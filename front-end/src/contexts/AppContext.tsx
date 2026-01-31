import axios from 'axios';
import {
  Dispatch,
  createContext,
  useContext,
  useEffect,
  useReducer
} from 'react';

import { logError } from '../utils/errorHandler';
import { PlayerDto } from '../utils/types';

export interface AppState {
  playerUuid?: string;
  nickname?: string;
  gameUuid?: string;
  gameCode?: string;
  gameType?: string;
  token?: string;
}

// Storage keys
const STORAGE_KEYS = {
  PLAYER_ID: 'games-v2-player-id',
  GAME_ID: 'games-v2-game-id',
  TOKEN: 'games-v2-token'
} as const;

// Helper functions for localStorage
const saveToStorage = (state: AppState) => {
  if (state.playerUuid)
    localStorage.setItem(STORAGE_KEYS.PLAYER_ID, state.playerUuid);
  if (state.gameUuid)
    localStorage.setItem(STORAGE_KEYS.GAME_ID, state.gameUuid);
  if (state.token) localStorage.setItem(STORAGE_KEYS.TOKEN, state.token);
};

const loadFromStorage = (): Partial<AppState> => {
  try {
    return {
      playerUuid: localStorage.getItem(STORAGE_KEYS.PLAYER_ID) || undefined,
      gameUuid: localStorage.getItem(STORAGE_KEYS.GAME_ID) || undefined,
      token: localStorage.getItem(STORAGE_KEYS.TOKEN) || undefined
    };
  } catch {
    return {};
  }
};

const clearStorage = () => {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
};

type Action =
  | { type: 'leave' }
  | { type: 'join'; state: AppState }
  | { type: 'loadFromStorage'; state: Partial<AppState> };

const reducer = (prev: AppState, action: Action): AppState => {
  let newState: AppState;

  switch (action.type) {
    case 'leave':
      clearStorage();
      return {};
    case 'join': {
      newState = {
        ...prev,
        ...action.state
      };
      saveToStorage(newState);
      return newState;
    }
    case 'loadFromStorage':
      return {
        ...prev,
        ...action.state
      };
  }
};

const AppContext = createContext<AppState>({});
const AppDispatchContext = createContext<Dispatch<Action>>(() => {});

export const AppContextProvider = ({
  children
}: {
  children: React.ReactElement;
}) => {
  const [context, dispatch] = useReducer(reducer, {});

  useEffect(() => {
    const controller = new AbortController();

    // Load from localStorage first
    const storedState = loadFromStorage();
    if (storedState.playerUuid || storedState.gameUuid) {
      dispatch({ type: 'loadFromStorage', state: storedState });
    }

    async function fetchPlayer() {
      try {
        // Only fetch if we have stored player/game data
        if (storedState.playerUuid && storedState.gameUuid) {
          const response = await axios.get(
            `/api/players/${storedState.playerUuid}`,
            { signal: controller.signal }
          );
          const player: PlayerDto = response.data;

          dispatch({
            type: 'join',
            state: {
              playerUuid: player.uuid,
              gameUuid: player.game?.uuid,
              gameCode: player.game?.code,
              token: response.headers.authorization,
              nickname: player.nickname
            }
          });
        }
      } catch (err: unknown) {
        logError(err);
        // If fetch fails, we still have the stored state from above
        console.warn('Failed to sync with server, using cached player data');
      }
    }

    fetchPlayer();

    return () => controller.abort();
  }, []);

  return (
    <AppContext.Provider value={context}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  return {
    context: useContext(AppContext),
    dispatchContext: useContext(AppDispatchContext)
  };
};
