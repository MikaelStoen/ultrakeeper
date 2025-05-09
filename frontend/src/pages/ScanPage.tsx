import { useEffect, useState } from 'react';
import axios from 'axios';

function ScanPage() {
  const [inputBuffer, setInputBuffer] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        submitScan(inputBuffer);
        setInputBuffer('');
      } else {
        setInputBuffer((prev) => prev + e.key);
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [inputBuffer]);

  const submitScan = async (rfid: string) => {
    try {
      const res = await axios.post('http://localhost:5000/api/laps/scan', { rfid });
      setStatus('success');
      setMessage(res.data.message);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.error || 'Scan failed');
    } finally {
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 2000);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10 text-center">
      <h2 className="text-2xl font-bold mb-4">Scanning Mode</h2>
      <p className="text-gray-600 mb-6">Please scan an athlete's RFID card...</p>

      <div
        className={`text-lg font-semibold py-4 px-6 rounded shadow-md transition-all duration-300 ${
          status === 'success' ? 'bg-green-100 text-green-800' : status === 'error' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
        }`}
      >
        {message || 'Waiting for scan...'}
      </div>
    </div>
  );
}

export default ScanPage;
