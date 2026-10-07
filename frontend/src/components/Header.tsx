import React from 'react';

interface HeaderProps {
  backendConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({ backendConnected }) => {
  return (
    <header className="app-header glass-panel">
      <div className="brand">
        <div className="brand-icon">⚡</div>
        <span>Stack<span className="gradient-text">Core</span></span>
      </div>
      <div className="status-badge">
        <span className="status-dot" style={{ backgroundColor: backendConnected ? '#10b981' : '#f43f5e', boxShadow: backendConnected ? '0 0 8px #10b981' : '0 0 8px #f43f5e' }}></span>
        <span>{backendConnected ? 'Backend Connected' : 'Backend Standby'}</span>
      </div>
    </header>
  );
};
