import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'games-v3-ai-suggestions';
// Older builds stored the inverse preference ("no AI") under this key.
const LEGACY_STORAGE_KEY = 'games-v3-no-ai-suggestions';

// The setting is read straight from localStorage so every component using the
// hook stays in sync, including across tabs via the `storage` event.
const listeners = new Set<() => void>();

function readIncludeAi(): boolean {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored !== null) {
    return stored !== 'false';
  }
  return localStorage.getItem(LEGACY_STORAGE_KEY) !== 'true';
}

function setIncludeAi(value: boolean) {
  localStorage.setItem(STORAGE_KEY, String(value));
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  listeners.forEach((listener) => listener());
}

function subscribeToSetting(listener: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (
      e.key === null ||
      e.key === STORAGE_KEY ||
      e.key === LEGACY_STORAGE_KEY
    ) {
      listener();
    }
  };
  listeners.add(listener);
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export const useAiSuggestionsSetting = () => {
  const includeAi = useSyncExternalStore(subscribeToSetting, readIncludeAi);

  return { includeAi, setIncludeAi };
};
