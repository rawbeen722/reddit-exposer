import React, { useState } from 'react';

const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');
const LOGS_ENDPOINT = API_BASE.endsWith('/api')
  ? `${API_BASE}/admin/logs`
  : `${API_BASE}/api/admin/logs`;

export default function LogsViewer() {
  const [token, setToken] = useState('');
  const [logs, setLogs] = useState([]);
  const [limit, setLimit] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchLogs = async (e, tokenOverride) => {
    e?.preventDefault?.();
    const tokenToUse = (tokenOverride ?? token).trim();
    if (!tokenToUse) {
      setError('Please provide a valid token');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${LOGS_ENDPOINT}?limit=${limit}&_=${Date.now()}`,
        {
          headers: {
            'x-access-token': tokenToUse,
            'cache-control': 'no-cache',
          },
        }
      );

      const contentType = response.headers.get('content-type') || '';

      if (!response.ok) {
        const data = contentType.includes('application/json')
          ? await response.json()
          : { error: `HTTP ${response.status}` };
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      if (!contentType.includes('application/json')) {
        throw new Error('Backend response is not JSON. Check VITE_API_BASE points to your backend URL.');
      }

      const data = await response.json();
      setLogs(data.logs || []);
      setIsAuthenticated(true);
    } catch (err) {
      setError(err.message);
      setLogs([]);
      if (tokenOverride) setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleTokenSubmit = (e) => {
    e.preventDefault();
    if (token.trim()) {
      fetchLogs(e, token);
    }
  };

  const logout = () => {
    setToken('');
    setIsAuthenticated(false);
    setLogs([]);
    setError(null);
  };

  return (
    <div className="logs-viewer-container">
      <style>{`
        .logs-viewer-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
          padding: 40px 20px;
          font-family: var(--font-mono), monospace;
          color: var(--text-primary, #e0e0e0);
        }

        .logs-viewer {
          max-width: 1200px;
          margin: 0 auto;
        }

        .logs-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(0,212,255,0.2);
        }

        .logs-title {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: 2px;
          color: var(--accent-cyan, #00d4ff);
        }

        .logs-auth {
          background: rgba(19,19,31,0.8);
          border: 1px solid rgba(0,212,255,0.3);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 30px;
          backdrop-filter: blur(16px);
        }

        .auth-form {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .auth-input {
          flex: 1;
          padding: 12px 16px;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(0,212,255,0.25);
          border-radius: 8px;
          color: var(--text-primary, #e0e0e0);
          font-family: inherit;
          font-size: 0.95rem;
        }

        .auth-input:focus {
          outline: none;
          border-color: var(--accent-cyan, #00d4ff);
          box-shadow: 0 0 0 3px rgba(0,212,255,0.15);
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.95rem;
          letter-spacing: 1px;
          transition: 0.2s;
        }

        .btn-primary {
          background: var(--accent-cyan, #00d4ff);
          color: #000;
        }

        .btn-primary:hover {
          opacity: 0.9;
          transform: translateY(-2px);
        }

        .btn-secondary {
          background: rgba(200,50,50,0.8);
          color: #fff;
        }

        .btn-secondary:hover {
          background: rgba(220,70,70,0.9);
        }

        .logs-controls {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 20px;
        }

        .logs-controls label {
          font-size: 0.9rem;
          color: var(--text-secondary, #b0b0b0);
        }

        .logs-controls input {
          width: 100px;
          padding: 8px 12px;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(0,212,255,0.25);
          border-radius: 6px;
          color: var(--text-primary, #e0e0e0);
          font-family: inherit;
        }

        .logs-error {
          background: rgba(220,50,50,0.15);
          border: 1px solid rgba(220,50,50,0.5);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
          color: #ff6b6b;
          font-size: 0.9rem;
        }

        .logs-loading {
          text-align: center;
          padding: 40px 20px;
          font-size: 1rem;
          color: var(--accent-cyan, #00d4ff);
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .logs-empty {
          text-align: center;
          padding: 60px 20px;
          color: var(--text-muted, #666);
          font-size: 1.1rem;
        }

        .logs-table {
          width: 100%;
          border-collapse: collapse;
          background: rgba(19,19,31,0.6);
          border: 1px solid rgba(0,212,255,0.2);
          border-radius: 8px;
          overflow: hidden;
        }

        .logs-table thead {
          background: rgba(0,212,255,0.1);
          border-bottom: 2px solid rgba(0,212,255,0.3);
        }

        .logs-table th {
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          font-size: 0.85rem;
          letter-spacing: 1px;
          color: var(--accent-cyan, #00d4ff);
          text-transform: uppercase;
        }

        .logs-table td {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(0,212,255,0.1);
          font-size: 0.85rem;
        }

        .logs-table tr:hover {
          background: rgba(0,212,255,0.05);
        }

        .log-username {
          color: var(--accent-cyan, #00d4ff);
          font-weight: 600;
        }

        .log-status-200 { color: #4ade80; }
        .log-status-400 { color: #facc15; }
        .log-status-500 { color: #ef4444; }

        .log-timestamp {
          color: var(--text-secondary, #b0b0b0);
          white-space: nowrap;
        }

        .user-agent-cell {
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          position: relative;
        }

        .user-agent-cell-tooltip {
          position: relative;
          cursor: help;
        }

        .user-agent-cell-tooltip:hover::after {
          content: attr(data-tooltip);
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.9);
          color: #fff;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 0.75rem;
          white-space: normal;
          width: 300px;
          z-index: 1000;
          margin-bottom: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.8);
          word-wrap: break-word;
          line-height: 1.4;
        }

        .btn-logout {
          background: rgba(100,100,100,0.6);
          color: #fff;
          font-size: 0.8rem;
          padding: 8px 16px;
        }

        @media (max-width: 768px) {
          .logs-table {
            font-size: 0.75rem;
          }

          .logs-table th,
          .logs-table td {
            padding: 8px;
          }

          .auth-form {
            flex-direction: column;
          }

          .logs-header {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }
        }
      `}</style>

      <div className="logs-viewer">
        <div className="logs-header">
          <h1 className="logs-title">📊 Request Logs</h1>
          {isAuthenticated && <button className="btn btn-logout" onClick={logout}>Logout</button>}
        </div>

        {!isAuthenticated ? (
          <div className="logs-auth">
            <h2 style={{ marginBottom: 16, color: 'var(--accent-cyan, #00d4ff)' }}>Enter Access Token</h2>
            <form onSubmit={handleTokenSubmit} className="auth-form">
              <input
                type="password"
                className="auth-input"
                placeholder="Enter ACCESS_TOKEN..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn btn-primary">
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </form>
            {error && <div className="logs-error">{error}</div>}
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #999)', marginBottom: 0 }}>
              Token is required to view logs. Ask your administrator for the ACCESS_TOKEN.
            </p>
          </div>
        ) : (
          <>
            <div className="logs-controls">
              <label>Limit:</label>
              <input
                type="number"
                min="10"
                max="1000"
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value) || 100)}
              />
              <button className="btn btn-primary" onClick={fetchLogs} disabled={loading}>
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {error && <div className="logs-error">{error}</div>}

            {loading && <div className="logs-loading">⏳ Loading logs...</div>}

            {!loading && logs.length === 0 && (
              <div className="logs-empty">No logs found. Perform some searches to generate logs.</div>
            )}

            {!loading && logs.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table className="logs-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Username</th>
                      <th>Endpoint</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>IP</th>
                      <th>User Agent</th>
                      <th>Time (ms)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td className="log-timestamp">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="log-username">{log.username || '—'}</td>
                        <td>{log.endpoint}</td>
                        <td>{log.method}</td>
                        <td className={`log-status-${log.status_code}`}>{log.status_code}</td>
                        <td>{log.requester_ip}</td>
                        <td>
                          <div className="user-agent-cell" title={log.user_agent || '—'}>
                            {log.user_agent || '—'}
                          </div>
                        </td>
                        <td>{log.response_time_ms}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
