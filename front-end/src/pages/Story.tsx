import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tooltip } from 'react-tooltip';

import Icon from '../components/Icon';
import PlayerList from '../components/PlayerList';
import RecreateButton from '../components/RecreateButton';
import ShareButton from '../components/ShareButton';
import StartGame from '../components/StartGame';
import { useAppContext } from '../contexts/AppContext';
import { useSocket } from '../contexts/SocketContext';
import { useSuggestions } from '../hooks/useSuggestions';
import { getPlayer, postStoryEntry } from '../utils/apiClient';
import { JOIN, PLAY, READ } from '../utils/constants';
import { alertError, logError } from '../utils/errorHandler';
import { StoryVariant } from '../utils/gameVariants';
import { PlayerDto } from '../utils/types';

const Story = (): JSX.Element => {
  const { context } = useAppContext();
  const socket = useSocket();
  const [state, setState] = useState<PlayerDto | null>(null);
  const entryRef = useRef<HTMLTextAreaElement>(null);
  const { suggestion, updateCategory, nextSuggestion } =
    useSuggestions('MALE_NAME');

  const refreshData = useCallback(async () => {
    if (!context.player || !context.token) {
      return;
    }
    try {
      const playerResponse = await getPlayer(
        context.token,
        context.player.nickname
      );
      setState(playerResponse.data);
      updateCategory(playerResponse.data.entry?.hint?.category);
    } catch (err: unknown) {
      logError('Error fetching player', err);
    }
  }, [context, updateCategory]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

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

  const Play = (): JSX.Element => {
    const submit = async () => {
      try {
        if (!entryRef.current?.value) {
          alert('Please enter a response');
          return;
        }

        await postStoryEntry(
          context.token!,
          context.player!.uuid,
          entryRef.current.value
        );
        setState(null);
        updateCategory('');
        entryRef.current.value = '';
      } catch (err: unknown) {
        alertError('An error has occurred', err);
      }
    };

    return (
      <form
        className="w-100"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
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
              onClick={(e) => {
                e.preventDefault();
                nextSuggestion();
              }}
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
            <Link
              to={`/story/${state!.game!.uuid}`}
              className="col btn btn-outline-success"
            >
              See all
            </Link>
            <ShareButton
              className="btn col-2"
              path={`/story/${state!.game!.uuid}`}
              title={'Games: ' + StoryVariant.title}
              text="Read my hilarious story!"
            />
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
