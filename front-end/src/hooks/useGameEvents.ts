/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';

import { useAppContext } from '../contexts/AppContext';

interface GameUpdatedEvent {
  gameUuid: string;
  playerUuid?: string;
  action: string;
}

export const useGameEvents = () => {
  const [gameUpdatedEvent, setGameUpdatedEvent] = useState<GameUpdatedEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { context } = useAppContext();

  useEffect(() => {
    if (!context.gameUuid) {
      console.debug('No game UUID provided, skipping SSE connection');
      return;
    }
    console.debug('Establishing SSE connection for game UUID:', context.gameUuid);

    const eventSource = new EventSource(
      `/api/games/${context.gameUuid}/events`
    );

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
      console.log('SSE connection established');
    };

    eventSource.onmessage = (event) => {
      try {
        console.debug("Received SSE data: " + event.data);
        const parsedData: GameUpdatedEvent = JSON.parse(event.data);
        setGameUpdatedEvent(parsedData);
      } catch (err) {
        console.error('Failed to parse SSE data:', err);
        setError(`Parse error: ${err}`);
      }
    };

    eventSource.onerror = (event) => {
      setIsConnected(false);
      setError('Connection lost');
      console.error('SSE connection error:', event);
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [context.gameUuid]);

  return { gameUpdatedEvent, error, isConnected };
};
