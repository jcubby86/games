import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { gameCodeLength, nicknameMaxLength } from './game.constants';
import { isPrismaUniqueError } from 'src/filters/prisma-exception.filter';
import {
  GameDto,
  PlayerDto,
  GameUpdatedMessageData,
} from 'src/game/game.types';
import { Game, GamePhase, GameType, Player } from 'src/generated/prisma/client';
import { NameService } from 'src/name/name.service';
import { PrismaService } from 'src/prisma.service';
import { StoryService } from 'src/story/story.service';

export interface GameUpdatedEvent {
  game: Game;
  player: Player | null;
  action: GameUpdatedMessageData['action'];
}

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);

  constructor(
    private prisma: PrismaService,
    private storyService: StoryService,
    private nameService: NameService,
    private eventEmitter: EventEmitter2,
  ) {}

  generateCode(): string {
    return Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, '')
      .substring(0, gameCodeLength)
      .toUpperCase();
  }

  static mapToGameDto(game: Game, players?: PlayerDto[]): GameDto {
    return {
      type: game.type,
      code: game.code,
      uuid: game.uuid,
      phase: game.phase,
      players,
    };
  }

  static mapToPlayerDto(
    player: Player,
    canPlayerSubmit?: boolean,
    game?: GameDto,
    roles?: string[],
  ): PlayerDto {
    return {
      uuid: player.uuid,
      nickname: player.nickname,
      canPlayerSubmit: canPlayerSubmit ?? false,
      game,
      roles,
    };
  }

  async createGame(type: string): Promise<GameDto> {
    if (!Object.values(GameType).includes(type as GameType)) {
      throw new BadRequestException('Invalid Game Type');
    }

    const game = await this.prisma.game.create({
      data: {
        code: this.generateCode(),
        type: type as GameType,
      },
    });

    return GameService.mapToGameDto(game);
  }

  async getGameByCode(code: string): Promise<GameDto> {
    const game = await this.prisma.game.findUnique({
      where: { code },
    });
    if (!game) {
      throw new NotFoundException('Game not found');
    }
    return GameService.mapToGameDto(game);
  }

  async getGame(uuid: string): Promise<GameDto> {
    const game = await this.prisma.game.findUnique({
      where: { uuid },
      include: {
        players: { orderBy: { id: 'asc' } },
      },
    });
    if (!game) {
      throw new NotFoundException('Game not found');
    }
    return GameService.mapToGameDto(
      game,
      game.players.map((p) => GameService.mapToPlayerDto(p)),
    );
  }

  async updateGame(uuid: string, phase: string): Promise<GameDto> {
    if (!Object.values(GamePhase).includes(phase as GamePhase)) {
      throw new BadRequestException('Invalid Game Phase');
    }
    const game = await this.prisma.game.update({
      where: { uuid },
      data: {
        phase: phase as GamePhase,
      },
    });
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    this.eventEmitter.emit('game.updated', {
      game,
      action: 'phase.updated',
      player: null,
    } satisfies GameUpdatedEvent);

    return GameService.mapToGameDto(game);
  }

  async addPlayer(gameUuid: string, nickname: string): Promise<PlayerDto> {
    if (!nickname || nickname.trim().length === 0) {
      throw new BadRequestException('Nickname cannot be empty');
    }

    const game = await this.prisma.game.findUnique({
      where: { uuid: gameUuid },
    });
    if (!game) {
      throw new NotFoundException('Game not found');
    } else if (game.phase !== GamePhase.JOIN) {
      throw new BadRequestException(
        'Cannot join a game that has already started',
      );
    }

    try {
      const player = await this.prisma.player.create({
        data: {
          nickname: nickname.toLowerCase().substring(0, nicknameMaxLength),
          game: {
            connect: { id: game.id },
          },
        },
      });

      this.eventEmitter.emit('game.updated', {
        game,
        player,
        action: 'player.joined',
      } satisfies GameUpdatedEvent);

      return this.getPlayer(player.uuid);
    } catch (error) {
      if (isPrismaUniqueError(error)) {
        throw new BadRequestException('Nickname already taken in this game');
      }
      throw error;
    }
  }

  async updatePlayer(uuid: string, nickname: string): Promise<PlayerDto> {
    if (!nickname || nickname.trim().length === 0) {
      throw new BadRequestException('Nickname cannot be empty');
    }

    try {
      const player = await this.prisma.player.update({
        where: { uuid },
        include: { game: true },
        data: {
          nickname: nickname.toLowerCase().substring(0, nicknameMaxLength),
        },
      });
      if (!player) {
        throw new NotFoundException('Player not found');
      }

      this.eventEmitter.emit('game.updated', {
        game: player.game!,
        player,
        action: 'player.updated',
      } satisfies GameUpdatedEvent);

      return this.getPlayer(player.uuid);
    } catch (error) {
      if (isPrismaUniqueError(error)) {
        throw new BadRequestException('Nickname already taken in this game');
      }
      throw error;
    }
  }

  async getPlayer(uuid: string): Promise<PlayerDto> {
    const player = await this.prisma.player.findUnique({
      where: { uuid },
      include: {
        game: {
          include: {
            players: {
              select: { id: true, uuid: true, nickname: true },
              orderBy: { id: 'asc' },
            },
          },
        },
      },
    });
    if (!player) {
      throw new NotFoundException('Player not found');
    } else if (!player.game) {
      return GameService.mapToPlayerDto(player);
    }

    const roles: string[] = [];
    if (player.game.players[0].id === player.id) {
      roles.push('host');
    }

    switch (player.game.type) {
      case GameType.NAME:
        return this.nameService.getPlayer(player, player.game, roles);
      case GameType.STORY:
        return this.storyService.getPlayer(player, player.game, roles);
    }
  }

  async leaveGame(playerUuid: string): Promise<PlayerDto> {
    const player = await this.prisma.player.findUniqueOrThrow({
      where: { uuid: playerUuid },
      include: { game: true },
    });

    if (!player) {
      throw new NotFoundException('Player not found');
    } else if (player.game) {
      await this.prisma.player.update({
        where: { id: player.id },
        data: { gameId: null },
      });

      this.eventEmitter.emit('game.updated', {
        game: player.game,
        player,
        action: 'player.left',
      } satisfies GameUpdatedEvent);

      player.game = null;
    }

    return GameService.mapToPlayerDto(player);
  }
}
