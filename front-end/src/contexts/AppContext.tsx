import {
  Dispatch,
  createContext,
  useContext,
  useEffect,
  useReducer
} from 'react';

export interface AppState {
  player?: {
    uuid: string;
    nickname: string;
  };
  game?: {
    uuid: string;
    code: string;
    type: string;
  };
  token?: string;
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

type Action = { type: 'clear' } | { type: 'save'; state: AppState };

const reducer = (prev: AppState, action: Action): AppState => {
  let newState: AppState;

  switch (action.type) {
    case 'clear':
      clearStorage();
      return {};
    case 'save': {
      newState = {
        ...prev,
        ...action.state
      };
      saveToStorage(newState);
      return newState;
    }
    default:
      return prev;
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
    const storedState = loadFromStorage();

    // apply cached values immediately
    if (storedState.player || storedState.game || storedState.token) {
      dispatch({ type: 'save', state: storedState });
    }
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
