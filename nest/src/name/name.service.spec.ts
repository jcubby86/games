import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';

import { NameService } from './name.service';
import { isPrismaUniqueError } from 'src/filters/prisma-exception.filter';
import { Game, NameEntry, Player } from 'src/generated/prisma/client';
import { GamePhase, GameType } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/prisma.service';

jest.mock('src/filters/prisma-exception.filter');

const mockIsPrismaUniqueError = isPrismaUniqueError as jest.Mock;

function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    id: 1,
    uuid: 'game-uuid',
    code: 'ABCD',
    type: GameType.NAME,
    phase: GamePhase.PLAY,
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

function makeEntry(overrides: Partial<NameEntry> = {}): NameEntry {
  return {
    id: 1,
    name: 'alice',
    normalized: 'alice',
    order: 0,
    gameId: 1,
    playerId: 1,
    ...overrides,
  };
}

describe('NameService', () => {
  let service: NameService;
  let prisma: {
    player: { findUnique: jest.Mock; findMany: jest.Mock };
    nameEntry: { upsert: jest.Mock };
    game: { update: jest.Mock };
  };
  let eventEmitter: { emit: jest.Mock };

  beforeEach(async () => {
    mockIsPrismaUniqueError.mockReturnValue(false);

    prisma = {
      player: { findUnique: jest.fn(), findMany: jest.fn() },
      nameEntry: { upsert: jest.fn() },
      game: { update: jest.fn() },
    };
    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NameService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<NameService>(NameService);
  });

  describe('addNameEntry', () => {
    it('throws for an empty name', async () => {
      await expect(service.addNameEntry('player-uuid', '  ')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException when the player does not exist', async () => {
      prisma.player.findUnique.mockResolvedValue(null);
      await expect(
        service.addNameEntry('player-uuid', 'Alice'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws when the game is not a NAME game', async () => {
      prisma.player.findUnique.mockResolvedValue({
        ...makePlayer(),
        game: makeGame({ type: GameType.STORY }),
      });
      await expect(
        service.addNameEntry('player-uuid', 'Alice'),
      ).rejects.toThrow('Game is not of type NAME');
    });

    it('throws when the game is not in the PLAY phase', async () => {
      prisma.player.findUnique.mockResolvedValue({
        ...makePlayer(),
        game: makeGame({ phase: GamePhase.JOIN }),
      });
      await expect(
        service.addNameEntry('player-uuid', 'Alice'),
      ).rejects.toThrow('Game is not in PLAY phase');
    });

    it('upserts the entry and emits name.updated on success', async () => {
      const game = makeGame();
      const player = { ...makePlayer(), game, gameId: game.id };
      prisma.player.findUnique.mockResolvedValue(player);
      const savedEntry = makeEntry({ name: 'Alice', normalized: 'alice' });
      prisma.nameEntry.upsert.mockResolvedValue(savedEntry);

      const result = await service.addNameEntry('player-uuid', 'Alice');

      expect(prisma.nameEntry.upsert).toHaveBeenCalledWith({
        where: {
          gameId_playerId: { gameId: game.id, playerId: player.id },
        },
        update: { name: 'Alice', normalized: 'alice' },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        create: expect.objectContaining({
          name: 'Alice',
          normalized: 'alice',
          playerId: player.id,
          gameId: game.id,
        }),
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('name.updated', {
        game,
        action: 'player.entry.submitted',
        player,
      });
      expect(result).toEqual({
        name: savedEntry.name,
        order: savedEntry.order,
      });
    });

    it('throws a friendly error when the name is already taken', async () => {
      prisma.player.findUnique.mockResolvedValue({
        ...makePlayer(),
        game: makeGame(),
      });
      prisma.nameEntry.upsert.mockRejectedValue(new Error('unique violation'));
      mockIsPrismaUniqueError.mockReturnValue(true);

      await expect(
        service.addNameEntry('player-uuid', 'Alice'),
      ).rejects.toThrow(
        'Name already submitted by another player in this game',
      );
    });

    it('rethrows unrecognized errors', async () => {
      prisma.player.findUnique.mockResolvedValue({
        ...makePlayer(),
        game: makeGame(),
      });
      const dbError = new Error('connection lost');
      prisma.nameEntry.upsert.mockRejectedValue(dbError);
      mockIsPrismaUniqueError.mockReturnValue(false);

      await expect(service.addNameEntry('player-uuid', 'Alice')).rejects.toBe(
        dbError,
      );
    });
  });

  describe('handleNameUpdatedEvent', () => {
    const game = makeGame();

    it('passes the event through when not everyone has submitted', async () => {
      const submitted = {
        ...makePlayer({ id: 1, uuid: 'p1' }),
        nameEntries: [makeEntry()],
      };
      const waiting = {
        ...makePlayer({ id: 2, uuid: 'p2' }),
        nameEntries: [],
      };
      prisma.player.findMany.mockResolvedValue([submitted, waiting]);

      await service.handleNameUpdatedEvent({
        game,
        player: submitted,
        action: 'player.entry.submitted',
      });

      expect(prisma.game.update).not.toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('game.updated', {
        game,
        player: submitted,
        action: 'player.entry.submitted',
      });
    });

    it('transitions to READ once every player has submitted a name', async () => {
      const players = [
        { ...makePlayer({ id: 1, uuid: 'p1' }), nameEntries: [makeEntry()] },
        { ...makePlayer({ id: 2, uuid: 'p2' }), nameEntries: [makeEntry()] },
      ];
      prisma.player.findMany.mockResolvedValue(players);
      prisma.game.update.mockResolvedValue({ ...game, phase: GamePhase.READ });

      await service.handleNameUpdatedEvent({
        game,
        player: null,
        action: 'player.entry.submitted',
      });

      expect(prisma.game.update).toHaveBeenCalledWith({
        where: { id: game.id },
        data: { phase: GamePhase.READ },
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('game.updated', {
        game,
        action: 'phase.updated',
        player: null,
      });
    });
  });

  describe('getPlayer', () => {
    it('omits entries outside of the READ phase', async () => {
      const game = makeGame({ phase: GamePhase.PLAY });
      const player = makePlayer();
      prisma.player.findMany.mockResolvedValue([
        { ...player, nameEntries: [] },
      ]);

      const result = await service.getPlayer(player, game);

      expect(result.entries).toBeUndefined();
    });

    it('returns entries sorted by submission order during the READ phase', async () => {
      const game = makeGame({ phase: GamePhase.READ });
      const player = makePlayer({ id: 1, uuid: 'p1' });
      const other = makePlayer({ id: 2, uuid: 'p2' });
      prisma.player.findMany.mockResolvedValue([
        { ...player, nameEntries: [makeEntry({ name: 'second', order: 5 })] },
        { ...other, nameEntries: [makeEntry({ name: 'first', order: 1 })] },
      ]);

      const result = await service.getPlayer(player, game);

      expect(result.entries).toEqual([
        { name: 'first', order: 1 },
        { name: 'second', order: 5 },
      ]);
    });
  });
});
