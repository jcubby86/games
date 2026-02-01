/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';

import { useAppContext } from '../contexts/AppContext';
import { socket } from '../utils/socket';

interface Event {
  type?: string;
  data?: any;
}

export const useGameEvents = () => {
  const [event, setEvent] = useState<Event | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { context } = useAppContext();

  useEffect(() => {
    if (!context.token || !context.playerUuid || !context.gameUuid) {
      return;
    }

    socket.io.opts.extraHeaders = {
      authorization: context.token || '',
      'x-player-uuid': context.playerUuid || '',
      'x-game-uuid': context.gameUuid || ''
    };

    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, [context]);

  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      setError(null);

      console.debug('WebSocket connected:', socket.id);
    };

    const handleDisconnect = (reason: any) => {
      setIsConnected(false);
      setError(`Disconnected: ${reason}`);

      console.warn('WebSocket disconnected:', reason);
    };

    const handleGameUpdated = (data: any) => {
      try {
        setEvent({ type: 'game.updated', data: data });

        console.debug('Received game.updated event: ' + data);
      } catch (err) {
        console.error('Failed to parse WebSocket data:', err);
        setError(`Parse error: ${err}`);
      }
    };

    const handlePoke = (data: any) => {
      setEvent({ type: 'poke', data: data });
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('game.updated', handleGameUpdated);
    socket.on('poke', handlePoke);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('game.updated', handleGameUpdated);
      socket.off('poke', handlePoke);
    };
  }, []);

  return { event, error, isConnected, socket };
};
