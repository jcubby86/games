import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

import { hints } from './story.constants';
import { storyEntryMaxLength } from 'src/game/game.constants';
import { GameService } from 'src/game/game.service';
import type { GameUpdatedEvent } from 'src/game/game.service';
import { PlayerDto, StoryEntryDto } from 'src/game/game.types';
import {
  Game,
  GamePhase,
  GameType,
  Player,
  StoryEntry,
} from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma.service';

interface StoryMapEntry {
  player: Player;
  entry?: StoryEntry;
  length: number;
  canSubmit: () => boolean;
}

@Injectable()
export class StoryService {
  private readonly logger = new Logger(StoryService.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  static mapToStoryEntryDto(entry?: StoryEntry): StoryEntryDto {
    return {
      values: entry?.values || [],
      story: entry?.story || undefined,
      hint: hints[entry?.values.length ?? 0],
    };
  }

  async addStoryEntry(
    playerUuid: string,
    value: string,
  ): Promise<StoryEntryDto> {
    if (!value || value.trim().length === 0) {
      throw new BadRequestException('Value cannot be empty');
    }

    const player = await this.prisma.player.findUnique({
      where: { uuid: playerUuid },
      include: { game: true },
    });
    if (!player) {
      throw new NotFoundException('Player not found');
    } else if (player.game!.type !== GameType.STORY) {
      throw new BadRequestException('Game is not of type STORY');
    } else if (player.game!.phase !== GamePhase.PLAY) {
      throw new BadRequestException('Game is not in PLAY phase');
    } else if (!(await this.canPlayerSubmit(player, player.game!))) {
      throw new BadRequestException('Player cannot submit entry at this time');
    }

    const entry = await this.prisma.storyEntry.upsert({
      where: {
        gameId_playerId: {
          gameId: player.gameId!,
          playerId: player.id,
        },
      },
      update: {
        values: {
          push: value.substring(0, storyEntryMaxLength),
        },
      },
      create: {
        values: [value],
        playerId: player.id,
        gameId: player.gameId!,
      },
    });

    this.eventEmitter.emit('story.updated', {
      game: player.game,
      action: 'story.entry.added',
      player,
    } as GameUpdatedEvent);

    return {
      values: entry.values,
      story: entry.story || undefined,
      hint: hints[entry.values.length],
    };
  }

  @OnEvent('story.updated')
  async handleStoryUpdatedEvent(event: GameUpdatedEvent) {
    const players = await this.prisma.player.findMany({
      where: {
        game: { id: event.game.id },
      },
      include: {
        storyEntries: {
          where: { gameId: event.game.id },
          orderBy: { id: 'asc' },
        },
      },
      orderBy: { id: 'asc' },
    });

    const playerMap = await this.getPlayerSubmissionMap(event.game);
    const entries = Array.from(playerMap.values());

    const allSubmitted = entries.every((entry) => entry.canSubmit());
    const minLength = Math.min(...entries.map((entry) => entry.length));

    if (allSubmitted && minLength >= hints.length) {
      this.logger.debug(
        `All story entries completed for game ${event.game.uuid}, generating stories. Transitioning to READ phase.`,
      );

      const stories = players.map((p) => p.storyEntries[0]);

      this.createStories(stories);
      await this.prisma.$transaction(
        stories.map((e) =>
          this.prisma.storyEntry.update({
            where: { id: e.id },
            data: { story: e.story },
          }),
        ),
      );

      await this.prisma.game.update({
        where: { id: event.game.id },
        data: { phase: GamePhase.READ },
      });

      this.eventEmitter.emit('game.updated', {
        game: event.game,
        action: 'game.phase.completed',
      } as GameUpdatedEvent);
    } else if (allSubmitted) {
      this.logger.debug(
        `All players have submitted their current story entry for game ${event.game.uuid}.`,
      );

      this.eventEmitter.emit('game.updated', {
        game: event.game,
        action: 'story.round.completed',
      } as GameUpdatedEvent);
    }
  }

  createStories(entries: StoryEntry[]) {
    const offset = Math.floor(Math.random() * entries.length);
    for (let i = 0; i < entries.length; i++) {
      let s = '';
      for (let j = 0; j < hints.length; j++) {
        const value = entries[(i + j + offset) % entries.length].values[j];
        s += hints[j].prefix + value + hints[j].suffix;
      }

      entries[i].story = s;
    }
  }

  async canPlayerSubmit(player: Player, game: Game): Promise<boolean> {
    const playerMap = await this.getPlayerSubmissionMap(game);
    return playerMap.get(player.uuid)!.canSubmit();
  }

  private async getPlayerSubmissionMap(game: Game) {
    const gamePlayers = await this.prisma.player.findMany({
      where: {
        gameId: game.id,
      },
      include: {
        storyEntries: { where: { gameId: game.id }, orderBy: { id: 'asc' } },
      },
      orderBy: { id: 'asc' },
    });

    const playerMap = new Map<string, StoryMapEntry>();
    let minLength = -1;

    for (const gp of gamePlayers) {
      const entry = gp.storyEntries[0];
      const currentLength = entry?.values.length ?? 0;
      if (minLength === -1 || currentLength < minLength) {
        minLength = currentLength;
      }

      playerMap.set(gp.uuid, {
        player: gp,
        entry,
        length: currentLength,
        canSubmit: () =>
          game.phase === GamePhase.PLAY && currentLength <= minLength,
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

    if (game.phase === GamePhase.PLAY) {
      const playerEntry = playerMap.get(player.uuid)!;
      response.entry = {
        values: playerEntry.entry?.values ?? [],
        hint: hints[playerEntry.length],
      };
    } else if (game.phase === GamePhase.READ) {
      const playerEntry = playerMap.get(player.uuid)!;
      response.entry = {
        values: playerEntry.entry!.values,
        story: playerEntry.entry!.story!,
      };
    }

    return response;
  }

  async getStoryArchives(uuid: string) {
    const entries = await this.prisma.storyEntry.findMany({
      where: {
        game: {
          uuid,
        },
      },
      include: {
        player: { select: { uuid: true, nickname: true } },
      },
      orderBy: { id: 'asc' },
    });

    return entries.map((entry) => ({
      player: {
        uuid: entry.player.uuid,
        nickname: entry.player.nickname,
      },
      story: entry.story ?? '',
    }));
  }
}
