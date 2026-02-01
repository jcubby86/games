import axios from 'axios';

import { useAppContext } from '../contexts/AppContext';
import { useGameEvents } from '../hooks/useGameEvents';
import { alertError } from '../utils/errorHandler';
import { GameDto } from '../utils/types';

const RecreateButton = ({ className }: { className?: string }): JSX.Element => {
  // const { socket, isConnected } = useGameEvents();
  const { context } = useAppContext();

  async function recreateGame(e: React.MouseEvent) {
    e.stopPropagation();
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

  if (context.gameType && context.gameUuid) {
    return (
      <button className={className} onClick={recreateGame}>
        Play Again
      </button>
    );
  } else {
    return <></>;
  }
};

export default RecreateButton;
