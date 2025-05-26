import { useEffect, useState } from 'react';
import axios from 'axios';

type Lap = {
  _id: string;
  athleteId: string;
  timestamp: string;
};

type AthleteRaw = {
  _id: string;
  name: string;
  rfid: string;
  status: string;
};

type AthleteEnriched = AthleteRaw & {
  lapCount: number;
  lastLapTime?: string | null;
  totalTime: number;
};

function StandingsTable() {
  const [athletes, setAthletes] = useState<AthleteEnriched[]>([]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get<AthleteRaw[]>('http://localhost:5000/api/athletes');
      const lapRes = await axios.get<Lap[]>('http://localhost:5000/api/laps');

      const enriched: AthleteEnriched[] = res.data.map((a) => {
        const laps = lapRes.data.filter((l) => String(l.athleteId) === String(a._id));

        const lastLap = laps
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

        const totalTime = laps.reduce((sum, lap) => sum + new Date(lap.timestamp).getTime(), 0);

        return {
          ...a,
          lapCount: laps.length,
          lastLapTime: lastLap?.timestamp || null,
          totalTime,
        };
      });

      const sorted = enriched.sort((a, b) => {
        if (b.lapCount !== a.lapCount) return b.lapCount - a.lapCount;
        return a.totalTime - b.totalTime;
      });

      setAthletes(sorted);
    } catch (err) {
      console.error('Failed to fetch standings:', err);
    }
  };

  return (
    <div>
      <h2>Standings</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Place</th>
            <th>Name</th>
            <th>Laps</th>
            <th>Last Lap</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {athletes.map((a, i) => (
            <tr
              key={a._id}
              style={{
                backgroundColor: a.status === 'forfeited' ? '#ffe6e6' : 'white',
                borderBottom: '1px solid #ccc',
              }}
            >
              <td>{i + 1}</td>
              <td>{a.name}</td>
              <td>{a.lapCount}</td>
              <td>
                {a.lastLapTime
                  ? new Date(a.lastLapTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    })
                  : '-'}
              </td>
              <td>{a.status === 'forfeited' ? '❌ Forfeited' : '✅ Active'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default StandingsTable;
