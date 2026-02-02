import axios from 'axios';
import { useCallback } from 'react';

import { useAppContext } from '../contexts/AppContext';
import { GameDto, PlayerDto, SuggestionDto } from '../utils/types';

export const useApiClient = () => {
  const { context, dispatchContext } = useAppContext();

  const leaveGame = useCallback(async () => {
    try {
      if (context.player && context.token) {
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

  const joinGame = useCallback(
    async (uuid: string, nickname: string) => {
      let player: PlayerDto;
      let token: string;

      if (
        context.game?.uuid === uuid &&
        context.player?.nickname === nickname &&
        context.token
      ) {
        const player = await getPlayer();
        return player!;
      } else if (
        context.game?.uuid === uuid &&
        context.player &&
        context.token
      ) {
        const playerResponse = await axios.patch<PlayerDto>(
          `/api/players/${context.player?.uuid}`,
          {
            nickname
          },
          {
            headers: {
              Authorization: `Bearer ${context.token}`
            }
          }
        );
        player = playerResponse.data;
        token = context.token!;
      } else {
        await leaveGame();
        const playerResponse = await axios.post<PlayerDto>(
          `/api/games/${uuid}/players`,
          {
            nickname
          }
        );
        player = playerResponse.data;
        token = playerResponse.headers['x-auth-token'];
      }

      dispatchContext({
        type: 'save',
        player,
        game: player.game!,
        token
      });
      return player;
    },
    [context, dispatchContext, leaveGame, getPlayer]
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
