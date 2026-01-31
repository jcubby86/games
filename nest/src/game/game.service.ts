import {
  BadRequestException,
  Injectable,
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
import {
  GameDto,
  NameEntryDto,
  PlayerDto,
  StoryEntryDto,
} from '../types/game.types';
import { EventEmitter2 } from '@nestjs/event-emitter';

type GameWithPlayers = Game & {
  players?: PlayerWithEntries[];
};

type PlayerWithEntries = Player & {
  nameEntries?: NameEntry[];
  storyEntries?: StoryEntry[];
};

interface PlayerJoinedEvent {
  gameUuid: string;
  playerUuid: string;
}

@Injectable()
export class GameService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  generateCode(): string {
    return Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, '')
      .substring(0, 4)
      .toUpperCase();
  }

  private mapToGameDto(game: GameWithPlayers): GameDto {
    return {
      type: game.type,
      code: game.code,
      uuid: game.uuid,
      phase: game.phase,
      players: game.players?.map((p) => this.mapToPlayerDto(p)),
    };
  }

  private mapToPlayerDto(player: PlayerWithEntries): PlayerDto {
    const dto = {
      uuid: player.uuid,
      nickname: player.nickname,
    } as PlayerDto;

    if (player.nameEntries && player.nameEntries.length > 0) {
      dto.entry = {
        name: player.nameEntries[0]?.name,
        order: player.nameEntries[0]?.order,
      } as NameEntryDto;
    } else if (player.storyEntries && player.storyEntries.length > 0) {
      dto.entry = {
        values: player.storyEntries[0]?.values,
        story: player.storyEntries[0]?.story || undefined,
      } as StoryEntryDto;
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

    return this.mapToGameDto(game);
  }

  async getGameByCode(code: string): Promise<GameDto> {
    const game = await this.prisma.game.findUnique({
      where: { code },
    });
    if (!game) {
      throw new NotFoundException('Game not found');
    }
    return this.mapToGameDto(game);
  }

  async getGame(uuid: string): Promise<GameDto> {
    const game = await this.prisma.game.findUnique({
      where: { uuid },
      include: {
        players: {
          include: {
            storyEntries: true,
            nameEntries: true,
          },
        },
      },
    });
    if (!game) {
      throw new NotFoundException('Game not found');
    }
    return this.mapToGameDto(game);
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
    return this.mapToGameDto(game);
  }

  async addPlayer(gameUuid: string, nickname: string): Promise<PlayerDto> {
    const game = await this.prisma.game.findUnique({
      where: { uuid: gameUuid },
    });
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    const player = await this.prisma.player.create({
      data: {
        nickname: nickname.toLowerCase(),
        game: {
          connect: { id: game.id },
        },
      },
    });

    this.eventEmitter.emit('player.joined', {
      gameUuid: game.uuid,
      playerUuid: player.uuid,
    } as PlayerJoinedEvent);

    return this.mapToPlayerDto(player);
  }

  async updatePlayer(uuid: string, nickname: string): Promise<PlayerDto> {
    const player = await this.prisma.player.update({
      where: { uuid },
      data: { nickname: nickname.toLowerCase() },
    });
    if (!player) {
      throw new NotFoundException('Player not found');
    }
    return this.mapToPlayerDto(player);
  }
}
