import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';

import { gameCodeLength } from './game.constants';
import { GameService } from './game.service';
import { isPrismaUniqueError } from 'src/filters/prisma-exception.filter';
import { Game, Player } from 'src/generated/prisma/client';
import { GamePhase, GameType } from 'src/generated/prisma/enums';
import { NameService } from 'src/name/name.service';
import { PrismaService } from 'src/prisma.service';
import { StoryService } from 'src/story/story.service';

jest.mock('src/filters/prisma-exception.filter');

const mockIsPrismaUniqueError = isPrismaUniqueError as jest.Mock;

function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    id: 1,
    uuid: 'game-uuid',
    code: 'ABCD',
    type: GameType.STORY,
    phase: GamePhase.JOIN,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 1,
    uuid: 'player-uuid',
    nickname: 'nick',
    gameId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('GameService', () => {
  let service: GameService;
  let prisma: {
    game: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    player: {
      create: jest.Mock;
      update: jest.Mock;
      findUnique: jest.Mock;
      findUniqueOrThrow: jest.Mock;
    };
  };
  let storyService: { getPlayer: jest.Mock };
  let nameService: { getPlayer: jest.Mock };
  let eventEmitter: { emit: jest.Mock };

  beforeEach(async () => {
    mockIsPrismaUniqueError.mockReturnValue(false);

    prisma = {
      game: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      player: {
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
    };
    storyService = { getPlayer: jest.fn() };
    nameService = { getPlayer: jest.fn() };
    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameService,
        { provide: PrismaService, useValue: prisma },
        { provide: StoryService, useValue: storyService },
        { provide: NameService, useValue: nameService },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<GameService>(GameService);
  });

  describe('generateCode', () => {
    it('generates an uppercase alphabetic code of the configured length', () => {
      for (let i = 0; i < 20; i++) {
        const code = service.generateCode();
        expect(code).toHaveLength(gameCodeLength);
        expect(code).toMatch(/^[A-Z]+$/);
      }
    });
  });

  describe('mapToGameDto', () => {
    it('maps game fields and omits players when not provided', () => {
      const game = makeGame();
      expect(GameService.mapToGameDto(game)).toEqual({
        type: game.type,
        code: game.code,
        uuid: game.uuid,
        phase: game.phase,
        players: undefined,
      });
    });
  });

  describe('mapToPlayerDto', () => {
    it('defaults canSubmit to false when omitted', () => {
      const player = makePlayer();
      expect(GameService.mapToPlayerDto(player)).toEqual({
        uuid: player.uuid,
        nickname: player.nickname,
        canSubmit: false,
        game: undefined,
        roles: undefined,
      });
    });
  });

  describe('createGame', () => {
    it('throws for an invalid game type', async () => {
      await expect(service.createGame('NOT_A_TYPE')).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.game.create).not.toHaveBeenCalled();
    });

    it('creates and returns the mapped game for a valid type', async () => {
      const game = makeGame({ type: GameType.NAME });
      prisma.game.create.mockResolvedValue(game);

      const result = await service.createGame('NAME');

      expect(prisma.game.create).toHaveBeenCalledWith({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: { code: expect.any(String), type: 'NAME' },
      });
      expect(result).toEqual(GameService.mapToGameDto(game));
    });
  });

  describe('getGameByCode', () => {
    it('throws NotFoundException when no game matches', async () => {
      prisma.game.findUnique.mockResolvedValue(null);
      await expect(service.getGameByCode('ABCD')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the mapped game when found', async () => {
      const game = makeGame();
      prisma.game.findUnique.mockResolvedValue(game);

      const result = await service.getGameByCode('ABCD');

      expect(result).toEqual(GameService.mapToGameDto(game));
    });
  });

  describe('getGame', () => {
    it('throws NotFoundException when no game matches', async () => {
      prisma.game.findUnique.mockResolvedValue(null);
      await expect(service.getGame('game-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the game with mapped players', async () => {
      const player = makePlayer();
      const game = { ...makeGame(), players: [player] };
      prisma.game.findUnique.mockResolvedValue(game);

      const result = await service.getGame('game-uuid');

      expect(result.players).toEqual([GameService.mapToPlayerDto(player)]);
    });
  });

  describe('updateGame', () => {
    it('throws for an invalid phase', async () => {
      await expect(
        service.updateGame('game-uuid', 'NOT_A_PHASE'),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.game.update).not.toHaveBeenCalled();
    });

    it('updates the phase and emits a game.updated event', async () => {
      const game = makeGame({ phase: GamePhase.PLAY });
      prisma.game.update.mockResolvedValue(game);

      const result = await service.updateGame('game-uuid', 'PLAY');

      expect(prisma.game.update).toHaveBeenCalledWith({
        where: { uuid: 'game-uuid' },
        data: { phase: 'PLAY' },
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('game.updated', {
        game,
        action: 'phase.updated',
        player: null,
      });
      expect(result).toEqual(GameService.mapToGameDto(game));
    });
  });

  describe('addPlayer', () => {
    it('throws for an empty nickname', async () => {
      await expect(service.addPlayer('game-uuid', '  ')).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.game.findUnique).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the game does not exist', async () => {
      prisma.game.findUnique.mockResolvedValue(null);
      await expect(service.addPlayer('game-uuid', 'nick')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws when the game has already started', async () => {
      prisma.game.findUnique.mockResolvedValue(
        makeGame({ phase: GamePhase.PLAY }),
      );
      await expect(service.addPlayer('game-uuid', 'nick')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('creates the player, emits an event, and returns it via getPlayer', async () => {
      const game = makeGame({ phase: GamePhase.JOIN });
      const player = makePlayer();
      prisma.game.findUnique.mockResolvedValue(game);
      prisma.player.create.mockResolvedValue(player);
      const getPlayerSpy = jest
        .spyOn(service, 'getPlayer')
        .mockResolvedValue({ uuid: player.uuid, nickname: player.nickname });

      const result = await service.addPlayer('game-uuid', 'NickName');

      expect(prisma.player.create).toHaveBeenCalledWith({
        data: {
          nickname: 'nickname',
          game: { connect: { id: game.id } },
        },
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('game.updated', {
        game,
        player,
        action: 'player.joined',
      });
      expect(getPlayerSpy).toHaveBeenCalledWith(player.uuid);
      expect(result).toEqual({ uuid: player.uuid, nickname: player.nickname });
    });

    it('throws a friendly error when the nickname is already taken', async () => {
      prisma.game.findUnique.mockResolvedValue(
        makeGame({ phase: GamePhase.JOIN }),
      );
      prisma.player.create.mockRejectedValue(new Error('unique violation'));
      mockIsPrismaUniqueError.mockReturnValue(true);

      await expect(service.addPlayer('game-uuid', 'nick')).rejects.toThrow(
        'Nickname already taken in this game',
      );
    });

    it('rethrows unrecognized errors', async () => {
      prisma.game.findUnique.mockResolvedValue(
        makeGame({ phase: GamePhase.JOIN }),
      );
      const dbError = new Error('connection lost');
      prisma.player.create.mockRejectedValue(dbError);
      mockIsPrismaUniqueError.mockReturnValue(false);

      await expect(service.addPlayer('game-uuid', 'nick')).rejects.toBe(
        dbError,
      );
    });
  });

  describe('updatePlayer', () => {
    it('throws for an empty nickname', async () => {
      await expect(service.updatePlayer('player-uuid', '')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('updates the player, emits an event, and returns it via getPlayer', async () => {
      const game = makeGame();
      const player = { ...makePlayer(), game };
      prisma.player.update.mockResolvedValue(player);
      const getPlayerSpy = jest
        .spyOn(service, 'getPlayer')
        .mockResolvedValue({ uuid: player.uuid, nickname: player.nickname });

      const result = await service.updatePlayer('player-uuid', 'NewNick');

      expect(prisma.player.update).toHaveBeenCalledWith({
        where: { uuid: 'player-uuid' },
        include: { game: true },
        data: { nickname: 'newnick' },
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('game.updated', {
        game,
        player,
        action: 'player.updated',
      });
      expect(getPlayerSpy).toHaveBeenCalledWith(player.uuid);
      expect(result).toEqual({ uuid: player.uuid, nickname: player.nickname });
    });

    it('throws a friendly error when the nickname is already taken', async () => {
      prisma.player.update.mockRejectedValue(new Error('unique violation'));
      mockIsPrismaUniqueError.mockReturnValue(true);

      await expect(service.updatePlayer('player-uuid', 'nick')).rejects.toThrow(
        'Nickname already taken in this game',
      );
    });
  });

  describe('getPlayer', () => {
    it('throws NotFoundException when the player does not exist', async () => {
      prisma.player.findUnique.mockResolvedValue(null);
      await expect(service.getPlayer('player-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns a plain player dto when the player has no game', async () => {
      const player = { ...makePlayer(), game: null };
      prisma.player.findUnique.mockResolvedValue(player);

      const result = await service.getPlayer('player-uuid');

      expect(result).toEqual(GameService.mapToPlayerDto(player));
      expect(nameService.getPlayer).not.toHaveBeenCalled();
      expect(storyService.getPlayer).not.toHaveBeenCalled();
    });

    it('assigns the host role to the first player in the game', async () => {
      const host = makePlayer({ id: 1, uuid: 'host-uuid' });
      const game = makeGame({ type: GameType.NAME });
      const player = { ...host, game: { ...game, players: [host] } };
      prisma.player.findUnique.mockResolvedValue(player);
      nameService.getPlayer.mockResolvedValue({ uuid: host.uuid });

      await service.getPlayer('host-uuid');

      expect(nameService.getPlayer).toHaveBeenCalledWith(player, player.game, [
        'host',
      ]);
    });

    it('delegates to storyService for STORY games', async () => {
      const other = makePlayer({ id: 1, uuid: 'other-uuid' });
      const player = makePlayer({ id: 2, uuid: 'player-uuid' });
      const game = makeGame({ type: GameType.STORY });
      const withGame = {
        ...player,
        game: { ...game, players: [other, player] },
      };
      prisma.player.findUnique.mockResolvedValue(withGame);
      storyService.getPlayer.mockResolvedValue({ uuid: player.uuid });

      await service.getPlayer('player-uuid');

      expect(storyService.getPlayer).toHaveBeenCalledWith(
        withGame,
        withGame.game,
        [],
      );
      expect(nameService.getPlayer).not.toHaveBeenCalled();
    });
  });

  describe('leaveGame', () => {
    it('leaves the current game, updates gameId, and emits an event', async () => {
      const game = makeGame();
      const player = { ...makePlayer(), game };
      prisma.player.findUniqueOrThrow.mockResolvedValue(player);
      prisma.player.update.mockResolvedValue({ ...player, gameId: null });

      const result = await service.leaveGame('player-uuid');

      expect(prisma.player.update).toHaveBeenCalledWith({
        where: { id: player.id },
        data: { gameId: null },
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('game.updated', {
        game,
        player,
        action: 'player.left',
      });
      expect(result).toEqual(GameService.mapToPlayerDto(player));
    });

    it('does nothing extra when the player is not in a game', async () => {
      const player = { ...makePlayer(), game: null };
      prisma.player.findUniqueOrThrow.mockResolvedValue(player);

      const result = await service.leaveGame('player-uuid');

      expect(prisma.player.update).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
      expect(result).toEqual(GameService.mapToPlayerDto(player));
    });
  });
});
