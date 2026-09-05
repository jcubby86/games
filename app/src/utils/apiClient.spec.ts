import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  getGameByCode,
  getSuggestions,
  postGame,
  postSuggestionLike
} from './apiClient';

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

  it('getSuggestions sends the token and omits the no_ai param by default', () => {
    const spy = vi.spyOn(axios, 'get').mockResolvedValue({ data: [] });

    void getSuggestions('a-token', 'MALE_NAME', 5);

    expect(spy).toHaveBeenCalledWith(
      '/api/suggestions?category=MALE_NAME&quantity=5',
      { headers: { Authorization: 'Bearer a-token' } }
    );
  });

  it('getSuggestions includes no_ai=true when requested', () => {
    const spy = vi.spyOn(axios, 'get').mockResolvedValue({ data: [] });

    void getSuggestions('a-token', 'MALE_NAME', 5, true);

    expect(spy).toHaveBeenCalledWith(
      '/api/suggestions?category=MALE_NAME&quantity=5&no_ai=true',
      { headers: { Authorization: 'Bearer a-token' } }
    );
  });

  it('postSuggestionLike sends the token with no body', () => {
    const spy = vi.spyOn(axios, 'post').mockResolvedValue({ data: undefined });

    void postSuggestionLike('a-token', 'suggestion-uuid');

    expect(spy).toHaveBeenCalledWith(
      '/api/suggestions/suggestion-uuid/like',
      undefined,
      { headers: { Authorization: 'Bearer a-token' } }
    );
  });
});
