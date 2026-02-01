import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { AppContextProvider } from './contexts/AppContext';
import { SocketProvider } from './contexts/SocketProvider';
import Create from './pages/Create';
import Home from './pages/Home';
import Join from './pages/Join';
import Layout from './pages/Layout';
import Names from './pages/Names';
import Privacy from './pages/Privacy';
import Story from './pages/Story';
import { NAMES, STORY } from './utils/constants';
import './App.scss';
import 'react-tooltip/dist/react-tooltip.css';

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <AppContextProvider>
        <SocketProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="join" element={<Join />} />
              <Route path="create" element={<Create />} />
              <Route path={STORY} element={<Story />} />
              <Route path={NAMES} element={<Names />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="*" element={<Home />} />
            </Route>
          </Routes>
        </SocketProvider>
      </AppContextProvider>
    </BrowserRouter>
  );
}

export default App;
