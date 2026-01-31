import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';

import List from '../components/List';
import StartGame from '../components/StartGame';
import { useAppContext } from '../contexts/AppContext';
import { useGameEvents } from '../hooks/useGameEvents';
import { END, JOIN, PLAY, READ, WAIT } from '../utils/constants';
import { alertError, logError } from '../utils/errorHandler';
import { NameVariant } from '../utils/gameVariants';
import { PlayerDto } from '../utils/types';

const Names = (): JSX.Element => {
  const { context } = useAppContext();
  const [state, setState] = useState<PlayerDto | null>(null);
  const entryRef = useRef<HTMLInputElement>(null);
  const { gameUpdatedEvent } = useGameEvents();

  const refreshData = useCallback(async () => {
    try {
      const response = await axios.get('/api/players/' + context.playerUuid, {
        headers: { Authorization: context.token }
      });
      setState({ ...response.data });
    } catch (err: unknown) {
      logError(err);
    }
  }, [context.playerUuid, context.token]);

  useEffect(() => {
    if (gameUpdatedEvent) {
      refreshData();
    }
  }, [gameUpdatedEvent, refreshData]);

  const Play = (): JSX.Element => {
    const sendEntry = async (e: React.FormEvent) => {
      try {
        e.preventDefault();
        if (!entryRef.current?.value) {
          alert('Please enter a name');
          return;
        }

        await axios.post(
          `/api/players/${context.playerUuid}/name-entries`,
          {
            name: entryRef.current.value
          },
          {
            headers: { Authorization: context.token }
          }
        );
        setState(null);
      } catch (err: unknown) {
        alertError('Error saving entry', err);
      }
    };

    return (
      <form className="w-100" onSubmit={sendEntry}>
        <h3 className="text-center w-100">Enter a name:</h3>
        <input placeholder="" ref={entryRef} className="form-control" />
        <input
          type="submit"
          value="Send"
          className="form-control btn btn-success mt-3"
        />
      </form>
    );
  };

  const Read = (): JSX.Element => {
    const endGame = async (e: React.MouseEvent) => {
      try {
        e.preventDefault();
        await axios.patch(
          `/api/games/${context.gameUuid}`,
          {
            phase: END
          },
          { headers: { Authorization: context.token } }
        );
        setState(null);
      } catch (err: unknown) {
        alertError('Error updating game', err);
      }
    };

    return (
      <div className="w-100 d-flex flex-column">
        <div className="w-100">
          <h3 className="text-center w-100">Names:</h3>
          <List items={state?.entries?.map((e) => e.name ?? '')} />
        </div>

        <button className={'btn btn-danger mt-4'} onClick={endGame}>
          Hide Names
        </button>
      </div>
    );
  };

  const End = (): JSX.Element => {
    return (
      <div className="w-100">
        <h3 className="w-100 text-center pb-3">Enjoy the game!</h3>
      </div>
    );
  };

  const Wait = (): JSX.Element => {
    return (
      <div className="w-100">
        <h3 className="text-center w-100">Waiting for other players...</h3>
        {state?.game?.phase === WAIT && (
          <List items={state.game.players?.map((p) => p.nickname ?? '')} />
        )}
      </div>
    );
  };

  if (state?.game?.phase === JOIN) {
    return (
      <StartGame
        players={state.game.players?.map((p) => p.nickname ?? '')}
        title={NameVariant.title}
        callback={() => setState(null)}
      />
    );
  } else if (state?.game?.phase === PLAY && state?.canPlayerSubmit) {
    return <Play />;
  } else if (state?.game?.phase === READ) {
    return <Read />;
  } else if (state?.game?.phase === END) {
    return <End />;
  } else {
    return <Wait />;
  }
};

export default Names;
