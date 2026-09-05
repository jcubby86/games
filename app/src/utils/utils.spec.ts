import { describe, expect, it, vi } from 'vitest';

import { eqIgnoreCase, sleep } from './utils';

describe('eqIgnoreCase', () => {
  it('returns true for strings that match ignoring case', () => {
    expect(eqIgnoreCase('Hello', 'hello')).toBe(true);
  });

  it('returns false for strings that differ', () => {
    expect(eqIgnoreCase('Hello', 'world')).toBe(false);
  });

  it('returns true when both args are undefined', () => {
    expect(eqIgnoreCase(undefined, undefined)).toBe(true);
  });

  it('returns false when only one arg is undefined', () => {
    expect(eqIgnoreCase('hello', undefined)).toBe(false);
  });
});

describe('sleep', () => {
  it('resolves after the given delay', async () => {
    vi.useFakeTimers();
    let resolved = false;
    void sleep(1000).then(() => {
      resolved = true;
    });

    await vi.advanceTimersByTimeAsync(1000);

    expect(resolved).toBe(true);
    vi.useRealTimers();
  });
});
