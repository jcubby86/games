import { clsx } from 'clsx';
import { Col, Container, Row } from 'react-bootstrap';

import Glitch from '../components/Glitch';
import Icon from '../components/Icon';
import { LinkButton } from '../components/LinkButton';
import { useAppContext } from '../contexts/AppContext';

const Home = () => {
  const { context } = useAppContext();

  return (
    <>
      <Container fluid>
        <Row>
          <Col xs={12}>
            <Glitch text="Games" className="my-3" />
          </Col>
          {context.game && (
            <LinkButton
              to={context.game.type.toLowerCase()}
              size="lg"
              variant="success"
              className="d-flex flex-column fw-bold px-5 col-12"
            >
              <Icon icon="joystick"></Icon>
              Return to Game
            </LinkButton>
          )}
          <LinkButton
            to="/join"
            size="lg"
            variant={context.game ? 'outline-success' : 'success'}
            className={clsx(
              'd-flex flex-column fw-bold col',
              context.game && 'bg-success-subtle'
            )}
          >
            <Icon icon="person-fill-up"></Icon>
            Join Game
          </LinkButton>
          <LinkButton
            to="/create"
            size="lg"
            variant={context.game ? 'outline-success' : 'success'}
            className={clsx(
              'd-flex flex-column fw-bold col',
              context.game && 'bg-success-subtle'
            )}
          >
            <Icon icon="person-fill-add"></Icon>
            Create Game
          </LinkButton>
        </Row>
      </Container>
    </>
  );
};

export default Home;
