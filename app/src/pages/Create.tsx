import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAppContext } from '../contexts/AppContext';
import { deletePlayer, postGame, postPlayer } from '../utils/apiClient';
import { nicknameMaxLength } from '../utils/constants';
import { alertError, logError } from '../utils/errorHandler';
import { gameVariants } from '../utils/gameVariants';

const Create = () => {
  const { context, dispatchContext } = useAppContext();
  const [gameType, setGameType] = useState('');
  const nicknameInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

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

      const gameResponse = await postGame(gameType.toUpperCase());

      await leavePreviousGame();

      const playerResponse = await postPlayer(gameResponse.data.uuid, nickname);

      dispatchContext({
        type: 'save',
        game: gameResponse.data,
        player: playerResponse.data,
        token: playerResponse.headers['x-auth-token'] as string
      });

      nicknameInputRef.current?.classList.remove('is-invalid');
      void navigate('/' + gameType);
    } catch (err: unknown) {
      alertError('Unable to create game', err);
    }
  };

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
          disabled={!gameType}
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
