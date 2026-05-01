import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import MainLayout from './components/MainLayout';
import SearchPage from './pages/SearchPage';
import VocabularyPage from './pages/VocabularyPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        
        {/* 使用 MainLayout 作为父路由 */}
        <Route element={<MainLayout />}>
          <Route path="/search" element={<SearchPage />} />
          <Route path="/vocabulary" element={<VocabularyPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </Router>
  );
}

export default App;