import { describe, expect, it } from 'vitest';

import generateNickname from './nicknameGeneration';

describe('generateNickname', () => {
  it('generates a hyphen-separated three-word nickname', () => {
    const nickname = generateNickname();
    const parts = nickname.split('-');

    expect(parts).toHaveLength(3);
    parts.forEach((part) => expect(part.length).toBeGreaterThan(0));
  });

  it('generates different nicknames across many calls', () => {
    const nicknames = new Set(
      Array.from({ length: 20 }, () => generateNickname())
    );

    expect(nicknames.size).toBeGreaterThan(1);
  });
});
