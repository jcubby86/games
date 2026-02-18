import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';

import { Category } from 'src/generated/prisma/enums';
import { SuggestionProvider } from 'src/suggestion/suggestion.factory';

@Injectable()
export class OpenAIService implements SuggestionProvider {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly baseUrl?: string;
  private readonly apiKey?: string;
  private readonly model: string;
  private readonly client?: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get('OPENAI_BASE_URL');
    this.apiKey = this.configService.get('OPENAI_API_KEY');
    this.model = this.configService.get('OPENAI_MODEL') || 'GPT-4o';

    if (!this.baseUrl || !this.apiKey) {
      this.logger.warn('OpenAI is not enabled');
    } else {
      this.client = new OpenAI({ baseURL: this.baseUrl, apiKey: this.apiKey });
    }
  }

  private async prompt(input: string): Promise<string> {
    const responsesResult = await this.client!.responses.create({
      model: this.model,
      instructions: `
        You are my assistant that is helping come up with create suggestions for a game. 
        When I give you a category, you will give me the requested number of suggestions that players could use. 
        Give the output as a valid json array of strings with no numbering or newlines in each string. 
        Separate each entry in the array with ",\n". 
        Use regular punctuation and proper grammar. 
        Do not include any additional commentary or text outside of the json array.
      `,
      input,
    });
    // this.logger.log(`OpenAI response: ${JSON.stringify(responsesResult)}`);
    return responsesResult.output_text;
  }

  async getSuggestions(categories: Category[], quantity?: number) {
    const response = await this.prompt(
      `Create ${quantity} suggestions for the category ${categories[0]}`,
    );
    const parsed = JSON.parse(response) as string[];
    return parsed.map((value) => ({
      value: value.trim(),
      category: categories[0],
    }));
  }

  enabled() {
    return this.client !== undefined;
  }
}
