import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';

import { SUGGESTION_PROVIDERS, SuggestionProvider } from './suggestion.factory';
import { SuggestionDto } from 'src/game/game.types';
import { Category } from 'src/generated/prisma/client';

@Injectable()
export class SuggestionService {
  private readonly logger = new Logger(SuggestionService.name);

  constructor(
    @Inject(SUGGESTION_PROVIDERS)
    private suggestionProviders: SuggestionProvider[],
  ) {
    if (this.suggestionProviders.length === 0) {
      this.logger.warn(
        `Enabled ${this.suggestionProviders.length} suggestion providers`,
      );
    }
  }

  async getSuggestions(
    categories: string[],
    quantity: number = 5,
  ): Promise<SuggestionDto[]> {
    const validCategories = this.validateCategories(categories);
    const suggestions = await this.getAll(validCategories, quantity);

    this.shuffle(suggestions);

    return suggestions.slice(0, quantity);
  }

  private async getAll(categories: Category[], quantity: number) {
    return Promise.all(
      this.suggestionProviders.map((p) =>
        p.getSuggestions(categories, quantity),
      ),
    ).then((results) => results.flat());
  }

  private validateCategories(categories: string[]) {
    const validCategories = Object.values(Category);
    if (!categories.every((c) => validCategories.includes(c as Category))) {
      throw new BadRequestException('One or more categories are invalid');
    }
    return categories as Category[];
  }

  private shuffle<T>(rows: T[]) {
    for (let i = rows.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rows[i], rows[j]] = [rows[j], rows[i]];
    }
  }
}
