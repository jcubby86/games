import Glitch from './Glitch';
import { showModal } from './ModalPortal';
import PlayerList from './PlayerList';
import { SpinnerButton } from './SpinnerButton';
import { useAppContext } from '../contexts/AppContext';
import { useUpdateGameMutation } from '../hooks/useUpdateGameMutation';
import { PLAY } from '../utils/constants';
import { PlayerDto } from '../utils/types';

interface StartGameProps {
  title: string;
  players: PlayerDto[] | undefined;
}

const StartGame = ({ title, players }: StartGameProps) => {
  const { context } = useAppContext();

  const updateGameMutation = useUpdateGameMutation();

  const startGame = () => {
    if (!context.token || !context.game || updateGameMutation.isPending) {
      return;
    }
    showModal({
      title: 'Start Game',
      body: 'Are you sure you want to start the game? Make sure all players have joined and are ready.',
      onConfirm: () => updateGameMutation.mutateAsync({ phase: PLAY }),
      confirmVariant: 'success'
    });
  };

  return (
    <>
      <div className="w-100">
        <div className="text-center mb-3">
          <Glitch text={title} className="mb-0 glitch-small" />
        </div>
        <form
          className="row gap-2 mb-4"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            startGame();
          }}
        >
          <div className="form-floating mb-3 col p-0">
            <input
              className="form-control"
              type="text"
              value={context.game?.code}
              aria-label="game code"
              readOnly
              id="gameCode"
              style={{ minWidth: '100px' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.select();
              }}
              placeholder="Game Code"
            />
            <label htmlFor="gameCode" className="form-label">
              Game Code
            </label>
          </div>
          <div className="form-floating mb-3 col p-0">
            <input
              className="form-control"
              type="text"
              value={String(players?.length ?? 0)}
              aria-label="player count"
              readOnly
              id="playerCount"
              placeholder="Player Count"
            />
            <label htmlFor="playerCount" className="form-label">
              Player Count
            </label>
          </div>
          {context.player?.roles?.includes('host') && (
            <SpinnerButton
              variant="success"
              className="form-control col-12"
              loading={updateGameMutation.isPending}
              type="submit"
            >
              Start Game
            </SpinnerButton>
          )}
        </form>
        <PlayerList players={players} />
      </div>
    </>
  );
};

export default StartGame;
