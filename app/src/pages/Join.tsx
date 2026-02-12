import { useMutation, useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
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
import { GameDto } from '../utils/types';

const Join = () => {
  const { context, dispatchContext } = useAppContext();
  const [code, setCode] = useState<string>(context.game?.code || '');
  const [prevContextCode, setPrevContextCode] = useState(context.game?.code);
  const nicknameInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Sync code state with context changes during render
  if (context.game?.code !== prevContextCode) {
    setCode(context.game?.code || '');
    setPrevContextCode(context.game?.code);
  }

  const gameQuery = useQuery({
    queryKey: ['games', { code }],
    queryFn: async () => {
      const res = await getGameByCode(code);
      return res.data;
    },
    enabled: code.length === 4,
    retry: false,
    staleTime: 300000 // 5 minutes
  });

  const leaveGameMutation = useMutation({
    mutationFn: () => deletePlayer(context.token!, context.player!.uuid),
    onSuccess: () => dispatchContext({ type: 'clear' }),
    onError: (err: unknown) => logError('Error leaving game', err)
  });

  const updatePlayerMutation = useMutation({
    mutationFn: (nickname: string) =>
      patchPlayer(context.token!, context.player!.uuid, nickname),
    onSuccess: (playerResponse) =>
      dispatchContext({
        type: 'save',
        game: playerResponse.data.game!,
        player: playerResponse.data,
        token: playerResponse.headers['x-auth-token'] as string
      }),
    onError: (err: unknown) => {
      alertError('Error updating nickname', err);
    }
  });

  const createPlayerMutation = useMutation({
    mutationFn: ({ game, nickname }: { game: GameDto; nickname: string }) =>
      postPlayer(game.uuid, nickname),
    onSuccess: (playerResponse) =>
      dispatchContext({
        type: 'save',
        player: playerResponse.data,
        game: playerResponse.data.game!,
        token: playerResponse.headers['x-auth-token'] as string
      }),
    onError: (err: unknown) => {
      alertError('Error joining game', err);
    }
  });

  const leavePreviousGame = async () => {
    if (!context.player || !context.token) {
      return;
    }
    await leaveGameMutation.mutateAsync();
  };

  const submit = async () => {
    if (!formEnabled) {
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
      await updatePlayerMutation.mutateAsync(nickname);
    } else {
      await leavePreviousGame();
      await createPlayerMutation.mutateAsync({
        game: gameQuery.data,
        nickname
      });
    }

    nicknameInputRef.current?.classList.remove('is-invalid');
    void navigate('/' + gameQuery.data.type.toLowerCase());
  };

  const formEnabled =
    gameQuery.isSuccess &&
    !updatePlayerMutation.isPending &&
    !createPlayerMutation.isPending;

  return (
    <div>
      <form
        className="row gap-2"
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
            value={code}
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
          disabled={!formEnabled}
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
