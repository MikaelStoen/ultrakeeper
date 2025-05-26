// src/pages/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

// ---- Helpers ----
function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function formatTimeOfDay(timestamp: string): string {
  const ts = new Date(timestamp);
  return ts.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

function formatLapTime(timestamp: string): string {
  const ts = new Date(timestamp);
  const hourStart = new Date(ts);
  hourStart.setMinutes(0, 0, 0);
  const msSinceHour = ts.getTime() - hourStart.getTime();
  const totalSeconds = Math.floor(msSinceHour / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// ---- Types ----

type Lap = {
  _id: string;
  athleteId: string | { _id: string };
  timestamp: string;
};

type AthleteBase = {
  _id: string;
  name: string;
  rfid: string;
  status: string;
};

type Athlete = AthleteBase & {
  lapCount: number;
  lastLapTime?: string;
  totalTime: number;
  laps: Lap[];
};

// ---- Component ----

function DashboardPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAthleteId, setOpenAthleteId] = useState<string | null>(null);

  const fetchAthletes = async () => {
    try {
      const res = await axios.get<AthleteBase[]>('http://localhost:5000/api/athletes');
      const lapRes = await axios.get<Lap[]>('http://localhost:5000/api/laps');

      const enriched: Athlete[] = res.data.map((a) => {
        const athleteIdStr = String(a._id);

        const getLapAthleteId = (lap: Lap): string =>
          typeof lap.athleteId === 'object'
            ? String((lap.athleteId as { _id: string })._id)
            : String(lap.athleteId);

        const laps = lapRes.data.filter((l) => getLapAthleteId(l) === athleteIdStr);

        const sortedLapsAsc = [...laps].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        const lastLap = sortedLapsAsc[sortedLapsAsc.length - 1];

        const totalTime = sortedLapsAsc.reduce((sum, lap) => {
          const ts = new Date(lap.timestamp);
          if (isNaN(ts.getTime())) return sum;
          const lapStart = new Date(ts);
          lapStart.setMinutes(0, 0, 0);
          return sum + (ts.getTime() - lapStart.getTime());
        }, 0);

        return {
          ...a,
          lapCount: laps.length,
          lastLapTime: lastLap?.timestamp,
          totalTime,
          laps: sortedLapsAsc,
        };
      });

      const sorted = enriched.sort((a, b) => {
        if (b.lapCount !== a.lapCount) return b.lapCount - a.lapCount;
        return a.totalTime - b.totalTime;
      });

      setAthletes(sorted);
    } catch (err) {
      console.error('Failed to fetch standings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAthletes();
    const interval = setInterval(fetchAthletes, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleForfeit = async (id: string) => {
    await axios.patch(`http://localhost:5000/api/athletes/${id}/forfeit`);
    fetchAthletes();
  };

  const toggleInfo = (id: string) => {
    setOpenAthleteId(prev => (prev === id ? null : id));
  };

  const handleDeleteLap = async (lapId: string) => {
    const token = window.prompt('Admin password')?.trim();
    if (!token) return;
    try {
      await axios.delete(`http://localhost:5000/api/laps/${lapId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAthletes();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        alert('Delete failed: ' + (err.response?.data?.error || err.message));
      } else {
        alert('Delete failed.');
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto border rounded-md shadow-sm">
          <table className="w-full table-auto text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3 font-semibold">Place</th>
                <th className="p-3 font-semibold">Name</th>
                <th className="p-3 font-semibold">Laps</th>
                <th className="p-3 font-semibold">Total Time</th>
                <th className="p-3 font-semibold">Last Lap</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {athletes.map((athlete, idx) => (
                <React.Fragment key={athlete._id}>
                  <tr
                    className={`border-t ${
                      athlete.status === 'forfeited' ? 'bg-red-50' : 'bg-green-50'
                    }`}
                  >
                    <td className="p-3">{idx + 1}</td>
                    <td className="p-3">{athlete.name}</td>
                    <td className="p-3">{athlete.lapCount}</td>
                    <td className="p-3">
                      {athlete.totalTime > 0 ? formatDuration(athlete.totalTime) : '-'}
                    </td>
                    <td className="p-3">
                      {athlete.lastLapTime ? formatLapTime(athlete.lastLapTime) : '-'}
                    </td>
                    <td className="p-3">
                      {athlete.status === 'forfeited'
                        ? '❌ Forfeited'
                        : '✅ Active'}
                    </td>
                    <td className="p-3">
                      <button
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm px-3 py-1 rounded mr-2"
                        onClick={() => toggleInfo(athlete._id)}
                      >
                        {openAthleteId === athlete._id ? 'Hide Info' : 'Info'}
                      </button>
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded"
                        onClick={() => handleForfeit(athlete._id)}
                      >
                        {athlete.status === 'active' ? 'Forfeit' : 'Unforfeit'}
                      </button>
                    </td>
                  </tr>

                  {openAthleteId === athlete._id && (
                    <tr>
                      <td colSpan={7} className="p-3 bg-gray-50">
                        <div className="overflow-x-auto">
                          <table className="w-full table-auto text-sm">
                            <thead className="bg-gray-100 text-left">
                              <tr>
                                <th className="p-2 font-semibold">Lap #</th>
                                <th className="p-2 font-semibold">Time</th>
                                <th className="p-2 font-semibold">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {athlete.laps.map((lap, i) => (
                                <tr key={lap._id} className="border-t">
                                  <td className="p-2">{i + 1}</td>
                                  <td className="p-2">
                                    {formatTimeOfDay(lap.timestamp)}
                                  </td>
                                  <td className="p-2">
                                    <button
                                      onClick={() => handleDeleteLap(lap._id)}
                                      className="text-red-600 hover:text-red-800 text-xs"
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
