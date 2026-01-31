/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';

import { useAppContext } from '../contexts/AppContext';
import { socket } from '../utils/socket';

interface GameUpdatedEvent {
  gameUuid: string;
  playerUuid?: string;
  action: string;
}

export const useGameEvents = () => {
  const [gameUpdatedEvent, setGameUpdatedEvent] =
    useState<GameUpdatedEvent | null>(null);
  const [pokedEvent, setPokedEvent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { context } = useAppContext();

  useEffect(() => {
    if (!context.gameUuid) {
      console.debug('No game UUID provided, skipping WebSocket connection');
      return;
    }
    console.debug(
      'Establishing WebSocket connection for game UUID:',
      context.gameUuid
    );

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      console.debug('WebSocket connected:', socket.id);

      socket.emit('game.join', {
        gameUuid: context.gameUuid,
        playerUuid: context.playerUuid
      });

      setGameUpdatedEvent({
        action: 'connected',
        gameUuid: context.gameUuid!,
        playerUuid: context.playerUuid
      });
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      setError(`Disconnected: ${reason}`);
      console.warn('WebSocket disconnected:', reason);
    });

    socket.on('game.updated', (data: any) => {
      try {
        console.debug('Received WebSocket data: ' + data);
        const parsedData: GameUpdatedEvent = JSON.parse(data);
        setGameUpdatedEvent(parsedData);
      } catch (err) {
        console.error('Failed to parse WebSocket data:', err);
        setError(`Parse error: ${err}`);
      }
    });

    socket.on('poke', (data: any) => {
      setPokedEvent(data);
    });

    socket.connect();

    return () => {
      socket.disconnect();
      setIsConnected(false);
    };
  }, [context.gameUuid, context.playerUuid]);

  return { gameUpdatedEvent, error, isConnected, socket, pokedEvent };
};
