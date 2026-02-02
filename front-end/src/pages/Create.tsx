import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAppContext } from '../contexts/AppContext';
import { useApiClient } from '../hooks/useApiClient';
import { alertError } from '../utils/errorHandler';
import { gameVariants } from '../utils/gameVariants';
import generateNickname from '../utils/nicknameGeneration';

const Create = (): JSX.Element => {
  const { context } = useAppContext();
  const { createGame, joinGame } = useApiClient();
  const [gameType, setGameType] = useState('');
  const nicknameRef = useRef<HTMLInputElement>(null);
  const suggestionRef = useRef(generateNickname());
  const navigate = useNavigate();

  const submit = async () => {
    try {
      if (!gameVariants.map((t) => t.type).includes(gameType)) {
        alert('Please select a game type');
        return;
      }
      const game = await createGame(gameType.toUpperCase());
      const player = await joinGame(
        game.uuid,
        nicknameRef.current?.value || suggestionRef.current
      );
      navigate('/' + player.game!.type.toLowerCase());
    } catch (err: unknown) {
      alertError(
        'Unable to create game. Please try again in a little bit.',
        err
      );
    }
  };

  const Description = (): JSX.Element => {
    if (gameType) {
      return (
        <p className="p-3 text-wrap">
          {gameVariants.find((v) => v.type === gameType)?.description}
        </p>
      );
    } else {
      return <></>;
    }
  };

  return (
    <div className="w-100">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="mb-3">
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
            placeholder={suggestionRef.current}
            maxLength={30}
            defaultValue={context.player?.nickname}
            ref={nicknameRef}
          />
        </div>
        <div
          className="btn-group-vertical d-block text-center m-4"
          role="group"
          aria-label="Game Type"
        >
          {gameVariants.map((variant) => {
            return (
              <button
                className={
                  'btn opacity-75 ' +
                  (gameType === variant.type
                    ? 'btn-primary'
                    : 'btn-outline-primary')
                }
                onClick={(e) => {
                  e.preventDefault();
                  setGameType(variant.type);
                }}
                key={variant.type}
              >
                {variant.title}
              </button>
            );
          })}
        </div>
        <input
          type="submit"
          value="Create Game"
          className="form-control btn btn-success"
        />
      </form>
      <Description />
    </div>
  );
};

export default Create;
