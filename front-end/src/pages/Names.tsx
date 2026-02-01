import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import Tooltip from 'react-bootstrap/esm/Tooltip';

import Icon from '../components/Icon';
import List from '../components/List';
import PlayerList from '../components/PlayerList';
import RecreateButton from '../components/RecreateButton';
import StartGame from '../components/StartGame';
import { useAppContext } from '../contexts/AppContext';
import { useSocket } from '../contexts/SocketProvider';
import { useSuggestion } from '../hooks/useSuggestion';
import { END, JOIN, PLAY, READ } from '../utils/constants';
import { alertError, logError } from '../utils/errorHandler';
import { NameVariant } from '../utils/gameVariants';
import { PlayerDto } from '../utils/types';

const Names = (): JSX.Element => {
  const { context } = useAppContext();
  const socket = useSocket();
  const [state, setState] = useState<PlayerDto | null>(null);
  const entryRef = useRef<HTMLInputElement>(null);
  const { suggestion, updateSuggestion, updateCategory } = useSuggestion(10);

  const refreshData = useCallback(async () => {
    if (!context.player || !context.token) {
      return;
    }
    try {
      const response = await axios.get('/api/players/' + context.player!.uuid, {
        headers: { Authorization: `Bearer ${context.token}` }
      });
      const player: PlayerDto = response.data;
      setState({ ...player });
    } catch (err: unknown) {
      logError(err);
    }
  }, [context.player, context.token]);

  useEffect(() => {
    function gameUpdated(event: unknown) {
      console.log('Game updated:', event);
      refreshData();
    }

    socket.on('game.updated', gameUpdated);
    return () => {
      socket.off('game.updated', gameUpdated);
    };
  }, [socket, refreshData]);

  useEffect(() => {
    updateCategory('MALE_NAME,FEMALE_NAME');
    refreshData();
  }, [context, refreshData, updateCategory]);

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

    const resetPlaceholder = async (e: React.MouseEvent) => {
      e.preventDefault();
      updateSuggestion();
    };

    return (
      <form className="w-100" onSubmit={sendEntry}>
        <h3 className="text-center w-100">Enter a name:</h3>
        <input
          placeholder={suggestion}
          ref={entryRef}
          className="form-control"
        />
        <div className="container-fluid mt-4">
          <div className="row gap-4">
            <input
              type="submit"
              value="Send"
              className="btn btn-success col-9"
            />
            <button
              className="btn btn-outline-secondary col"
              onClick={resetPlaceholder}
              data-tooltip-id="my-tooltip"
              data-tooltip-content="New Suggestion"
              data-tooltip-place="bottom"
            >
              <Icon icon="nf-fa-refresh" className="flex-grow-1" />
            </button>
          </div>
        </div>
        <Tooltip id="my-tooltip" />
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
