import { Container, Navbar } from 'react-bootstrap';
import { Link, Outlet } from 'react-router-dom';

import Icon from '../components/Icon';
import { useAppContext } from '../contexts/AppContext';

const Layout = () => {
  const { context } = useAppContext();

  return (
    <>
      <header>
        <Navbar className="bg-dark" data-bs-theme="dark">
          <Container fluid>
            <Link className="navbar-brand" to=".">
              <Icon icon="house" />
            </Link>
            {context.player && (
              <Link className="navbar-brand me-0 text-danger" to="/join">
                <Icon icon="gear" />
              </Link>
            )}
          </Container>
        </Navbar>
      </header>

      <main className="flex-grow-1">
        <Container className="p-3" style={{ maxWidth: '30rem' }}>
          <Outlet />
        </Container>
      </main>

      <footer className="footer py-2 px-4 d-flex gap-3">
        <a
          href="https://github.com/jcubby86/games"
          className="text-dark text-decoration-none link-danger ms-auto"
          target="_blank"
          rel="noreferrer"
        >
          <Icon icon="github" className="fs-2" />
        </a>
        <a
          href="https://www.linkedin.com/in/jacob-bastian-643033206/"
          className="text-dark text-decoration-none link-info"
          target="_blank"
          rel="noreferrer"
        >
          <Icon icon="linkedin" className="fs-2" />
        </a>
        <a
          href="mailto:games@muffinjr.com?&subject=Hello!&body=I'm reaching out about"
          className="text-dark text-decoration-none link-success"
          target="_blank"
          rel="noreferrer"
        >
          <Icon icon="envelope-fill" className="fs-2" />
        </a>
        <Link
          to="/privacy"
          className="text-dark text-decoration-none link-primary"
          title="Privacy Policy"
        >
          <Icon icon="shield-fill-check" className="fs-2" />
        </Link>
      </footer>
    </>
  );
};

export default Layout;
