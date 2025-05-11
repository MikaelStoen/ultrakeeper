// src/components/HeaderWithCountdown.tsx
import React from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import CountdownTimer from './CountdownTimer';
import logo from '../assets/example.png';

interface HeaderProps {
  children: ReactNode;
}

const HeaderWithCountdown: React.FC<HeaderProps> = ({ children }) => {
  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '1rem 1.5rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: '1280px',
            margin: '0 auto',
            width: '100%',
          }}
        >
          {/* Logo + Title */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img
              src={logo}
              alt="Lyder Ultra logo"
              style={{
                height: '2.5rem',       // adjust as needed
                width: 'auto',
                marginRight: '0.75rem',
              }}
            />
            <span
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#2b6cb0',
                fontFamily: 'sans-serif',
              }}
            >
              Lyder Ultra 2025
            </span>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', gap: '1rem' }}>
            {[
              { to: '/', label: 'Dashboard' },
              { to: '/register', label: 'Register' },
              { to: '/manual', label: 'Manual Entry' },
              { to: '/scan', label: 'Scan Mode' },
            ].map(({ to, label }) => (
              <Link key={to} to={to} style={linkStyle}>
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main
        style={{
          flex: 1,
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '1rem 1.5rem',
          marginBottom: '4rem',
        }}
      >
        {children}
      </main>

      <footer
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
          backgroundColor: '#e53e3e',
        }}
      >
        <CountdownTimer lapIntervalMinutes={10} />
      </footer>
    </>
  );
};

const linkStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.5rem 1rem',
  border: '1px solid #cbd5e0',
  borderRadius: '0.375rem',
  textDecoration: 'none',
  color: '#4a5568',
  fontWeight: 500,
};

export default HeaderWithCountdown;
