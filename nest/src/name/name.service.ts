import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

import {
  Game,
  GamePhase,
  GameType,
  NameEntry,
  Player,
} from 'src/generated/prisma/client';
import { GameService } from 'src/game/game.service';
import type { GameUpdatedEvent } from 'src/game/game.service';
import { PrismaService } from 'src/prisma.service';
import { NameEntryDto, PlayerDto } from 'src/types/game.types';

interface NameMapEntry {
  player: Player;
  entry?: NameEntry;
  canSubmit: () => boolean;
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
      game: player.game,
      action: 'name.entry.added',
      player,
    } as GameUpdatedEvent);

    return {
      name: entry.name,
      order: entry.order,
    };
  }

  @OnEvent('name.updated')
  async handleNameUpdatedEvent(event: GameUpdatedEvent) {
    const players = await this.prisma.player.findMany({
      where: {
        game: { uuid: event.game.uuid },
      },
      include: { nameEntries: true },
    });

    const completed =
      players.filter((player) => player.nameEntries.length === 0).length === 0;

    if (completed) {
      this.logger.log(
        `All players have submitted names for game ${event.game.uuid}. Transitioning to READ phase.`,
      );
      await this.prisma.game.update({
        where: { id: event.game.id },
        data: { phase: GamePhase.READ },
      });

      this.eventEmitter.emit('game.updated', {
        game: event.game,
        action: 'game.phase.updated',
      } as GameUpdatedEvent);
    }
  }

  private async getPlayerSubmissionMap(game: Game) {
    const gamePlayers = await this.prisma.player.findMany({
      where: {
        gameId: game.id,
      },
      include: {
        nameEntries: true,
      },
    });

    const playerMap = new Map<string, NameMapEntry>();

    for (const gp of gamePlayers) {
      const entry = gp.nameEntries[0];
      playerMap.set(gp.uuid, {
        player: gp,
        entry,
        canSubmit: () => game.phase === GamePhase.PLAY && !entry,
      });
    }

    return playerMap;
  }

  async getPlayer(
    player: Player,
    game: Game,
    roles?: string[],
  ): Promise<PlayerDto> {
    const playerMap = await this.getPlayerSubmissionMap(game);
    const entries = Array.from(playerMap.values());

    const response = GameService.mapToPlayerDto(
      player,
      playerMap.get(player.uuid)!.canSubmit(),
      GameService.mapToGameDto(
        game,
        entries.map((e) => GameService.mapToPlayerDto(e.player, e.canSubmit())),
      ),
      roles,
    );

    if (game.phase === GamePhase.READ) {
      response.entries = entries.map((e) =>
        NameService.mapToNameEntryDto(e.entry),
      );
    }

    return response;
  }
}
