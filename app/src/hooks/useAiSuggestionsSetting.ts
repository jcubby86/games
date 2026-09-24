import { useCallback, useState } from 'react';

const STORAGE_KEY = 'games-v3-ai-suggestions';
// Older builds stored the inverse preference ("no AI") under this key.
const LEGACY_STORAGE_KEY = 'games-v3-no-ai-suggestions';

function readIncludeAi(): boolean {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored !== null) {
    return stored !== 'false';
  }
  return localStorage.getItem(LEGACY_STORAGE_KEY) !== 'true';
}

export const useAiSuggestionsSetting = () => {
  const [storedIncludeAi, setStoredIncludeAi] = useState(readIncludeAi);

  const setIncludeAi = useCallback((value: boolean) => {
    localStorage.setItem(STORAGE_KEY, String(value));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    setStoredIncludeAi(value);
  }, []);

  return { includeAi: storedIncludeAi, setIncludeAi };
};
