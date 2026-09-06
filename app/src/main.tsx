import { TanStackDevtools } from '@tanstack/react-devtools';
import {
  QueryClient,
  QueryClientProvider,
  QueryErrorResetBoundary
} from '@tanstack/react-query';
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools';
import {
  RouterProvider,
  createRouter,
  useNavigate
} from '@tanstack/react-router';
import type { ErrorComponentProps } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { StrictMode, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';

import { FloatingMessagePortal } from './components/FloatingMessagePortal';
import Glitch from './components/Glitch';
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

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="center-content flex-column gap-3 min-vh-100 w-100 text-center px-3">
      <Glitch text="Error" />
      <p className="mb-0">Something went wrong. Please try again.</p>
      <Button variant="outline-primary" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

function RouteErrorComponent({ reset }: ErrorComponentProps) {
  return <ErrorFallback onRetry={reset} />;
}

const client = new QueryClient();

const router = createRouter({
  routeTree,
  context: { queryClient: client },
  defaultNotFoundComponent: RedirectHome,
  defaultErrorComponent: RouteErrorComponent,
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
                <ErrorFallback onRetry={resetErrorBoundary} />
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
    <TanStackDevtools
      config={{ position: 'bottom-left', hideUntilHover: true }}
      plugins={[
        {
          name: 'TanStack Query',
          render: <ReactQueryDevtoolsPanel client={client} />
        },
        {
          name: 'TanStack Router',
          render: <TanStackRouterDevtoolsPanel router={router} />
        }
      ]}
    />
  </StrictMode>
);
