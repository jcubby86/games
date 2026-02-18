import { useEffect, useEffectEvent, useState } from 'react';
import { Badge, Container, ListGroup } from 'react-bootstrap';

import { useAppContext } from '../contexts/AppContext';
import { useSocketContext } from '../contexts/SocketContext';
import { Message, PlayerDto, PokeMessageData } from '../utils/types';

interface PlayerListProps {
  players?: PlayerDto[];
  className?: string;
}

const PlayerList = ({ players, className = '' }: PlayerListProps) => {
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
    <Container fluid className={className}>
      <ListGroup id="player-list">
        {players.map((p: PlayerDto) => {
          const isCurrentPlayer = p.uuid === context.player?.uuid;
          const pokeCount = pokeCounts[p.uuid] ?? 0;
          return (
            <ListGroup.Item
              action
              key={p.uuid}
              className="border d-flex justify-content-between align-items-center no-select"
              disabled={isCurrentPlayer}
              aria-disabled={isCurrentPlayer}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                sendPoke(p);
              }}
            >
              {p.nickname}
              {isCurrentPlayer && (
                <Badge bg="secondary" pill className="center-content">
                  You
                </Badge>
              )}
              {pokeCount > 0 && (
                <Badge bg="danger" pill className="center-content">
                  {pokeCount >= 99 ? '99+' : pokeCount}
                </Badge>
              )}
            </ListGroup.Item>
          );
        })}
      </ListGroup>
      {players.length > 1 && (
        <p className="text-center my-3 text-muted">
          Try poking other players by clicking their names!
        </p>
      )}
    </Container>
  );
};

export default PlayerList;
