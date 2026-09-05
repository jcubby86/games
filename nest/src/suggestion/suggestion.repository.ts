import { SuggestionDto } from '@games/shared';
import { Injectable } from '@nestjs/common';

import { SuggestionProvider } from './suggestion.factory';
import { shuffle } from './suggestion.utils';
import { Category, SuggestionType } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma.service';

interface RawSuggestionRow {
  value: string;
  category: Category;
  uuid: string;
  likes: number;
  type: SuggestionType;
}

@Injectable()
export class SuggestionRepository implements SuggestionProvider {
  constructor(private readonly prisma: PrismaService) {}

  async getSuggestions(
    categories: Category[],
    quantity: number = 5,
    noAi: boolean = false,
  ): Promise<SuggestionDto[]> {
    const suggestions = await this.prisma.$queryRaw<RawSuggestionRow[]>`
      SELECT value, category, uuid, likes, type
      FROM "Suggestion"
      WHERE category = ANY(${categories}::"Category"[])
        AND (
          type = 'HUMAN'
          OR (type = 'AI' AND likes <> -1 AND NOT ${noAi})
        )
      ORDER BY POWER(random(), 1.0 / (likes + 1)) DESC
      LIMIT ${quantity}
    `;

    const freshAiUuids = suggestions
      .filter((s) => s.type === 'AI' && s.likes === 0)
      .map((s) => s.uuid);

    if (freshAiUuids.length > 0) {
      await this.prisma.suggestion.updateMany({
        where: { uuid: { in: freshAiUuids } },
        data: { likes: -1 },
      });
    }

    return suggestions.map(({ value, category, uuid }) => ({
      value,
      category,
      uuid,
    }));
  }

  async getExamples(category: Category, count: number): Promise<string[]> {
    const suggestions = await this.prisma.suggestion.findMany({
      where: { category, type: 'HUMAN' },
      select: { value: true },
    });
    return shuffle(suggestions.map((s) => s.value)).slice(0, count);
  }

  async countAiSuggestions(category: Category): Promise<number> {
    return this.prisma.suggestion.count({
      where: { category, type: 'AI', likes: 0 },
    });
  }

  async createAiSuggestions(category: Category, values: string[]) {
    await this.prisma.suggestion.createMany({
      data: values.map((value) => ({ category, value, type: 'AI' })),
      skipDuplicates: true,
    });
  }

  async deleteUnlikedUsedAiSuggestions(before: Date): Promise<number> {
    const { count } = await this.prisma.suggestion.deleteMany({
      where: { type: 'AI', likes: -1, updatedAt: { lt: before } },
    });
    return count;
  }

  async incrementLikes(uuid: string): Promise<SuggestionDto | undefined> {
    const rows = await this.prisma.$queryRaw<
      { value: string; category: Category; uuid: string }[]
    >`
      UPDATE "Suggestion"
      SET likes = CASE WHEN likes = -1 THEN 1 ELSE likes + 1 END
      WHERE uuid = ${uuid}
      RETURNING value, category, uuid
    `;
    return rows[0];
  }

  enabled() {
    return true;
  }
}
