import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useAiSuggestionsSetting } from './useAiSuggestionsSetting';

const STORAGE_KEY = 'games-v3-ai-suggestions';
const LEGACY_STORAGE_KEY = 'games-v3-no-ai-suggestions';

describe('useAiSuggestionsSetting', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(cleanup);

  it('defaults to true when nothing is stored', () => {
    const { result } = renderHook(() => useAiSuggestionsSetting());

    expect(result.current.includeAi).toBe(true);
  });

  it('reads an existing false value from localStorage', () => {
    localStorage.setItem(STORAGE_KEY, 'false');

    const { result } = renderHook(() => useAiSuggestionsSetting());

    expect(result.current.includeAi).toBe(false);
  });

  it('honors an opt-out stored under the legacy key', () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, 'true');

    const { result } = renderHook(() => useAiSuggestionsSetting());

    expect(result.current.includeAi).toBe(false);
  });

  it('prefers the new key over the legacy key', () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, 'true');
    localStorage.setItem(STORAGE_KEY, 'true');

    const { result } = renderHook(() => useAiSuggestionsSetting());

    expect(result.current.includeAi).toBe(true);
  });

  it('persists updates to localStorage and clears the legacy key', () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, 'true');
    const { result } = renderHook(() => useAiSuggestionsSetting());

    act(() => {
      result.current.setIncludeAi(true);
    });

    expect(result.current.includeAi).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
  });
});
