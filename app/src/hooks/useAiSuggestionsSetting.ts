import { useCallback, useState } from 'react';

const STORAGE_KEY = 'games-v3-no-ai-suggestions';

function readNoAi(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export const useAiSuggestionsSetting = () => {
  const [storedNoAi, setStoredNoAi] = useState(readNoAi);

  const setNoAi = useCallback((value: boolean) => {
    localStorage.setItem(STORAGE_KEY, String(value));
    setStoredNoAi(value);
  }, []);

  return { noAi: storedNoAi, setNoAi };
};
