import { useAppContext } from '../contexts/AppContext';

/**
 * Custom hook for managing game session state
 * Provides easy access to gameId, playerId and session management
 */
export const useGameSession = () => {
  const { context, dispatchContext } = useAppContext();

  const isInGame = Boolean(context.gameId && context.playerId);
  const hasPartialSession = Boolean(context.gameId || context.playerId);

  const leaveGame = () => {
    dispatchContext({ type: 'leave' });
  };

  const getGameUrl = () => {
    if (!context.gameCode) return null;
    return `${window.location.origin}/join?code=${context.gameCode}`;
  };

  return {
    // State
    gameId: context.gameId,
    playerId: context.playerId,
    gameCode: context.gameCode,
    gameType: context.gameType,
    nickname: context.nickname,
    
    // Computed
    isInGame,
    hasPartialSession,
    
    // Actions
    leaveGame,
    getGameUrl,
  };
};