import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAppContext } from '../contexts/AppContext';
import {
  deletePlayer,
  getGameByCode,
  patchPlayer,
  postPlayer
} from '../utils/apiClient';
import { gameCodeLength, nicknameMaxLength } from '../utils/constants';
import { alertError, logError } from '../utils/errorHandler';
import { gameVariants } from '../utils/gameVariants';

const Join = () => {
  const { context, dispatchContext } = useAppContext();
  const [code, setCode] = useState<string>(context.game?.code || '');
  const nicknameInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const gameQuery = useQuery({
    queryKey: ['games', code],
    queryFn: async () => {
      const res = await getGameByCode(code);
      return res.data;
    },
    enabled: code.length === 4,
    retry: false,
    staleTime: 300000 // 5 minutes
  });

  const leavePreviousGame = async () => {
    if (!context.player || !context.token) {
      return;
    }
    try {
      await deletePlayer(context.token, context.player.uuid);
      dispatchContext({ type: 'clear' });
    } catch (err: unknown) {
      logError('Error leaving previous game', err);
    }
  };

  const submit = async () => {
    try {
      if (!gameQuery.isSuccess) {
        return;
      }
      if (!nicknameInputRef.current?.value) {
        alertError('Please enter a nickname', {});
        nicknameInputRef.current?.focus();
        nicknameInputRef.current?.classList.add('is-invalid');
        return;
      }
      const nickname = nicknameInputRef.current.value;

      if (
        gameQuery.data.uuid === context.game?.uuid &&
        nickname === context.player?.nickname
      ) {
        // noop
      } else if (
        gameQuery.data.uuid === context.game?.uuid &&
        context.player &&
        context.token
      ) {
        const playerResponse = await patchPlayer(
          context.token,
          context.player.uuid,
          nickname
        );
        dispatchContext({
          type: 'save',
          game: gameQuery.data,
          player: playerResponse.data,
          token: playerResponse.headers['x-auth-token'] as string
        });
      } else {
        await leavePreviousGame();
        const playerResponse = await postPlayer(gameQuery.data.uuid, nickname);
        dispatchContext({
          type: 'save',
          game: gameQuery.data,
          player: playerResponse.data,
          token: playerResponse.headers['x-auth-token'] as string
        });
      }

      nicknameInputRef.current?.classList.remove('is-invalid');
      void navigate('/' + gameQuery.data.type.toLowerCase());
    } catch (err: unknown) {
      alertError('Error joining game', err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCode((c) => context.game?.code ?? c);
  }, [context.game]);

  return (
    <div>
      <form
        className="row gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="form-floating col p-0">
          <input
            id="codeInput"
            className={`form-control ${gameQuery.isError ? 'is-invalid' : ''}`}
            type="search"
            autoComplete="off"
            spellCheck="false"
            autoCorrect="off"
            placeholder="Game Code (abxy)"
            maxLength={gameCodeLength}
            defaultValue={context.game?.code}
            onChange={(e) => {
              e.preventDefault();
              setCode(e.target.value.toUpperCase());
            }}
          />
          <label htmlFor="codeInput" className="form-label">
            Game Code
          </label>
        </div>

        <div className="form-floating col p-0">
          <input
            id="nicknameInput"
            className="form-control"
            type="search"
            autoComplete="off"
            spellCheck="false"
            autoCorrect="off"
            placeholder="Nickname"
            maxLength={nicknameMaxLength}
            defaultValue={context.player?.nickname}
            ref={nicknameInputRef}
          />
          <label htmlFor="nicknameInput" className="form-label">
            Nickname
          </label>
        </div>

        <input
          disabled={!gameQuery.isSuccess}
          type="submit"
          className="form-control btn btn-success col-12 mt-3"
          value={
            gameQuery.isSuccess && context.game?.code === gameQuery.data.code
              ? 'Return to Game'
              : 'Join Game'
          }
        />
        {gameQuery.isSuccess && (
          <div className="w-100 text-center text-muted">
            {
              gameVariants.find(
                (v) => v.type === gameQuery.data.type.toLowerCase()
              )?.title
            }
          </div>
        )}
        {gameQuery.isError && (
          <div className="w-100 text-center text-danger">Game not found</div>
        )}
      </form>
    </div>
  );
};

export default Join;
