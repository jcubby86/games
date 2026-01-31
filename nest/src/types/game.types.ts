export interface NameEntryDto {
  name?: string;
  order?: number;
}

export interface StoryEntryDto {
  values: string[];
  story?: string;
  hints?: {
    filler: string;
    prefix: string;
    suffix: string;
    prompt: string;
  };
}

export interface PlayerDto {
  uuid: string;
  nickname: string;
  entry?: StoryEntryDto;
  entries?: NameEntryDto[];
  canPlayerSubmit?: boolean;
  gameType?: string;
  gamePhase?: string;
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
