import { useCallback, useEffect, useRef, useState } from 'react';

import { getSuggestions } from '../utils/apiClient';
import { logError } from '../utils/errorHandler';
import { SuggestionDto } from '../utils/types';

export const useSuggestions = (
  initialCategory?: string,
  initialQuantity = 5
) => {
  const [category, setCategory] = useState<string>(initialCategory ?? '');
  const [quantity] = useState<number>(initialQuantity);
  const [suggestion, setSuggestion] = useState<string>('');
  const suggestionsRef = useRef<Map<string, string[]>>(new Map());

  const nextSuggestion = useCallback(async () => {
    try {
      let stored = suggestionsRef.current.get(category) || [];
      if (stored.length === 0 && category !== '') {
        const suggestionResponse = await getSuggestions(category, quantity);
        stored = suggestionResponse.data.map((s: SuggestionDto) => s.value);
        suggestionsRef.current.set(category, stored);
      }

      setSuggestion(stored.shift() || '');
      suggestionsRef.current.set(category, stored);
    } catch (err: unknown) {
      logError('Error fetching suggestions', err);
    }
  }, [category, quantity]);

  const updateCategory = useCallback((newCategory?: string) => {
    setCategory((prev) => newCategory ?? prev);
  }, []);

  useEffect(() => {
    nextSuggestion();
  }, [category, nextSuggestion]);

  return { category, suggestion, updateCategory, nextSuggestion };
};
