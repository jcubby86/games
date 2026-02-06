import { useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { getSuggestions } from '../utils/apiClient';

export const useSuggestions = (initialCategory?: string, quantity = 5) => {
  const [category, setCategory] = useState(initialCategory ?? '');
  const [offsets, setOffsets] = useState<{ [key: string]: number }>({});
  const offset = offsets[category] ?? 0;

  const suggestionQuery = useQuery({
    queryKey: [
      'suggestions',
      { category, quantity, offset: Math.floor(offset / quantity) }
    ],
    queryFn: async () => {
      const res = await getSuggestions(category, quantity);
      return res.data;
    },
    enabled: category !== ''
  });

  const nextSuggestion = useCallback(async () => {
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
