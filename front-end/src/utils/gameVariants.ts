import { NAME, STORY } from './constants';

export interface GameVariant {
  type: string;
  title: string;
  description: string;
}

export const StoryVariant: GameVariant = {
  type: STORY,
  title: 'He Said She Said',
  description: 'Create a fun story reminiscent of mad libs together!'
};

export const NameVariant: GameVariant = {
  type: NAME,
  title: 'The Name Game',
  description:
    "Everyone secretly enters the name of a person (real or fictional) that others would know. Players then take turns guessing each other's names until only one remains!"
};

export const gameVariants: GameVariant[] = [StoryVariant, NameVariant];
