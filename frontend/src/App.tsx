import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DocumentVerificationUI } from './components/DocumentVerificationUI';
import { CustomDocumentVerificationUI } from './components/CustomDocumentVerificationUI';
import { ChallanVerificationUI } from './components/ChallanVerificationUI';
import { ApiStatusCard } from './components/ApiStatusCard';
import { FeatureGrid } from './components/FeatureGrid';
import { Footer } from './components/Footer';
import { fetchHealth } from './services/api';

export function App() {
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'verifier' | 'custom' | 'challan' | 'backend'>('challan');

  useEffect(() => {
    fetchHealth()
      .then(() => setBackendConnected(true))
      .catch(() => setBackendConnected(false));
  }, []);

  return (
    <div className="app-container">
      <Header backendConnected={backendConnected} />

      {/* Navigation View Switcher */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          className={`btn ${activeView === 'challan' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveView('challan')}
        >
          🧾 Delivery Challan OCR
        </button>
        <button
          className={`btn ${activeView === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveView('custom')}
        >
          🧩 Dynamic Document Parser
        </button>
        <button
          className={`btn ${activeView === 'verifier' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveView('verifier')}
        >
          📄 Standard KYC Verifier
        </button>
        <button
          className={`btn ${activeView === 'backend' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveView('backend')}
        >
          ⚙️ Backend Console &amp; System Info
        </button>
      </div>

      {activeView === 'challan' ? (
        <ChallanVerificationUI />
      ) : activeView === 'custom' ? (
        <CustomDocumentVerificationUI />
      ) : activeView === 'verifier' ? (
        <DocumentVerificationUI />
      ) : (
        <>
          <section className="hero-section">
            <h1 className="hero-title">
              Fullstack <span className="gradient-text">React &amp; Node.js</span> Architecture
            </h1>
            <p className="hero-subtitle">
              Initialized with React + Vite frontend and Node.js + Express backend with end-to-end TypeScript integration.
            </p>
          </section>

          <ApiStatusCard onStatusChange={setBackendConnected} />
          <FeatureGrid />
        </>
      )}

      <Footer />
    </div>
  );
}

export default App;
