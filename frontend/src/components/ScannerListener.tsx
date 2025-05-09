import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

const SCAN_TIMEOUT = 100;
const SCAN_COMPLETE_DELAY = 200;

function ScannerListener() {
  const [banner, setBanner] = useState<{ message: string; success: boolean } | null>(null);
  const bufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();

      if (e.key.length !== 1) return;

      if (now - lastKeyTimeRef.current > SCAN_TIMEOUT) {
        bufferRef.current = '';
      }

      lastKeyTimeRef.current = now;
      bufferRef.current += e.key;

      if (scanTimerRef.current) {
        clearTimeout(scanTimerRef.current);
      }

      scanTimerRef.current = setTimeout(() => {
        const scannedRFID = bufferRef.current.trim();
        bufferRef.current = '';
        if (scannedRFID) {
          handleScan(scannedRFID);
        }
      }, SCAN_COMPLETE_DELAY);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleScan = async (rfid: string) => {
    try {
      const res = await axios.get('http://localhost:5000/api/athletes');
      const athlete = res.data.find((a: any) => a.rfid === rfid);

      if (!athlete) {
        showBanner(`❌ Unknown RFID: ${rfid}`, false);
        return;
      }

      await axios.post('http://localhost:5000/api/laps', {
        athleteId: athlete._id,
        source: 'scan',
      });

      showBanner(`✅ Lap registered for ${athlete.name}`, true);
    } catch (err) {
      showBanner('❌ Scan failed', false);
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
