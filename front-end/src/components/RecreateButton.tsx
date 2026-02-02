import { useAppContext } from '../contexts/AppContext';
import { alertError } from '../utils/errorHandler';

const RecreateButton = ({ className }: { className?: string }): JSX.Element => {
  // const { socket, isConnected } = useGameEvents();
  const { context } = useAppContext();

  async function recreateGame() {
    try {
      // const response = await axios.post('/api/games', {
      //   type: context.gameType!.toUpperCase()
      // });
      // const game: GameDto = response.data;
      // if (isConnected) {
      //   socket.emit('game.recreate', {
      //     gameUuid: game.uuid
      //   });
      // }
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
          recreateGame();
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
