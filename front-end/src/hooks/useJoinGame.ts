import axios from 'axios';

import { useAppContext } from '../contexts/AppContext';
import { PlayerDto } from '../utils/types';

const useJoinGame = () => {
  const { dispatchContext } = useAppContext();

  return async (nickname: string, gameUuid: string) => {
    const response = await axios.post(`/api/games/${gameUuid}/players`, {
      nickname
    });
    const player: PlayerDto = response.data;

    dispatchContext({
      type: 'save',
      state: {
        playerUuid: player.uuid,
        nickname: player.nickname,
        gameUuid: player.game?.uuid,
        gameCode: player.game?.code,
        gameType: player.game?.type,
        token: response.headers.authorization
      }
    });

    return response.data;
  };
};

export default useJoinGame;
