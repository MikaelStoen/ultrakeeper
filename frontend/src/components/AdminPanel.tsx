import React, { useState } from 'react';
import axios from 'axios';

/**
 * AdminPanel component:
 * - Toggles open/closed via an "Admin" button
 * - Prompts for admin password
 * - Exposes "Wipe DB" and "Restart" buttons
 * - Sends POST to backend admin routes with full URLs
 */
const AdminPanel: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState({ wipe: false, restart: false });

  // Full backend URLs to avoid 404 if no proxy
  const wipeUrl = 'http://localhost:5000/admin/wipe-db';
  const restartUrl = 'http://localhost:5000/admin/restart';

  const authHeader = { Authorization: `Bearer ${password}` };

  const handleWipe = async () => {
    setLoading(l => ({ ...l, wipe: true }));
    setMessage(null);
    try {
      const res = await axios.post(wipeUrl, null, { headers: authHeader });
      setMessage(res.data);
    } catch (err: any) {
      setMessage(err.response?.data || err.message);
    } finally {
      setLoading(l => ({ ...l, wipe: false }));
    }
  };

  const handleRestart = async () => {
    setLoading(l => ({ ...l, restart: true }));
    setMessage(null);
    try {
      const res = await axios.post(restartUrl, null, { headers: authHeader });
      setMessage(res.data);
    } catch (err: any) {
      setMessage(err.response?.data || err.message);
    } finally {
      setLoading(l => ({ ...l, restart: false }));
    }
  };

  return (
    <div className="admin-panel-container">
      {/* Toggle Admin panel */}
      <button
        onClick={() => setOpen(o => !o)}
        className="px-3 py-1 bg-gray-800 text-white rounded shadow"
      >
        Admin
      </button>

      {open && (
        <div className="mt-2 p-4 w-64 bg-white border rounded shadow-lg">
          <label className="block text-gray-700 mb-1">
            Admin Password
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-1 block w-full px-2 py-1 border rounded focus:outline-none focus:ring"
              placeholder="••••••"
            />
          </label>

          <div className="flex gap-2 mt-3">
            <button
              onClick={handleWipe}
              disabled={!password || loading.wipe}
              className={`flex-1 px-2 py-1 text-white rounded ${
                !password || loading.wipe
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {loading.wipe ? 'Wiping…' : 'Wipe DB'}
            </button>
            <button
              onClick={handleRestart}
              disabled={!password || loading.restart}
              className={`flex-1 px-2 py-1 text-white rounded ${
                !password || loading.restart
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {loading.restart ? 'Restarting…' : 'Restart'}
            </button>
          </div>

          {message && (
            <p className="mt-3 text-xs text-gray-800 break-words">{message}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
