import { useCallback, useSyncExternalStore } from 'react';

import { useAppContext } from '../contexts/AppContext';
import { postSuggestionLike } from '../utils/apiClient';

// Liked uuids live outside React so the like button and the submit flow agree
// on whether a suggestion was already liked, and so a suggestion that rotates
// back around stays liked. Uuids are added optimistically to prevent a second
// like from being sent while the first is still in flight.
const likedUuids = new Set<string>();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribeToLikes(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

async function likeSuggestion(token: string, uuid: string) {
  if (likedUuids.has(uuid)) {
    return;
  }
  likedUuids.add(uuid);
  notify();
  try {
    await postSuggestionLike(token, uuid);
  } catch (err) {
    likedUuids.delete(uuid);
    notify();
    throw err;
  }
}

export const useSuggestionLike = (uuid?: string) => {
  const { context } = useAppContext();
  const token = context.token;
  const liked = useSyncExternalStore(
    subscribeToLikes,
    () => !!uuid && likedUuids.has(uuid),
  );

  const like = useCallback(async () => {
    if (!token || !uuid) {
      return;
    }
    await likeSuggestion(token, uuid);
  }, [token, uuid]);

  return { liked, like };
};
