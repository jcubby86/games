/**
 * Utility functions for game session management
 */

export const isValidUuid = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const isValidGameCode = (code: string): boolean => {
  // Adjust this regex based on your game code format
  return /^[A-Z0-9]{4,8}$/i.test(code);
};

export const validateSession = (gameId?: string, playerId?: string): boolean => {
  if (!gameId || !playerId) return false;
  return isValidUuid(gameId) && isValidUuid(playerId);
};

/**
 * Clear invalid session data from storage
 * Call this if server returns 404/unauthorized for stored session
 */
export const clearInvalidSession = () => {
  const keys = [
    'games-v2-player-id',
    'games-v2-game-id',
    'games-v2-nickname',
    'games-v2-game-code',
    'games-v2-game-type',
  ];
  
  keys.forEach(key => localStorage.removeItem(key));
};