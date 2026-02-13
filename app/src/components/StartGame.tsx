import { useRef, useState } from 'react';

import Glitch from './Glitch';
import PlayerList from './PlayerList';
import { showToast } from './ToastPortal';
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
  const codeRef = useRef<HTMLInputElement>(null);
  const [confirm, setConfirm] = useState(false);

  const updateGameMutation = useUpdateGameMutation();

  const startGame = () => {
    if (!context.token || !context.game || updateGameMutation.isPending) {
      return;
    }
    if (!confirm) {
      setConfirm(true);
      showToast({
        message: 'Press again to confirm all players have joined.',
        type: 'success'
      });
      return;
    }

    updateGameMutation.mutate({ phase: PLAY });
    setConfirm(false);
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
            void startGame();
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
              ref={codeRef}
              onClick={(e) => {
                e.preventDefault();
                codeRef.current?.select();
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
            <button
              className="form-control btn btn-success col-12"
              disabled={updateGameMutation.isPending}
            >
              Start Game
              {confirm && (
                <span
                  className="spinner-border spinner-border-sm mx-1"
                  role="status"
                  aria-hidden="true"
                ></span>
              )}
            </button>
          )}
        </form>
        <PlayerList players={players} />
      </div>
    </>
  );
};

export default StartGame;
