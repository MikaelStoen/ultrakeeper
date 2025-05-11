import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

const SCAN_TIMEOUT = 100; // ms to clear buffer between scans

function ScannerListener() {
  const [banner, setBanner] = useState<{ message: string; success: boolean } | null>(null);
  const bufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();

      // ENTER signals end of RFID string
      if (e.key === 'Enter') {
        const scannedRFID = bufferRef.current.trim();
        bufferRef.current = '';
        if (scannedRFID) handleScan(scannedRFID);
        return;
      }
      // only accept single-character keys
      if (e.key.length !== 1) return;

      // if we paused longer than SCAN_TIMEOUT, reset buffer
      if (now - lastKeyTimeRef.current > SCAN_TIMEOUT) {
        bufferRef.current = '';
      }
      lastKeyTimeRef.current = now;
      bufferRef.current += e.key;
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleScan = async (rfid: string) => {
    try {
      // POST to the scan-specific endpoint
      const res = await axios.post(
        'http://localhost:5000/api/laps/scan',
        { rfid },
      );
      // backend returns { message: `Lap recorded for ${name}` }
      showBanner(res.data.message, true);
    } catch (err: any) {
      // display the server’s error (e.g. “Lap already recorded…” or “Too early…”)
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        '❌ Scan failed';
      showBanner(`❌ ${msg}`, false);
    }
  };

  const showBanner = (message: string, success: boolean) => {
    setBanner({ message, success });
    setTimeout(() => setBanner(null), 3000);
  };

  return banner ? (
    <div
      style={{
        position: 'fixed',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: banner.success ? '#28a745' : '#dc3545',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        zIndex: 9999,
        fontWeight: 500,
        fontSize: '1rem',
      }}
    >
      {banner.message}
    </div>
  ) : null;
}

export default ScannerListener;
