import { SuggestionDto } from '@games/shared';
import { Controller, Get, Query } from '@nestjs/common';

import { SuggestionService } from './suggestion.service';

@Controller('api/suggestions')
export class SuggestionController {
  constructor(private readonly suggestionService: SuggestionService) {}

  @Get()
  async getSuggestion(
    @Query('category') category: string,
    @Query('quantity') quantity?: number,
    @Query('no_ai') noAi?: string,
  ): Promise<SuggestionDto[]> {
    const categories = category.split(',');
    return this.suggestionService.getSuggestions(
      categories,
      quantity,
      noAi === 'true',
    );
  }
}
