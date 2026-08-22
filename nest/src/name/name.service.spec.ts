import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';

import { NameService } from './name.service';
import { PrismaService } from 'src/prisma.service';

describe('NameService', () => {
  let service: NameService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NameService,
        { provide: PrismaService, useValue: {} },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get<NameService>(NameService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
