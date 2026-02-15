import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

import { showModal } from './ModalPortal';
import { useAppContext } from '../contexts/AppContext';
import { useSocketContext } from '../contexts/SocketContext';
import { postGame, postPlayer } from '../utils/apiClient';
import { alertError } from '../utils/errorHandler';
import { GameDto } from '../utils/types';

const RecreateButton = ({
  className,
  to
}: {
  className?: string;
  to?: string;
}) => {
  const { context, dispatchContext } = useAppContext();
  const socket = useSocketContext();
  const navigate = useNavigate();

  const createGameMutation = useMutation({
    mutationFn: () => postGame(context.game!.type),
    onError: (err: unknown) => alertError('Unable to create game', err)
  });

  const createPlayerMutation = useMutation({
    mutationFn: ({ game }: { game: GameDto }) =>
      postPlayer(game.uuid, context.player!.nickname),
    onSuccess: async (playerResponse, { game }) => {
      socket.emit('game.recreated', { data: game });

      dispatchContext({
        type: 'save',
        game: playerResponse.data.game!,
        player: playerResponse.data,
        token: playerResponse.headers['x-auth-token'] as string
      });

      if (to) {
        await navigate(to);
      }
    },
    onError: (err: unknown) => alertError('Unable to create player', err)
  });

  const recreateGameHandler = () => {
    if (!formEnabled) {
      return;
    }
    showModal({
      title: 'Recreate Game',
      body: 'Are you sure you are ready to start a new game?',
      onConfirm: async () => {
        const gameResponse = await createGameMutation.mutateAsync();
        await createPlayerMutation.mutateAsync({ game: gameResponse.data });
      },
      confirmVariant: 'success'
    });
  };

  const formEnabled =
    !createGameMutation.isPending && !createPlayerMutation.isPending;

  if (context.game && context.player?.roles?.includes('host')) {
    return (
      <button
        className={className}
        onClick={(e) => {
          e.preventDefault();
          recreateGameHandler();
        }}
        disabled={!formEnabled}
      >
        Play Again
      </button>
    );
  } else {
    return <></>;
  }
};

export default RecreateButton;
