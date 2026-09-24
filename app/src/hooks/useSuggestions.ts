import {
  noop,
  queryOptions,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useCallback, useEffect, useSyncExternalStore } from 'react';

import { useAiSuggestionsSetting } from './useAiSuggestionsSetting';
import { useAppContext } from '../contexts/AppContext';
import { getSuggestions } from '../utils/apiClient';

type UseSuggestionsArgs = {
  category: string;
  quantity: number;
};

// Offsets live outside React (not component state) so the rotation survives
// navigating away and back, matching the cached suggestion batches.
const offsets = new Map<string, number>();
const listeners = new Set<() => void>();

function getOffset(category: string) {
  return offsets.get(category) ?? 0;
}

function incrementOffset(category: string) {
  offsets.set(category, getOffset(category) + 1);
  listeners.forEach((listener) => listener());
}

function subscribeToOffsets(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function suggestionOptions(
  token: string,
  category: string,
  quantity: number,
  offsetKey: number,
  noAi: boolean,
) {
  return queryOptions({
    queryKey: ['suggestions', { category, quantity, offsetKey, noAi }],
    queryFn: async () => {
      const response = await getSuggestions(token, category, quantity, noAi);
      return response.data;
    },
    retry: false,
    staleTime: Infinity,
  });
}

export const useSuggestions = ({ category, quantity }: UseSuggestionsArgs) => {
  const queryClient = useQueryClient();
  const { noAi } = useAiSuggestionsSetting();
  const { context } = useAppContext();
  const token = context.token!;
  const offset = useSyncExternalStore(subscribeToOffsets, () =>
    getOffset(category),
  );
  const offsetKey = Math.floor(offset / quantity);

  const suggestionQuery = useQuery(
    suggestionOptions(token, category, quantity, offsetKey, noAi),
  );

  const prefetch = useCallback(
    (prefetchCategory: string) => {
      const prefetchOffset = getOffset(prefetchCategory);
      queryClient
        .query(
          suggestionOptions(
            token,
            prefetchCategory,
            quantity,
            Math.floor(prefetchOffset / quantity),
            noAi,
          ),
        )
        .catch(noop);
    },
    [queryClient, token, quantity, noAi],
  );

  useEffect(() => {
    const remainingInBatch = quantity - (offset % quantity);
    if (remainingInBatch > 2) {
      return;
    }
    queryClient
      .query(suggestionOptions(token, category, quantity, offsetKey + 1, noAi))
      .catch(noop);
  }, [category, quantity, offset, offsetKey, noAi, queryClient, token]);

  const nextSuggestion = useCallback(() => {
    incrementOffset(category);
  }, [category]);

  const currentSuggestion = suggestionQuery.isSuccess
    ? suggestionQuery.data[offset % quantity]
    : undefined;

  return {
    suggestion: currentSuggestion?.value ?? '',
    suggestionUuid: currentSuggestion?.uuid,
    nextSuggestion,
    prefetch,
  };
};
