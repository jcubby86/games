import { SuggestionDto } from '@games/shared';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { SuggestionProvider } from './suggestion.factory';
import { SuggestionRepository } from './suggestion.repository';
import { shuffle } from './suggestion.utils';
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
    if (noAi) {
      const suggestions =
        await this.suggestionRepository.getSuggestions(categories);
      return shuffle(suggestions).slice(0, quantity);
    }

    const results = await Promise.all(
      categories.map((category) =>
        this.getSuggestionsForCategory(category, quantity),
      ),
    );
    return results.flat();
  }

  private async getSuggestionsForCategory(
    category: Category,
    quantity: number,
  ): Promise<SuggestionDto[]> {
    const taken = await this.suggestionRepository.popAiSuggestions(
      category,
      quantity,
    );

    if (taken.length < quantity) {
      this.logger.warn(
        `Suggestion stock has fewer than ${quantity} entries for category ${category}, falling back to the suggestion repository`,
      );
      this.replenish(category);
      const suggestions = await this.suggestionRepository.getSuggestions([
        category,
      ]);
      const needed = quantity - taken.length;
      return [...taken, ...shuffle(suggestions).slice(0, needed)];
    }

    const remaining =
      await this.suggestionRepository.countAiSuggestions(category);
    if (remaining < TARGET_STOCK) {
      this.replenish(category);
    }

    return taken;
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
