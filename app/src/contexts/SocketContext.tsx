import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useRef,
  useState
} from 'react';
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
const URL = import.meta.env.VITE_BACKEND_ADDRESS as string | undefined;

export const SocketContextProvider = ({
  children
}: {
  children: React.ReactElement;
}) => {
  const { context, dispatchContext } = useAppContext();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleConnect = useEffectEvent(() => {
    setConnected(true);
    return console.log('Connected to websocket server');
  });

  const handleConnectError = useEffectEvent((err: Error) => {
    setConnected(false);

    if (err.message === 'jwt expired') {
      dispatchContext({ type: 'clear' });
      void navigate('/');
    }

    return console.log('Connection error: ', err.message);
  });

  const handleDisconnect = useEffectEvent(() => {
    setConnected(false);
    return console.log('Disconnected from websocket server');
  });

  const handleGameRecreated = useEffectEvent(
    async (message: Message<GameDto>) => {
      const playerResponse = await postPlayer(
        message.data.uuid,
        context.player!.nickname
      );
      dispatchContext({
        type: 'save',
        game: playerResponse.data.game!,
        player: playerResponse.data,
        token: playerResponse.headers['x-auth-token'] as string
      });

      void navigate(`/` + playerResponse.data.game!.type.toLowerCase());
    }
  );

  const gameUpdated = useEffectEvent(() => {
    void queryClient.invalidateQueries({ queryKey: ['players'] });
  });

  const handlePoke = useEffectEvent((message: Message<PokeMessageData>) => {
    showFloatingMessage({
      children: `${message.data.from!.nickname} has poked you!`
    });
  });

  useEffect(() => {
    if (!context.token) {
      return;
    }

    socketRef.current = io(URL, {
      auth: {
        bearer: context.token
      }
    });

    socketRef.current.on('connect', handleConnect);
    socketRef.current.on('connect_error', handleConnectError);
    socketRef.current.on('disconnect', handleDisconnect);
    socketRef.current.on('game.updated', gameUpdated);
    socketRef.current.on('game.recreated', handleGameRecreated);
    socketRef.current.on('poke', handlePoke);

    return () => {
      socketRef.current?.disconnect();
    };
  }, [context]);

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

export const useSocketContext = () => {
  const socket = useContext(SocketContext);
  if (!socket) throw new Error('useSocket must be used inside SocketProvider');
  return socket;
};
