import {
  Dispatch,
  createContext,
  useContext,
  useEffect,
  useReducer
} from 'react';

import axios from '../utils/axiosWrapper';
import { logError } from '../utils/errorHandler';
import { PlayerDto } from '../utils/types';

export interface AppState {
  nickname?: string;
  gameCode?: string;
  gameType?: string;
  playerId?: string;
  gameId?: string;
}

// Storage keys
const STORAGE_KEYS = {
  PLAYER_ID: 'games-v2-player-id',
  GAME_ID: 'games-v2-game-id',
  NICKNAME: 'games-v2-nickname',
  GAME_CODE: 'games-v2-game-code',
  GAME_TYPE: 'games-v2-game-type',
} as const;

// Helper functions for localStorage
const saveToStorage = (state: AppState) => {
  if (state.playerId) localStorage.setItem(STORAGE_KEYS.PLAYER_ID, state.playerId);
  if (state.gameId) localStorage.setItem(STORAGE_KEYS.GAME_ID, state.gameId);
  if (state.nickname) localStorage.setItem(STORAGE_KEYS.NICKNAME, state.nickname);
  if (state.gameCode) localStorage.setItem(STORAGE_KEYS.GAME_CODE, state.gameCode);
  if (state.gameType) localStorage.setItem(STORAGE_KEYS.GAME_TYPE, state.gameType);
};

const loadFromStorage = (): Partial<AppState> => {
  try {
    return {
      playerId: localStorage.getItem(STORAGE_KEYS.PLAYER_ID) || undefined,
      gameId: localStorage.getItem(STORAGE_KEYS.GAME_ID) || undefined,
      nickname: localStorage.getItem(STORAGE_KEYS.NICKNAME) || undefined,
      gameCode: localStorage.getItem(STORAGE_KEYS.GAME_CODE) || undefined,
      gameType: localStorage.getItem(STORAGE_KEYS.GAME_TYPE) || undefined,
    };
  } catch {
    return {};
  }
};

const clearStorage = () => {
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
};

type Action = 
  | { type: 'leave' } 
  | { type: 'join'; player: PlayerDto }
  | { type: 'loadFromStorage'; state: Partial<AppState> };

const reducer = (prev: AppState, action: Action): AppState => {
  let newState: AppState;
  
  switch (action.type) {
    case 'leave':
      newState = {
        ...prev,
        gameCode: undefined,
        gameType: undefined,
        gameId: undefined
      };
      clearStorage();
      return newState;
    case 'join': {
      const player = action.player;
      newState = {
        nickname: player.nickname,
        playerId: player.uuid,
        gameCode: player.game.code,
        gameType: player.game.type,
        gameId: player.game.uuid
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
    if (storedState.playerId || storedState.gameId) {
      dispatch({ type: 'loadFromStorage', state: storedState });
    }

    async function fetchPlayer() {
      try {
        // Only fetch if we have stored player/game data
        if (storedState.playerId && storedState.gameId) {
          const response = await axios.get<PlayerDto>('/api/player', controller);
          dispatch({ type: 'join', player: response.data });
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
