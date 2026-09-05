import { SuggestionDto } from '@games/shared';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { SuggestionProvider } from './suggestion.factory';
import { SuggestionRepository } from './suggestion.repository';
import { Category } from 'src/generated/prisma/client';
import { OpenAIService } from 'src/openai/openai.service';

const TARGET_STOCK = 50;

@Injectable()
export class SuggestionCacheService
  implements SuggestionProvider, OnApplicationBootstrap
{
  private readonly logger = new Logger(SuggestionCacheService.name);
  private readonly queue: Category[] = [];
  private readonly queued = new Set<Category>();
  private processing = false;
  private readonly batchSize: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly openAIService: OpenAIService,
    private readonly suggestionRepository: SuggestionRepository,
  ) {
    const size = this.configService.get<string>('SUGGESTION_REFILL_BATCH_SIZE');
    this.batchSize = size ? Number(size) : 10;
  }

  onApplicationBootstrap() {
    if (!this.enabled()) return;

    for (const category of Object.values(Category)) {
      this.replenish(category);
    }
  }

  enabled() {
    return this.openAIService.enabled();
  }

  async getSuggestions(
    categories: Category[],
    quantity: number = 5,
    noAi: boolean = false,
  ): Promise<SuggestionDto[]> {
    const suggestions = await this.suggestionRepository.getSuggestions(
      categories,
      quantity,
      noAi,
    );

    if (!noAi) {
      for (const category of categories) {
        void this.checkStock(category);
      }
    }

    return suggestions;
  }

  private async checkStock(category: Category) {
    const remaining =
      await this.suggestionRepository.countAiSuggestions(category);
    if (remaining < TARGET_STOCK) {
      this.replenish(category);
    }
  }

  private replenish(category: Category) {
    if (this.queued.has(category)) return;

    this.queued.add(category);
    this.queue.push(category);
    this.logger.log(`Queuing suggestion cache refill for category ${category}`);

    void this.processQueue();
  }

  private async processQueue() {
    if (this.processing) return;
    this.processing = true;

    try {
      let category: Category | undefined;
      while ((category = this.queue.shift()) !== undefined) {
        try {
          await this.fillCategory(category);
        } finally {
          this.queued.delete(category);
        }
      }
    } finally {
      this.processing = false;
    }
  }

  private async fillCategory(category: Category) {
    while (
      (await this.suggestionRepository.countAiSuggestions(category)) <
      TARGET_STOCK
    ) {
      const suggestions = await this.openAIService.getSuggestions(
        [category],
        this.batchSize,
      );

      if (suggestions.length === 0) break;

      await this.suggestionRepository.createAiSuggestions(
        category,
        suggestions.map((s) => s.value),
      );

      this.logger.log(
        `Generated ${suggestions.length} suggestions for category ${category}`,
      );
    }
  }
}
