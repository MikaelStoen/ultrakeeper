import { useEffect, useState } from 'react';
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
  rfid: string;
  status: string;
  lapCount: number;
  lastLapTime?: string;
  totalTime: number;
};

// ---- Component ----
function DashboardPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);

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

        const laps: Lap[] = lapRes.data.filter((l: any) => getLapAthleteId(l) === athleteIdStr);

        const sortedLaps = [...laps].sort(
          (a: Lap, b: Lap) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        const lastLap = sortedLaps[0];

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
        };
      });

      const sorted = enriched.sort((a: Athlete, b: Athlete) => {
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
                <th className="p-3 font-semibold">RFID</th>
                <th className="p-3 font-semibold">Laps</th>
                <th className="p-3 font-semibold">Total Time</th>
                <th className="p-3 font-semibold">Last Lap</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {athletes.map((athlete, index) => (
                <tr
                  key={athlete._id}
                  className={`border-t ${
                    athlete.status === 'forfeited' ? 'bg-red-50' : 'bg-green-50'
                  }`}
                >
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3">{athlete.name}</td>
                  <td className="p-3">{athlete.rfid}</td>
                  <td className="p-3">{athlete.lapCount}</td>
                  <td className="p-3">
                    {athlete.totalTime > 0 ? formatDuration(athlete.totalTime) : '-'}
                  </td>
                  <td className="p-3">
                    {athlete.lastLapTime ? formatLapTime(athlete.lastLapTime) : '-'}
                  </td>
                  <td className="p-3">
                    {athlete.status === 'forfeited' ? '❌ Forfeited' : '✅ Active'}
                  </td>
                  <td className="p-3">
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded"
                      onClick={() => handleForfeit(athlete._id)}
                    >
                      {athlete.status === 'active' ? 'Forfeit' : 'Unforfeit'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
