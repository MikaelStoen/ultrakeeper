// src/pages/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const KM_PER_LAP = 8.06;

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
  const hours = ts.getHours().toString().padStart(2, '0');
  const minutes = ts.getMinutes().toString().padStart(2, '0');
  const seconds = ts.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function formatLapTime(timestamp: string): string {
  const ts = new Date(timestamp);
  const hourStart = new Date(ts);
  hourStart.setMinutes(0, 0, 0, 0);
  const msSinceHour = ts.getTime() - hourStart.getTime();

  const totalSeconds = Math.floor(msSinceHour / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;
}

type Lap = {
  _id: string;
  athleteId: string;
  timestamp: string;
  source?: string;
};

type Athlete = {
  _id: string;
  name: string;
  rfid: string;
  status: string;
  lapCount: number;
  checkpointCount: number;
  checkpointTime?: string | null;
  lastLapTime?: string | null;
  totalTime: number;
  laps: Lap[];
};

function DashboardPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [openAthleteId, setOpenAthleteId] = useState<string | null>(null);

  const fetchAthletes = async () => {
    try {
      const res = await axios.get<Athlete[]>('http://localhost:5000/api/athletes');
      const lapRes = await axios.get<Lap[]>('http://localhost:5000/api/laps');

      const enriched: Athlete[] = res.data.map((a) => {
        const athleteIdStr = String(a._id);

        const getLapAthleteId = (lap: Lap): string =>
          typeof lap.athleteId === 'object' && lap.athleteId !== null
            ? String((lap.athleteId as any)._id || lap.athleteId)
            : String(lap.athleteId);

        const laps: Lap[] = lapRes.data.filter(
          (l) => getLapAthleteId(l) === athleteIdStr
        );

        const sortedLapsAsc = [...laps].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        const lastLap = sortedLapsAsc.filter(l => l.source !== 'checkpoint').slice(-1)[0];
        const lapCount = laps.filter(l => l.source !== 'checkpoint').length;
        const checkpointCount = laps.filter(l => l.source === 'checkpoint').length;

        const now = new Date();
        const lapHourStart = new Date(now);
        lapHourStart.setMinutes(0, 0, 0);

        const latestCheckpoint = [...laps]
          .filter(l => l.source === 'checkpoint' && new Date(l.timestamp) >= lapHourStart)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

        const checkpointTime = latestCheckpoint
          ? formatLapTime(latestCheckpoint.timestamp)
          : null;

        const totalTime = laps.reduce((sum: number, lap) => {
          if (lap.source === 'checkpoint') return sum;
          const ts = new Date(lap.timestamp);
          if (isNaN(ts.getTime())) return sum;
          const lapStart = new Date(ts);
          lapStart.setMinutes(0, 0, 0);
          return sum + (ts.getTime() - lapStart.getTime());
        }, 0);

        return {
          ...a,
          lapCount,
          checkpointCount,
          lastLapTime: lastLap?.timestamp || null,
          totalTime,
          checkpointTime,
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
        alert('Delete failed: ' + (err as Error).message);
      }
    }
  };

  const totalKm = athletes.reduce((sum, a) => sum + a.lapCount * KM_PER_LAP, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div>
          <span className="font-semibold">Total kilometers run:</span>{' '}
          <span>{totalKm.toFixed(2)} km</span>
        </div>
      </div>

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
                <th className="p-3 font-semibold">Total KM</th>
                <th className="p-3 font-semibold">Total Time</th>
                <th className="p-3 font-semibold">Last Lap</th>
                <th className="p-3 font-semibold">Checkpoint</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {athletes.map((athlete, idx) => {
                const groupedLaps = Object.values(
                  athlete.laps.reduce((acc, lap) => {
                    const hourKey = new Date(lap.timestamp);
                    hourKey.setMinutes(0, 0, 0);
                    const key = hourKey.toISOString();
                    acc[key] = acc[key] || { checkpoint: null, finish: null };
                    if (lap.source === 'checkpoint') acc[key].checkpoint = lap;
                    else acc[key].finish = lap;
                    return acc;
                  }, {} as Record<string, { checkpoint: Lap | null; finish: Lap | null }>)
                );

                return (
                  <React.Fragment key={athlete._id}>
                    <tr className={`border-t ${athlete.status === 'forfeited' ? 'bg-red-50' : 'bg-green-50'}`}>
                      <td className="p-3">{idx + 1}</td>
                      <td className="p-3">{athlete.name}</td>
                      <td className="p-3">{athlete.lapCount}</td>
                      <td className="p-3">{(athlete.lapCount * KM_PER_LAP).toFixed(2)}</td>
                      <td className="p-3">{athlete.totalTime > 0 ? formatDuration(athlete.totalTime) : '-'}</td>
                      <td className="p-3">{athlete.lastLapTime ? formatLapTime(athlete.lastLapTime) : '-'}</td>
                      <td className="p-3">{athlete.checkpointTime ?? '–'}</td>
                      <td className="p-3">{athlete.status === 'forfeited' ? '❌ Forfeited' : '✅ Active'}</td>
                      <td className="p-3">
                        <button
                          className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm px-3 py-1 rounded mr-2"
                          onClick={() => toggleInfo(athlete._id)}>
                          {openAthleteId === athlete._id ? 'Hide Info' : 'Info'}
                        </button>
                        <button
                          className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded"
                          onClick={() => handleForfeit(athlete._id)}>
                          {athlete.status === 'active' ? 'Forfeit' : 'Unforfeit'}
                        </button>
                      </td>
                    </tr>

                    {openAthleteId === athlete._id && (
                      <tr>
                        <td colSpan={9} className="p-3 bg-gray-50">
                          <div className="overflow-x-auto">
                            <table className="w-full table-auto text-sm">
                              <thead className="bg-gray-100 text-left">
                                <tr>
                                  <th className="p-2 font-semibold">Lap #</th>
                                  <th className="p-2 font-semibold">Checkpoint</th>
                                  <th className="p-2 font-semibold">Finish</th>
                                  <th className="p-2 font-semibold">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {groupedLaps.map((group, i) => (
                                  <tr key={i} className="border-t">
                                    <td className="p-2">{i + 1}</td>
                                    <td className="p-2">
                                      {group.checkpoint ? formatTimeOfDay(group.checkpoint.timestamp) : '–'}
                                    </td>
                                    <td className="p-2">
                                      {group.finish ? formatTimeOfDay(group.finish.timestamp) : '–'}
                                    </td>
                                    <td className="p-2">
                                      {group.checkpoint && (
                                        <button
                                          onClick={() => handleDeleteLap(group.checkpoint._id)}
                                          className="text-yellow-600 hover:text-yellow-800 text-xs mr-2"
                                        >
                                          Delete CP
                                        </button>
                                      )}
                                      {group.finish && (
                                        <button
                                          onClick={() => handleDeleteLap(group.finish._id)}
                                          className="text-red-600 hover:text-red-800 text-xs"
                                        >
                                          Delete Lap
                                        </button>
                                      )}
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
