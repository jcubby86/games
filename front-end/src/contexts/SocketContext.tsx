/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Socket, io } from 'socket.io-client';

import { useAppContext } from './AppContext';
import { showFloatingMessage } from '../components/FloatingMessagePortal';
import { postPlayer } from '../utils/apiClient';
import { GameDto, Message, PokeMessageData } from '../utils/types';

interface SocketContextType {
  emit: (event: string, message: Message<any>) => void;
  on: (event: string, callback: (message: Message<any>) => void) => void;
  off: (event: string, callback: (message: Message<any>) => void) => void;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType | null>(null);
const URL = import.meta.env.VITE_NGINX_BACKEND_ADDRESS as string | undefined;

export const SocketContextProvider = ({
  children
}: {
  children: React.ReactElement;
}) => {
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

    socketRef.current.on(
      'game.recreated',
      async (message: Message<GameDto>) => {
        console.log('Game recreated:', JSON.stringify(message));

        const playerResponse = await postPlayer(
          message.data.uuid,
          context.player!.nickname
        );
        dispatchContext({
          type: 'save',
          game: playerResponse.data.game!,
          player: playerResponse.data,
          token: playerResponse.headers['x-auth-token']
        });

        navigate(`/` + playerResponse.data.game!.type.toLowerCase());
      }
    );

    socketRef.current.on('poke', (message: Message<PokeMessageData>) => {
      console.log('Poked by', message.data.from!.nickname);
      showFloatingMessage({
        children: `${message.data.from!.nickname} has poked you!`
      });
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [context, dispatchContext, navigate]);

  const emit: SocketContextType['emit'] = (event, message) => {
    socketRef.current?.emit(event, message);
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
  const socket = useContext(SocketContext);
  if (!socket) throw new Error('useSocket must be used inside SocketProvider');
  return socket;
};
