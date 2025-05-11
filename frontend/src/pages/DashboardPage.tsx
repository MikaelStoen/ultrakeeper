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

function formatLapTime(timestamp: string): string {
  const ts = new Date(timestamp);
  const hourStart = new Date(ts);
  hourStart.setMinutes(0, 0, 0);
  const ms = ts.getTime() - hourStart.getTime();

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;
}

// ---- Types ----
type Lap = {
  _id: string;
  athleteId: string;
  timestamp: string;
};

type Athlete = {
  _id: string;
  name: string;
  rfid: string;            // kept in type but not rendered
  status: string;
  lapCount: number;
  lastLapTime?: string;
  totalTime: number;
  laps: Lap[];             // full lap list for “Info”
};

// ---- Component ----
function DashboardPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAthleteId, setOpenAthleteId] = useState<string | null>(null);

  const fetchAthletes = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/athletes');
      const lapRes = await axios.get('http://localhost:5000/api/laps');

      const enriched: Athlete[] = res.data.map((a: any) => {
        const athleteIdStr = String(a._id);

        const getLapAthleteId = (lap: any): string =>
          typeof lap.athleteId === 'object' && lap.athleteId !== null
            ? String(lap.athleteId._id || lap.athleteId)
            : String(lap.athleteId);

        // all laps for this athlete
        const laps: Lap[] = lapRes.data.filter(
          (l: any) => getLapAthleteId(l) === athleteIdStr
        );

        // sort ascending by timestamp for display
        const sortedLapsAsc = [...laps].sort(
          (a: Lap, b: Lap) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        // most recent lap
        const lastLap = sortedLapsAsc[sortedLapsAsc.length - 1];

        // total elapsed ms
        const totalTime = laps.reduce((sum: number, lap: Lap) => {
          const ts = new Date(lap.timestamp);
          if (isNaN(ts.getTime())) return sum;
          const lapStart = new Date(ts);
          lapStart.setMinutes(0, 0, 0);
          return sum + (ts.getTime() - lapStart.getTime());
        }, 0);

        return {
          ...a,
          lapCount: laps.length,
          lastLapTime: lastLap?.timestamp || null,
          totalTime,
          laps: sortedLapsAsc,
        };
      });

      // sort leaderboard
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
                  {/* Main row */}
                  <tr
                    className={`border-t ${
                      athlete.status === 'forfeited' ? 'bg-red-50' : 'bg-green-50'
                    }`}
                  >
                    <td className="p-3">{idx + 1}</td>
                    <td className="p-3">{athlete.name}</td>
                    <td className="p-3">{athlete.lapCount}</td>
                    <td className="p-3">
                      {athlete.totalTime > 0
                        ? formatDuration(athlete.totalTime)
                        : '-'}
                    </td>
                    <td className="p-3">
                      {athlete.lastLapTime
                        ? formatLapTime(athlete.lastLapTime)
                        : '-'}
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

                  {/* Expanded laps */}
                  {openAthleteId === athlete._id && (
                    <tr>
                      <td colSpan={7} className="p-3 bg-gray-50">
                        <div className="overflow-x-auto">
                          <table className="w-full table-auto text-sm">
                            <thead className="bg-gray-100 text-left">
                              <tr>
                                <th className="p-2 font-semibold">Lap #</th>
                                <th className="p-2 font-semibold">Time</th>
                              </tr>
                            </thead>
                            <tbody>
                              {athlete.laps.map((lap, i) => (
                                <tr key={lap._id} className="border-t">
                                  <td className="p-2">{i + 1}</td>
                                  <td className="p-2">
                                    {formatLapTime(lap.timestamp)}
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
