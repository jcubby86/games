import { Link, Outlet } from 'react-router-dom';

import LeaveButton from '../components/LeaveButton';

const Layout = () => {
  return (
    <>
      <header>
        <nav className="navbar navbar-dark bg-dark">
          <div className="container-fluid">
            <Link className="navbar-brand text-light" to=".">
              <i className="bi bi-house-fill mx-1"></i>Games
            </Link>
            <LeaveButton />
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
