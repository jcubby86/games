import { useMutation } from '@tanstack/react-query';
import { useRef } from 'react';

import List from '../components/List';
import { showModal } from '../components/ModalPortal';
import PlayerList from '../components/PlayerList';
import RecreateButton from '../components/RecreateButton';
import StartGame from '../components/StartGame';
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
      setPlayerSubmitted();
    },
    onError: (err: unknown) => alertError('Error saving entry', err)
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
      if (!entryRef.current?.value) {
        showModal({
          title: 'Use Placeholder',
          body: `You haven't entered anything. Do you want to use the placeholder "${suggestion}"?`,
          onConfirm: () =>
            postNameMutation.mutateAsync({
              name: suggestion
            }),
          confirmVariant: 'warning'
        });
        return;
      }

      postNameMutation.mutate({ name: entryRef.current.value });
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
        />
        <div className="container-fluid mt-4">
          <div className="row gap-2">
            <button
              className="btn col-9 btn-success"
              disabled={postNameMutation.isPending}
            >
              Submit
            </button>
            <button
              className="btn btn-outline-secondary col"
              onClick={(e) => {
                e.preventDefault();
                nextSuggestion();
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
      showModal({
        title: 'Hide Names',
        body: 'Are you sure you want to hide the names? This will start the next phase of the game.',
        onConfirm: () => updateGameMutation.mutateAsync({ phase: END }),
        confirmVariant: 'danger'
      });
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
