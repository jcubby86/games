import { QueryClient } from '@tanstack/react-query';
import {
  Link,
  Outlet,
  createRootRouteWithContext
} from '@tanstack/react-router';
import { Suspense } from 'react';
import { Container, Navbar } from 'react-bootstrap';

import Icon from '../components/Icon';
import Loading from '../components/Loading';
import { AppContextProvider, useAppContext } from '../contexts/AppContext';
import { SocketContextProvider } from '../contexts/SocketContext';

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <Suspense fallback={<Loading />}>
      <AppContextProvider>
        <SocketContextProvider>
          <RouteComponent />
        </SocketContextProvider>
      </AppContextProvider>
    </Suspense>
  )
});

function RouteComponent() {
  const { context, title } = useAppContext();

  return (
    <>
      <title>{title}</title>
      <meta property="og:title" content={title} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={window.location.href} />
      <header>
        <Navbar className="bg-dark" data-bs-theme="dark">
          <Container fluid>
            <Link className="navbar-brand" to="/">
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
}
