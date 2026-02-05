import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import Icon from '../components/Icon';
import PlayerList from '../components/PlayerList';
import RecreateButton from '../components/RecreateButton';
import ShareButton from '../components/ShareButton';
import StartGame from '../components/StartGame';
import { showToast } from '../components/ToastPortal';
import { useAppContext } from '../contexts/AppContext';
import { useSocketContext } from '../contexts/SocketContext';
import { useSuggestions } from '../hooks/useSuggestions';
import { getPlayer, postStoryEntry } from '../utils/apiClient';
import { JOIN, PLAY, READ } from '../utils/constants';
import { alertError, logError } from '../utils/errorHandler';
import { StoryVariant } from '../utils/gameVariants';
import { PlayerDto } from '../utils/types';

const Story = (): JSX.Element => {
  const { suggestion, updateCategory, nextSuggestion } =
    useSuggestions('MALE_NAME');

  const { context } = useAppContext();
  const socket = useSocketContext();
  const [state, setState] = useState<PlayerDto | null>(null);
  const [confirm, setConfirm] = useState(false);
  const entryRef = useRef<HTMLTextAreaElement>(null);

  const refreshData = useCallback(async () => {
    if (!context.player || !context.token) {
      return;
    }
    try {
      const playerResponse = await getPlayer(
        context.token,
        context.player.uuid
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function gameUpdated(_event: unknown) {
      refreshData();
    }

    socket.on('game.updated', gameUpdated);
    return () => {
      socket.off('game.updated', gameUpdated);
    };
  }, [socket, refreshData]);

  if (state?.game?.phase === JOIN) {
    return (
      <StartGame
        players={state.game.players}
        title={StoryVariant.title}
        callback={() => setState(null)}
      />
    );
  } else if (state?.game?.phase === PLAY && state?.canPlayerSubmit) {
    const submitEntry = async () => {
      try {
        if (!entryRef.current!.value && !confirm) {
          setConfirm(true);
          showToast({
            message: "Press 'Confirm' to use the suggested name.",
            type: 'warning'
          });
          return;
        }

        await postStoryEntry(
          context.token!,
          context.player!.uuid,
          entryRef.current!.value || suggestion
        );
        entryRef.current!.value = '';
        updateCategory('');
        setConfirm(false);
        refreshData();
      } catch (err: unknown) {
        alertError('An error has occurred', err);
        setConfirm(false);
      }
    };

    return (
      <form
        className="w-100"
        onSubmit={(e) => {
          e.preventDefault();
          submitEntry();
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
          autoComplete="off"
          spellCheck="false"
          autoCorrect="off"
          onChange={(e) => {
            e.preventDefault();
            if (confirm) setConfirm(false);
          }}
        />
        <p className="form-label">{state?.entry?.hint?.suffix}</p>
        <div className="container-fluid mt-4">
          <div className="row gap-4">
            <button
              className={`btn col-9 btn-${confirm ? 'warning' : 'success'}`}
            >
              {confirm ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm mx-1"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Confirm
                </>
              ) : (
                <>Submit</>
              )}
            </button>
            <button
              className="btn btn-outline-secondary col"
              onClick={(e) => {
                e.preventDefault();
                nextSuggestion();
                if (confirm) setConfirm(false);
              }}
            >
              <Icon icon="nf-fa-refresh" className="flex-grow-1" />
            </button>
          </div>
        </div>
      </form>
    );
  } else if (state?.game?.phase === READ) {
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
  } else {
    return (
      <div className="w-100">
        <h3 className="text-center w-100">Waiting for other players...</h3>
        <PlayerList
          players={state?.game?.players}
          filter={(p) => p.canPlayerSubmit ?? true}
        />
      </div>
    );
  }
};

export default Story;
