import { useAppContext } from '../contexts/AppContext';
import { useSocket } from '../contexts/SocketContext';
import { useApiClient } from '../hooks/useApiClient';
import { alertError } from '../utils/errorHandler';

const RecreateButton = ({ className }: { className?: string }): JSX.Element => {
  const { context } = useAppContext();
  const socket = useSocket();
  const { createGame, joinGame } = useApiClient();

  async function recreateGameHandler() {
    try {
      const game = await createGame(context.game!.type);
      await joinGame(game.uuid, context.player!.nickname, false, () =>
        socket.emit('game.recreated', { game: { uuid: game.uuid } })
      );
    } catch (err: unknown) {
      alertError(
        'Unable to create game. Please try again in a little bit.',
        err
      );
    }
  }

  if (context.game && context.player?.roles?.includes('host')) {
    return (
      <button
        className={className}
        onClick={(e) => {
          e.preventDefault();
          recreateGameHandler();
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
