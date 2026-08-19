import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';

import {
  REPLENISH_EVENT,
  SuggestionCacheService,
} from './suggestion-cache.service';
import { SuggestionRepository } from './suggestion.repository';
import { SuggestionDto } from 'src/game/game.types';
import { Category } from 'src/generated/prisma/client';
import { OpenAIService } from 'src/openai/openai.service';

describe('SuggestionCacheService', () => {
  let service: SuggestionCacheService;
  let openAIService: { enabled: jest.Mock; getSuggestions: jest.Mock };
  let suggestionRepository: { getSuggestions: jest.Mock };
  let eventEmitter: { emit: jest.Mock };

  const suggestion = (value: string): SuggestionDto => ({
    value,
    category: Category.STATEMENT,
  });

  beforeEach(async () => {
    openAIService = {
      enabled: jest.fn().mockReturnValue(true),
      getSuggestions: jest.fn().mockResolvedValue([]),
    };
    suggestionRepository = {
      getSuggestions: jest.fn().mockResolvedValue([]),
    };
    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuggestionCacheService,
        { provide: OpenAIService, useValue: openAIService },
        { provide: SuggestionRepository, useValue: suggestionRepository },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get(SuggestionCacheService);
  });

  it('delegates enabled() to the underlying OpenAI service', () => {
    openAIService.enabled.mockReturnValue(false);
    expect(service.enabled()).toBe(false);
  });

  it('falls back to the suggestion repository when the cache has fewer than the requested quantity', async () => {
    const stored = [suggestion('a'), suggestion('b')];
    suggestionRepository.getSuggestions.mockResolvedValue(stored);

    const result = await service.getSuggestions([Category.STATEMENT], 5);
    const byValue = (a: SuggestionDto, b: SuggestionDto) =>
      a.value.localeCompare(b.value);

    expect(result.sort(byValue)).toEqual(stored.sort(byValue));
    expect(suggestionRepository.getSuggestions).toHaveBeenCalledWith([
      Category.STATEMENT,
    ]);
  });

  it('emits a replenish event when falling back to the repository', async () => {
    await service.getSuggestions([Category.STATEMENT], 5);

    expect(eventEmitter.emit).toHaveBeenCalledWith(REPLENISH_EVENT, {
      category: Category.STATEMENT,
    });
  });

  it('serves from the cache once it has been populated', async () => {
    // 12 cached items so taking 2 leaves 10, at (not below) the low water mark.
    const cached = Array.from({ length: 12 }, (_, i) => suggestion(`s${i}`));
    openAIService.getSuggestions.mockResolvedValue(cached);
    await service.handleReplenish({ category: Category.STATEMENT });
    eventEmitter.emit.mockClear();

    const result = await service.getSuggestions([Category.STATEMENT], 2);

    expect(result).toEqual(cached.slice(0, 2));
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('emits a replenish event once the cache drops below the low water mark', async () => {
    const cached = Array.from({ length: 9 }, (_, i) => suggestion(`s${i}`));
    openAIService.getSuggestions.mockResolvedValue(cached);
    await service.handleReplenish({ category: Category.STATEMENT });
    eventEmitter.emit.mockClear();

    await service.getSuggestions([Category.STATEMENT], 1);

    expect(eventEmitter.emit).toHaveBeenCalledWith(REPLENISH_EVENT, {
      category: Category.STATEMENT,
    });
  });

  it('generates a batch via OpenAI and appends it to the cache when replenishing', async () => {
    const generated = [suggestion('a'), suggestion('b')];
    openAIService.getSuggestions.mockResolvedValue(generated);

    await service.handleReplenish({ category: Category.STATEMENT });

    expect(openAIService.getSuggestions).toHaveBeenCalledWith(
      [Category.STATEMENT],
      20,
    );
  });
});
