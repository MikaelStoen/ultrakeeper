import { useEffect, useState } from 'react';
import axios, { isAxiosError } from 'axios';

type Athlete = {
  _id: string;
  name: string;
};

function ManualEntryPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/athletes');
        setAthletes(res.data);
      } catch (err: unknown) {
        if (isAxiosError(err)) {
          setMessage(`❌ Failed to load athletes: ${err.message}`);
        } else {
          setMessage('❌ Unknown error loading athletes');
        }
      }
    };
    fetch();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      await axios.post('http://localhost:5000/api/laps', {
        athleteId: selectedId,
        source: 'manual',
        timestamp: timestamp || undefined,
      });
      setMessage('✅ Lap added');
      setSelectedId('');
      setTimestamp('');
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
      } else {
        setMessage('❌ Unknown error occurred.');
      }
    }
  };

  return (
    <div>
      <h2>Manual Lap Entry</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', maxWidth: '300px', gap: '1rem' }}>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          required
        >
          <option value="">Select athlete</option>
          {athletes.map((a) => (
            <option key={a._id} value={a._id}>
              {a.name}
            </option>
          ))}
        </select>

        <input
          type="time"
          value={timestamp}
          onChange={(e) => setTimestamp(e.target.value)}
          required
        />

        <button type="submit">Add Lap</button>
      </form>
      {message && <p style={{ marginTop: '1rem' }}>{message}</p>}
    </div>
  );
}

export default ManualEntryPage;
