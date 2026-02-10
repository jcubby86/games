import {
  nameEntryMaxLength,
  storyEntryMaxLength,
} from 'src/game/game.constants';
import { Hint } from 'src/game/game.types';
import { Category } from 'src/generated/prisma/enums';

export const hints: Hint[] = [
  {
    prefix: '',
    suffix: ' ',
    prompt: "Man's name:",
    category: Category.MALE_NAME,
    limit: nameEntryMaxLength,
  },
  {
    prefix: 'and ',
    suffix: ' ',
    prompt: "Woman's name:",
    category: Category.FEMALE_NAME,
    limit: nameEntryMaxLength,
  },
  {
    prefix: 'were ',
    suffix: '. ',
    prompt: '(Man) and (Woman) were __________.',
    category: Category.PRESENT_ACTION,
    limit: storyEntryMaxLength,
  },
  {
    prefix: 'He said, "',
    suffix: '." ',
    prompt: 'He said, "__________."',
    category: Category.STATEMENT,
    limit: storyEntryMaxLength,
  },
  {
    prefix: 'She said, "',
    suffix: '." ',
    prompt: 'She said, "__________."',
    category: Category.STATEMENT,
    limit: storyEntryMaxLength,
  },
  {
    prefix: 'So they ',
    suffix: '.',
    prompt: 'So they __________.',
    category: Category.PAST_ACTION,
    limit: storyEntryMaxLength,
  },
];
