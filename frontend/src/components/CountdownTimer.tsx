// CountdownTimer.tsx
import React, { useEffect, useState } from 'react';

interface CountdownTimerProps {
  /** Length of each lap in minutes */
  lapIntervalMinutes?: number;
}

const CountdownTimer: React.FC<CountdownTimerProps> = () => {
  const calculateRemaining = (): string => {
    const now = new Date();
    const msUntilNextHour =
      (60 - now.getMinutes()) * 60 * 1000 - now.getSeconds() * 1000 - now.getMilliseconds();
    const totalSeconds = Math.floor(msUntilNextHour / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  };

  const [timeLeft, setTimeLeft] = useState(calculateRemaining());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateRemaining());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ width: '100%', textAlign: 'center', padding: '1rem' }}>
      <span
        style={{
          fontSize: '3rem',
          fontWeight: 800,
          fontFamily: 'monospace',
          color: 'white',
          backgroundColor: '#c53030',
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem',
        }}
      >
        🕒  {timeLeft}
      </span>
    </div>
  );
};

export default CountdownTimer;
