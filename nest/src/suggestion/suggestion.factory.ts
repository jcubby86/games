import { FactoryProvider } from '@nestjs/common';

import { SuggestionRepository } from './suggestion.repository';
import { SuggestionDto } from 'src/game/game.types';
import { Category } from 'src/generated/prisma/client';
import { OpenAIService } from 'src/openai/openai.service';

export const SUGGESTION_PROVIDER = 'SuggestionProvider';

export interface SuggestionProvider {
  getSuggestions(
    categories: Category[],
    quantity?: number,
  ): Promise<SuggestionDto[]>;
  enabled(): boolean;
}

export const suggestionProviderFactory: FactoryProvider<SuggestionProvider> = {
  provide: SUGGESTION_PROVIDER,
  useFactory: (
    suggestionRepository: SuggestionRepository,
    openAIService: OpenAIService,
  ): SuggestionProvider =>
    // OpenAI supersedes the static repository whenever it's configured.
    openAIService.enabled() ? openAIService : suggestionRepository,
  inject: [SuggestionRepository, OpenAIService],
};
