import React, { useState, useEffect } from 'react';

interface HeaderProps {
  backendConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({ backendConnected }) => {
  const [apiKey, setApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('gemini_api_key') || '';
    } catch {
      return '';
    }
  });
  const [showModal, setShowModal] = useState<boolean>(false);
  const [tempKey, setTempKey] = useState<string>('');
  const [showSecret, setShowSecret] = useState<boolean>(false);

  useEffect(() => {
    const handleStorage = () => {
      try {
        setApiKey(localStorage.getItem('gemini_api_key') || '');
      } catch {}
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const openModal = () => {
    setTempKey(apiKey);
    setShowModal(true);
  };

  const handleSave = () => {
    const cleaned = tempKey.trim();
    setApiKey(cleaned);
    try {
      if (cleaned) {
        localStorage.setItem('gemini_api_key', cleaned);
      } else {
        localStorage.removeItem('gemini_api_key');
      }
    } catch {}
    setShowModal(false);
  };

  return (
    <header className="app-header glass-panel">
      <div className="brand">
        <div className="brand-icon">⚡</div>
        <span>Stack<span className="gradient-text">Core</span></span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        {/* Gemini Key Badge & Quick Config Button */}
        <button
          type="button"
          onClick={openModal}
          style={{
            background: apiKey ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.08)',
            border: apiKey ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.15)',
            color: apiKey ? '#34d399' : '#cbd5e1',
            borderRadius: '9999px',
            padding: '4px 12px',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
          }}
          title="Configure Gemini API Key"
        >
          <span>🔑</span>
          <span>Gemini: {apiKey ? 'Custom Key Active' : 'Backend ENV'}</span>
        </button>

        <div className="status-badge">
          <span
            className="status-dot"
            style={{
              backgroundColor: backendConnected ? '#10b981' : '#f43f5e',
              boxShadow: backendConnected ? '0 0 8px #10b981' : '0 0 8px #f43f5e',
            }}
          ></span>
          <span>{backendConnected ? 'Backend Connected' : 'Backend Standby'}</span>
        </div>
      </div>

      {/* Gemini Key Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1rem',
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              borderRadius: '12px',
              padding: '1.5rem',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
              color: '#f8fafc',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.25rem' }}>🔑</span>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                  Gemini API Key Settings
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '0 0 1rem 0', lineHeight: 1.5 }}>
              Enter your Gemini API key below to use it for AI OCR. If left empty, the system automatically uses the backend&apos;s default <code style={{ color: '#a855f7' }}>GEMINI_API_KEY</code> from the server <code style={{ color: '#a855f7' }}>.env</code>.
            </p>

            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <input
                type={showSecret ? 'text' : 'password'}
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                placeholder="Paste Gemini API key (optional)"
                style={{
                  width: '100%',
                  padding: '0.6rem 2.4rem 0.6rem 0.75rem',
                  background: '#030712',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontFamily: 'monospace',
                }}
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
                title={showSecret ? 'Hide Key' : 'Show Key'}
              >
                {showSecret ? '🙈' : '👁️'}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
              {tempKey ? (
                <button
                  type="button"
                  onClick={() => setTempKey('')}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    borderRadius: '6px',
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Clear (Use Backend ENV)
                </button>
              ) : (
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Currently using Backend ENV</span>
              )}

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#cbd5e1',
                    borderRadius: '6px',
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  style={{
                    background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '6px',
                    padding: '0.45rem 1rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Save Preference
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
