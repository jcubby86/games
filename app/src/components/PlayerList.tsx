import { useEffect, useEffectEvent, useState } from 'react';

import { useAppContext } from '../contexts/AppContext';
import { useSocketContext } from '../contexts/SocketContext';
import { Message, PlayerDto, PokeMessageData } from '../utils/types';

interface PlayerListProps {
  players?: PlayerDto[];
}

const PlayerList = ({ players }: PlayerListProps) => {
  const { context } = useAppContext();
  const socket = useSocketContext();
  const [pokeCounts, setPokeCounts] = useState<{ [key: string]: number }>({});

  function setPokeCount(uuid: string, fun: (count: number) => number) {
    setPokeCounts((prev) => ({
      ...prev,
      [uuid]: fun(prev[uuid] ?? 0)
    }));
  }

  function sendPoke(p: PlayerDto) {
    if (p.uuid === context.player?.uuid) {
      return;
    }
    socket.emit('poke', {
      data: { to: p } satisfies PokeMessageData
    });

    setPokeCount(p.uuid, (count) => Math.max(count - 1, 0));
  }

  const receivePoke = useEffectEvent((message: Message<PokeMessageData>) => {
    const p = message.data.from;
    if (!p) {
      return;
    }

    setPokeCount(p.uuid, (count) => Math.min(count + 1, 99));
  });

  useEffect(() => {
    socket.on('poke', receivePoke);
    return () => {
      socket.off('poke', receivePoke);
    };
  }, [socket]);

  if (!players || players.length === 0) {
    return <></>;
  }

  return (
    <div>
      <div className="list-group mt-3">
        {players.map((p: PlayerDto) => {
          const isCurrentPlayer = p.uuid === context.player?.uuid;
          const pokeCount = pokeCounts[p.uuid] ?? 0;
          return (
            <button
              key={p.uuid}
              className={`list-group-item list-group-item-light list-group-item-action border d-flex justify-content-between align-items-center no-select ${isCurrentPlayer ? 'fw-bold' : ''}`}
              disabled={isCurrentPlayer}
              aria-disabled={isCurrentPlayer}
              onClick={(e) => {
                e.preventDefault();
                sendPoke(p);
              }}
            >
              {p.nickname} {isCurrentPlayer && '(You)'}
              {pokeCount > 0 && (
                <span className="badge bg-danger rounded-pill">
                  {pokeCount >= 99 ? '99+' : pokeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {players.length > 1 && (
        <p className="w-100 text-center mt-3 text-muted">
          Try poking other players by clicking their names!
        </p>
      )}
    </div>
  );
};

export default PlayerList;
