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
    };
    $queryRaw: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      suggestion: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
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

  it('only returns human suggestions from getSuggestions', async () => {
    await repository.getSuggestions([Category.STATEMENT]);

    expect(prisma.suggestion.findMany).toHaveBeenCalledWith({
      where: { category: { in: [Category.STATEMENT] }, type: 'HUMAN' },
      select: { value: true, category: true },
      orderBy: { id: 'asc' },
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

  it('counts only AI suggestions for a category', async () => {
    prisma.suggestion.count.mockResolvedValue(7);

    const count = await repository.countAiSuggestions(Category.STATEMENT);

    expect(count).toBe(7);
    expect(prisma.suggestion.count).toHaveBeenCalledWith({
      where: { category: Category.STATEMENT, type: 'AI' },
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

  it('pops AI suggestions via a single delete-and-return query', async () => {
    const rows = [{ value: 'a', category: Category.STATEMENT }];
    prisma.$queryRaw.mockResolvedValue(rows);

    const result = await repository.popAiSuggestions(Category.STATEMENT, 3);

    expect(result).toEqual(rows);
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    const [strings, ...values] = prisma.$queryRaw.mock.calls[0] as [
      TemplateStringsArray,
      ...unknown[],
    ];
    expect(strings.join('')).toContain('DELETE FROM "Suggestion"');
    expect(strings.join('')).toContain('RETURNING value, category');
    expect(values).toEqual([Category.STATEMENT, 3]);
  });
});
