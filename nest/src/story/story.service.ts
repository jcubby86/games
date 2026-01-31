import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { GamePhase, GameType, StoryEntry } from '../generated/prisma/client';
import { PrismaService } from '../prisma.service';
import { StoryEntryDto } from 'src/types/game.types';

export interface StoryUpdatedEvent {
  gameUuid: string;
}

// const fillers = ['', '(Man) ', '(Man) and (Woman) ', '', '', ''];
const prefixes = ['', 'and ', 'were ', 'He said, "', 'She said, "', 'So they '];
const suffixes = [' ', ' ', ' ', '" ', '" ', ''];
// const prompts = [
//   "Man's name:",
//   "Woman's name:",
//   'Activity:',
//   'Statement:',
//   'Statement:',
//   'Activity:',
// ];

@Injectable()
export class StoryService {
  private readonly logger = new Logger(StoryService.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async addStoryEntry(
    playerUuid: string,
    value: string,
  ): Promise<StoryEntryDto> {
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

    const entry = await this.prisma.storyEntry.upsert({
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
      },
    });

    this.eventEmitter.emit('story.updated', {
      gameUuid: player.game!.uuid,
    } as StoryUpdatedEvent);

    return {
      values: entry.values,
      story: entry.story || undefined,
    };
  }

  @OnEvent('story.updated')
  async handleStoryUpdatedEvent(payload: StoryUpdatedEvent) {
    const stories = await this.prisma.storyEntry.findMany({
      where: {
        game: { uuid: payload.gameUuid },
      },
    });

    const minStoryLength = Math.min(...stories.map((s) => s.values.length));

    if (minStoryLength === prefixes.length) {
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
        where: { uuid: payload.gameUuid },
        data: { phase: GamePhase.READ },
      });
    }
  }

  createStories(entries: StoryEntry[]) {
    const offset = Math.floor(Math.random() * entries.length);
    for (let i = 0; i < entries.length; i++) {
      let s = '';
      for (let j = 0; j < prefixes.length; j++) {
        const value = entries[(i + j + offset) % entries.length].values[j];
        s += prefixes[j] + value + suffixes[j];
      }

      entries[i].story = s;
    }
  }
}
