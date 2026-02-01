import axios from 'axios';
import { Link, Outlet, useNavigate } from 'react-router-dom';

import Icon from '../components/Icon';
import { useAppContext } from '../contexts/AppContext';
import { alertError } from '../utils/errorHandler';

const Layout = (): JSX.Element => {
  const navigate = useNavigate();
  const { context, dispatchContext } = useAppContext();

  const leaveGame = async (e: React.FormEvent) => {
    try {
      e.preventDefault();

      await axios.delete('/api/players/' + context.player!.uuid, {
        headers: {
          Authorization: context.token
        }
      });
      dispatchContext({ type: 'clear' });

      navigate('/');
    } catch (err: unknown) {
      alertError('Error leaving game, please try again', err);
    }
  };

  return (
    <>
      <header>
        <nav className="navbar navbar-dark bg-dark">
          <div className="container-fluid">
            <Link className="navbar-brand text-light" to=".">
              <i className="nf-fa-home px-3"></i>Games
            </Link>

            {context.player && (
              <div className="d-flex justify-content-start">
                <button className="btn btn-outline-danger" onClick={leaveGame}>
                  <Icon icon="nf-mdi-account_off" className="pe-2" />
                  Leave Game
                </button>
              </div>
            )}
          </div>
        </nav>
      </header>

      <main className="flex-grow-1 my-2">
        <div className="container d-flex p-4" style={{ maxWidth: '30rem' }}>
          <Outlet />
        </div>
      </main>

      <footer className="footer bg-light py-2 px-4 d-flex gap-3">
        <a
          href="https://github.com/jcubby86/games-cp4"
          className="text-dark text-decoration-none link-danger ms-auto"
          target="_blank"
          rel="noreferrer"
        >
          <Icon icon="nf-cod-github_inverted" />
        </a>
        <a
          href="https://www.linkedin.com/in/jacob-bastian-643033206/"
          className="text-dark text-decoration-none link-info"
          target="_blank"
          rel="noreferrer"
        >
          <Icon icon="nf-fa-linkedin_square" />
        </a>
        <a
          href="mailto:games@jmbastian.com?&subject=Hello!&body=I'm reaching out about"
          className="text-dark text-decoration-none link-warning"
          target="_blank"
          rel="noreferrer"
        >
          <Icon icon="nf-mdi-email_variant" />
        </a>
        <Link
          to="/privacy"
          className="text-dark text-decoration-none link-secondary"
          title="Privacy Policy"
        >
          <Icon icon="nf-fa-file_text" />
        </Link>
      </footer>
    </>
  );
};

export default Layout;
