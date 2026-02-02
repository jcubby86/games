import { Injectable } from '@nestjs/common';
import { Category } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma.service';
import { SuggestionProvider } from './suggestion.factory';

@Injectable()
export class SuggestionRepository implements SuggestionProvider {
  constructor(private prisma: PrismaService) {}

  async getSuggestions(categories: Category[]) {
    return this.prisma.suggestion.findMany({
      where: { category: { in: categories } },
      select: { value: true, category: true },
      orderBy: { id: 'asc' },
    });
  }
}
