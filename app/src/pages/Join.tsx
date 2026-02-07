import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAppContext } from '../contexts/AppContext';
import {
  deletePlayer,
  getGameByCode,
  patchPlayer,
  postPlayer
} from '../utils/apiClient';
import { alertError, logError } from '../utils/errorHandler';
import { gameVariants } from '../utils/gameVariants';
import generateNickname from '../utils/nicknameGeneration';
import { GameDto } from '../utils/types';
import { eqIgnoreCase as eq } from '../utils/utils';

type JoinState =
  | { validity: 'valid'; game: GameDto }
  | { validity: 'unknown' | 'invalid' };

const Join = () => {
  const { context, dispatchContext } = useAppContext();
  const [code, setCode] = useState<string>(context.game?.code || '');
  const [state, setState] = useState<JoinState>({
    validity: 'unknown'
  });
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
      if (state.validity !== 'valid') {
        return;
      }
      const nickname = nicknameRef.current?.value || suggestion;

      if (
        state.game.uuid === context.game?.uuid &&
        nickname === context.player?.nickname
      ) {
        // noop
      } else if (
        state.game.uuid === context.game?.uuid &&
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
          game: state.game,
          player: playerResponse.data,
          token: playerResponse.headers['x-auth-token'] as string
        });
      } else {
        await leavePreviousGame();
        const playerResponse = await postPlayer(state.game.uuid, nickname);
        dispatchContext({
          type: 'save',
          game: state.game,
          player: playerResponse.data,
          token: playerResponse.headers['x-auth-token'] as string
        });
      }
      navigate('/' + state.game.type.toLowerCase());
    } catch (err: unknown) {
      alertError('Error joining game', err);
    }
  };

  const checkGameType = useCallback(async (code: string) => {
    try {
      if (code.length !== 4) {
        setState({ validity: 'unknown' });
        return;
      }
      const gameResponse = await getGameByCode(code);
      setState({
        validity: 'valid',
        game: gameResponse.data
      });
      return;
    } catch (err: unknown) {
      logError('Error checking game type', err);
    }
    setState({ validity: 'invalid' });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCode((c) => context.game?.code ?? c);
  }, [context]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void checkGameType(code);
  }, [code, checkGameType]);

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
            maxLength={4}
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
            maxLength={30}
            defaultValue={context.player?.nickname}
            ref={nicknameRef}
          />
        </div>

        <input
          disabled={state.validity !== 'valid'}
          type="submit"
          className="form-control btn btn-success col-12 mt-3"
          value={
            state.validity === 'valid' && context.game?.code === state.game.code
              ? 'Return to Game'
              : 'Join Game'
          }
        />
        {state.validity === 'valid' && (
          <div className="text-muted">
            {gameVariants.find((v) => eq(v.type, state.game.type))?.title}
          </div>
        )}
        {state.validity === 'invalid' && (
          <div className="text-danger">Game not found</div>
        )}
      </form>
    </div>
  );
};

export default Join;
