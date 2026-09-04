import { SuggestionDto } from '@games/shared';
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
      where: { category: { in: categories }, type: 'HUMAN' },
      select: { value: true, category: true },
      orderBy: { id: 'asc' },
    });
  }

  async getExamples(category: Category, count: number): Promise<string[]> {
    const suggestions = await this.prisma.suggestion.findMany({
      where: { category, type: 'HUMAN' },
      select: { value: true },
    });
    return shuffle(suggestions.map((s) => s.value)).slice(0, count);
  }

  async countAiSuggestions(category: Category): Promise<number> {
    return this.prisma.suggestion.count({ where: { category, type: 'AI' } });
  }

  async createAiSuggestions(category: Category, values: string[]) {
    await this.prisma.suggestion.createMany({
      data: values.map((value) => ({ category, value, type: 'AI' })),
      skipDuplicates: true,
    });
  }

  async popAiSuggestions(
    category: Category,
    quantity: number,
  ): Promise<SuggestionDto[]> {
    return this.prisma.$queryRaw<SuggestionDto[]>`
      DELETE FROM "Suggestion"
      WHERE id IN (
        SELECT id FROM "Suggestion"
        WHERE category = ${category}::"Category" AND type = 'AI'::"SuggestionType"
        ORDER BY random()
        LIMIT ${quantity}
      )
      RETURNING value, category;
    `;
  }

  enabled() {
    return true;
  }
}
