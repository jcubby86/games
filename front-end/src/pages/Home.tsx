import { Link } from 'react-router-dom';

import Icon from '../components/Icon';
import { useAppContext } from '../contexts/AppContext';

const Home = (): JSX.Element => {
  const { context } = useAppContext();

  return (
    <>
      <div className="row justify-content-center gap-4 w-100 m-0">
        {context.gameUuid && (
          <Link
            role="button"
            to={context.gameType!}
            className="btn btn-lg btn-success d-flex flex-column fw-bold px-5 col-12"
          >
            <Icon icon="nf-mdi-account_convert" className="py-1" />
            Return to Game
          </Link>
        )}
        <Link
          role="button"
          to="/join"
          className={
            'btn btn-lg d-flex flex-column fw-bold col ' +
            (context.gameCode ? 'btn-outline-success' : 'btn-success')
          }
        >
          <Icon icon="nf-mdi-account_check" className="flex-grow-1" />
          Join a Game
        </Link>
        <Link
          role="button"
          to="/create"
          className={
            'btn btn-lg d-flex flex-column fw-bold col ' +
            (context.gameCode ? 'btn-outline-success' : 'btn-success')
          }
        >
          <Icon icon="nf-mdi-account_multiple_plus" className="flex-grow-1" />
          Create a Game
        </Link>
      </div>
    </>
  );
};

export default Home;
