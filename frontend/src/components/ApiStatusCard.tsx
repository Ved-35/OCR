import React, { useState } from 'react';
import { fetchHealth, fetchInfo, fetchItems, HealthResponse, InfoResponse, Item } from '../services/api';

interface ApiStatusCardProps {
  onStatusChange: (connected: boolean) => void;
}

export const ApiStatusCard: React.FC<ApiStatusCardProps> = ({ onStatusChange }) => {
  const [activeEndpoint, setActiveEndpoint] = useState<string>('health');
  const [response, setResponse] = useState<HealthResponse | InfoResponse | Item[] | null | object>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleTestEndpoint = async (endpoint: 'health' | 'info' | 'items') => {
    setLoading(true);
    setError(null);
    setActiveEndpoint(endpoint);
    try {
      let data: HealthResponse | InfoResponse | Item[];
      if (endpoint === 'health') {
        data = await fetchHealth();
      } else if (endpoint === 'info') {
        data = await fetchInfo();
      } else {
        data = await fetchItems();
      }
      setResponse(data);
      onStatusChange(true);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to connect to backend';
      setError(errMsg);
      setResponse(null);
      onStatusChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="api-tester glass-panel">
      <div className="api-header">
        <h3 className="api-title">
          <span>📡</span> Interactive Backend API Console
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className={`btn ${activeEndpoint === 'health' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleTestEndpoint('health')}
            disabled={loading}
          >
            GET /api/health
          </button>
          <button 
            className={`btn ${activeEndpoint === 'info' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleTestEndpoint('info')}
            disabled={loading}
          >
            GET /api/info
          </button>
          <button 
            className={`btn ${activeEndpoint === 'items' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleTestEndpoint('items')}
            disabled={loading}
          >
            GET /api/items
          </button>
        </div>
      </div>

      <div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.8rem', fontSize: '0.9rem' }}>
          Response Preview ({activeEndpoint ? `/api/${activeEndpoint}` : 'Select an endpoint'}):
        </p>
        <pre className="response-box">
          {loading ? (
            '⏳ Fetching data from Node.js backend...'
          ) : error ? (
            `❌ Error: ${error}\nMake sure backend is running on http://localhost:5000`
          ) : response ? (
            JSON.stringify(response, null, 2)
          ) : (
            'Click any button above to test the REST API connection.'
          )}
        </pre>
      </div>
    </div>
  );
};
