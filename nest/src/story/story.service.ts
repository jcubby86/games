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

interface StoryUpdatedEvent {
  gameUuid: string;
}

const fillers = ['', '(Man) ', '(Man) and (Woman) ', '', '', ''];
const prefixes = ['', 'and ', 'were ', 'He said, "', 'She said, "', 'So they '];
const suffixes = [' ', ' ', ' ', '" ', '" ', ''];
const prompts = [
  "Man's name:",
  "Woman's name:",
  'Activity:',
  'Statement:',
  'Statement:',
  'Activity:',
];

@Injectable()
export class StoryService {
  private readonly logger = new Logger(StoryService.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  static getHints(round: number) {
    return {
      filler: fillers[round],
      prefix: prefixes[round],
      suffix: suffixes[round],
      prompt: prompts[round],
    };
  }

  static mapToStoryEntryDto(entry?: StoryEntry): StoryEntryDto {
    return {
      values: entry?.values || [],
      story: entry?.story || undefined,
      hints: StoryService.getHints(entry?.values.length ?? 0),
    };
  }

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
    } else if (player.game!.type !== GameType.STORY) {
      throw new BadRequestException('Game is not of type STORY');
    } else if (player.game!.phase !== GamePhase.PLAY) {
      throw new BadRequestException('Game is not in PLAY phase');
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
    const players = await this.prisma.player.findMany({
      where: {
        game: { uuid: payload.gameUuid },
      },
      include: {
        storyEntries: true,
      },
    });

    const minStoryLength = Math.min(
      ...players.map((p) => p.storyEntries[0]?.values.length ?? 0),
    );

    if (minStoryLength >= prefixes.length) {
      this.logger.log(
        `All story entries completed for game ${payload.gameUuid}, generating stories. Transitioning to READ phase.`,
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
