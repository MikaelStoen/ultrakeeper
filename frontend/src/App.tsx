// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HeaderWithCountdown from './components/HeaderWithCountdown';
import ScannerListener from './components/ScannerListener';
import DashboardPage from './pages/DashboardPage';
import RegisterPage from './pages/RegisterPage';
import ManualEntryPage from './pages/ManualEntryPage';

function App() {
  return (
    <Router>
      <HeaderWithCountdown>
        <ScannerListener /> 
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/manual" element={<ManualEntryPage />} />
        </Routes>
      </HeaderWithCountdown>
    </Router>
  );
}

export default App;
