import {
  QueryClient,
  QueryClientProvider,
  QueryErrorResetBoundary
} from '@tanstack/react-query';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { FloatingMessagePortal } from './components/FloatingMessagePortal';
import Loading from './components/Loading';
import { ToastPortal } from './components/ToastPortal';
import { AppContextProvider } from './contexts/AppContext';
import { SocketContextProvider } from './contexts/SocketContext';
import Create from './pages/Create';
import Home from './pages/Home';
import Join from './pages/Join';
import Layout from './pages/Layout';
import Names from './pages/Names';
import Privacy from './pages/Privacy';
import Story from './pages/Story';
import StoryArchive from './pages/StoryArchive';
import { NAME, STORY } from './utils/constants';

const client = new QueryClient();

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="join" element={<Join />} />
        <Route path="create" element={<Create />} />
        <Route path={`${STORY}/:gameUuid`} element={<StoryArchive />} />
        <Route path={STORY} element={<Story />} />
        <Route path={NAME} element={<Names />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
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
              <BrowserRouter>
                <AppContextProvider>
                  <SocketContextProvider>
                    <Suspense fallback={<Loading />}>
                      <AppRoutes />
                    </Suspense>
                  </SocketContextProvider>
                </AppContextProvider>
                <FloatingMessagePortal />
                <ToastPortal />
              </BrowserRouter>
            </ErrorBoundary>
          )}
        </QueryErrorResetBoundary>
      </QueryClientProvider>
    </>
  );
}

export default App;
