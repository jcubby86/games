import { SuggestionDto } from '@games/shared';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { SuggestionCacheService } from './suggestion-cache.service';
import { SuggestionRepository } from './suggestion.repository';
import { Category } from 'src/generated/prisma/client';
import { OpenAIService } from 'src/openai/openai.service';

const TARGET_STOCK = 50;
const REFILL_BATCH_SIZE = 10;

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

interface SuggestionCacheServiceInternals {
  fillCategory(category: Category): Promise<void>;
}

const internals = (service: SuggestionCacheService) =>
  service as unknown as SuggestionCacheServiceInternals;

describe('SuggestionCacheService', () => {
  let service: SuggestionCacheService;
  let openAIService: { enabled: jest.Mock; getSuggestions: jest.Mock };
  let suggestionRepository: {
    getSuggestions: jest.Mock;
    popAiSuggestions: jest.Mock;
    countAiSuggestions: jest.Mock;
    createAiSuggestions: jest.Mock;
  };

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
      popAiSuggestions: jest.fn().mockResolvedValue([]),
      countAiSuggestions: jest.fn().mockResolvedValue(0),
      createAiSuggestions: jest.fn().mockResolvedValue(undefined),
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

  it('tops up from the suggestion repository when the DB stock has fewer than the requested quantity', async () => {
    const popped = [suggestion(Category.STATEMENT, 'popped')];
    const fallback = [
      suggestion(Category.STATEMENT, 'a'),
      suggestion(Category.STATEMENT, 'b'),
    ];
    suggestionRepository.popAiSuggestions.mockResolvedValue(popped);
    suggestionRepository.getSuggestions.mockResolvedValue(fallback);

    const result = await service.getSuggestions([Category.STATEMENT], 3);

    expect(result).toHaveLength(3);
    expect(result).toEqual(expect.arrayContaining(popped));
    expect(suggestionRepository.popAiSuggestions).toHaveBeenCalledWith(
      Category.STATEMENT,
      3,
    );
    expect(suggestionRepository.getSuggestions).toHaveBeenCalledWith([
      Category.STATEMENT,
    ]);
  });

  it('serves purely from the DB stock and does not queue a refill above the target stock', async () => {
    const popped = [
      suggestion(Category.STATEMENT, 'a'),
      suggestion(Category.STATEMENT, 'b'),
    ];
    suggestionRepository.popAiSuggestions.mockResolvedValue(popped);
    suggestionRepository.countAiSuggestions.mockResolvedValue(TARGET_STOCK);

    const result = await service.getSuggestions([Category.STATEMENT], 2);

    expect(result).toEqual(popped);
    expect(openAIService.getSuggestions).not.toHaveBeenCalled();
  });

  it('queues a refill once the DB stock drops below the target stock', async () => {
    suggestionRepository.popAiSuggestions.mockResolvedValue([
      suggestion(Category.STATEMENT, 'a'),
    ]);
    suggestionRepository.countAiSuggestions.mockResolvedValue(
      TARGET_STOCK - 10,
    );
    openAIService.getSuggestions.mockResolvedValue([]);

    await service.getSuggestions([Category.STATEMENT], 1);
    await flushPromises();

    expect(openAIService.getSuggestions).toHaveBeenCalledWith(
      [Category.STATEMENT],
      REFILL_BATCH_SIZE,
    );
  });

  it('bypasses OpenAI and the AI stock entirely when noAi is set', async () => {
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
    expect(suggestionRepository.popAiSuggestions).not.toHaveBeenCalled();
  });

  it('fills the DB stock in small batches until the target stock is reached', async () => {
    const batch = (n: number) =>
      Array.from({ length: n }, (_, i) =>
        suggestion(Category.STATEMENT, `b${i}`),
      );
    openAIService.getSuggestions.mockResolvedValue(batch(REFILL_BATCH_SIZE));

    let stock = 0;
    suggestionRepository.countAiSuggestions.mockImplementation(() =>
      Promise.resolve(stock),
    );
    suggestionRepository.createAiSuggestions.mockImplementation(
      (_category: Category, values: string[]) => {
        stock += values.length;
        return Promise.resolve();
      },
    );

    await internals(service).fillCategory(Category.STATEMENT);

    const expectedCalls = TARGET_STOCK / REFILL_BATCH_SIZE;
    expect(openAIService.getSuggestions).toHaveBeenCalledTimes(expectedCalls);
    expect(openAIService.getSuggestions).toHaveBeenNthCalledWith(
      1,
      [Category.STATEMENT],
      REFILL_BATCH_SIZE,
    );
    expect(suggestionRepository.createAiSuggestions).toHaveBeenCalledWith(
      Category.STATEMENT,
      batch(REFILL_BATCH_SIZE).map((s) => s.value),
    );
    expect(stock).toBe(TARGET_STOCK);
  });

  it('processes queued refills for different categories one at a time', async () => {
    let resolveFirst: (value: SuggestionDto[]) => void = () => {};
    const first = new Promise<SuggestionDto[]>((resolve) => {
      resolveFirst = resolve;
    });

    openAIService.getSuggestions.mockImplementationOnce(() => first);
    openAIService.getSuggestions.mockResolvedValue([]);

    suggestionRepository.countAiSuggestions.mockResolvedValue(0);
    suggestionRepository.popAiSuggestions.mockResolvedValue([]);
    suggestionRepository.getSuggestions.mockResolvedValue([]);

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
