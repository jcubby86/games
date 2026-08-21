import { SuggestionDto } from '@games/shared';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';

import { SUGGESTION_PROVIDER } from './suggestion.factory';
import type { SuggestionProvider } from './suggestion.factory';
import { shuffle } from './suggestion.utils';
import { Category } from 'src/generated/prisma/client';

@Injectable()
export class SuggestionService {
  private readonly logger = new Logger(SuggestionService.name);

  constructor(
    @Inject(SUGGESTION_PROVIDER)
    private readonly suggestionProvider: SuggestionProvider,
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
    const suggestions = await this.suggestionProvider.getSuggestions(
      validCategories,
      quantity,
      noAi,
    );

    return shuffle(suggestions).slice(0, quantity);
  }

  private validateCategories(categories: string[]) {
    const validCategories = Object.values(Category);
    if (!categories.every((c) => validCategories.includes(c as Category))) {
      throw new BadRequestException('One or more categories are invalid');
    }
    return categories as Category[];
  }
}
