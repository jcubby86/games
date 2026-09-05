import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';

import { hints } from './story.constants';
import { StoryService } from './story.service';
import { Game, Player, StoryEntry } from 'src/generated/prisma/client';
import { GamePhase, GameType } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/prisma.service';

function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    id: 1,
    uuid: 'game-uuid',
    code: 'ABCD',
    type: GameType.STORY,
    phase: GamePhase.PLAY,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 1,
    uuid: 'player-uuid',
    nickname: 'nick',
    gameId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeEntry(overrides: Partial<StoryEntry> = {}): StoryEntry {
  return {
    id: 1,
    values: [],
    story: null,
    gameId: 1,
    playerId: 1,
    ...overrides,
  };
}

describe('StoryService', () => {
  let service: StoryService;
  let prisma: {
    player: { findUnique: jest.Mock; findMany: jest.Mock };
    storyEntry: { upsert: jest.Mock; update: jest.Mock; findMany: jest.Mock };
    game: { update: jest.Mock };
    $transaction: jest.Mock;
  };
  let eventEmitter: { emit: jest.Mock };

  beforeEach(async () => {
    prisma = {
      player: { findUnique: jest.fn(), findMany: jest.fn() },
      storyEntry: { upsert: jest.fn(), update: jest.fn(), findMany: jest.fn() },
      game: { update: jest.fn() },
      $transaction: jest.fn().mockResolvedValue(undefined),
    };
    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoryService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<StoryService>(StoryService);
  });

  describe('mapToStoryEntryDto', () => {
    it('returns empty defaults when no entry is given', () => {
      expect(StoryService.mapToStoryEntryDto()).toEqual({
        values: [],
        story: undefined,
        hint: hints[0],
      });
    });

    it('picks the hint matching the entry length', () => {
      const entry = makeEntry({ values: ['a', 'b'] });
      expect(StoryService.mapToStoryEntryDto(entry)).toEqual({
        values: ['a', 'b'],
        story: undefined,
        hint: hints[2],
      });
    });
  });

  describe('trimQuotes', () => {
    it('strips quotes at the boundaries and surrounding whitespace', () => {
      expect(service.trimQuotes('"hello"')).toBe('hello');
      expect(service.trimQuotes('  hello  ')).toBe('hello');
      expect(service.trimQuotes('no quotes here')).toBe('no quotes here');
    });
  });

  describe('endsWithPunctuation', () => {
    it('detects trailing sentence punctuation', () => {
      expect(service.endsWithPunctuation('done.')).toBe(true);
      expect(service.endsWithPunctuation('really?!')).toBe(true);
      expect(service.endsWithPunctuation('nope')).toBe(false);
    });
  });

  describe('createStories', () => {
    afterEach(() => {
      jest.spyOn(Math, 'random').mockRestore();
    });

    it('builds a story from each entry using every hint prefix/suffix in order', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0);

      const values = hints.map((_, i) => `value${i}`);
      const entries = [makeEntry({ id: 1, values })];

      service.createStories(entries);

      expect(entries[0].story).toEqual(
        hints.map((h, j) => h.prefix + `value${j}` + h.suffix).join(''),
      );
    });

    it('interleaves answers from other players using an offset', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0);

      const entryA = makeEntry({ id: 1, values: hints.map((_, i) => `a${i}`) });
      const entryB = makeEntry({ id: 2, values: hints.map((_, i) => `b${i}`) });
      const entries = [entryA, entryB];

      service.createStories(entries);

      const expected = hints
        .map((h, j) => h.prefix + (j % 2 === 0 ? `a${j}` : `b${j}`) + h.suffix)
        .join('');
      expect(entries[0].story).toEqual(expected);
    });

    it('drops the suffix period when the value already ends with punctuation', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0);

      const values = hints.map((_, i) => `value${i}`);
      values[3] = 'He said this.';
      const entries = [makeEntry({ id: 1, values })];

      service.createStories(entries);

      expect(entries[0].story).toContain('He said, "He said this." ');
    });
  });

  describe('addStoryEntry', () => {
    it('throws for an empty value', async () => {
      await expect(service.addStoryEntry('player-uuid', '  ')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException when the player does not exist', async () => {
      prisma.player.findUnique.mockResolvedValue(null);
      await expect(
        service.addStoryEntry('player-uuid', 'value'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws when the game is not a STORY game', async () => {
      prisma.player.findUnique.mockResolvedValue({
        ...makePlayer(),
        game: makeGame({ type: GameType.NAME }),
      });
      await expect(
        service.addStoryEntry('player-uuid', 'value'),
      ).rejects.toThrow('Game is not of type STORY');
    });

    it('throws when the game is not in the PLAY phase', async () => {
      prisma.player.findUnique.mockResolvedValue({
        ...makePlayer(),
        game: makeGame({ phase: GamePhase.JOIN }),
      });
      await expect(
        service.addStoryEntry('player-uuid', 'value'),
      ).rejects.toThrow('Game is not in PLAY phase');
    });

    it('throws when the player is ahead of the rest of the group', async () => {
      const game = makeGame();
      const ahead = makePlayer({
        id: 1,
        uuid: 'player-uuid',
        storyEntries: [makeEntry({ values: ['a'] })],
      } as Partial<Player>);
      const behind = makePlayer({
        id: 2,
        uuid: 'other-uuid',
        storyEntries: [],
      } as Partial<Player>);
      prisma.player.findUnique.mockResolvedValue({ ...ahead, game });
      prisma.player.findMany.mockResolvedValue([ahead, behind]);

      await expect(
        service.addStoryEntry('player-uuid', 'value'),
      ).rejects.toThrow('Player cannot submit entry at this time');
    });

    it('upserts the entry and emits story.updated on success', async () => {
      const game = makeGame();
      const player = { ...makePlayer(), game, gameId: game.id };
      prisma.player.findUnique.mockResolvedValue(player);
      prisma.player.findMany.mockResolvedValue([
        { ...player, storyEntries: [] },
      ]);
      const savedEntry = makeEntry({ values: ['a new value'] });
      prisma.storyEntry.upsert.mockResolvedValue(savedEntry);

      const result = await service.addStoryEntry('player-uuid', 'a new value');

      expect(prisma.storyEntry.upsert).toHaveBeenCalledWith({
        where: {
          gameId_playerId: { gameId: game.id, playerId: player.id },
        },
        update: { values: { push: 'a new value' } },
        create: {
          values: ['a new value'],
          playerId: player.id,
          gameId: game.id,
        },
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('story.updated', {
        game,
        action: 'player.entry.submitted',
        player,
      });
      expect(result).toEqual({
        values: savedEntry.values,
        story: undefined,
        hint: hints[savedEntry.values.length],
      });
    });
  });

  describe('handleStoryUpdatedEvent', () => {
    const game = makeGame();

    it('passes the event through when not everyone has submitted', async () => {
      const submitted = makePlayer({
        id: 1,
        uuid: 'submitted',
        storyEntries: [makeEntry({ values: ['a'] })],
      } as Partial<Player>);
      const waiting = makePlayer({
        id: 2,
        uuid: 'waiting',
        storyEntries: [],
      } as Partial<Player>);
      prisma.player.findMany.mockResolvedValue([submitted, waiting]);

      await service.handleStoryUpdatedEvent({
        game,
        player: submitted,
        action: 'player.entry.submitted',
      });

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'game.updated',
        expect.objectContaining({ game, action: 'player.entry.submitted' }),
      );
      expect(prisma.game.update).not.toHaveBeenCalled();
    });

    it('reports progress once everyone submits but the story is not finished', async () => {
      const values = ['a'];
      const players = [
        makePlayer({
          id: 1,
          uuid: 'p1',
          storyEntries: [makeEntry({ values })],
        } as Partial<Player>),
        makePlayer({
          id: 2,
          uuid: 'p2',
          storyEntries: [makeEntry({ values })],
        } as Partial<Player>),
      ];
      prisma.player.findMany.mockResolvedValue(players);

      await service.handleStoryUpdatedEvent({
        game,
        player: null,
        action: 'player.entry.submitted',
      });

      expect(prisma.game.update).not.toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('game.updated', {
        game,
        action: 'player.entry.submitted',
        player: null,
      });
    });

    it('finishes the story, saves it, and transitions to READ once all hints are answered', async () => {
      const values = hints.map((_, i) => `value${i}`);
      const entryA = makeEntry({ id: 1, playerId: 1, values });
      const entryB = makeEntry({ id: 2, playerId: 2, values });
      const players = [
        { ...makePlayer({ id: 1, uuid: 'p1' }), storyEntries: [entryA] },
        { ...makePlayer({ id: 2, uuid: 'p2' }), storyEntries: [entryB] },
      ];
      prisma.player.findMany.mockResolvedValue(players);
      prisma.game.update.mockResolvedValue({ ...game, phase: GamePhase.READ });

      await service.handleStoryUpdatedEvent({
        game,
        player: null,
        action: 'player.entry.submitted',
      });

      expect(entryA.story).toEqual(expect.any(String));
      expect(entryB.story).toEqual(expect.any(String));
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.game.update).toHaveBeenCalledWith({
        where: { id: game.id },
        data: { phase: GamePhase.READ },
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('game.updated', {
        game,
        action: 'phase.updated',
        player: null,
      });
    });
  });

  describe('getPlayer', () => {
    it('includes the current entry and hint while in the PLAY phase', async () => {
      const game = makeGame({ phase: GamePhase.PLAY });
      const entry = makeEntry({ values: ['a'] });
      const player = makePlayer();
      prisma.player.findMany.mockResolvedValue([
        { ...player, storyEntries: [entry] },
      ]);

      const result = await service.getPlayer(player, game);

      expect(result.entry).toEqual({ values: ['a'], hint: hints[1] });
    });

    it('includes the finished story while in the READ phase', async () => {
      const game = makeGame({ phase: GamePhase.READ });
      const entry = makeEntry({ values: ['a'], story: 'The finished tale.' });
      const player = makePlayer();
      prisma.player.findMany.mockResolvedValue([
        { ...player, storyEntries: [entry] },
      ]);

      const result = await service.getPlayer(player, game);

      expect(result.entry).toEqual({
        values: ['a'],
        story: 'The finished tale.',
      });
    });

    it('omits the entry field outside of PLAY/READ', async () => {
      const game = makeGame({ phase: GamePhase.JOIN });
      const player = makePlayer();
      prisma.player.findMany.mockResolvedValue([
        { ...player, storyEntries: [] },
      ]);

      const result = await service.getPlayer(player, game);

      expect(result.entry).toBeUndefined();
    });
  });

  describe('getStoryArchives', () => {
    it('maps entries to player/story pairs, defaulting empty stories', async () => {
      const entries = [
        {
          player: { uuid: 'p1', nickname: 'alice' },
          story: 'A tale',
        },
        {
          player: { uuid: 'p2', nickname: 'bob' },
          story: null,
        },
      ];
      prisma.storyEntry.findMany.mockResolvedValue(entries);

      const result = await service.getStoryArchives('game-uuid');

      expect(prisma.storyEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { game: { uuid: 'game-uuid' } } }),
      );
      expect(result).toEqual([
        { player: { uuid: 'p1', nickname: 'alice' }, story: 'A tale' },
        { player: { uuid: 'p2', nickname: 'bob' }, story: '' },
      ]);
    });
  });
});
