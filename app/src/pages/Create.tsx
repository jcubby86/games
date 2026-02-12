import { useMutation } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAppContext } from '../contexts/AppContext';
import { deletePlayer, postGame, postPlayer } from '../utils/apiClient';
import { nicknameMaxLength } from '../utils/constants';
import { alertError, logError } from '../utils/errorHandler';
import { gameVariants } from '../utils/gameVariants';
import { GameDto } from '../utils/types';

const Create = () => {
  const { context, dispatchContext } = useAppContext();
  const [gameType, setGameType] = useState('');
  const nicknameInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const leaveGameMutation = useMutation({
    mutationFn: () => deletePlayer(context.token!, context.player!.uuid),
    onSuccess: () => dispatchContext({ type: 'clear' }),
    onError: (err: unknown) => logError('Error leaving game', err)
  });

  const leavePreviousGame = async () => {
    if (!context.player || !context.token) {
      return;
    }
    await leaveGameMutation.mutateAsync();
  };

  const createGameMutation = useMutation({
    mutationFn: async (gameType: string) => postGame(gameType.toUpperCase()),
    onError: (err: unknown) => alertError('Unable to create game', err)
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
    onError: (err: unknown) => alertError('Unable to create player', err)
  });

  const submit = async () => {
    if (!formEnabled) {
      return;
    }
    if (!gameVariants.map((t) => t.type).includes(gameType)) {
      alertError('Please select a game type', {});
      return;
    }
    if (!nicknameInputRef.current?.value) {
      alertError('Please enter a nickname', {});
      nicknameInputRef.current?.focus();
      nicknameInputRef.current?.classList.add('is-invalid');
      return;
    }

    const nickname = nicknameInputRef.current.value;

    const gameResponse = await createGameMutation.mutateAsync(gameType);

    await leavePreviousGame();

    await createPlayerMutation.mutateAsync({
      game: gameResponse.data,
      nickname
    });

    nicknameInputRef.current?.classList.remove('is-invalid');
    void navigate('/' + gameType);
  };

  const formEnabled =
    gameType !== '' &&
    !createGameMutation.isPending &&
    !createPlayerMutation.isPending;

  return (
    <div className="w-100">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="form-floating mb-3">
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
        <ul className="list-group my-4">
          {gameVariants.map((variant) => {
            return (
              <li
                className="list-group-item"
                key={variant.type}
                aria-pressed={gameType === variant.type}
              >
                <input
                  className="form-check-input me-2"
                  type="radio"
                  name="listGroupRadio"
                  value={variant.type}
                  id={`radio-${variant.type}`}
                  checked={gameType === variant.type}
                  onChange={(e) => {
                    setGameType(e.target.value);
                  }}
                />
                <label
                  className="form-check-label stretched-link"
                  htmlFor={`radio-${variant.type}`}
                >
                  {variant.title}
                </label>
              </li>
            );
          })}
        </ul>
        <input
          type="submit"
          value="Create Game"
          className="form-control btn btn-success"
          disabled={!formEnabled}
        />
      </form>
      {gameType && (
        <p className="p-3 text-wrap">
          {gameVariants.find((v) => v.type === gameType)?.description}
        </p>
      )}
    </div>
  );
};

export default Create;
