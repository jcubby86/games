import { useEffect } from 'react';

import { useAppContext } from '../contexts/AppContext';
import { useSocket } from '../contexts/SocketProvider';
import { PlayerDto } from '../utils/types';

interface PlayerListProps {
  players?: PlayerDto[];
  filter?: (player: PlayerDto) => boolean;
}

const PlayerList = ({ players, filter }: PlayerListProps): JSX.Element => {
  const { context } = useAppContext();
  const socket = useSocket();

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function poked(event: any) {
      console.log('Poked by', event.nickname || event.from);
    }

    socket.on('poke', poked);
    return () => {
      socket.off('poke', poked);
    };
  }, [socket]);

  function poke(p: PlayerDto) {
    if (p.uuid !== context.player?.uuid) {
      socket.emit('poke', {
        to: p.uuid,
        from: context.player?.uuid,
        nickname: context.player?.nickname
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
          onClick={(e) => {
            e.preventDefault();
            poke(p);
          }}
        >
          {p.nickname}
        </li>
      ))}
    </ul>
  );
};

export default PlayerList;
