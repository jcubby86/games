import { useAppContext } from '../contexts/AppContext';
import { useSocket } from '../contexts/SocketContext';
import { PlayerDto, PokeMessageData } from '../utils/types';

interface PlayerListProps {
  players?: PlayerDto[];
  filter?: (player: PlayerDto) => boolean;
}

const PlayerList = ({ players, filter }: PlayerListProps): JSX.Element => {
  const { context } = useAppContext();
  const socket = useSocket();

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
