import { HttpService } from '@nestjs/axios/dist';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Category } from 'src/generated/prisma/enums';
import { SuggestionProvider } from 'src/suggestion/suggestion.factory';
import { SuggestionDto } from 'src/types/game.types';

@Injectable()
export class OpenAIService implements SuggestionProvider {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly baseUrl?: string;
  private readonly apiKey?: string;
  private readonly model: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.baseUrl = this.configService.get('OPENAI_BASE_URL');
    this.apiKey = this.configService.get('OPENAI_API_KEY');
    this.model = this.configService.get('OPENAI_MODEL') || 'gpt-3.5-turbo';

    if (!this.baseUrl || !this.apiKey) {
      this.logger.warn('OpenAI is not enabled');
    }
  }

  getSuggestions(
    categories: Category[],
    quantity?: number,
  ): Promise<SuggestionDto[]> {
    throw new Error('Method not implemented.');
  }

  enabled() {
    return !!this.baseUrl && !!this.apiKey;
  }
}
