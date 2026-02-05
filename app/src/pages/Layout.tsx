import { Link, Outlet, useNavigate } from 'react-router-dom';

import { useAppContext } from '../contexts/AppContext';
import { deletePlayer } from '../utils/apiClient';
import { logError } from '../utils/errorHandler';

const Layout = (): JSX.Element => {
  const navigate = useNavigate();
  const { context, dispatchContext } = useAppContext();

  const leavePreviousGame = async () => {
    if (!context.player || !context.token) {
      return;
    }
    try {
      await deletePlayer(context.token, context.player.uuid);
    } catch (err: unknown) {
      logError('Error leaving previous game', err);
    }
    dispatchContext({ type: 'clear' });
    navigate('/');
  };

  return (
    <>
      <header>
        <nav className="navbar navbar-dark bg-dark">
          <div className="container-fluid">
            <Link className="navbar-brand text-light" to=".">
              <i className="bi bi-house-fill mx-1"></i>Games
            </Link>

            {context.player && context.token && (
              <div className="d-flex justify-content-start">
                <button
                  className="btn btn-outline-danger"
                  onClick={(e) => {
                    e.preventDefault();
                    leavePreviousGame();
                  }}
                >
                  <i className="bi bi-person-x mx-1"></i>
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
          href="https://github.com/jcubby86/games"
          className="text-dark text-decoration-none link-danger ms-auto"
          target="_blank"
          rel="noreferrer"
        >
          <i className="bi bi-github"></i>
        </a>
        <a
          href="https://www.linkedin.com/in/jacob-bastian-643033206/"
          className="text-dark text-decoration-none link-info"
          target="_blank"
          rel="noreferrer"
        >
          <i className="bi bi-linkedin"></i>
        </a>
        <a
          href="mailto:games@muffinjr.com?&subject=Hello!&body=I'm reaching out about"
          className="text-dark text-decoration-none link-warning"
          target="_blank"
          rel="noreferrer"
        >
          <i className="bi bi-envelope-fill"></i>
        </a>
        <Link
          to="/privacy"
          className="text-dark text-decoration-none link-secondary"
          title="Privacy Policy"
        >
          <i className="bi bi-shield-fill-check"></i>
        </Link>
      </footer>
    </>
  );
};

export default Layout;
