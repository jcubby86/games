export interface NameEntryDto {
  name: string;
  order: number;
}

export interface StoryEntryDto {
  values: string[];
  story?: string;
}

export interface PlayerDto {
  uuid: string;
  nickname: string;
  entry?: NameEntryDto | StoryEntryDto;
}

export interface GameDto {
  uuid: string;
  code: string;
  type: string;
  phase: string;
  players?: PlayerDto[];
}

export interface SuggestionDto {
  value: string;
  category: string;
}
