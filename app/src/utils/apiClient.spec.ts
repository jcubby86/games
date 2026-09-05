import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getGameByCode, getSuggestions, postGame } from './apiClient';

describe('apiClient', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('postGame posts the game type', () => {
    const spy = vi.spyOn(axios, 'post').mockResolvedValue({ data: {} });

    void postGame('STORY');

    expect(spy).toHaveBeenCalledWith('/api/games', { type: 'STORY' });
  });

  it('getGameByCode requests by code query param', () => {
    const spy = vi.spyOn(axios, 'get').mockResolvedValue({ data: {} });

    void getGameByCode('ABCD');

    expect(spy).toHaveBeenCalledWith('/api/games?code=ABCD');
  });

  it('getSuggestions omits the no_ai param by default', () => {
    const spy = vi.spyOn(axios, 'get').mockResolvedValue({ data: [] });

    void getSuggestions('MALE_NAME', 5);

    expect(spy).toHaveBeenCalledWith(
      '/api/suggestions?category=MALE_NAME&quantity=5'
    );
  });

  it('getSuggestions includes no_ai=true when requested', () => {
    const spy = vi.spyOn(axios, 'get').mockResolvedValue({ data: [] });

    void getSuggestions('MALE_NAME', 5, true);

    expect(spy).toHaveBeenCalledWith(
      '/api/suggestions?category=MALE_NAME&quantity=5&no_ai=true'
    );
  });
});
