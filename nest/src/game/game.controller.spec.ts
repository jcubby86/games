import { Test, TestingModule } from '@nestjs/testing';

import { GameController } from './game.controller';
import { GameService } from './game.service';
import { AuthService } from 'src/auth/auth.service';
import { NameService } from 'src/name/name.service';
import { StoryService } from 'src/story/story.service';

describe('GameController', () => {
  let controller: GameController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GameController],
      providers: [
        { provide: GameService, useValue: {} },
        { provide: StoryService, useValue: {} },
        { provide: NameService, useValue: {} },
        { provide: AuthService, useValue: {} },
      ],
    }).compile();

    controller = module.get<GameController>(GameController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
