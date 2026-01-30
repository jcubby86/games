import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Game, GamePhase, GameType, NameEntry, Player, Prisma, StoryEntry } from './generated/prisma/client';

@Injectable()
export class GameService {
  constructor(private prisma: PrismaService) { }

  generateCode(): string {
    return Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, '')
      .substring(0, 4)
      .toUpperCase();
  }


  async createGame(type: string): Promise<Game> {
    if (!Object.values(GameType).includes(type as GameType)) {
      throw new BadRequestException('Invalid Game Type');
    }

    return this.prisma.game.create({
      data: {
        code: this.generateCode(),
        type: type as GameType,
      },
    });
  }

  async getGameByCode(code: string): Promise<Game> {
    const game = await this.prisma.game.findUnique({
      where: { code },
    });
    if (!game) {
      throw new NotFoundException('Game not found');
    }
    return game;
  }

  async getGame(uuid: string): Promise<Game & { players: Player[] }> {
    const game = await this.prisma.game.findUnique({
      where: { uuid },
      include: {
        players: {
          include: {
            storyEntries: true,
            nameEntries: true
          }
        }
      },
    });
    if (!game) {
      throw new NotFoundException('Game not found');
    }
    return game;
  }

  async updateGame(uuid: string, phase: string): Promise<Game> {
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
    return game;
  }

  async addPlayer(gameUuid: string, nickname: string): Promise<Player> {
    const game = await this.prisma.game.findUnique({
      where: { uuid: gameUuid },
    });
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    const player = await this.prisma.player.create({
      data: {
        nickname,
        game: {
          connect: { id: game.id },
        },
      },
    });
    return player;
  }

  async addNameEntry(playerUuid: string, name: string): Promise<NameEntry> {
    const player = await this.prisma.player.findUnique({
      where: { uuid: playerUuid },
      include: { game: true },
    });
    if (!player) {
      throw new NotFoundException('Player not found');
    }

    if (player.game!.type !== GameType.NAME) {
      throw new BadRequestException('Game is not of type NAME');
    }
    const normalized = name.trim().toLowerCase();

    return await this.prisma.nameEntry.upsert({
      where: {
        gameId_playerId: {
          gameId: player.gameId!,
          playerId: player.id,
        },
      },
      update: {
        name,
        normalized,
      },
      create: {
        name,
        normalized,
        order: Math.floor(Math.random() * 1000000),
        playerId: player.id,
        gameId: player.gameId!,
      }
    });
  }

  async addStoryEntry(playerUuid: string, value: string): Promise<StoryEntry> {
    const player = await this.prisma.player.findUnique({
      where: { uuid: playerUuid },
      include: { game: true },
    });
    if (!player) {
      throw new NotFoundException('Player not found');
    }

    if (player.game!.type !== GameType.STORY) {
      throw new BadRequestException('Game is not of type STORY');
    }

    return await this.prisma.storyEntry.upsert({
      where: {
        gameId_playerId: {
          gameId: player.gameId!,
          playerId: player.id,
        },
      },
      update: {
        values: {
          push: value,
        },
      },
      create: {
        values: [value],
        playerId: player.id,
        gameId: player.gameId!,
      }
    });
  }

}
