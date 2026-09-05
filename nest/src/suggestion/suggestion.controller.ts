import { SuggestionDto } from '@games/shared';
import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import { SuggestionService } from './suggestion.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
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

  @Post(':uuid/like')
  async likeSuggestion(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SuggestionDto | undefined> {
    const suggestion = await this.suggestionService.likeSuggestion(uuid);
    if (!suggestion) {
      res.status(HttpStatus.NO_CONTENT);
    }
    return suggestion;
  }
}
