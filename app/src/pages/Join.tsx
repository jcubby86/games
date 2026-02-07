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
import generateNickname from '../utils/nicknameGeneration';

const Join = () => {
  const { context, dispatchContext } = useAppContext();
  const [code, setCode] = useState<string>(context.game?.code || '');
  const nicknameRef = useRef<HTMLInputElement>(null);
  const [suggestion] = useState(generateNickname());
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
      const nickname = nicknameRef.current?.value || suggestion;

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
        <div className="col p-0">
          <label htmlFor="codeInput" className="form-label">
            Code:
          </label>
          <input
            id="codeInput"
            className="form-control"
            type="search"
            autoComplete="off"
            spellCheck="false"
            autoCorrect="off"
            placeholder="abxy"
            maxLength={gameCodeLength}
            value={code}
            onChange={(e) => {
              e.preventDefault();
              setCode(e.target.value.toUpperCase());
            }}
          />
        </div>

        <div className="col p-0">
          <label htmlFor="nicknameInput" className="form-label">
            Nickname:
          </label>
          <input
            id="nicknameInput"
            className="form-control"
            type="search"
            autoComplete="off"
            spellCheck="false"
            autoCorrect="off"
            placeholder={suggestion}
            maxLength={nicknameMaxLength}
            defaultValue={context.player?.nickname}
            ref={nicknameRef}
          />
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
          <div className="text-muted">
            {
              gameVariants.find(
                (v) => v.type === gameQuery.data.type.toLowerCase()
              )?.title
            }
          </div>
        )}
        {gameQuery.isError && <div className="text-danger">Game not found</div>}
      </form>
    </div>
  );
};

export default Join;
