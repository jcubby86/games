/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Socket, io } from 'socket.io-client';

import { useAppContext } from './AppContext';
import { useApiClient } from '../hooks/useApiClient';

interface SocketContextType {
  emit: (event: string, data: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback: (data: any) => void) => void;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType | null>(null);
const URL = import.meta.env.VITE_NGINX_BACKEND_ADDRESS as string | undefined;

export const SocketContextProvider = ({
  children
}: {
  children: React.ReactElement;
}) => {
  const { joinGame } = useApiClient();
  const { context, dispatchContext } = useAppContext();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!context.token) {
      return;
    }

    socketRef.current = io(URL, {
      auth: {
        bearer: context.token
      }
    });

    socketRef.current.on('connect', () => {
      setConnected(true);
      return console.log('Connected to websocket server');
    });

    socketRef.current.on('connect_error', (err) => {
      setConnected(false);

      if (err.message === 'jwt expired') {
        dispatchContext({ type: 'clear' });
        navigate('/');
      }

      return console.log('Connection error: ', err.message);
    });

    socketRef.current.on('disconnect', () => {
      setConnected(false);
      return console.log('Disconnected from websocket server');
    });

    socketRef.current.on('game.recreated', async (data) => {
      console.log('Game recreated:', JSON.stringify(data));
      const player = await joinGame(data.game.uuid, context.player!.nickname);
      navigate(`/` + player.game!.type.toLowerCase());
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [context, dispatchContext, navigate, joinGame]);

  const emit: SocketContextType['emit'] = (event, data) => {
    socketRef.current?.emit(event, data);
  };

  const on: SocketContextType['on'] = (event, callback) => {
    socketRef.current?.on(event, callback);
  };

  const off: SocketContextType['off'] = (event, callback) => {
    socketRef.current?.off(event, callback);
  };

  return (
    <SocketContext.Provider
      value={{
        emit,
        on,
        off,
        connected
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used inside SocketProvider');
  return ctx;
};
