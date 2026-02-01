import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';

import List from '../components/List';
import PlayerList from '../components/PlayerList';
import RecreateButton from '../components/RecreateButton';
import StartGame from '../components/StartGame';
import { useAppContext } from '../contexts/AppContext';
import { END, JOIN, PLAY, READ } from '../utils/constants';
import { alertError, logError } from '../utils/errorHandler';
import { NameVariant } from '../utils/gameVariants';
import { PlayerDto } from '../utils/types';

const Names = (): JSX.Element => {
  const { context } = useAppContext();
  const [state, setState] = useState<PlayerDto | null>(null);
  const entryRef = useRef<HTMLInputElement>(null);

  const refreshData = useCallback(async () => {
    try {
      const response = await axios.get('/api/players/' + context.player!.uuid, {
        headers: { Authorization: `Bearer ${context.token}` }
      });
      setState({ ...response.data });
    } catch (err: unknown) {
      logError(err);
    }
  }, [context.player, context.token]);

  useEffect(() => {
    refreshData();
  }, [refreshData, context]);

  const Play = (): JSX.Element => {
    const sendEntry = async (e: React.FormEvent) => {
      try {
        e.preventDefault();
        if (!entryRef.current?.value) {
          alert('Please enter a name');
          return;
        }

        await axios.post(
          `/api/players/${context.player!.uuid}/name-entries`,
          {
            name: entryRef.current.value
          },
          {
            headers: { Authorization: `Bearer ${context.token}` }
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
          `/api/games/${context.game!.uuid}`,
          {
            phase: END
          },
          { headers: { Authorization: `Bearer ${context.token}` } }
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
        <div className="d-flex justify-content-center">
          <RecreateButton className="btn btn-success" />
        </div>
      </div>
    );
  };

  const Wait = (): JSX.Element => {
    return (
      <div className="w-100">
        <h3 className="text-center w-100">Waiting for other players...</h3>
        <PlayerList
          players={state?.game?.players}
          filter={(p) => p.canPlayerSubmit ?? true}
        />
      </div>
    );
  };

  if (state?.game?.phase === JOIN) {
    return (
      <StartGame
        players={state.game.players}
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
