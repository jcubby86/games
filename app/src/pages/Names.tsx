import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

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
import { alertError } from '../utils/errorHandler';
import { NameVariant } from '../utils/gameVariants';

const Names = () => {
  const { suggestion, nextSuggestion } = useSuggestions({
    initialCategory: 'MALE_NAME,FEMALE_NAME',
    quantity: 10
  });

  const { context } = useAppContext();
  const socket = useSocketContext();
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const entryRef = useRef<HTMLInputElement>(null);

  const playerQuery = useQuery({
    queryKey: ['player', context.player?.uuid],
    queryFn: async () => {
      const playerResponse = await getPlayer(
        context.token!,
        context.player!.uuid
      );
      return playerResponse.data;
    },
    enabled: !!context.player?.uuid && !!context.token
  });

  const postNameMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await postNameEntry(
        context.token!,
        context.player!.uuid,
        name
      );
      return response.data;
    },
    onSuccess: async () => {
      entryRef.current!.value = '';
      nextSuggestion();
      setConfirm(false);
      await queryClient.invalidateQueries({ queryKey: ['player'] });
    },
    onError: (err: unknown) => {
      setConfirm(false);
      alertError('Error saving entry', err);
    }
  });

  const updateGameMutation = useMutation({
    mutationFn: (phase: string) =>
      patchGame(context.token!, context.game!.uuid, phase),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['player'] }),
    onError: (err: unknown) => alertError('Error updating game', err)
  });

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function gameUpdated(_event: unknown) {
      void queryClient.invalidateQueries({ queryKey: ['player'] });
    }

    socket.on('game.updated', gameUpdated);
    return () => {
      socket.off('game.updated', gameUpdated);
    };
  }, [socket, queryClient]);

  const player = playerQuery.data;

  if (player?.game?.phase === JOIN) {
    return (
      <StartGame
        players={player.game.players}
        title={NameVariant.title}
        callback={() =>
          void queryClient.invalidateQueries({ queryKey: ['player'] })
        }
      />
    );
  } else if (player?.game?.phase === PLAY && player?.canPlayerSubmit) {
    const submitEntry = () => {
      if (!entryRef.current!.value && !confirm) {
        setConfirm(true);
        showToast({
          message: "Press 'Confirm' to use the suggested name.",
          type: 'warning'
        });
        return;
      }

      postNameMutation.mutate(entryRef.current!.value || suggestion);
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
              <i className="bi bi-arrow-clockwise"></i>
            </button>
          </div>
        </div>
      </form>
    );
  } else if (player?.game?.phase === READ) {
    const sortedEntries = [...player.entries!].sort((a, b) => {
      return b.order! - a.order!;
    });

    return (
      <div className="w-100 d-flex flex-column">
        <div className="w-100">
          <h3 className="text-center w-100">Names:</h3>
          <List items={sortedEntries.map((e) => e.name ?? '')} />
        </div>
        {player?.roles?.includes('host') && (
          <button
            className={'btn btn-danger mt-4'}
            onClick={(e) => {
              e.preventDefault();
              updateGameMutation.mutate(END);
            }}
          >
            Hide Names
          </button>
        )}
      </div>
    );
  } else if (player?.game?.phase === END) {
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
          players={player?.game?.players}
          filter={(p) => p.canPlayerSubmit ?? true}
        />
      </div>
    );
  }
};

export default Names;
