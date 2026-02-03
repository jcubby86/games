import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { SuggestionProvider } from './suggestion.factory';
import { Category } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class SuggestionRepository implements SuggestionProvider {
  private readonly enabledFlag: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const flag = this.configService.get<boolean>(
      'SUGGESTION_REPOSITORY_ENABLED',
      true,
    );
    this.enabledFlag = flag === true;
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
