import {
  Dispatch,
  createContext,
  useContext,
  useEffect,
  useReducer
} from 'react';

import { GameDto, PlayerDto } from '../utils/types';

export interface AppState {
  player?: {
    uuid: string;
    nickname: string;
    roles?: string[];
  };
  game?: {
    uuid: string;
    code: string;
    type: string;
  };
  token?: string;
}

interface AppContextType {
  context: AppState;
  dispatchContext: Dispatch<Action>;
}

// Storage keys
const STORAGE_KEYS = {
  PLAYER_ID: 'games-v3-player-id',
  GAME_ID: 'games-v3-game-id',
  TOKEN: 'games-v3-token'
} as const;

// Helper functions for localStorage
const saveToStorage = (state: AppState) => {
  if (state.player)
    localStorage.setItem(STORAGE_KEYS.PLAYER_ID, JSON.stringify(state.player));
  if (state.game)
    localStorage.setItem(STORAGE_KEYS.GAME_ID, JSON.stringify(state.game));
  if (state.token) localStorage.setItem(STORAGE_KEYS.TOKEN, state.token);
};

const loadFromStorage = (): AppState => {
  try {
    return {
      player:
        JSON.parse(localStorage.getItem(STORAGE_KEYS.PLAYER_ID) || 'null') ||
        undefined,
      game:
        JSON.parse(localStorage.getItem(STORAGE_KEYS.GAME_ID) || 'null') ||
        undefined,
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
  | { type: 'clear' }
  | { type: 'save'; player: PlayerDto; game: GameDto; token: string }
  | { type: 'load'; state: AppState };

const reducer = (prev: AppState, action: Action): AppState => {
  let newState: AppState;

  switch (action.type) {
    case 'clear':
      clearStorage();
      return {};
    case 'save': {
      newState = {
        player: {
          uuid: action.player.uuid,
          nickname: action.player.nickname,
          roles: action.player.roles
        },
        game: {
          uuid: action.game.uuid,
          code: action.game.code,
          type: action.game.type
        },
        token: action.token
      };
      saveToStorage(newState);
      return newState;
    }
    case 'load':
      newState = {
        ...prev,
        ...action.state
      };
      return newState;
    default:
      return prev;
  }
};

const AppContext = createContext<AppContextType | null>(null);

export const AppContextProvider = ({
  children
}: {
  children: React.ReactElement;
}) => {
  const [context, dispatchContext] = useReducer(reducer, {});

  useEffect(() => {
    const storedState = loadFromStorage();

    // apply cached values immediately
    if (storedState.player || storedState.game || storedState.token) {
      dispatchContext({ type: 'load', state: storedState });
    }
  }, []);

  return (
    <AppContext.Provider value={{ context, dispatchContext }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const appContext = useContext(AppContext);
  if (!appContext)
    throw new Error('useAppContext must be used inside AppContextProvider');
  return appContext;
};
