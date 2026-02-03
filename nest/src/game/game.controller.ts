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
  Delete,
} from '@nestjs/common';
import type { Response } from 'express';

import { GameService } from './game.service';
import { GameAuthGuard, Roles } from '../auth/auth.guard';
import { AuthService } from '../auth/auth.service';
import { StoryService } from '../story/story.service';
import {
  GameDto,
  PlayerDto,
  NameEntryDto,
  StoryEntryDto,
} from '../types/game.types';
import { NameService } from 'src/name/name.service';

@Controller('api')
export class GameController {
  constructor(
    private readonly gameService: GameService,
    private readonly storyService: StoryService,
    private readonly nameService: NameService,
    private readonly authService: AuthService,
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
  @Roles(['host'])
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

    const token = await this.authService.generateTokenAsync(
      player.game!,
      player,
    );
    res.setHeader('x-auth-token', token);

    return player;
  }

  @UseGuards(GameAuthGuard)
  @Patch('players/:uuid')
  async updatePlayer(
    @Param('uuid') uuid: string,
    @Body() data: { nickname: string },
    @Res({ passthrough: true }) res: Response,
  ): Promise<PlayerDto> {
    const player = await this.gameService.updatePlayer(uuid, data.nickname);

    const token = await this.authService.generateTokenAsync(
      player.game!,
      player,
    );
    res.setHeader('x-auth-token', token);

    return player;
  }

  @UseGuards(GameAuthGuard)
  @Get('players/:uuid')
  async getPlayer(@Param('uuid') uuid: string): Promise<PlayerDto> {
    return this.gameService.getPlayer(uuid);
  }

  @UseGuards(GameAuthGuard)
  @Post('players/:uuid/name-entries')
  async addNameEntry(
    @Param('uuid') uuid: string,
    @Body() data: { name: string },
  ): Promise<NameEntryDto> {
    return this.nameService.addNameEntry(uuid, data.name);
  }

  @UseGuards(GameAuthGuard)
  @Post('players/:uuid/story-entries')
  async addStoryEntry(
    @Param('uuid') uuid: string,
    @Body() data: { value: string },
  ): Promise<StoryEntryDto> {
    return await this.storyService.addStoryEntry(uuid, data.value);
  }

  @Get('games/:uuid/story-entries')
  async getStoryArchives(@Param('uuid') uuid: string) {
    return this.storyService.getStoryArchives(uuid);
  }

  @UseGuards(GameAuthGuard)
  @Delete('players/:uuid')
  async leaveGame(@Param('uuid') uuid: string): Promise<PlayerDto> {
    return this.gameService.leaveGame(uuid);
  }
}
