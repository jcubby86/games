import { useCallback, useEffect, useRef, useState } from 'react';
import Tooltip from 'react-bootstrap/esm/Tooltip';

import Icon from '../components/Icon';
import List from '../components/List';
import PlayerList from '../components/PlayerList';
import RecreateButton from '../components/RecreateButton';
import StartGame from '../components/StartGame';
import { useAppContext } from '../contexts/AppContext';
import { useSocket } from '../contexts/SocketContext';
import { useSuggestions } from '../hooks/useSuggestions';
import { getPlayer, patchGame, postNameEntry } from '../utils/apiClient';
import { END, JOIN, PLAY, READ } from '../utils/constants';
import { alertError, logError } from '../utils/errorHandler';
import { NameVariant } from '../utils/gameVariants';
import { PlayerDto } from '../utils/types';

const Names = (): JSX.Element => {
  const { context } = useAppContext();
  const socket = useSocket();
  const [state, setState] = useState<PlayerDto | null>(null);
  const entryRef = useRef<HTMLInputElement>(null);
  const { suggestion, nextSuggestion, updateCategory } = useSuggestions(
    'MALE_NAME,FEMALE_NAME',
    10
  );

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
    async function gameUpdated(event: unknown) {
      console.log('Game updated:', event);
      refreshData();
    }

    socket.on('game.updated', gameUpdated);
    return () => {
      socket.off('game.updated', gameUpdated);
    };
  }, [socket, refreshData]);

  const Play = (): JSX.Element => {
    const sendEntry = async () => {
      try {
        if (
          !entryRef.current!.value &&
          !window.confirm(
            "You haven't typed anything in! Do you want to use the placeholder text?"
          )
        ) {
          return;
        }
        await postNameEntry(
          context.token!,
          context.player!.uuid,
          entryRef.current!.value || suggestion
        );
        setState(null);
        updateCategory('');
        entryRef.current!.value = '';
      } catch (err: unknown) {
        alertError('Error saving entry', err);
      }
    };

    return (
      <form
        className="w-100"
        onSubmit={(e) => {
          e.preventDefault();
          sendEntry();
        }}
      >
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
