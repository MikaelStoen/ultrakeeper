import { useEffect, useState } from 'react';
import axios from 'axios';

type Athlete = {
  _id: string;
  name: string;
  rfid: string;
  status: string;
  lapCount: number;
};

function DashboardPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAthletes = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/athletes');
      setAthletes(res.data);
    } catch (err) {
      console.error('Failed to fetch athletes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAthletes();
  }, []);

  const handleForfeit = async (id: string) => {
    await axios.patch(`http://localhost:5000/api/athletes/${id}/forfeit`);
    fetchAthletes(); // refresh
  };

  return (
    <div>
      <h2>Dashboard</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table border={1} cellPadding={8}>
          <thead>
            <tr>
              <th>Name</th>
              <th>RFID</th>
              <th>Status</th>
              <th>Laps</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {athletes.map((athlete) => (
              <tr key={athlete._id}>
                <td>{athlete.name}</td>
                <td>{athlete.rfid}</td>
                <td>{athlete.status}</td>
                <td>{athlete.lapCount}</td>
                <td>
                  {athlete.status === 'active' ? (
                    <button onClick={() => handleForfeit(athlete._id)}>
                    {athlete.status === 'active' ? 'Forfeit' : 'Unforfeit'}
                  </button>
                  
                  ) : (
                    <span>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default DashboardPage;
