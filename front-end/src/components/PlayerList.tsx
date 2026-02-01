import { useEffect } from 'react';

import { useAppContext } from '../contexts/AppContext';
import { useGameEvents } from '../hooks/useGameEvents';
import { PlayerDto } from '../utils/types';

interface PlayerListProps {
  players?: PlayerDto[];
  filter?: (player: PlayerDto) => boolean;
}

const PlayerList = ({ players, filter }: PlayerListProps): JSX.Element => {
  const { event, socket, isConnected } = useGameEvents();
  const { context } = useAppContext();

  useEffect(() => {
    if (event?.type === 'poke') {
      alert(
        `You have been poked by ${event.data.nickname || event.data.from}!`
      );
    }
  }, [event]);

  function handleClick(e: React.MouseEvent, p: PlayerDto) {
    e.stopPropagation();
    if (isConnected && p.uuid && p.uuid !== context.playerUuid) {
      socket.emit('poke', {
        to: p.uuid,
        from: context.playerUuid,
        nickname: context.nickname
      });
    }
  }

  if (!players || players.length === 0) {
    return <></>;
  }

  return (
    <ul className="list-group mt-3">
      {players.filter(filter ?? (() => true)).map((p: PlayerDto) => (
        <li
          key={p.uuid}
          className="list-group-item text-break"
          onClick={(e) => handleClick(e, p)}
        >
          {p.nickname}
        </li>
      ))}
    </ul>
  );
};

export default PlayerList;
