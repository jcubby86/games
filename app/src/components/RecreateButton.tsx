import { useNavigate } from 'react-router';

import { useAppContext } from '../contexts/AppContext';
import { useSocketContext } from '../contexts/SocketContext';
import { postGame, postPlayer } from '../utils/apiClient';
import { alertError } from '../utils/errorHandler';

const RecreateButton = ({
  className,
  to
}: {
  className?: string;
  to?: string;
}): JSX.Element => {
  const { context, dispatchContext } = useAppContext();
  const socket = useSocketContext();
  const navigate = useNavigate();

  async function recreateGameHandler() {
    try {
      const gameResponse = await postGame(context.game!.type);
      const playerResponse = await postPlayer(
        gameResponse.data.uuid,
        context.player!.nickname
      );

      socket.emit('game.recreated', { data: gameResponse.data });

      dispatchContext({
        type: 'save',
        game: gameResponse.data,
        player: playerResponse.data,
        token: playerResponse.headers['x-auth-token'] as string
      });

      if (to) {
        navigate(to);
      }
    } catch (err: unknown) {
      alertError('Unable to create game', err);
    }
  }

  if (context.game && context.player?.roles?.includes('host')) {
    return (
      <button
        className={className}
        onClick={(e) => {
          e.preventDefault();
          void recreateGameHandler();
        }}
      >
        Play Again
      </button>
    );
  } else {
    return <></>;
  }
};

export default RecreateButton;
