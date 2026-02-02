import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SuggestionDto } from 'src/types/game.types';
import { SUGGESTION_PROVIDERS, SuggestionProvider } from './suggestion.factory';
import { Category } from 'src/generated/prisma/client';

@Injectable()
export class SuggestionService {
  constructor(
    @Inject(SUGGESTION_PROVIDERS)
    private suggestionProviders: SuggestionProvider[],
  ) {}

  async getSuggestions(
    categories: string[],
    quantity: number = 5,
  ): Promise<SuggestionDto[]> {
    const validCategories = this.validateCategories(categories);
    const suggestions = await this.getAll(validCategories, quantity);

    if (suggestions.length === 0) {
      throw new NotFoundException('No suggestions found for this category');
    }

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
    var validCategories = Object.values(Category);
    if (!categories.every((c) => validCategories.includes(c as Category))) {
      throw new BadRequestException('One or more categories are invalid');
    }
    return categories as Category[];
  }

  private shuffle(rows: any[]) {
    for (let i = rows.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rows[i], rows[j]] = [rows[j], rows[i]];
    }
  }
}
