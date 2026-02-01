import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAppContext } from '../contexts/AppContext';
import { alertError, logError } from '../utils/errorHandler';
import { gameVariants } from '../utils/gameVariants';
import generateNickname from '../utils/nicknameGeneration';
import { PlayerDto } from '../utils/types';
import { eqIgnoreCase as eq } from '../utils/utils';

type JoinState =
  | { validity: 'valid'; gameUuid: string; gameType: string }
  | { validity: 'unknown' | 'invalid' };

const Join = (): JSX.Element => {
  const { context, dispatchContext } = useAppContext();
  const [code, setCode] = useState(context.game?.code ?? '');
  const [state, setState] = useState<JoinState>({ validity: 'unknown' });
  const nicknameRef = useRef<HTMLInputElement>(null);
  const suggestionRef = useRef(generateNickname());
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      if (state.validity !== 'valid') {
        return;
      }

      const response = await axios.post(
        `/api/games/${state.gameUuid}/players`,
        {
          nickname: nicknameRef.current?.value || suggestionRef.current
        }
      );
      const player: PlayerDto = response.data;

      dispatchContext({
        type: 'save',
        state: {
          player: {
            uuid: player.uuid,
            nickname: player.nickname
          },
          game: {
            uuid: player.game!.uuid,
            code: player.game!.code,
            type: player.game!.type
          },
          token: response.headers['x-auth-token']
        }
      });

      navigate('/' + player.game!.type);
    } catch (err: unknown) {
      alertError('Error joining game', err);
    }
  };

  useEffect(() => {
    setCode((c) => context.game?.code ?? c);
  }, [context.game?.code]);

  useEffect(() => {
    const controller = new AbortController();
    async function checkGameType(code: string) {
      try {
        if (code.length === 4) {
          const result = await axios.get(`/api/games?code=${code}`, {
            signal: controller.signal
          });
          setState({
            gameType: result.data.type,
            gameUuid: result.data.uuid,
            validity: 'valid'
          });
        } else {
          setState({ validity: 'unknown' });
        }
      } catch (err: unknown) {
        logError(err);
        setState({ validity: 'invalid' });
      }
    }

    checkGameType(code);
    return () => controller.abort();
  }, [code]);

  return (
    <div>
      <form className="row gap-3" onSubmit={submit}>
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
            placeholder={suggestionRef.current}
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
            state.validity === 'valid' && context.game?.code === code
              ? 'Return to Game'
              : 'Join Game'
          }
        />
        {state.validity === 'valid' && (
          <div className="text-muted">
            {gameVariants.find((v) => eq(v.type, state.gameType))?.title}
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
