import { Dispatch, createContext, useContext, useReducer } from 'react';

import { GameDto, PlayerDto } from '../utils/types';

export interface AppState {
  player?: Pick<PlayerDto, 'uuid' | 'nickname' | 'roles'>;
  game?: Pick<GameDto, 'uuid' | 'code' | 'type'>;
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
};

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
        (JSON.parse(
          localStorage.getItem(STORAGE_KEYS.PLAYER_ID) || 'null'
        ) as PlayerDto) || undefined,
      game:
        (JSON.parse(
          localStorage.getItem(STORAGE_KEYS.GAME_ID) || 'null'
        ) as GameDto) || undefined,
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
  switch (action.type) {
    case 'clear':
      clearStorage();
      return {};
    case 'save': {
      const newState = {
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
      return action.state;
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
  const [context, dispatchContext] = useReducer(reducer, null, loadFromStorage);

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
