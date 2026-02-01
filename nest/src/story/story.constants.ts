import { Category } from 'src/generated/prisma/enums';
import { Hint } from 'src/types/game.types';

export const hints: Hint[] = [
  {
    filler: '',
    prefix: '',
    suffix: ' ',
    prompt: "Man's name:",
    category: Category.MALE_NAME,
  },
  {
    filler: '(Man) ',
    prefix: 'and ',
    suffix: ' ',
    prompt: "Woman's name:",
    category: Category.FEMALE_NAME,
  },
  {
    filler: '(Man) and (Woman) ',
    prefix: 'were ',
    suffix: ' ',
    prompt: 'Present Action:',
    category: Category.PRESENT_ACTION,
  },
  {
    filler: '',
    prefix: 'He said, "',
    suffix: '" ',
    prompt: 'Statement:',
    category: Category.STATEMENT,
  },
  {
    filler: '',
    prefix: 'She said, "',
    suffix: '" ',
    prompt: 'Statement:',
    category: Category.STATEMENT,
  },
  {
    filler: '',
    prefix: 'So they ',
    suffix: '',
    prompt: 'Past Action:',
    category: Category.PAST_ACTION,
  },
];
