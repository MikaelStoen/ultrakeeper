import { useEffect, useState, useRef } from 'react';
import axios, { AxiosError } from 'axios';

const SCAN_TIMEOUT = 100; // ms to clear buffer between scans

function ScannerListener() {
  const [banner, setBanner] = useState<{ message: string; success: boolean } | null>(null);
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();

      if (e.key === 'Enter') {
        const scannedRFID = bufferRef.current.trim();
        bufferRef.current = '';
        if (scannedRFID) handleScan(scannedRFID);
        return;
      }

      if (e.key.length !== 1) return;

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
      const res = await axios.post<{ message: string }>(
        'http://localhost:5000/api/laps/scan',
        { rfid }
      );
      showBanner(res.data.message, true);
    } catch (error) {
      const err = error as AxiosError<{ error?: string; message?: string }>;
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
