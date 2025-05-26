import React, { useEffect, useState } from 'react';
import axios, { AxiosError } from 'axios';

interface Athlete {
  _id: string;
  name: string;
  rfid: string;
  status: string;
  lapCount?: number;
}

const AdminPanel: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [selectedAthlete, setSelectedAthlete] = useState('');
  const [athletes, setAthletes] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState({
    wipe: false,
    wipeLaps: false,
    deleteAthlete: false,
    fetchAthletes: false,
  });

  const authHeader = { Authorization: `Bearer ${password}` };

  const fetchAthletes = async () => {
    setLoading(l => ({ ...l, fetchAthletes: true }));
    try {
      const res = await axios.get<Athlete[]>('http://localhost:5000/api/athletes');
      const names = res.data.map(a => a.name);
      setAthletes(names);
    } catch (err: unknown) {
      const e = err as AxiosError;
      setMessage(e.response?.data as string || e.message);
    } finally {
      setLoading(l => ({ ...l, fetchAthletes: false }));
    }
  };

  useEffect(() => {
    if (open) fetchAthletes();
  }, [open]);

  const handleWipeAll = async () => {
    if (!confirm('Really wipe all athletes and laps?')) return;
    setLoading(l => ({ ...l, wipe: true }));
    setMessage(null);
    try {
      const res = await axios.post('http://localhost:5000/admin/wipe-db', null, { headers: authHeader });
      setMessage(res.data);
    } catch (err: unknown) {
      const e = err as AxiosError;
      setMessage(e.response?.data as string || e.message);
    } finally {
      setLoading(l => ({ ...l, wipe: false }));
    }
  };

  const handleWipeLaps = async () => {
    if (!confirm('Really wipe all laps?')) return;
    setLoading(l => ({ ...l, wipeLaps: true }));
    setMessage(null);
    try {
      const res = await axios.post('http://localhost:5000/admin/wipe-laps',null, { headers: authHeader });
      setMessage(res.data);
    } catch (err: unknown) {
      const e = err as AxiosError;
      setMessage(e.response?.data as string || e.message);
    } finally {
      setLoading(l => ({ ...l, wipeLaps: false }));
    }
  };

  const handleDeleteAthlete = async () => {
    if (!selectedAthlete) return;
    if (!confirm(`Really delete athlete "${selectedAthlete}"?`)) return;
    setLoading(l => ({ ...l, deleteAthlete: true }));
    setMessage(null);
    try {
      const res = await axios.post(
        'http://localhost:5000/admin/delete-athlete-by-name',
        { name: selectedAthlete },
        { headers: authHeader }
      );
      setMessage(res.data);
      await fetchAthletes();
    } catch (err: unknown) {
      const e = err as AxiosError;
      setMessage(e.response?.data as string || e.message);
    } finally {
      setLoading(l => ({ ...l, deleteAthlete: false }));
    }
  };

  return (
    <div className="admin-panel-container">
      <button
        onClick={() => setOpen(o => !o)}
        className="px-3 py-1 bg-gray-800 text-white rounded shadow"
      >
        Admin
      </button>

      {open && (
        <div className="mt-2 p-4 w-80 bg-white border rounded shadow-lg">
          <label className="block text-sm mb-2">
            Admin Password
            <input
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              className="mt-1 w-full px-2 py-1 border rounded"
              placeholder="••••••"
            />
          </label>

          <div className="mt-3 flex flex-col gap-2">
            <button
              onClick={handleWipeAll}
              disabled={!password || loading.wipe}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
            >
              {loading.wipe ? 'Wiping All…' : 'Wipe All (Athletes + Laps)'}
            </button>

            <button
              onClick={handleWipeLaps}
              disabled={!password || loading.wipeLaps}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
            >
              {loading.wipeLaps ? 'Wiping Laps…' : 'Wipe All Laps'}
            </button>

            <label className="text-sm">
              Delete Specific Athlete:
              <select
                value={selectedAthlete}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedAthlete(e.target.value)}
                className="mt-1 w-full px-2 py-1 border rounded"
              >
                <option value="">Select athlete</option>
                {athletes.map(name => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>

            <button
              onClick={handleDeleteAthlete}
              disabled={!password || !selectedAthlete || loading.deleteAthlete}
              className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-1 rounded"
            >
              {loading.deleteAthlete ? 'Deleting…' : 'Delete Athlete'}
            </button>
          </div>

          {message && <p className="mt-3 text-sm text-gray-800">{message}</p>}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
