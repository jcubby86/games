import axios from 'axios';
import { useCallback } from 'react';

import { useAppContext } from '../contexts/AppContext';
import { GameDto, PlayerDto, SuggestionDto } from '../utils/types';

export const useApiClient = () => {
  const { context, dispatchContext } = useAppContext();

  const joinGame = useCallback(
    async (uuid: string, nickname: string) => {
      const playerResponse = await axios.post<PlayerDto>(
        `/api/games/${uuid}/players`,
        {
          nickname
        }
      );
      const player = playerResponse.data;

      dispatchContext({
        type: 'save',
        state: {
          player: {
            uuid: player.uuid,
            nickname: player.nickname
          },
          game: {
            uuid: player.game!.uuid,
            code: player.game!.code,
            type: player.game!.type
          },
          token: playerResponse.headers['x-auth-token']
        }
      });
      return player;
    },
    [dispatchContext]
  );

  const getGameByCode = useCallback(
    async (code: string, controller?: AbortController) => {
      return axios.get<GameDto>(`/api/games?code=${code}`, {
        signal: controller?.signal
      });
    },
    []
  );

  const createGame = useCallback(async (type: string) => {
    const gameResponse = await axios.post<GameDto>('/api/games', {
      type
    });
    return gameResponse.data;
  }, []);

  const updateGame = useCallback(
    async (phase: string) => {
      await axios.patch<GameDto>(
        `/api/games/${context.game!.uuid}`,
        {
          phase
        },
        {
          headers: {
            Authorization: `Bearer ${context.token}`
          }
        }
      );
    },
    [context]
  );

  const leaveGame = useCallback(async () => {
    try {
      if (context.player) {
        await axios.delete('/api/players/' + context.player.uuid, {
          headers: {
            Authorization: `Bearer ${context.token}`
          }
        });
      }
      dispatchContext({
        type: 'clear'
      });
    } catch (err: unknown) {
      console.error('Error leaving game', err);
    }
  }, [dispatchContext, context]);

  const getPlayer = useCallback(async () => {
    if (!context.player || !context.token) {
      console.log('getPlayer: No player or token in context');
      return null;
    }
    const playerResponse = await axios.get<PlayerDto>(
      '/api/players/' + context.player!.uuid,
      {
        headers: { Authorization: `Bearer ${context.token}` }
      }
    );
    return playerResponse.data;
  }, [context]);

  const submitNameEntry = useCallback(
    async (name: string) => {
      await axios.post(
        `/api/players/${context.player!.uuid}/name-entries`,
        {
          name
        },
        {
          headers: { Authorization: `Bearer ${context.token}` }
        }
      );
    },
    [context]
  );

  const submitStoryEntry = useCallback(
    async (value: string) => {
      await axios.post(
        `/api/players/${context.player!.uuid}/story-entries`,
        {
          value
        },
        {
          headers: { Authorization: `Bearer ${context.token}` }
        }
      );
    },
    [context]
  );

  const getSuggestion = useCallback(
    async (category: string, quantity: number) => {
      try {
        const suggestionResponse = await axios.get<SuggestionDto[]>(
          `/api/suggestions?category=${category}&quantity=${quantity}`
        );
        return suggestionResponse.data;
      } catch (err: unknown) {
        console.error('Error fetching suggestions', err);
        return [];
      }
    },
    []
  );

  return {
    joinGame,
    createGame,
    updateGame,
    getGameByCode,
    leaveGame,
    getPlayer,
    submitNameEntry,
    submitStoryEntry,
    getSuggestion
  };
};
