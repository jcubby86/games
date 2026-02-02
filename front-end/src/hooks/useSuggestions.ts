import { useCallback, useEffect, useRef, useState } from 'react';

import { useApiClient } from './useApiClient';
import { SuggestionDto } from '../utils/types';

export const useSuggestions = (
  initialCategory?: string,
  initialQuantity = 5
) => {
  const { getSuggestion } = useApiClient();
  const [category, setCategory] = useState<string>(initialCategory ?? '');
  const [quantity] = useState<number>(initialQuantity);
  const [suggestion, setSuggestion] = useState<string>('');
  const suggestionsRef = useRef<Map<string, string[]>>(new Map());

  const nextSuggestion = useCallback(async () => {
    let stored = suggestionsRef.current.get(category) || [];
    if (stored.length === 0 && category !== '') {
      const suggestions = await getSuggestion(category, quantity);
      stored = suggestions.map((s: SuggestionDto) => s.value);
      suggestionsRef.current.set(category, stored);
    }

    setSuggestion(stored.shift() || '');
    suggestionsRef.current.set(category, stored);
  }, [category, quantity, getSuggestion]);

  const updateCategory = useCallback((newCategory?: string) => {
    setCategory((prev) => newCategory ?? prev);
  }, []);

  useEffect(() => {
    nextSuggestion();
  }, [category, nextSuggestion]);

  return { category, suggestion, updateCategory, nextSuggestion };
};
