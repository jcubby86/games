import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { SuggestionCacheService } from './suggestion-cache.service';
import { SuggestionRepository } from './suggestion.repository';
import { SuggestionDto } from 'src/game/game.types';
import { Category } from 'src/generated/prisma/client';
import { OpenAIService } from 'src/openai/openai.service';

const TARGET_STOCK = 50;
const REFILL_BATCH_SIZE = 10;

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

interface SuggestionCacheServiceInternals {
  cache: Map<Category, SuggestionDto[]>;
  fillCategory(category: Category): Promise<void>;
}

const internals = (service: SuggestionCacheService) =>
  service as unknown as SuggestionCacheServiceInternals;

describe('SuggestionCacheService', () => {
  let service: SuggestionCacheService;
  let openAIService: { enabled: jest.Mock; getSuggestions: jest.Mock };
  let suggestionRepository: { getSuggestions: jest.Mock };

  const suggestion = (category: Category, value: string): SuggestionDto => ({
    value,
    category,
  });

  beforeEach(async () => {
    openAIService = {
      enabled: jest.fn().mockReturnValue(true),
      getSuggestions: jest.fn().mockResolvedValue([]),
    };
    suggestionRepository = {
      getSuggestions: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuggestionCacheService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(undefined) },
        },
        { provide: OpenAIService, useValue: openAIService },
        { provide: SuggestionRepository, useValue: suggestionRepository },
      ],
    }).compile();

    service = module.get(SuggestionCacheService);
  });

  it('delegates enabled() to the underlying OpenAI service', () => {
    openAIService.enabled.mockReturnValue(false);
    expect(service.enabled()).toBe(false);
  });

  it('falls back to the suggestion repository when the cache has fewer than the requested quantity', async () => {
    const stored = [
      suggestion(Category.STATEMENT, 'a'),
      suggestion(Category.STATEMENT, 'b'),
    ];
    suggestionRepository.getSuggestions.mockResolvedValue(stored);

    const result = await service.getSuggestions([Category.STATEMENT], 5);
    const byValue = (a: SuggestionDto, b: SuggestionDto) =>
      a.value.localeCompare(b.value);

    expect(result.sort(byValue)).toEqual(stored.sort(byValue));
    expect(suggestionRepository.getSuggestions).toHaveBeenCalledWith([
      Category.STATEMENT,
    ]);
  });

  it('serves from the cache and does not queue a refill above the target stock', async () => {
    const cached = Array.from({ length: TARGET_STOCK + 2 }, (_, i) =>
      suggestion(Category.STATEMENT, `s${i}`),
    );
    internals(service).cache.set(Category.STATEMENT, [...cached]);

    const result = await service.getSuggestions([Category.STATEMENT], 2);

    expect(result).toEqual(cached.slice(0, 2));
    expect(openAIService.getSuggestions).not.toHaveBeenCalled();
  });

  it('queues a refill once the cache drops below the target stock', async () => {
    const cached = Array.from({ length: TARGET_STOCK - 10 }, (_, i) =>
      suggestion(Category.STATEMENT, `s${i}`),
    );
    internals(service).cache.set(Category.STATEMENT, [...cached]);
    openAIService.getSuggestions.mockResolvedValue([]);

    await service.getSuggestions([Category.STATEMENT], 1);
    await flushPromises();

    expect(openAIService.getSuggestions).toHaveBeenCalledWith(
      [Category.STATEMENT],
      REFILL_BATCH_SIZE,
    );
  });

  it('bypasses OpenAI and the cache entirely when noAi is set', async () => {
    const stored = [
      suggestion(Category.STATEMENT, 'a'),
      suggestion(Category.STATEMENT, 'b'),
    ];
    suggestionRepository.getSuggestions.mockResolvedValue(stored);

    const result = await service.getSuggestions([Category.STATEMENT], 5, true);
    const byValue = (a: SuggestionDto, b: SuggestionDto) =>
      a.value.localeCompare(b.value);

    expect(result.sort(byValue)).toEqual(stored.sort(byValue));
    expect(suggestionRepository.getSuggestions).toHaveBeenCalledWith([
      Category.STATEMENT,
    ]);
    expect(openAIService.getSuggestions).not.toHaveBeenCalled();
  });

  it('fills the cache in small batches until the target stock is reached', async () => {
    const batch = (n: number) =>
      Array.from({ length: n }, (_, i) =>
        suggestion(Category.STATEMENT, `b${i}`),
      );
    openAIService.getSuggestions.mockResolvedValue(batch(REFILL_BATCH_SIZE));

    await internals(service).fillCategory(Category.STATEMENT);

    const expectedCalls = TARGET_STOCK / REFILL_BATCH_SIZE;
    expect(openAIService.getSuggestions).toHaveBeenCalledTimes(expectedCalls);
    expect(openAIService.getSuggestions).toHaveBeenNthCalledWith(
      1,
      [Category.STATEMENT],
      REFILL_BATCH_SIZE,
    );
    expect(internals(service).cache.get(Category.STATEMENT)).toHaveLength(
      TARGET_STOCK,
    );
  });

  it('processes queued refills for different categories one at a time', async () => {
    let resolveFirst: (value: SuggestionDto[]) => void = () => {};
    const first = new Promise<SuggestionDto[]>((resolve) => {
      resolveFirst = resolve;
    });

    openAIService.getSuggestions.mockImplementationOnce(() => first);
    openAIService.getSuggestions.mockResolvedValue([]);

    internals(service).cache.set(Category.STATEMENT, []);
    internals(service).cache.set(Category.FEMALE_NAME, []);

    void service.getSuggestions([Category.STATEMENT], 1);
    await flushPromises();
    void service.getSuggestions([Category.FEMALE_NAME], 1);
    await flushPromises();

    // The second category's refill has been queued but not yet requested.
    expect(openAIService.getSuggestions).toHaveBeenCalledTimes(1);
    expect(openAIService.getSuggestions).toHaveBeenCalledWith(
      [Category.STATEMENT],
      REFILL_BATCH_SIZE,
    );

    resolveFirst([]);
    await flushPromises();
    await flushPromises();

    expect(openAIService.getSuggestions).toHaveBeenCalledWith(
      [Category.FEMALE_NAME],
      REFILL_BATCH_SIZE,
    );
  });
});
