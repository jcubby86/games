import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useEffectEvent, useState } from 'react';

import { getSuggestions } from '../utils/apiClient';

type UseSuggestionsArgs = {
  initialCategory: string;
  quantity: number;
  prefetchCategories?: string[];
};

function suggestionOptions(
  category: string,
  quantity: number,
  offsetKey: number
) {
  return queryOptions({
    queryKey: ['suggestions', category, quantity, offsetKey],
    queryFn: async () => {
      const response = await getSuggestions(category, quantity);
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
  const [category, setCategory] = useState(initialCategory);
  const [offsets, setOffsets] = useState<{ [key: string]: number }>({});
  const offset = offsets[category] ?? 0;
  const offsetKey = Math.floor(offset / quantity);

  const suggestionQuery = useQuery(
    suggestionOptions(category, quantity, offsetKey)
  );

  const prefetch = useEffectEvent(() => {
    if (!prefetchCategories) {
      return;
    }
    prefetchCategories.forEach((cat) => {
      void queryClient.prefetchQuery(suggestionOptions(cat, quantity, 0));
    });
  });

  useEffect(() => {
    prefetch();
  }, []);

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

  const suggestion = suggestionQuery.isSuccess
    ? suggestionQuery.data[offset % quantity]?.value
    : '';

  return { suggestion, updateCategory, nextSuggestion };
};
