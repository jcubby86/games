import { Test, TestingModule } from '@nestjs/testing';

import { SuggestionRepository } from './suggestion.repository';
import { Category } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma.service';

describe('SuggestionRepository', () => {
  let repository: SuggestionRepository;
  let prisma: {
    suggestion: {
      findMany: jest.Mock;
      count: jest.Mock;
      createMany: jest.Mock;
      updateMany: jest.Mock;
      deleteMany: jest.Mock;
    };
    $queryRaw: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      suggestion: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      $queryRaw: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuggestionRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = module.get(SuggestionRepository);
  });

  it('draws a weighted random selection across categories', async () => {
    const rows = [
      {
        value: 'a',
        category: Category.STATEMENT,
        uuid: 'uuid-a',
        likes: 0,
        type: 'HUMAN',
      },
    ];
    prisma.$queryRaw.mockResolvedValue(rows);

    const result = await repository.getSuggestions(
      [Category.STATEMENT],
      3,
      false,
    );

    expect(result).toEqual([
      { value: 'a', category: Category.STATEMENT, uuid: 'uuid-a' },
    ]);
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    const [strings, ...values] = prisma.$queryRaw.mock.calls[0] as [
      TemplateStringsArray,
      ...unknown[],
    ];
    expect(strings.join('')).toContain('ORDER BY POWER(random()');
    expect(values).toEqual([[Category.STATEMENT], false, 3]);
    expect(prisma.suggestion.updateMany).not.toHaveBeenCalled();
  });

  it('marks fresh AI suggestions as used once drawn, without touching liked or human ones', async () => {
    const rows = [
      {
        value: 'fresh',
        category: Category.STATEMENT,
        uuid: 'uuid-fresh',
        likes: 0,
        type: 'AI',
      },
      {
        value: 'liked',
        category: Category.STATEMENT,
        uuid: 'uuid-liked',
        likes: 3,
        type: 'AI',
      },
      {
        value: 'human',
        category: Category.STATEMENT,
        uuid: 'uuid-human',
        likes: 0,
        type: 'HUMAN',
      },
    ];
    prisma.$queryRaw.mockResolvedValue(rows);

    await repository.getSuggestions([Category.STATEMENT], 3);

    expect(prisma.suggestion.updateMany).toHaveBeenCalledWith({
      where: { uuid: { in: ['uuid-fresh'] } },
      data: { likes: -1 },
    });
  });

  it('only draws examples from human suggestions', async () => {
    prisma.suggestion.findMany.mockResolvedValue([
      { value: 'a' },
      { value: 'b' },
    ]);

    await repository.getExamples(Category.STATEMENT, 2);

    expect(prisma.suggestion.findMany).toHaveBeenCalledWith({
      where: { category: Category.STATEMENT, type: 'HUMAN' },
      select: { value: true },
    });
  });

  it('counts only fresh (unused) AI suggestions for a category', async () => {
    prisma.suggestion.count.mockResolvedValue(7);

    const count = await repository.countAiSuggestions(Category.STATEMENT);

    expect(count).toBe(7);
    expect(prisma.suggestion.count).toHaveBeenCalledWith({
      where: { category: Category.STATEMENT, type: 'AI', likes: 0 },
    });
  });

  it('creates AI suggestions and skips duplicates', async () => {
    await repository.createAiSuggestions(Category.STATEMENT, ['a', 'b']);

    expect(prisma.suggestion.createMany).toHaveBeenCalledWith({
      data: [
        { category: Category.STATEMENT, value: 'a', type: 'AI' },
        { category: Category.STATEMENT, value: 'b', type: 'AI' },
      ],
      skipDuplicates: true,
    });
  });

  it('deletes unliked AI suggestions used before the given cutoff', async () => {
    prisma.suggestion.deleteMany.mockResolvedValue({ count: 4 });
    const before = new Date('2026-01-01T00:00:00Z');

    const count = await repository.deleteUnlikedUsedAiSuggestions(before);

    expect(count).toBe(4);
    expect(prisma.suggestion.deleteMany).toHaveBeenCalledWith({
      where: { type: 'AI', likes: -1, updatedAt: { lt: before } },
    });
  });

  it('increments likes for a suggestion by uuid', async () => {
    prisma.$queryRaw.mockResolvedValue([
      { value: 'a', category: Category.STATEMENT, uuid: 'uuid-a' },
    ]);

    const result = await repository.incrementLikes('uuid-a');

    expect(result).toEqual({
      value: 'a',
      category: Category.STATEMENT,
      uuid: 'uuid-a',
    });
    const [strings, ...values] = prisma.$queryRaw.mock.calls[0] as [
      TemplateStringsArray,
      ...unknown[],
    ];
    expect(strings.join('')).toContain(
      'CASE WHEN likes = -1 THEN 1 ELSE likes + 1 END',
    );
    expect(values).toEqual(['uuid-a']);
  });

  it('returns undefined when liking an unknown uuid', async () => {
    prisma.$queryRaw.mockResolvedValue([]);

    const result = await repository.incrementLikes('unknown-uuid');

    expect(result).toBeUndefined();
  });
});
