import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { SUGGESTION_PROVIDER } from './suggestion.factory';
import { SuggestionRepository } from './suggestion.repository';
import { SuggestionService } from './suggestion.service';
import { Category } from 'src/generated/prisma/enums';

describe('SuggestionService', () => {
  let service: SuggestionService;
  let suggestionProvider: { getSuggestions: jest.Mock };
  let suggestionRepository: { incrementLikes: jest.Mock };

  beforeEach(async () => {
    suggestionProvider = { getSuggestions: jest.fn() };
    suggestionRepository = { incrementLikes: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuggestionService,
        { provide: SUGGESTION_PROVIDER, useValue: suggestionProvider },
        { provide: SuggestionRepository, useValue: suggestionRepository },
      ],
    }).compile();

    service = module.get<SuggestionService>(SuggestionService);
  });

  describe('getSuggestions', () => {
    it('throws when a category is invalid', async () => {
      await expect(service.getSuggestions(['NOT_A_CATEGORY'])).rejects.toThrow(
        BadRequestException,
      );
      expect(suggestionProvider.getSuggestions).not.toHaveBeenCalled();
    });

    it('delegates to the suggestion provider with defaults applied', async () => {
      suggestionProvider.getSuggestions.mockResolvedValue([]);

      await service.getSuggestions([Category.MALE_NAME]);

      expect(suggestionProvider.getSuggestions).toHaveBeenCalledWith(
        [Category.MALE_NAME],
        5,
        false,
      );
    });

    it('forwards explicit quantity and noAi values', async () => {
      suggestionProvider.getSuggestions.mockResolvedValue([]);

      await service.getSuggestions([Category.MALE_NAME], 2, true);

      expect(suggestionProvider.getSuggestions).toHaveBeenCalledWith(
        [Category.MALE_NAME],
        2,
        true,
      );
    });
  });

  describe('likeSuggestion', () => {
    it('delegates to the repository', async () => {
      suggestionRepository.incrementLikes.mockResolvedValue(undefined);

      await service.likeSuggestion('suggestion-uuid');

      expect(suggestionRepository.incrementLikes).toHaveBeenCalledWith(
        'suggestion-uuid',
      );
    });
  });
});
