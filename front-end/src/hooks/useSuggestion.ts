import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';

import { SuggestionDto } from '../utils/types';

export const useSuggestion = (quantity = 5) => {
  const [category, setCategory] = useState<string>('');
  const [suggestion, setSuggestion] = useState<string>('');
  const suggestionsRef = useRef<Map<string, string[]>>(new Map());

  const updateSuggestion = useCallback(async () => {
    let stored = suggestionsRef.current.get(category) || [];
    if (stored.length === 0 && category !== '') {
      const response = await axios.get(
        `/api/suggestions?category=${category}&quantity=${quantity}`
      );
      stored = response.data.map((s: SuggestionDto) => s.value);
      suggestionsRef.current.set(category, stored);
    }

    setSuggestion(stored.shift() || '');
    suggestionsRef.current.set(category, stored);
  }, [category, quantity]);

  const updateCategory = useCallback((newCategory?: string) => {
    setCategory((prev) => newCategory ?? prev);
  }, []);

  useEffect(() => {
    updateSuggestion();
  }, [category, updateSuggestion]);

  return { category, suggestion, updateCategory, updateSuggestion };
};
