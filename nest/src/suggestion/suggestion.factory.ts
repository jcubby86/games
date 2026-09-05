import { SuggestionDto } from '@games/shared';
import { FactoryProvider } from '@nestjs/common';

import { SuggestionCacheService } from './suggestion-cache.service';
import { SuggestionRepository } from './suggestion.repository';
import { Category } from 'src/generated/prisma/client';

export const SUGGESTION_PROVIDER = 'SuggestionProvider';

export interface SuggestionProvider {
  getSuggestions(
    categories: Category[],
    quantity?: number,
    noAi?: boolean,
  ): Promise<SuggestionDto[]>;
  enabled(): boolean;
}

export const suggestionProviderFactory: FactoryProvider<SuggestionProvider> = {
  provide: SUGGESTION_PROVIDER,
  useFactory: (
    suggestionRepository: SuggestionRepository,
    suggestionCacheService: SuggestionCacheService,
  ): SuggestionProvider =>
    // OpenAI (via the cache) supersedes the static repository whenever it's configured.
    suggestionCacheService.enabled()
      ? suggestionCacheService
      : suggestionRepository,
  inject: [SuggestionRepository, SuggestionCacheService],
};
