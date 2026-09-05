import {
  QueryClient,
  QueryClientProvider,
  QueryErrorResetBoundary
} from '@tanstack/react-query';
import {
  RouterProvider,
  createRouter,
  useNavigate
} from '@tanstack/react-router';
import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';

import { FloatingMessagePortal } from './components/FloatingMessagePortal';
import { ModalPortal } from './components/ModalPortal';
import { ToastPortal } from './components/ToastPortal';
import { routeTree } from './routeTree.gen';
import './styles/app.scss';

function RedirectHome() {
  const navigate = useNavigate();

  useEffect(() => {
    void navigate({ to: '/', replace: true });
  }, [navigate]);

  return null;
}

const client = new QueryClient();

const router = createRouter({
  routeTree,
  context: { queryClient: client },
  defaultNotFoundComponent: RedirectHome,
  defaultPreload: 'intent',
  scrollRestoration: true
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function App() {
  return (
    <>
      <QueryClientProvider client={client}>
        <QueryErrorResetBoundary>
          {({ reset }) => (
            <ErrorBoundary
              onReset={reset}
              fallbackRender={({ resetErrorBoundary }) => (
                <div>
                  There was an error!
                  <button onClick={() => resetErrorBoundary()}>
                    Try again
                  </button>
                </div>
              )}
            >
              <RouterProvider router={router} />
              <FloatingMessagePortal />
              <ToastPortal />
              <ModalPortal />
            </ErrorBoundary>
          )}
        </QueryErrorResetBoundary>
      </QueryClientProvider>
    </>
  );
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
