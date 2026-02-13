import { useMutation } from '@tanstack/react-query';
import { useRef, useState } from 'react';

import List from '../components/List';
import PlayerList from '../components/PlayerList';
import RecreateButton from '../components/RecreateButton';
import StartGame from '../components/StartGame';
import { showToast } from '../components/ToastPortal';
import { useAppContext } from '../contexts/AppContext';
import { usePlayerQuery } from '../hooks/usePlayerQuery';
import { useSuggestions } from '../hooks/useSuggestions';
import { useUpdateGameMutation } from '../hooks/useUpdateGameMutation';
import { postNameEntry } from '../utils/apiClient';
import { END, JOIN, nameEntryMaxLength, PLAY, READ } from '../utils/constants';
import { alertError } from '../utils/errorHandler';
import { NameVariant } from '../utils/gameVariants';

const Names = () => {
  const { suggestion, nextSuggestion } = useSuggestions({
    initialCategory: 'MALE_NAME,FEMALE_NAME',
    quantity: 10
  });

  const { context } = useAppContext();
  const [confirm, setConfirm] = useState(false);
  const entryRef = useRef<HTMLInputElement>(null);

  const { playerQuery, setPlayerSubmitted } = usePlayerQuery();

  const postNameMutation = useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      const response = await postNameEntry(
        context.token!,
        context.player!.uuid,
        name
      );
      return response.data;
    },
    onSuccess: () => {
      entryRef.current!.value = '';
      nextSuggestion();
      setConfirm(false);
      setPlayerSubmitted();
    },
    onError: (err: unknown) => {
      setConfirm(false);
      alertError('Error saving entry', err);
    }
  });

  const updateGameMutation = useUpdateGameMutation();

  const player = playerQuery.data;
  const game = player?.game;

  if (game?.phase === JOIN) {
    return <StartGame title={NameVariant.title} players={game.players} />;
  } else if (game?.phase === PLAY && player?.canSubmit) {
    const submitEntry = () => {
      if (postNameMutation.isPending) {
        return;
      }
      if (!entryRef.current!.value && !confirm) {
        setConfirm(true);
        showToast({
          message: 'Press "Confirm" to use the suggested name.',
          type: 'warning'
        });
        return;
      }

      postNameMutation.mutate({ name: entryRef.current!.value || suggestion });
    };

    return (
      <form
        className="w-100"
        onSubmit={(e) => {
          e.preventDefault();
          submitEntry();
        }}
      >
        <h4 className="text-center w-100">Enter a name:</h4>
        <input
          type="search"
          placeholder={suggestion}
          ref={entryRef}
          className="form-control"
          autoComplete="off"
          spellCheck="false"
          autoCorrect="off"
          maxLength={nameEntryMaxLength}
          onChange={(e) => {
            e.preventDefault();
            if (confirm) setConfirm(false);
          }}
        />
        <div className="container-fluid mt-4">
          <div className="row gap-2">
            <button
              className={`btn col-9 btn-${confirm ? 'warning' : 'success'}`}
              disabled={postNameMutation.isPending}
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
  } else if (game?.phase === READ) {
    const sortedEntries = [...player!.entries!].sort((a, b) => {
      return b.order! - a.order!;
    });

    const hideNames = () => {
      if (!confirm) {
        setConfirm(true);
        showToast({
          message: 'Press again to confirm hiding names.',
          type: 'danger'
        });
        return;
      }
      updateGameMutation.mutate({ phase: END });
      setConfirm(false);
    };

    return (
      <div className="w-100 d-flex flex-column">
        <div className="w-100">
          <h4 className="text-center w-100">Names:</h4>
          <List items={sortedEntries.map((e) => e.name ?? '')} />
        </div>
        {player?.roles?.includes('host') && (
          <button
            className={'btn btn-danger mt-4'}
            onClick={(e) => {
              e.preventDefault();
              hideNames();
            }}
            disabled={updateGameMutation.isPending}
          >
            Hide Names
            {confirm && (
              <span
                className="spinner-border spinner-border-sm mx-1"
                role="status"
                aria-hidden="true"
              ></span>
            )}
          </button>
        )}
      </div>
    );
  } else if (game?.phase === END) {
    return (
      <div className="w-100 d-flex flex-column">
        <h4 className="w-100 text-center pb-3">Enjoy the game!</h4>
        <RecreateButton className="btn btn-success" />
      </div>
    );
  } else {
    return (
      <div className="w-100">
        <h4 className="text-center w-100">Waiting for other players...</h4>
        <PlayerList players={game?.players?.filter((p) => p.canSubmit)} />
      </div>
    );
  }
};

export default Names;
