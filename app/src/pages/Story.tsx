import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

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
    quantity: 5
  });

  const { context } = useAppContext();
  const socket = useSocketContext();
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const entryRef = useRef<HTMLTextAreaElement>(null);

  const playerQuery = useQuery({
    queryKey: ['players', context.player?.uuid],
    queryFn: async () => {
      const playerResponse = await getPlayer(
        context.token!,
        context.player!.uuid
      );
      return playerResponse.data;
    },
    enabled: !!context.player?.uuid && !!context.token
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
    onSuccess: async (data) => {
      entryRef.current!.value = '';
      updateCategory(data.hint?.category);
      setConfirm(false);
      await queryClient.invalidateQueries({ queryKey: ['players'] });
    },
    onError: (err: unknown) => {
      setConfirm(false);
      alertError('Error saving entry', err);
    }
  });

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function gameUpdated(_event: unknown) {
      void queryClient.invalidateQueries({ queryKey: ['players'] });
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
        title={StoryVariant.title}
        callback={() =>
          void queryClient.invalidateQueries({ queryKey: ['players'] })
        }
      />
    );
  } else if (player?.game?.phase === PLAY && player?.canPlayerSubmit) {
    const submitEntry = () => {
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
        <h3 className="text-center w-100">{player?.entry?.hint?.prompt}</h3>
        <p className="form-label">
          {player?.entry?.hint?.filler} {player?.entry?.hint?.prefix}
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
        <p className="form-label">{player?.entry?.hint?.suffix}</p>
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
    return (
      <div className="w-100">
        <p className="lh-lg fs-5 px-2 w-100 text-break">
          {player?.entry?.story}
        </p>
        <div className="container-fluid">
          <div className="row gap-4">
            <RecreateButton className="col btn btn-success" />
            <Link
              to={`/story/${player.game.uuid}`}
              className="col btn btn-outline-success"
            >
              See all
            </Link>
            <ShareButton
              className="btn col-2"
              path={`/story/${player.game.uuid}`}
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
          players={player?.game?.players}
          filter={(p) => p.canPlayerSubmit ?? true}
        />
      </div>
    );
  }
};

export default Story;
