import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';

import type { SuggestionProvider } from './suggestion.factory';
import { SuggestionRepository } from './suggestion.repository';
import { shuffle } from './suggestion.utils';
import { SuggestionDto } from 'src/game/game.types';
import { Category } from 'src/generated/prisma/client';
import { OpenAIService } from 'src/openai/openai.service';

const TARGET_STOCK = 50;
const REFILL_BATCH_SIZE = 10;

@Injectable()
export class SuggestionCacheService
  implements SuggestionProvider, OnApplicationBootstrap
{
  private readonly logger = new Logger(SuggestionCacheService.name);
  private readonly cache = new Map<Category, SuggestionDto[]>();
  private readonly queue: Category[] = [];
  private readonly queued = new Set<Category>();
  private processing = false;

  constructor(
    private readonly openAIService: OpenAIService,
    private readonly suggestionRepository: SuggestionRepository,
  ) {}

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
    const cached = this.cache.get(category) ?? [];

    if (cached.length < quantity) {
      this.logger.warn(
        `Suggestion cache has fewer than ${quantity} entries for category ${category}, falling back to the suggestion repository`,
      );
      this.replenish(category);
      const suggestions = await this.suggestionRepository.getSuggestions([
        category,
      ]);
      return shuffle(suggestions).slice(0, quantity);
    }

    const taken = cached.splice(0, quantity);

    if (cached.length < TARGET_STOCK) {
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
    while ((this.cache.get(category)?.length ?? 0) < TARGET_STOCK) {
      const suggestions = await this.openAIService.getSuggestions(
        [category],
        REFILL_BATCH_SIZE,
      );
      const cached = this.cache.get(category) ?? [];
      cached.push(...suggestions);
      this.cache.set(category, cached);

      this.logger.log(
        `Generated ${suggestions.length} suggestions for category ${category} (cache size: ${cached.length})`,
      );

      if (suggestions.length === 0) break;
    }
  }
}
