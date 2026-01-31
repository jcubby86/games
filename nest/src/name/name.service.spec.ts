import { Test, TestingModule } from '@nestjs/testing';
import { NameService } from './name.service';

describe('NameService', () => {
  let service: NameService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NameService],
    }).compile();

    service = module.get<NameService>(NameService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
