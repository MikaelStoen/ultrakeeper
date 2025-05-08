// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ManualEntryPage from './pages/ManualEntryPage';

function App() {
  return (
    <Router>
      <div style={{ padding: '1rem' }}>
        <nav style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <Link to="/">Dashboard</Link>
          <Link to="/register">Register</Link>
          <Link to="/manual">Manual Entry</Link>
        </nav>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/manual" element={<ManualEntryPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
