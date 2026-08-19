import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { OpenAIService } from './openai.service';
import { SuggestionRepository } from 'src/suggestion/suggestion.repository';

describe('OpenAIService', () => {
  let service: OpenAIService;
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    configService = { get: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenAIService,
        { provide: ConfigService, useValue: configService },
        {
          provide: SuggestionRepository,
          useValue: { getExamples: jest.fn().mockResolvedValue([]) },
        },
      ],
    }).compile();

    service = module.get<OpenAIService>(OpenAIService);
  });

  it('is disabled when neither OPENAI_API_KEY nor OPENAI_BASE_URL is set', () => {
    expect(service.enabled()).toBe(false);
  });

  it('is enabled with only OPENAI_API_KEY set (OpenAI)', async () => {
    configService.get.mockImplementation(
      (key: string) => ({ OPENAI_API_KEY: 'sk-test' })[key],
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenAIService,
        { provide: ConfigService, useValue: configService },
        {
          provide: SuggestionRepository,
          useValue: { getExamples: jest.fn().mockResolvedValue([]) },
        },
      ],
    }).compile();

    expect(module.get<OpenAIService>(OpenAIService).enabled()).toBe(true);
  });

  it('is enabled with only OPENAI_BASE_URL set (e.g. llama.cpp)', async () => {
    configService.get.mockImplementation(
      (key: string) => ({ OPENAI_BASE_URL: 'http://localhost:8080/v1' })[key],
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenAIService,
        { provide: ConfigService, useValue: configService },
        {
          provide: SuggestionRepository,
          useValue: { getExamples: jest.fn().mockResolvedValue([]) },
        },
      ],
    }).compile();

    expect(module.get<OpenAIService>(OpenAIService).enabled()).toBe(true);
  });
});
