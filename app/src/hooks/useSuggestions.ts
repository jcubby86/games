import { useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { getSuggestions } from '../utils/apiClient';

type UseSuggestionsArgs = {
  initialCategory: string;
  quantity: number;
};

export const useSuggestions = ({
  initialCategory,
  quantity
}: UseSuggestionsArgs) => {
  const [category, setCategory] = useState(initialCategory);
  const [offsets, setOffsets] = useState<{ [key: string]: number }>({});
  const offset = offsets[category] ?? 0;
  const offsetKey = Math.floor(offset / quantity);

  const suggestionQuery = useQuery({
    queryKey: ['suggestions', category, quantity, offsetKey],
    queryFn: async () => {
      const response = await getSuggestions(category, quantity);
      return response.data;
    },
    enabled: category !== ''
  });

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
