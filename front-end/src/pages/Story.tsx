import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Tooltip } from 'react-tooltip';

import Icon from '../components/Icon';
import PlayerList from '../components/PlayerList';
import RecreateButton from '../components/RecreateButton';
import StartGame from '../components/StartGame';
import { useAppContext } from '../contexts/AppContext';
import { useSocket } from '../contexts/SocketProvider';
import { useSuggestion } from '../hooks/useSuggestion';
import { JOIN, PLAY, READ } from '../utils/constants';
import { alertError, logError } from '../utils/errorHandler';
import { StoryVariant } from '../utils/gameVariants';
import { PlayerDto } from '../utils/types';

const Story = (): JSX.Element => {
  const { context } = useAppContext();
  const socket = useSocket();
  const [state, setState] = useState<PlayerDto | null>(null);
  const entryRef = useRef<HTMLTextAreaElement>(null);
  const { suggestion, updateCategory, updateSuggestion } = useSuggestion();

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
      updateCategory(player.entry?.hint?.category);
    } catch (err: unknown) {
      logError(err);
    }
  }, [context.player, context.token, updateCategory]);

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
    updateCategory('MALE_NAME');
    refreshData();
  }, [context, refreshData, updateCategory]);

  const Play = (): JSX.Element => {
    const submit = async (e: React.FormEvent) => {
      try {
        e.preventDefault();
        if (!entryRef.current?.value) {
          alert('Please enter a response');
          return;
        }

        await axios.post(
          `/api/players/${context.player!.uuid}/story-entries`,
          {
            value: entryRef.current.value
          },
          {
            headers: { Authorization: `Bearer ${context.token}` }
          }
        );
        setState(null);
        updateSuggestion();
        entryRef.current.value = '';
      } catch (err: unknown) {
        alertError('An error has occurred', err);
      }
    };

    const resetPlaceholder = async (e: React.MouseEvent) => {
      e.preventDefault();
      updateSuggestion();
    };

    return (
      <form className="w-100" onSubmit={submit}>
        <h3 className="text-center w-100">{state?.entry?.hint?.prompt}</h3>
        <p className="form-label">
          {state?.entry?.hint?.filler} {state?.entry?.hint?.prefix}
        </p>
        <textarea
          placeholder={suggestion}
          ref={entryRef}
          className="form-control"
          rows={3}
        />
        <p className="form-label">{state?.entry?.hint?.suffix}</p>
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
    return (
      <div className="w-100">
        <p className="lh-lg fs-5 px-2 w-100 text-break">
          {state?.entry?.story}
        </p>
        <div className="container-fluid">
          <div className="row gap-4">
            <RecreateButton className="col btn btn-success" />
          </div>
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
        title={StoryVariant.title}
        callback={() => setState(null)}
      />
    );
  } else if (state?.game?.phase === PLAY && state?.canPlayerSubmit) {
    return <Play />;
  } else if (state?.game?.phase === READ) {
    return <Read />;
  } else {
    return <Wait />;
  }
};

export default Story;
