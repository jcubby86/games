export interface NameEntryDto {
  name?: string;
  order?: number;
}

export interface Hint {
  filler: string;
  prefix: string;
  suffix: string;
  prompt: string;
  category: string;
}

export interface StoryEntryDto {
  values: string[];
  story?: string;
  hint?: Hint;
}

export interface PlayerDto {
  uuid: string;
  nickname: string;
  entry?: StoryEntryDto;
  entries?: NameEntryDto[];
  canPlayerSubmit?: boolean;
  game?: GameDto;
  roles?: string[];
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

export interface StoryArchiveDto {
  player: PlayerDto;
  story: string;
}
