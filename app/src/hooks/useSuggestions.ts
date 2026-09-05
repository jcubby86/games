import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useEffectEvent, useState } from 'react';

import { useAiSuggestionsSetting } from './useAiSuggestionsSetting';
import { getSuggestions } from '../utils/apiClient';

type UseSuggestionsArgs = {
  initialCategory: string;
  quantity: number;
  prefetchCategories?: string[];
};

function suggestionOptions(
  category: string,
  quantity: number,
  offsetKey: number,
  noAi: boolean
) {
  return queryOptions({
    queryKey: ['suggestions', { category, quantity, offsetKey, noAi }],
    queryFn: async () => {
      const response = await getSuggestions(category, quantity, noAi);
      return response.data;
    },
    retry: false,
    staleTime: Infinity
  });
}

export const useSuggestions = ({
  initialCategory,
  quantity,
  prefetchCategories
}: UseSuggestionsArgs) => {
  const queryClient = useQueryClient();
  const { noAi } = useAiSuggestionsSetting();
  const [category, setCategory] = useState(initialCategory);
  const [offsets, setOffsets] = useState<{ [key: string]: number }>({});
  const offset = offsets[category] ?? 0;
  const offsetKey = Math.floor(offset / quantity);

  const suggestionQuery = useQuery(
    suggestionOptions(category, quantity, offsetKey, noAi)
  );

  const prefetch = useEffectEvent(() => {
    if (!prefetchCategories) {
      return;
    }
    prefetchCategories.forEach((cat) => {
      void queryClient.prefetchQuery(suggestionOptions(cat, quantity, 0, noAi));
    });
  });

  useEffect(() => {
    prefetch();
  }, []);

  useEffect(() => {
    const remainingInBatch = quantity - (offset % quantity);
    if (remainingInBatch > 2) {
      return;
    }
    void queryClient.prefetchQuery(
      suggestionOptions(category, quantity, offsetKey + 1, noAi)
    );
  }, [category, quantity, offset, offsetKey, noAi, queryClient]);

  const nextSuggestion = useCallback(() => {
    setOffsets((prev) => ({
      ...prev,
      [category]: offset + 1
    }));
  }, [category, offset]);

  const updateCategory = useCallback(
    (newCategory?: string) => {
      nextSuggestion();
      setCategory((prev) => newCategory ?? prev);
    },
    [nextSuggestion]
  );

  const currentSuggestion = suggestionQuery.isSuccess
    ? suggestionQuery.data[offset % quantity]
    : undefined;

  return {
    suggestion: currentSuggestion?.value ?? '',
    suggestionUuid: currentSuggestion?.uuid,
    updateCategory,
    nextSuggestion
  };
};
