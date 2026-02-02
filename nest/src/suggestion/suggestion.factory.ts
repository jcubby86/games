import { FactoryProvider } from '@nestjs/common';
import { SuggestionDto } from 'src/types/game.types';
import { SuggestionRepository } from './suggestion.repository';
import { Category } from 'src/generated/prisma/client';
import { OpenAIService } from 'src/openai/openai.service';

export const SUGGESTION_PROVIDERS = 'SuggestionProviders';

export interface SuggestionProvider {
  getSuggestions(
    categories: Category[],
    quantity?: number,
  ): Promise<SuggestionDto[]>;
  enabled(): boolean;
}

export const suggestionProviderFactory: FactoryProvider<SuggestionProvider[]> =
  {
    provide: SUGGESTION_PROVIDERS,
    useFactory: (
      suggestionRepository: SuggestionRepository,
      openAIService: OpenAIService,
    ) => {
      const providers = [suggestionRepository, openAIService];
      return providers.filter((p) => {
        return p.enabled() === true;
      });
    },
    inject: [SuggestionRepository, OpenAIService],
  };
