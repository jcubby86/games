import { Test, TestingModule } from '@nestjs/testing';

import { EventGateway } from './event.gateway';
import { AuthService } from 'src/auth/auth.service';

describe('EventGateway', () => {
  let gateway: EventGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventGateway, { provide: AuthService, useValue: {} }],
    }).compile();

    gateway = module.get<EventGateway>(EventGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
