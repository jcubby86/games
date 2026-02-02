import { Injectable, NotFoundException } from '@nestjs/common';
import { Category } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma.service';
import { SuggestionDto } from 'src/types/game.types';

@Injectable()
export class SuggestionService {
  constructor(private prisma: PrismaService) {}

  async getSuggestion(
    category: string[],
    quantity: number = 5,
  ): Promise<SuggestionDto[]> {
    const suggestions = await this.prisma.suggestion.findMany({
      where: { category: { in: category as Category[] } },
      orderBy: { id: 'asc' },
    });

    if (suggestions.length === 0) {
      throw new NotFoundException('No suggestions found for this category');
    }

    const response: SuggestionDto[] = [];

    for (let i = 0; i < quantity && suggestions.length > 0; i++) {
      const index = Math.floor(Math.random() * suggestions.length);
      const suggestion = suggestions[index];
      response.push({
        value: suggestion.value,
        category: suggestion.category,
      });
      suggestions.splice(index, 1);
    }

    return response;
  }
}
