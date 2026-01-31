import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { Tooltip } from 'react-tooltip';

import Icon from '../components/Icon';
import List from '../components/List';
import StartGame from '../components/StartGame';
import { useAppContext } from '../contexts/AppContext';
import { JOIN, PLAY, READ, WAIT } from '../utils/constants';
import { alertError, logError } from '../utils/errorHandler';
import { StoryVariant } from '../utils/gameVariants';
import { PlayerDto } from '../utils/types';

const Story = (): JSX.Element => {
  const { context } = useAppContext();
  const [state, setState] = useState<PlayerDto | null>(null);
  const entryRef = useRef<HTMLTextAreaElement>(null);

  const pollStatus = async (controller?: AbortController) => {
    try {
      const response = await axios.get('/api/players/' + context.playerUuid, {
        signal: controller?.signal,
        headers: { Authorization: context.token }
      });
      setState({ ...response.data });
    } catch (err: unknown) {
      logError(err);
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    if (!state?.game?.phase) pollStatus(controller);
    const timer = setInterval(() => {
      if (
        state?.game?.phase === JOIN ||
        state?.game?.phase === WAIT ||
        (state?.game?.phase === PLAY && !state?.canPlayerSubmit)
      )
        pollStatus(controller);
    }, 3000);

    return () => {
      controller.abort();
      clearInterval(timer);
    };
  });

  const Play = (): JSX.Element => {
    const submit = async (e: React.FormEvent) => {
      try {
        e.preventDefault();
        if (!entryRef.current?.value) {
          alert('Please enter a response');
          return;
        }

        await axios.post(
          `/api/players/${context.playerUuid}/story-entries`,
          {
            value: entryRef.current.value
          },
          {
            headers: { Authorization: context.token }
          }
        );
        setState(null);
        entryRef.current.value = '';
      } catch (err: unknown) {
        alertError('An error has occurred', err);
      }
    };

    const resetPlaceholder = async (e: React.MouseEvent) => {
      e.preventDefault();
      pollStatus();
    };

    return (
      <form className="w-100" onSubmit={submit}>
        <h3 className="text-center w-100">{state?.entry?.hints?.prompt}</h3>
        <p className="form-label">
          {state?.entry?.hints?.filler} {state?.entry?.hints?.prefix}
        </p>
        <textarea
          placeholder=""
          ref={entryRef}
          className="form-control"
          rows={3}
        />
        <p className="form-label">{state?.entry?.hints?.suffix}</p>
        <div className="container-fluid mt-4">
          <div className="row gap-4">
            <input
              type="submit"
              value="Send"
              className="btn btn-success col-9"
            />
            <button
              className="btn btn-outline-secondary col"
              onClick={resetPlaceholder}
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
      </div>
    );
  };

  const Wait = (): JSX.Element => {
    return (
      <div className="w-100">
        <h3 className="text-center w-100">Waiting for other players...</h3>
        {state?.game?.phase === WAIT && (
          <List items={state.game.players?.map((p) => p.nickname ?? '')} />
        )}
      </div>
    );
  };

  if (state?.game?.phase === JOIN) {
    return (
      <StartGame
        players={state.game.players?.map((p) => p.nickname ?? '')}
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
