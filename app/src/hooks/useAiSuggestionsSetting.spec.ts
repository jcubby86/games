import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useAiSuggestionsSetting } from './useAiSuggestionsSetting';

const STORAGE_KEY = 'games-v3-no-ai-suggestions';

describe('useAiSuggestionsSetting', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(cleanup);

  it('defaults to false when nothing is stored', () => {
    const { result } = renderHook(() => useAiSuggestionsSetting());

    expect(result.current.noAi).toBe(false);
  });

  it('reads an existing true value from localStorage', () => {
    localStorage.setItem(STORAGE_KEY, 'true');

    const { result } = renderHook(() => useAiSuggestionsSetting());

    expect(result.current.noAi).toBe(true);
  });

  it('persists updates to localStorage', () => {
    const { result } = renderHook(() => useAiSuggestionsSetting());

    act(() => {
      result.current.setNoAi(true);
    });

    expect(result.current.noAi).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
  });
});
