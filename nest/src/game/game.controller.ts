import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Query,
  Patch,
  UseGuards,
  Res,
} from '@nestjs/common';
import { GameService } from './game.service';
import { StoryService } from '../story/story.service';
import { GameAuthGuard } from '../auth/game-auth.guard';
import { PlayerAuthGuard } from '../auth/player-auth.guard';
import { HmacService } from '../auth/hmac.service';
import {
  GameDto,
  PlayerDto,
  NameEntryDto,
  StoryEntryDto,
} from '../types/game.types';
import type { Response } from 'express';

@Controller('api')
export class GameController {
  constructor(
    private readonly gameService: GameService,
    private readonly hmacService: HmacService,
    private readonly storyService: StoryService,
  ) {}

  @Post('games')
  async createGame(@Body() data: { type: string }): Promise<GameDto> {
    return this.gameService.createGame(data.type);
  }

  @Get('games')
  async getGameByCode(@Query('code') code: string): Promise<GameDto> {
    return this.gameService.getGameByCode(code);
  }

  @Get('games/:uuid')
  async getGame(@Param('uuid') uuid: string): Promise<GameDto> {
    return this.gameService.getGame(uuid);
  }

  @UseGuards(GameAuthGuard)
  @Patch('games/:uuid')
  async updateGame(
    @Param('uuid') uuid: string,
    @Body() data: { phase: string },
  ): Promise<GameDto> {
    return this.gameService.updateGame(uuid, data.phase);
  }

  @Post('games/:uuid/players')
  async addPlayer(
    @Param('uuid') uuid: string,
    @Body() data: { nickname: string },
    @Res({ passthrough: true }) res: Response,
  ): Promise<PlayerDto> {
    const player = await this.gameService.addPlayer(uuid, data.nickname);

    const token = this.hmacService.generateCombinedTokens(uuid, player.uuid);
    res.setHeader('Authorization', `Bearer ${token}`);

    return player;
  }

  @UseGuards(PlayerAuthGuard)
  @Patch('players/:uuid')
  async updatePlayer(
    @Param('uuid') uuid: string,
    @Body() data: { nickname: string },
  ): Promise<PlayerDto> {
    return this.gameService.updatePlayer(uuid, data.nickname);
  }

  @UseGuards(PlayerAuthGuard)
  @Post('players/:uuid/name-entries')
  async addNameEntry(
    @Param('uuid') uuid: string,
    @Body() data: { name: string },
  ): Promise<NameEntryDto> {
    return this.gameService.addNameEntry(uuid, data.name);
  }

  @UseGuards(PlayerAuthGuard)
  @Post('players/:uuid/story-entries')
  async addStoryEntry(
    @Param('uuid') uuid: string,
    @Body() data: { value: string },
  ): Promise<StoryEntryDto> {
    return await this.storyService.addStoryEntry(uuid, data.value);
  }
}
