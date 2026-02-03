import { Injectable } from '@nestjs/common';
import { Category } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma.service';
import { SuggestionProvider } from './suggestion.factory';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SuggestionRepository implements SuggestionProvider {
  private readonly enabledFlag: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.enabledFlag = this.configService.get<boolean>(
      'SUGGESTION_REPOSITORY_ENABLED',
      true,
    );
  }

  async getSuggestions(categories: Category[]) {
    return this.prisma.suggestion.findMany({
      where: { category: { in: categories } },
      select: { value: true, category: true },
      orderBy: { id: 'asc' },
    });
  }

  enabled() {
    return this.enabledFlag;
  }
}
