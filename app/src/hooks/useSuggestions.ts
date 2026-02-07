import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

import { getSuggestions } from '../utils/apiClient';

type UseSuggestionsArgs = {
  initialCategory?: string;
  quantity?: number;
  prefetchCategories?: string[];
};

const queryFn = async (category: string, quantity: number) => {
  const res = await getSuggestions(category, quantity);
  return res.data;
};

export const useSuggestions = ({
  initialCategory = '',
  quantity = 5,
  prefetchCategories = []
}: UseSuggestionsArgs) => {
  const queryClient = useQueryClient();

  const [category, setCategory] = useState(initialCategory ?? '');
  const [offsets, setOffsets] = useState<{ [key: string]: number }>({});
  const offset = offsets[category] ?? 0;

  const suggestionQuery = useQuery({
    queryKey: [
      'suggestions',
      { category, quantity, offset: Math.floor(offset / quantity) }
    ],
    queryFn: () => queryFn(category, quantity),
    enabled: category !== ''
  });

  const prefetch = useCallback(() => {
    void Promise.all(
      prefetchCategories.map((cat) =>
        queryClient.prefetchQuery({
          queryKey: ['suggestions', { category: cat, quantity, offset: 0 }],
          queryFn: () => queryFn(cat, quantity)
        })
      )
    );
  }, [queryClient, prefetchCategories, quantity]);

  useEffect(() => {
    prefetch();
  }, [prefetch]);

  const nextSuggestion = useCallback(() => {
    setOffsets((prev) => ({
      ...prev,
      [category]: offset + 1
    }));
  }, [category, offset]);

  const updateCategory = useCallback((newCategory?: string) => {
    setCategory((prev) => newCategory ?? prev);
  }, []);

  const suggestion = suggestionQuery.isSuccess
    ? suggestionQuery.data[offset % quantity]?.value
    : '';

  return { suggestion, updateCategory, nextSuggestion };
};
