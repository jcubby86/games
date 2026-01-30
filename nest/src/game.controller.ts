import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Query,
  Patch,
} from '@nestjs/common';
import { GameService } from './game.service';
import { Game } from './generated/prisma/client';

interface NameEntryDto {
  name: string;
  order: number;
}

interface StoryEntryDto {
  values: string[];
  story?: string;
}

interface PlayerDto {
  uuid: string;
  nickname: string;
  entry?: NameEntryDto | StoryEntryDto;
}

interface GameDto {
  uuid: string;
  code: string;
  type: string;
  phase: string;
  players?: PlayerDto[];
}

@Controller('api')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  toDto(game: Game & { players?: any[] }): GameDto {
    return {
      type: game.type,
      code: game.code,
      uuid: game.uuid,
      phase: game.phase,
      players: game.players?.map((p) => ({
        uuid: p.uuid,
        nickname: p.nickname,
        entry:
          p.nameEntries?.length > 0
            ? ({
                name: p.nameEntries[0]?.name,
                order: p.nameEntries[0]?.order,
              } as NameEntryDto)
            : p.storyEntries?.length > 0
              ? ({
                  values: p.storyEntries[0]?.values,
                  finalValue: p.storyEntries[0]?.finalValue,
                } as StoryEntryDto)
              : undefined,
      })),
    };
  }

  @Post('games')
  async createGame(@Body() data: { type: string }): Promise<GameDto> {
    const game = await this.gameService.createGame(data.type);
    return this.toDto(game);
  }

  @Get('games')
  async getGameByCode(@Query('code') code: string): Promise<GameDto> {
    const game = await this.gameService.getGameByCode(code);
    return this.toDto(game);
  }

  @Get('games/:uuid')
  async getGame(@Param('uuid') uuid: string): Promise<GameDto> {
    const game = await this.gameService.getGame(uuid);
    return this.toDto(game);
  }

  @Patch('games/:uuid')
  async updateGame(
    @Param('uuid') uuid: string,
    @Body() data: { phase: string },
  ): Promise<GameDto> {
    const game = await this.gameService.updateGame(uuid, data.phase);
    return this.toDto(game);
  }

  @Post('games/:uuid/players')
  async addPlayer(
    @Param('uuid') uuid: string,
    @Body() data: { nickname: string },
  ): Promise<PlayerDto> {
    const player = await this.gameService.addPlayer(uuid, data.nickname);
    return {
      uuid: player.uuid,
      nickname: player.nickname,
    };
  }

  @Post('players/:uuid/name-entries')
  async addNameEntry(
    @Param('uuid') uuid: string,
    @Body() data: { name: string },
  ): Promise<NameEntryDto> {
    const entry = await this.gameService.addNameEntry(uuid, data.name);
    return {
      name: entry.name,
      order: entry.order,
    };
  }

  @Post('players/:uuid/story-entries')
  async addStoryEntry(
    @Param('uuid') uuid: string,
    @Body() data: { value: string },
  ): Promise<StoryEntryDto> {
    const entry = await this.gameService.addStoryEntry(uuid, data.value);
    return {
      values: entry.values,
      story: entry.story ?? undefined,
    };
  }
}
