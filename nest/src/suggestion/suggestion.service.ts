import { SuggestionDto } from '@games/shared';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';

import { SUGGESTION_PROVIDER } from './suggestion.factory';
import type { SuggestionProvider } from './suggestion.factory';
import { SuggestionRepository } from './suggestion.repository';
import { Category } from 'src/generated/prisma/client';

@Injectable()
export class SuggestionService {
  private readonly logger = new Logger(SuggestionService.name);

  constructor(
    @Inject(SUGGESTION_PROVIDER)
    private readonly suggestionProvider: SuggestionProvider,
    private readonly suggestionRepository: SuggestionRepository,
  ) {
    this.logger.log(
      `Using suggestion provider: ${this.suggestionProvider.constructor.name}`,
    );
  }

  async getSuggestions(
    categories: string[],
    quantity: number = 5,
    noAi: boolean = false,
  ): Promise<SuggestionDto[]> {
    const validCategories = this.validateCategories(categories);
    return this.suggestionProvider.getSuggestions(
      validCategories,
      quantity,
      noAi,
    );
  }

  async likeSuggestion(uuid: string): Promise<SuggestionDto | undefined> {
    return this.suggestionRepository.incrementLikes(uuid);
  }

  private validateCategories(categories: string[]) {
    const validCategories = Object.values(Category);
    if (!categories.every((c) => validCategories.includes(c as Category))) {
      throw new BadRequestException('One or more categories are invalid');
    }
    return categories as Category[];
  }
}
