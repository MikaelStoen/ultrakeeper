import { useState } from 'react';
import axios, { isAxiosError } from 'axios';

function RegisterPage() {
  const [name, setName] = useState('');
  const [rfid, setRfid] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/athletes/register', {
        name,
        rfid,
      });
      setMessage(`✅ Registered: ${res.data.name}`);
      setName('');
      setRfid('');
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
      <h2>Register Athlete</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
        <input
          type="text"
          placeholder="Athlete Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="RFID"
          value={rfid}
          onChange={(e) => setRfid(e.target.value)}
          required
        />
        <button type="submit">Register</button>
      </form>
      {message && <p style={{ marginTop: '1rem' }}>{message}</p>}
    </div>
  );
}

export default RegisterPage;

