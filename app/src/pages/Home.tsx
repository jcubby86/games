import { Col, Container, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import Glitch from '../components/Glitch';
import { useAppContext } from '../contexts/AppContext';

const Home = () => {
  const { context } = useAppContext();

  return (
    <>
      <Container fluid className="m-0">
        <Row className="gap-2">
          <Col xs={12} className="p-0">
            <Glitch text="Games" />
          </Col>
          {context.game && (
            <Link
              role="button"
              to={context.game.type.toLowerCase()}
              className="btn btn-lg btn-success d-flex flex-column fw-bold px-5 col-12"
            >
              <i className="bi bi-joystick"></i>
              Return to Game
            </Link>
          )}
          <Link
            role="button"
            to="/join"
            className={
              'btn btn-lg d-flex flex-column fw-bold col ' +
              (context.game
                ? 'btn-outline-success bg-success-subtle'
                : 'btn-success')
            }
          >
            <i className="bi bi-person-fill-up"></i>
            Join Game
          </Link>
          <Link
            role="button"
            to="/create"
            className={
              'btn btn-lg d-flex flex-column fw-bold col ' +
              (context.game
                ? 'btn-outline-success bg-success-subtle'
                : 'btn-success')
            }
          >
            <i className="bi bi-person-fill-add"></i>
            Create Game
          </Link>
        </Row>
      </Container>
    </>
  );
};

export default Home;
