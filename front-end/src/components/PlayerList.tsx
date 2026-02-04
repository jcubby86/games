import { useEffect, useState } from 'react';

import { useAppContext } from '../contexts/AppContext';
import { useSocket } from '../contexts/SocketContext';
import { Message, PlayerDto, PokeMessageData } from '../utils/types';

interface PlayerListProps {
  players?: PlayerDto[];
  filter?: (player: PlayerDto) => boolean;
}

const PlayerList = ({ players, filter }: PlayerListProps): JSX.Element => {
  const { context } = useAppContext();
  const socket = useSocket();
  const [pokes, setPokes] = useState<PlayerDto[]>([]);

  useEffect(() => {
    function pokeReceived(message: Message<PokeMessageData>) {
      console.log('Poked by', message.data.from!.nickname);
    }

    socket.on('poke', pokeReceived);
    return () => {
      socket.off('poke', pokeReceived);
    };
  }, [socket]);

  function sendPoke(p: PlayerDto) {
    if (p.uuid !== context.player?.uuid) {
      socket.emit('poke', {
        data: { to: p } as PokeMessageData
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
            sendPoke(p);
          }}
        >
          {p.nickname}
        </li>
      ))}
    </ul>
  );
};

export default PlayerList;
