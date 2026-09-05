import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';

import { Category } from 'src/generated/prisma/enums';
import { SuggestionRepository } from 'src/suggestion/suggestion.repository';

const EXAMPLE_COUNT = 5;

interface GeneratedSuggestion {
  value: string;
  category: Category;
}

const CATEGORY_DESCRIPTIONS: Record<Category, string> = {
  FEMALE_NAME:
    'the name of a well-known fictional, historical, or famous woman',
  MALE_NAME: 'the name of a well-known fictional, historical, or famous man',
  PAST_ACTION: 'a funny thing someone did, written in the past tense',
  PRESENT_ACTION:
    'a funny thing someone is doing, written in the present ("-ing") tense',
  STATEMENT: 'a funny, quotable thing someone might blurt out loud',
};

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly model: string;
  private readonly client?: OpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly suggestionRepository: SuggestionRepository,
  ) {
    const baseUrl = this.configService.get<string>('OPENAI_BASE_URL');
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o';

    if (!baseUrl && !apiKey) {
      this.logger.warn(
        'OpenAI is disabled: set OPENAI_API_KEY (to use OpenAI) and/or OPENAI_BASE_URL (to use a local/self-hosted endpoint such as llama.cpp)',
      );
      return;
    }

    // A base URL alone (e.g. llama.cpp) doesn't need a real key, but the SDK
    // requires *something* to be set.
    this.client = new OpenAI({ baseURL: baseUrl, apiKey: apiKey ?? 'unused' });
    this.logger.log(
      `OpenAI is enabled, using model "${this.model}"${baseUrl ? ` at ${baseUrl}` : ''}`,
    );
  }

  enabled() {
    return this.client !== undefined;
  }

  async getSuggestions(
    categories: Category[],
    quantity: number = 5,
  ): Promise<GeneratedSuggestion[]> {
    const results = await Promise.all(
      categories.map((category) =>
        this.getSuggestionsForCategory(category, quantity),
      ),
    );
    return results.flat();
  }

  private async getSuggestionsForCategory(
    category: Category,
    quantity: number,
  ): Promise<GeneratedSuggestion[]> {
    const examples = await this.suggestionRepository.getExamples(
      category,
      EXAMPLE_COUNT,
    );

    try {
      const suggestions = await this.prompt(category, quantity, examples);
      return suggestions.map((value) => ({ value: value.trim(), category }));
    } catch (error) {
      this.logger.error(
        `Failed to get OpenAI suggestions for category ${category}`,
        error instanceof Error ? error.stack : error,
      );
      return [];
    }
  }

  private async prompt(
    category: Category,
    quantity: number,
    examples: string[],
  ): Promise<string[]> {
    const exampleBlock =
      examples.length > 0
        ? `Match the tone and style of these existing examples for this category:\n${examples
            .map((example) => `- ${example}`)
            .join('\n')}`
        : '';

    const response = await this.client!.responses.create({
      model: this.model,
      instructions: `
        You write short, funny suggestions for a party game. Players draw a
        category and fill in a suggestion that gets read aloud to the group.

        Every suggestion must be: ${CATEGORY_DESCRIPTIONS[category]}.

        Rules:
        - Keep each suggestion under 15 words.
        - Use regular punctuation and proper grammar.
        - Be original and varied - don't repeat yourself or the examples.
        - Keep the humor lighthearted and silly, not mean-spirited or explicit.

        ${exampleBlock}
      `.trim(),
      input: `Generate exactly ${quantity} suggestions for the category ${category}.`,
      text: {
        format: {
          type: 'json_schema',
          name: 'suggestions',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              suggestions: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            required: ['suggestions'],
            additionalProperties: false,
          },
        },
      },
    });

    const parsed = JSON.parse(response.output_text) as {
      suggestions: string[];
    };
    return parsed.suggestions;
  }
}
