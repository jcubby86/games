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

  static mapToGameDto(game: GameWithPlayers): GameDto {
    return {
      type: game.type,
      code: game.code,
      uuid: game.uuid,
      phase: game.phase,
      players: game.players?.map((p) => GameService.mapToPlayerDto(p, game)),
    };
  }

  static mapToPlayerDto(player: PlayerWithEntries, game: Game): PlayerDto {
    const dto = {
      uuid: player.uuid,
      nickname: player.nickname,
    } as PlayerDto;

    if (game.type === GameType.NAME) {
      dto.entry = NameService.mapToNameEntryDto(player.nameEntries?.[0]);
    } else {
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
    return GameService.mapToGameDto(game);
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

    return GameService.mapToPlayerDto(player, game);
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
    return GameService.mapToPlayerDto(player, player.game!);
  }

  async getPlayer(uuid: string): Promise<PlayerDto> {
    const player = await this.prisma.player.findUnique({
      where: { uuid },
      include: {
        game: true,
        nameEntries: true,
        storyEntries: true,
      },
    });
    if (!player) {
      throw new NotFoundException('Player not found');
    }

    return GameService.mapToPlayerDto(player, player.game!);
  }
}
