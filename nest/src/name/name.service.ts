import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { GamePhase, GameType, NameEntry } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma.service';
import { NameEntryDto } from 'src/types/game.types';

interface NameUpdatedEvent {
  gameUuid: string;
}

@Injectable()
export class NameService {
  private readonly logger = new Logger(NameService.name);

  constructor(
    private readonly prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  static mapToNameEntryDto(entry?: NameEntry): NameEntryDto {
    return {
      name: entry?.name,
      order: entry?.order,
    };
  }

  async addNameEntry(playerUuid: string, name: string): Promise<NameEntryDto> {
    const player = await this.prisma.player.findUnique({
      where: { uuid: playerUuid },
      include: { game: true },
    });
    if (!player) {
      throw new NotFoundException('Player not found');
    } else if (player.game!.type !== GameType.NAME) {
      throw new BadRequestException('Game is not of type NAME');
    } else if (player.game!.phase !== GamePhase.PLAY) {
      throw new BadRequestException('Game is not in PLAY phase');
    }
    const normalized = name.trim().toLowerCase();

    const entry = await this.prisma.nameEntry.upsert({
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
      },
    });

    this.eventEmitter.emit('name.updated', {
      gameUuid: player.game!.uuid,
    } as NameUpdatedEvent);

    return {
      name: entry.name,
      order: entry.order,
    };
  }

  @OnEvent('name.updated')
  async handleNameUpdatedEvent(event: NameUpdatedEvent) {
    const players = await this.prisma.player.findMany({
      where: {
        game: { uuid: event.gameUuid },
      },
      include: { nameEntries: true },
    });

    const completed =
      players.filter((player) => player.nameEntries.length === 0).length === 0;

    if (completed) {
      this.logger.log(
        `All players have submitted names for game ${event.gameUuid}. Transitioning to READ phase.`,
      );
      await this.prisma.game.update({
        where: { uuid: event.gameUuid },
        data: { phase: GamePhase.READ },
      });
    }
  }

  async getAllNames(gameUuid: string): Promise<NameEntry[]> {
    return this.prisma.nameEntry.findMany({
      where: {
        game: { uuid: gameUuid },
      },
    });
  }
}
