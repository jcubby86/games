import { useCallback, useEffect, useRef, useState } from 'react';

import Icon from '../components/Icon';
import List from '../components/List';
import PlayerList from '../components/PlayerList';
import RecreateButton from '../components/RecreateButton';
import StartGame from '../components/StartGame';
import { showToast } from '../components/ToastPortal';
import { useAppContext } from '../contexts/AppContext';
import { useSocketContext } from '../contexts/SocketContext';
import { useSuggestions } from '../hooks/useSuggestions';
import { getPlayer, patchGame, postNameEntry } from '../utils/apiClient';
import { END, JOIN, PLAY, READ } from '../utils/constants';
import { alertError, logError } from '../utils/errorHandler';
import { NameVariant } from '../utils/gameVariants';
import { PlayerDto } from '../utils/types';

const Names = (): JSX.Element => {
  const { suggestion, updateCategory, nextSuggestion } = useSuggestions(
    'MALE_NAME,FEMALE_NAME',
    10
  );

  const { context } = useAppContext();
  const socket = useSocketContext();
  const [state, setState] = useState<PlayerDto | null>(null);
  const [confirm, setConfirm] = useState(false);
  const entryRef = useRef<HTMLInputElement>(null);

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
      updateCategory('MALE_NAME,FEMALE_NAME');
    } catch (err: unknown) {
      logError('Error fetching player', err);
    }
  }, [context, updateCategory]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async function gameUpdated(_event: unknown) {
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
        title={NameVariant.title}
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

        await postNameEntry(
          context.token!,
          context.player!.uuid,
          entryRef.current!.value || suggestion
        );
        entryRef.current!.value = '';
        updateCategory('');
        setConfirm(false);
        refreshData();
      } catch (err: unknown) {
        alertError('Error saving entry', err);
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
        <h3 className="text-center w-100">Enter a name:</h3>
        <input
          type="search"
          placeholder={suggestion}
          ref={entryRef}
          className="form-control"
          autoComplete="off"
          spellCheck="false"
          autoCorrect="off"
          onChange={(e) => {
            e.preventDefault();
            if (confirm) setConfirm(false);
          }}
        />
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
    const endGame = async () => {
      try {
        await patchGame(context.token!, context.game!.uuid, END);
        setState(null);
      } catch (err: unknown) {
        alertError('Error updating game', err);
      }
    };

    const HideNamesButton = (): JSX.Element => {
      if (context.player?.roles?.includes('host')) {
        return (
          <button
            className={'btn btn-danger mt-4'}
            onClick={(e) => {
              e.preventDefault();
              endGame();
            }}
          >
            Hide Names
          </button>
        );
      } else {
        return <></>;
      }
    };

    const sortedEntries = [...state!.entries!].sort((a, b) => {
      return b.order! - a.order!;
    });

    return (
      <div className="w-100 d-flex flex-column">
        <div className="w-100">
          <h3 className="text-center w-100">Names:</h3>
          <List items={sortedEntries.map((e) => e.name ?? '')} />
        </div>
        <HideNamesButton />
      </div>
    );
  } else if (state?.game?.phase === END) {
    return (
      <div className="w-100">
        <h3 className="w-100 text-center pb-3">Enjoy the game!</h3>
        <div className="d-flex justify-content-center">
          <RecreateButton className="btn btn-success" />
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

export default Names;
