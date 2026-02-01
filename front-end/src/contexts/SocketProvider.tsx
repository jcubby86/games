/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useContext, useEffect, useRef } from 'react';
import { Socket, io } from 'socket.io-client';

import { useAppContext } from './AppContext';

interface SocketContextType {
  emit: (event: string, data: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback: (data: any) => void) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);
const URL = import.meta.env.VITE_NGINX_BACKEND_ADDRESS as string | undefined;

export const SocketProvider = ({
  children
}: {
  children: React.ReactElement;
}) => {
  const { context } = useAppContext();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!context.token) {
      return;
    }

    socketRef.current = io(URL, {
      auth: {
        bearer: context.token
      }
    });

    socketRef.current.on('connect', () =>
      console.log('Connected to websocket server')
    );

    socketRef.current.on('disconnect', () =>
      console.log('Disconnected from websocket server')
    );

    return () => {
      socketRef.current?.disconnect();
    };
  }, [context.token]);

  const emit: SocketContextType['emit'] = (event, data) => {
    socketRef.current?.emit(event, data);
  };

  const on: SocketContextType['on'] = (event, callback) => {
    if (!socketRef.current) console.log('Socket not connected yet');
    socketRef.current?.on(event, callback);
  };

  const off: SocketContextType['off'] = (event, callback) => {
    socketRef.current?.off(event, callback);
  };

  return (
    <SocketContext.Provider value={{ emit, on, off }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used inside SocketProvider');
  return ctx;
};
