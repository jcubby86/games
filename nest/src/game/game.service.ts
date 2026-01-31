import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  Game,
  GamePhase,
  GameType,
  NameEntry,
  Player,
  StoryEntry,
} from '../generated/prisma/client';
import { GameDto, PlayerDto } from '../types/game.types';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { StoryService } from 'src/story/story.service';
import { NameService } from 'src/name/name.service';

type GameWithPlayers = Game & {
  players?: PlayerWithEntries[];
};

type PlayerWithEntries = Player & {
  nameEntries?: NameEntry[];
  storyEntries?: StoryEntry[];
  canPlayerSubmit?: boolean;
  game?: Game | null;
};

export interface GameUpdatedEvent {
  gameUuid: string;
  playerUuid?: string;
  nickname?: string;
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

  static mapToGameDto(game: GameWithPlayers): GameDto {
    return {
      type: game.type,
      code: game.code,
      uuid: game.uuid,
      phase: game.phase,
      players: game.players?.map((p) => GameService.mapToPlayerDto(p)),
    };
  }

  static mapToPlayerDto(player: PlayerWithEntries): PlayerDto {
    const dto: PlayerDto = {
      uuid: player.uuid,
      nickname: player.nickname,
      canPlayerSubmit: player.canPlayerSubmit,
      game: player.game ? this.mapToGameDto(player.game) : undefined,
    };

    if (player.game?.type === GameType.NAME) {
      dto.entries = player.nameEntries?.map((entry) =>
        NameService.mapToNameEntryDto(entry),
      );
    } else if (player.game?.type === GameType.STORY) {
      dto.entry = StoryService.mapToStoryEntryDto(player.storyEntries?.[0]);
    }
    return dto;
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
    return GameService.mapToGameDto(game);
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
      gameUuid: game.uuid,
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
      gameUuid: game.uuid,
      playerUuid: player.uuid,
      nickname: player.nickname,
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
      gameUuid: player.game!.uuid,
      playerUuid: player.uuid,
      nickname: player.nickname,
      action: 'game.player.updated',
    } as GameUpdatedEvent);

    return GameService.mapToPlayerDto(player);
  }

  async getPlayer(uuid: string): Promise<PlayerDto> {
    const player = await this.prisma.player.findUnique({
      where: { uuid },
      include: {
        game: {
          include: {
            players: true,
          },
        },
        nameEntries: true,
        storyEntries: true,
      },
    });
    if (!player || !player.game) {
      throw new NotFoundException('Player not found');
    }
    const game = player.game;

    const response: PlayerWithEntries = {
      ...player,
      canPlayerSubmit: game.phase === GamePhase.PLAY,
    };

    if (response.canPlayerSubmit && game.type === GameType.STORY) {
      response.canPlayerSubmit = await this.storyService.canPlayerSubmit(
        game.uuid,
        player.uuid,
      );
    } else if (game.type === GameType.NAME) {
      if (game.phase === GamePhase.READ) {
        const allEntries = await this.nameService.getAllNames(game.uuid);
        response.nameEntries = allEntries;
        response.canPlayerSubmit = false;
      } else if (
        game.phase === GamePhase.PLAY &&
        (response.nameEntries?.length ?? 0) > 0
      ) {
        response.canPlayerSubmit = false;
      }
    }

    return GameService.mapToPlayerDto(response);
  }

  async leaveGame(playerUuid: string): Promise<PlayerDto> {
    const player = await this.prisma.player.findUniqueOrThrow({
      where: { uuid: playerUuid },
      include: { game: true },
    });
    if (!player) {
      throw new NotFoundException('Player not found');
    }

    await this.prisma.player.update({
      where: { id: player.id },
      data: { gameId: null },
    });

    this.eventEmitter.emit('game.updated', {
      gameUuid: player.game!.uuid,
      playerUuid: player.uuid,
      action: 'game.player.left',
    } as GameUpdatedEvent);

    player.game = null;
    return GameService.mapToPlayerDto(player);
  }
}
