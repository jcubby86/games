import { useRef } from 'react';

import Glitch from './Glitch';
import PlayerList from './PlayerList';
import { useAppContext } from '../contexts/AppContext';
import { patchGame } from '../utils/apiClient';
import { PLAY } from '../utils/constants';
import { alertError } from '../utils/errorHandler';
import { PlayerDto } from '../utils/types';

interface StartGameProps {
  callback: () => void;
  title: string;
  players?: PlayerDto[];
}

const StartGame = ({ callback, title, players }: StartGameProps) => {
  const { context } = useAppContext();
  const codeRef = useRef<HTMLInputElement>(null);

  const startGame = async () => {
    if (!context.token || !context.game) {
      return;
    }
    try {
      await patchGame(context.token, context.game.uuid, PLAY);
      callback();
    } catch (err: unknown) {
      alertError('Unable to start game', err);
    }
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
            <input
              type="submit"
              value="Start Game"
              className="form-control btn btn-success col-12"
            />
          )}
        </form>
        <PlayerList players={players} />
      </div>
    </>
  );
};

export default StartGame;
