import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAppContext } from '../contexts/AppContext';
import { deletePlayer, postGame, postPlayer } from '../utils/apiClient';
import { nicknameMaxLength } from '../utils/constants';
import { alertError, logError } from '../utils/errorHandler';
import { gameVariants } from '../utils/gameVariants';
import generateNickname from '../utils/nicknameGeneration';

const Create = () => {
  const { context, dispatchContext } = useAppContext();
  const [gameType, setGameType] = useState('');
  const nicknameRef = useRef<HTMLInputElement>(null);
  const [suggestion] = useState(generateNickname());
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
      const nickname = nicknameRef.current?.value || suggestion;

      const gameResponse = await postGame(gameType.toUpperCase());

      await leavePreviousGame();

      const playerResponse = await postPlayer(gameResponse.data.uuid, nickname);

      dispatchContext({
        type: 'save',
        game: gameResponse.data,
        player: playerResponse.data,
        token: playerResponse.headers['x-auth-token'] as string
      });

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
            placeholder={suggestion}
            maxLength={nicknameMaxLength}
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
                className={`btn btn-outline-primary opacity-75 ${gameType === variant.type ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setGameType(variant.type);
                }}
                key={variant.type}
                aria-pressed={gameType === variant.type}
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
