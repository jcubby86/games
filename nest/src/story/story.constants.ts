import {
  nameEntryMaxLength,
  storyEntryMaxLength,
} from 'src/game/game.constants';
import { Hint } from 'src/game/game.types';
import { Category } from 'src/generated/prisma/enums';

export const hints: Hint[] = [
  {
    filler: '',
    prefix: '',
    suffix: ' ',
    prompt: "Man's name:",
    category: Category.MALE_NAME,
    limit: nameEntryMaxLength,
  },
  {
    filler: '(Man) ',
    prefix: 'and ',
    suffix: ' ',
    prompt: "Woman's name:",
    category: Category.FEMALE_NAME,
    limit: nameEntryMaxLength,
  },
  {
    filler: '(Man) and (Woman) ',
    prefix: 'were ',
    suffix: ' ',
    prompt: 'Present Action:',
    category: Category.PRESENT_ACTION,
    limit: storyEntryMaxLength,
  },
  {
    filler: '',
    prefix: 'He said, "',
    suffix: '" ',
    prompt: 'Statement:',
    category: Category.STATEMENT,
    limit: storyEntryMaxLength,
  },
  {
    filler: '',
    prefix: 'She said, "',
    suffix: '" ',
    prompt: 'Statement:',
    category: Category.STATEMENT,
    limit: storyEntryMaxLength,
  },
  {
    filler: '',
    prefix: 'So they ',
    suffix: '',
    prompt: 'Past Action:',
    category: Category.PAST_ACTION,
    limit: storyEntryMaxLength,
  },
];
