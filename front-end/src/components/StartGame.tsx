import axios from 'axios';
import { useRef } from 'react';

import PlayerList from './PlayerList';
import { useAppContext } from '../contexts/AppContext';
import { PLAY } from '../utils/constants';
import { alertError } from '../utils/errorHandler';
import { PlayerDto } from '../utils/types';

interface StartGameProps {
  callback: () => void;
  title: string;
  players?: PlayerDto[];
}

const StartGame = ({
  callback,
  title,
  players
}: StartGameProps): JSX.Element => {
  const { context } = useAppContext();
  const codeRef = useRef<HTMLInputElement>(null);

  const startGame = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      await axios.patch(
        `/api/games/${context.game!.uuid}`,
        {
          phase: PLAY
        },
        {
          headers: {
            Authorization: `Bearer ${context.token}`
          }
        }
      );
      callback();
    } catch (err: unknown) {
      alertError('Unable to start game. Please try again', err);
    }
  };

  return (
    <>
      <div className="w-100">
        <div className="text-center mb-4">
          <h1 className="text-nowrap">{title}</h1>
        </div>
        <form className="row gap-3" onSubmit={startGame}>
          <div className="mb-3 col p-0">
            <label htmlFor="gameCode" className="form-label">
              Game Code:
            </label>
            <input
              className="form-control"
              type="text"
              value={context.game!.code}
              aria-label="game code"
              readOnly
              id="gameCode"
              style={{ minWidth: '100px' }}
              ref={codeRef}
              onClick={(e) => {
                e.preventDefault();
                codeRef.current?.select();
              }}
            />
          </div>
          <div className="mb-3 col p-0">
            <label htmlFor="playerCount" className="form-label">
              Player Count:
            </label>
            <input
              className="form-control"
              type="text"
              value={String(players?.length ?? 0)}
              aria-label="player count"
              readOnly
              id="playerCount"
            />
          </div>
          <input
            type="submit"
            value="Start Game"
            className="form-control btn btn-success mt-4 col-12"
          />
        </form>
        <h3 className="text-center mt-5">Players:</h3>
        <PlayerList players={players} />
      </div>
    </>
  );
};

export default StartGame;
