import { FactoryProvider, Injectable, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma.service';
import { SuggestionDto } from 'src/types/game.types';
import { SuggestionRepository } from './suggestion.repository';
import { Category } from 'src/generated/prisma/client';

export const SUGGESTION_PROVIDERS = 'SuggestionProviders';

export interface SuggestionProvider {
  getSuggestions(
    categories: Category[],
    quantity?: number,
  ): Promise<SuggestionDto[]>;
}

export const suggestionProviderFactory: FactoryProvider<SuggestionProvider[]> =
  {
    provide: SUGGESTION_PROVIDERS,
    useFactory: (
      configService: ConfigService,
      prismaService: PrismaService,
    ) => {
      const suggestionRepository = new SuggestionRepository(prismaService);
      return [suggestionRepository];
    },
    inject: [ConfigService, PrismaService],
  };
