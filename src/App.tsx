import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import GalleryPage from './pages/GalleryPage';
import LettersPage from './pages/LettersPage';
import ArticlesPage from './pages/ArticlesPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="gallery" element={<GalleryPage />} />
        <Route path="letters" element={<LettersPage />} />
        <Route path="articles" element={<ArticlesPage />} />
      </Route>
    </Routes>
  );
}

export default App;
