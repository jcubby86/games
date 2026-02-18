import { Col, Container, FloatingLabel, Form, Row } from 'react-bootstrap';

import Glitch from './Glitch';
import { showModal } from './ModalPortal';
import PlayerList from './PlayerList';
import ShareButton from './ShareButton';
import { SpinnerButton } from './SpinnerButton';
import { useAppContext } from '../contexts/AppContext';
import { useUpdateGameMutation } from '../hooks/useUpdateGameMutation';
import { PLAY } from '../utils/constants';
import { PlayerDto } from '../utils/types';

interface StartGameProps {
  title: string;
  players: PlayerDto[] | undefined;
}

const StartGame = ({ title, players }: StartGameProps) => {
  const { context } = useAppContext();

  const updateGameMutation = useUpdateGameMutation();

  const startGame = () => {
    if (!context.token || !context.game || updateGameMutation.isPending) {
      return;
    }
    showModal({
      title: 'Start Game',
      body: 'Are you sure you want to start the game? Make sure all players have joined and are ready.',
      onConfirm: () => updateGameMutation.mutateAsync({ phase: PLAY }),
      confirmVariant: 'success'
    });
  };

  const isHost = context.player?.roles?.includes('host') ?? false;

  return (
    <Container fluid>
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          startGame();
        }}
      >
        <Row>
          <Col>
            <Glitch size="sm" text={title} className="my-3" />
          </Col>
        </Row>
        <Row>
          <Col>
            <FloatingLabel label="Game Code" controlId="gameCode">
              <Form.Control
                type="text"
                value={context.game?.code.toLowerCase()}
                readOnly
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.select();
                }}
                placeholder="Game Code"
              />
            </FloatingLabel>
          </Col>
          <Col>
            <FloatingLabel label="Player Count" controlId="playerCount">
              <Form.Control
                type="text"
                value={String(players?.length ?? 0)}
                readOnly
                placeholder="Player Count"
                className="no-select"
              />
            </FloatingLabel>
          </Col>
        </Row>
        {isHost && (
          <Row>
            <SpinnerButton
              variant="success"
              className="col"
              loading={updateGameMutation.isPending}
              type="submit"
            >
              Start Game
            </SpinnerButton>
            <ShareButton
              className="col"
              path={`/join?code=${context.game?.code.toLowerCase()}`}
              title="Join my game!"
            />
          </Row>
        )}
        <hr />
        <Row>
          <Col>
            <PlayerList players={players} />
          </Col>
        </Row>
      </Form>
    </Container>
  );
};

export default StartGame;
