// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HeaderWithCountdown from './components/HeaderWithCountdown';
import ScannerListener from './components/ScannerListener';
import DashboardPage from './pages/DashboardPage';
import RegisterPage from './pages/RegisterPage';
import ManualEntryPage from './pages/ManualEntryPage';
import ScanPage from './pages/ScanPage';

function App() {
  return (
    <Router>
      {/* Global scanner listener */}
      <ScannerListener />

      {/* Layout wrapper includes header, content, and bottom countdown */}
      <HeaderWithCountdown>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/manual" element={<ManualEntryPage />} />
          {/* <Route path="/scan" element={<ScanPage />} /> */}
        </Routes>
      </HeaderWithCountdown>
    </Router>
  );
}

export default App;
