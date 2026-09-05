import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { SuggestionCleanupService } from './suggestion-cleanup.service';
import { SuggestionRepository } from './suggestion.repository';

// @nestjs/schedule ships as pure ESM, which Jest can't parse from
// node_modules by default; the actual cron wiring isn't under test here,
// so stub it out rather than widening the shared transformIgnorePatterns.
jest.mock('@nestjs/schedule', () => ({
  Cron: () => () => {},
  CronExpression: { EVERY_HOUR: 'EVERY_HOUR' },
}));

async function buildService(hours?: string) {
  const configService = {
    get: jest.fn().mockReturnValue(hours),
  };
  const suggestionRepository = {
    deleteUnlikedUsedAiSuggestions: jest
      .fn<Promise<number>, [Date]>()
      .mockResolvedValue(0),
  };

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      SuggestionCleanupService,
      { provide: ConfigService, useValue: configService },
      { provide: SuggestionRepository, useValue: suggestionRepository },
    ],
  }).compile();

  return {
    service: module.get<SuggestionCleanupService>(SuggestionCleanupService),
    suggestionRepository,
  };
}

describe('SuggestionCleanupService', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-02T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('defaults the grace period to 24 hours when not configured', async () => {
    const { service, suggestionRepository } = await buildService(undefined);

    await service.cleanupUnlikedAiSuggestions();

    const before =
      suggestionRepository.deleteUnlikedUsedAiSuggestions.mock.calls[0][0];
    expect(before).toEqual(new Date('2026-01-01T00:00:00.000Z'));
  });

  it('uses the configured grace period in hours', async () => {
    const { service, suggestionRepository } = await buildService('2');

    await service.cleanupUnlikedAiSuggestions();

    const before =
      suggestionRepository.deleteUnlikedUsedAiSuggestions.mock.calls[0][0];
    expect(before).toEqual(new Date('2026-01-01T22:00:00.000Z'));
  });

  it('deletes suggestions used before the grace cutoff', async () => {
    const { service, suggestionRepository } = await buildService('24');
    suggestionRepository.deleteUnlikedUsedAiSuggestions.mockResolvedValue(3);

    await expect(
      service.cleanupUnlikedAiSuggestions(),
    ).resolves.toBeUndefined();

    expect(
      suggestionRepository.deleteUnlikedUsedAiSuggestions,
    ).toHaveBeenCalledTimes(1);
  });
});
