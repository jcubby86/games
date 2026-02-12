import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import PlayerList from '../components/PlayerList';
import RecreateButton from '../components/RecreateButton';
import ShareButton from '../components/ShareButton';
import StartGame from '../components/StartGame';
import { showToast } from '../components/ToastPortal';
import { useAppContext } from '../contexts/AppContext';
import { useSuggestions } from '../hooks/useSuggestions';
import { getPlayer, postStoryEntry } from '../utils/apiClient';
import { JOIN, PLAY, READ, storyEntryMaxLength } from '../utils/constants';
import { alertError } from '../utils/errorHandler';
import { StoryVariant } from '../utils/gameVariants';
import { PlayerDto } from '../utils/types';

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
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const entryRef = useRef<HTMLTextAreaElement>(null);

  const playerQuery = useQuery({
    queryKey: ['players', { uuid: context.player?.uuid }],
    queryFn: async () => {
      const playerResponse = await getPlayer(
        context.token!,
        context.player!.uuid
      );
      return playerResponse.data;
    },
    enabled: !!context.player?.uuid && !!context.token,
    staleTime: 120000 // 2 minutes
  });

  const postStoryMutation = useMutation({
    mutationFn: async (value: string) => {
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
      setConfirm(false);
      queryClient.setQueryData(
        ['players', { uuid: context.player?.uuid }],
        (oldData: PlayerDto) => {
          return {
            ...oldData,
            canPlayerSubmit: false
          };
        }
      );
    },
    onError: (err: unknown) => {
      setConfirm(false);
      alertError('Error saving entry', err);
    }
  });

  const player = playerQuery.data;
  const game = player?.game;

  if (game?.phase === JOIN) {
    return <StartGame title={StoryVariant.title} players={game.players} />;
  } else if (game?.phase === PLAY && player?.canPlayerSubmit) {
    const submitEntry = () => {
      if (postStoryMutation.isPending) {
        return;
      }
      if (!entryRef.current!.value && !confirm) {
        setConfirm(true);
        showToast({
          message: "Press 'Confirm' to use the suggested value.",
          type: 'warning'
        });
        return;
      }

      postStoryMutation.mutate(entryRef.current!.value || suggestion);
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
          onChange={(e) => {
            e.preventDefault();
            if (confirm) setConfirm(false);
          }}
        />
        <div className="container-fluid mt-4">
          <div className="row gap-2">
            <button
              className={`btn col-9 btn-${confirm ? 'warning' : 'success'}`}
              disabled={postStoryMutation.isPending}
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
    return (
      <div className="w-100">
        <p className="border rounded bg-white lh-lg fs-6 px-3 py-1 w-100 text-break">
          {player?.entry?.story}
        </p>
        <div className="container-fluid">
          <div className="row gap-2">
            <RecreateButton className="col btn btn-success" />
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
        <PlayerList
          players={game?.players}
          filter={(p) => p.canPlayerSubmit ?? true}
        />
      </div>
    );
  }
};

export default Story;
