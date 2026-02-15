import { useMutation } from '@tanstack/react-query';
import { useRef } from 'react';
import { Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { showModal } from '../components/ModalPortal';
import PlayerList from '../components/PlayerList';
import RecreateButton from '../components/RecreateButton';
import ShareButton from '../components/ShareButton';
import { SpinnerButton } from '../components/SpinnerButton';
import StartGame from '../components/StartGame';
import { useAppContext } from '../contexts/AppContext';
import { usePlayerQuery } from '../hooks/usePlayerQuery';
import { useSuggestions } from '../hooks/useSuggestions';
import { postStoryEntry } from '../utils/apiClient';
import { JOIN, PLAY, READ, storyEntryMaxLength } from '../utils/constants';
import { alertError } from '../utils/errorHandler';
import { StoryVariant } from '../utils/gameVariants';

const categories = [
  'MALE_NAME',
  'FEMALE_NAME',
  'STATEMENT',
  'PRESENT_ACTION',
  'PAST_ACTION'
];

const Story = () => {
  const { suggestion, updateCategory, nextSuggestion } = useSuggestions({
    initialCategory: categories[0],
    quantity: 5,
    prefetchCategories: categories
  });

  const { context } = useAppContext();
  const entryRef = useRef<HTMLTextAreaElement>(null);

  const { playerQuery, setPlayerSubmitted } = usePlayerQuery();

  const postStoryMutation = useMutation({
    mutationFn: async ({ value }: { value: string }) => {
      const response = await postStoryEntry(
        context.token!,
        context.player!.uuid,
        value
      );
      return response.data;
    },
    onSuccess: (data) => {
      entryRef.current!.value = '';
      updateCategory(data.hint?.category);
      setPlayerSubmitted();
    },
    onError: (err: unknown) => alertError('Error saving entry', err)
  });

  const player = playerQuery.data;
  const game = player?.game;

  if (game?.phase === JOIN) {
    return <StartGame title={StoryVariant.title} players={game.players} />;
  } else if (game?.phase === PLAY && player?.canSubmit) {
    const submitEntry = () => {
      if (postStoryMutation.isPending) {
        return;
      }
      if (!entryRef.current?.value) {
        showModal({
          title: 'Use Placeholder',
          body: `You haven't entered anything. Do you want to use the placeholder "${suggestion}"?`,
          onConfirm: () =>
            postStoryMutation.mutateAsync({
              value: suggestion
            }),
          confirmVariant: 'warning'
        });
        return;
      }

      postStoryMutation.mutate({
        value: entryRef.current.value
      });
    };

    return (
      <form
        className="w-100"
        onSubmit={(e) => {
          e.preventDefault();
          submitEntry();
        }}
      >
        <h4 className="text-center w-100">{player.entry?.hint?.prompt}</h4>
        <textarea
          placeholder={suggestion}
          ref={entryRef}
          className="form-control"
          style={{ minHeight: '100px' }}
          autoComplete="off"
          spellCheck="false"
          autoCorrect="off"
          maxLength={player.entry?.hint?.limit ?? storyEntryMaxLength}
        />
        <div className="container-fluid mt-4">
          <div className="row gap-2">
            <SpinnerButton
              variant="success"
              className="col-9"
              disabled={postStoryMutation.isPending}
              type="submit"
            >
              Submit
            </SpinnerButton>
            <Button
              variant="outline-secondary"
              className="col"
              onClick={(e) => {
                e.preventDefault();
                nextSuggestion();
              }}
              disabled={postStoryMutation.isPending}
            >
              <i className="bi bi-arrow-clockwise"></i>
            </Button>
          </div>
        </div>
      </form>
    );
  } else if (game?.phase === READ) {
    return (
      <div className="w-100">
        <p className="border rounded bg-white lh-lg fs-6 px-3 py-1 w-100 text-break">
          {player?.entry?.story}
        </p>
        <div className="container-fluid">
          <div className="row gap-2">
            <RecreateButton className="col" />
            <Link
              to={`/story/${game.uuid}`}
              className="col btn btn-outline-success bg-success-subtle"
            >
              See all
            </Link>
            <ShareButton
              className="btn col-2 btn-outline-secondary bg-secondary-subtle"
              path={`/story/${game.uuid}`}
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
        <h4 className="text-center w-100">Waiting for other players...</h4>
        <PlayerList players={game?.players?.filter((p) => p.canSubmit)} />
      </div>
    );
  }
};

export default Story;
