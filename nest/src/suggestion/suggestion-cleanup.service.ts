import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

import { SuggestionRepository } from './suggestion.repository';

@Injectable()
export class SuggestionCleanupService {
  private readonly logger = new Logger(SuggestionCleanupService.name);
  private readonly graceMs: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly suggestionRepository: SuggestionRepository,
  ) {
    const hours = this.configService.get<string>('SUGGESTION_LIKE_GRACE_HOURS');
    this.graceMs = (hours ? Number(hours) : 24) * 60 * 60 * 1000;
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupUnlikedAiSuggestions() {
    const before = new Date(Date.now() - this.graceMs);
    const count =
      await this.suggestionRepository.deleteUnlikedUsedAiSuggestions(before);
    if (count > 0) {
      this.logger.log(
        `Deleted ${count} unliked AI suggestions used before ${before.toISOString()}`,
      );
    }
  }
}
