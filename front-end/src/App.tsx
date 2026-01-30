import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { AppContextProvider } from './contexts/AppContext';
import Admin from './pages/Admin';
import Create from './pages/Create';
import Home from './pages/Home';
import Join from './pages/Join';
import Layout from './pages/Layout';
import Names from './pages/Names';
import Privacy from './pages/Privacy';
import Story from './pages/Story';
import StoryArchive from './pages/StoryArchive';
import { NAMES, STORY } from './utils/constants';
import './App.scss';
import 'react-tooltip/dist/react-tooltip.css';

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <AppContextProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="join" element={<Join />} />
            <Route path="create" element={<Create />} />
            <Route path={STORY} element={<Story />} />
            <Route
              path={`${STORY}/:gameId/:playerId?`}
              element={<StoryArchive />}
            />
            <Route path={NAMES} element={<Names />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<Home />} />
          </Route>
        </Routes>
      </AppContextProvider>
    </BrowserRouter>
  );
}

export default App;
