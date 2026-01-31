import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Category } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma.service';
import { SuggestionDto } from 'src/types/game.types';

@Injectable()
export class SuggestionService {
  constructor(private prisma: PrismaService) {}

  async getSuggestion(category: string): Promise<SuggestionDto> {
    if (!Object.values(Category).includes(category as Category)) {
      throw new BadRequestException('Invalid category');
    }

    const suggestions = await this.prisma.suggestion.findMany({
      where: { category: category as Category },
    });

    if (suggestions.length === 0) {
      throw new NotFoundException('No suggestions found for this category');
    }

    const randomIndex = Math.floor(Math.random() * suggestions.length);
    const suggestion = suggestions[randomIndex];
    return {
      value: suggestion.value,
      category: suggestion.category,
    };
  }
}
