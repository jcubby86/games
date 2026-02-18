export interface NameEntryDto {
  name?: string;
  order?: number;
}

export interface Hint {
  prefix: string;
  suffix: string;
  prompt: string;
  category: string;
  limit: number;
}

export interface StoryEntryDto {
  values: string[];
  story?: string;
  hint?: Hint;
}

export interface PlayerDto {
  uuid: string;
  nickname: string;
  game?: GameDto;
  entry?: StoryEntryDto;
  entries?: NameEntryDto[];
  canSubmit?: boolean;
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

export interface GameUpdatedMessageData {
  game: GameDto;
  player: PlayerDto | null;
  action:
    | 'player.joined'
    | 'player.left'
    | 'player.updated'
    | 'player.entry.submitted'
    | 'phase.updated';
}

export interface PokeMessageData {
  to?: PlayerDto;
  from?: PlayerDto;
}

export interface Message<T> {
  data: T;
  timestamp?: number;
}
