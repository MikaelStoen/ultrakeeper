// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ManualEntryPage from './pages/ManualEntryPage';
import ScannerListener from './components/ScannerListener';
import ScanPage from './pages/ScanPage';

function App() {
  return (
    <Router>
      {/* <ScannerListener />  */}

      <div style={{ padding: '1rem' }}>
        <nav style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <Link to="/">Dashboard</Link>
          <Link to="/register">Register</Link>
          <Link to="/manual">Manual Entry</Link>
          <Link to="/scan">Scan</Link>
        </nav>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/manual" element={<ManualEntryPage />} />
          <Route path="/scan" element={<ScanPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
