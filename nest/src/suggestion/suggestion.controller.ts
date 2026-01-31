import { Controller, Get, Query } from '@nestjs/common';
import { SuggestionService } from './suggestion.service';
import { SuggestionDto } from 'src/types/game.types';

@Controller('api/suggestions')
export class SuggestionController {
  constructor(private readonly suggestionService: SuggestionService) {}

  @Get()
  async getSuggestion(
    @Query('category') category: string,
    @Query('quantity') quantity?: number,
  ): Promise<SuggestionDto[]> {
    return this.suggestionService.getSuggestion(category, quantity);
  }
}
