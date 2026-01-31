import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Game, GamePhase, GameType, Player } from 'src/generated/prisma/client';
import { NameService } from 'src/name/name.service';
import { PrismaService } from 'src/prisma.service';
import { StoryService } from 'src/story/story.service';
import { GameDto, PlayerDto } from 'src/types/game.types';

export interface GameUpdatedEvent {
  game: Game;
  player?: Player;
  action: string;
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
      .substring(0, 4)
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
  ): PlayerDto {
    return {
      uuid: player.uuid,
      nickname: player.nickname,
      canPlayerSubmit: canPlayerSubmit ?? false,
      game,
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
        players: true,
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
      action: 'game.phase.updated',
    } as GameUpdatedEvent);

    return GameService.mapToGameDto(game);
  }

  async addPlayer(gameUuid: string, nickname: string): Promise<PlayerDto> {
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

    const player = await this.prisma.player.create({
      data: {
        nickname: nickname.toLowerCase(),
        game: {
          connect: { id: game.id },
        },
      },
    });

    this.eventEmitter.emit('game.updated', {
      game,
      player,
      action: 'game.player.joined',
    } as GameUpdatedEvent);

    return this.getPlayer(player.uuid);
  }

  async updatePlayer(uuid: string, nickname: string): Promise<PlayerDto> {
    const player = await this.prisma.player.update({
      where: { uuid },
      include: { game: true },
      data: { nickname: nickname.toLowerCase() },
    });
    if (!player) {
      throw new NotFoundException('Player not found');
    }

    this.eventEmitter.emit('game.updated', {
      game: player.game,
      player,
      action: 'game.player.updated',
    } as GameUpdatedEvent);

    return this.getPlayer(player.uuid);
  }

  async getPlayer(uuid: string): Promise<PlayerDto> {
    const player = await this.prisma.player.findUnique({
      where: { uuid },
      include: {
        game: true,
      },
    });
    if (!player) {
      throw new NotFoundException('Player not found');
    } else if (!player.game) {
      return GameService.mapToPlayerDto(player);
    }

    switch (player.game.type) {
      case GameType.NAME:
        return this.nameService.getPlayer(player, player.game);
      case GameType.STORY:
        return this.storyService.getPlayer(player, player.game);
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
        action: 'game.player.left',
      } as GameUpdatedEvent);

      player.game = null;
    }

    return GameService.mapToPlayerDto(player);
  }
}
