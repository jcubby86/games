import { Injectable } from '@nestjs/common';

import { SuggestionProvider } from './suggestion.factory';
import { shuffle } from './suggestion.utils';
import { Category } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class SuggestionRepository implements SuggestionProvider {
  constructor(private readonly prisma: PrismaService) {}

  async getSuggestions(categories: Category[]) {
    return this.prisma.suggestion.findMany({
      where: { category: { in: categories } },
      select: { value: true, category: true },
      orderBy: { id: 'asc' },
    });
  }

  async getExamples(category: Category, count: number): Promise<string[]> {
    const suggestions = await this.prisma.suggestion.findMany({
      where: { category },
      select: { value: true },
    });
    return shuffle(suggestions.map((s) => s.value)).slice(0, count);
  }

  enabled() {
    return true;
  }
}
