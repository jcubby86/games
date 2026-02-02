import { Controller, Get, Param } from '@nestjs/common';
import { StoryService } from './story.service';

@Controller('api')
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  @Get('story-entries/:uuid')
  async getStoryArchives(@Param('uuid') uuid: string) {
    return this.storyService.getStoryArchives(uuid);
  }
}
