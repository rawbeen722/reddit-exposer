import React, { useState } from 'react';

const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');
const ADMIN_ENDPOINT = API_BASE.endsWith('/api')
  ? `${API_BASE}/admin/blacklist`
  : `${API_BASE}/api/admin/blacklist`;

export default function AdminPanel() {
  const [token, setToken] = useState('');
  const [blacklistedUsers, setBlacklistedUsers] = useState([]);
  const [username, setUsername] = useState('');
  const [reason, setReason] = useState('');
  const [limit, setLimit] = useState(500);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const authHeaders = (tokenValue) => ({
    'x-access-token': tokenValue,
    'cache-control': 'no-cache',
  });

  const fetchBlacklist = async (e, tokenOverride) => {
    e?.preventDefault?.();
    const tokenToUse = (tokenOverride ?? token).trim();
    if (!tokenToUse) {
      setError('Please provide a valid access token');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`${ADMIN_ENDPOINT}?limit=${limit}&_=${Date.now()}`, {
        headers: authHeaders(tokenToUse),
      });

      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await response.json() : null;

      if (!response.ok) {
        throw new Error(data?.error || `HTTP ${response.status}`);
      }

      setBlacklistedUsers(data?.users || []);
      setIsAuthenticated(true);
    } catch (err) {
      setError(err.message);
      setBlacklistedUsers([]);
      if (tokenOverride) setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleTokenSubmit = (e) => {
    e.preventDefault();
    if (token.trim()) fetchBlacklist(e, token);
  };

  const addToBlacklist = async (e) => {
    e.preventDefault();
    const cleanUsername = username.replace(/^u\//i, '').trim();
    if (!cleanUsername) {
      setError('Username is required');
      return;
    }
    if (!token.trim()) {
      setError('Please authenticate first');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(ADMIN_ENDPOINT, {
        method: 'POST',
        headers: {
          ...authHeaders(token.trim()),
          'content-type': 'application/json',
        },
        body: JSON.stringify({ username: cleanUsername, reason }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || `HTTP ${response.status}`);

      setMessage(`Added ${data.user.username} to blacklist`);
      setUsername('');
      setReason('');
      await fetchBlacklist(undefined, token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeFromBlacklist = async (user) => {
    if (!token.trim()) {
      setError('Please authenticate first');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`${ADMIN_ENDPOINT}/${encodeURIComponent(user.username)}`, {
        method: 'DELETE',
        headers: authHeaders(token.trim()),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || `HTTP ${response.status}`);

      setMessage(`Removed ${user.username} from blacklist`);
      await fetchBlacklist(undefined, token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken('');
    setIsAuthenticated(false);
    setBlacklistedUsers([]);
    setUsername('');
    setReason('');
    setError(null);
    setMessage(null);
  };

  return (
    <div className="admin-viewer-container">
      <style>{`
        .admin-viewer-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
          padding: 40px 20px;
          font-family: var(--font-mono), monospace;
          color: var(--text-primary, #e0e0e0);
        }

        .admin-viewer {
          max-width: 1200px;
          margin: 0 auto;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(0,212,255,0.2);
        }

        .admin-title {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: 2px;
          color: var(--accent-cyan, #00d4ff);
        }

        .panel {
          background: rgba(19,19,31,0.8);
          border: 1px solid rgba(0,212,255,0.3);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          backdrop-filter: blur(16px);
        }

        .form-row {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .input {
          flex: 1;
          min-width: 220px;
          padding: 12px 16px;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(0,212,255,0.25);
          border-radius: 8px;
          color: var(--text-primary, #e0e0e0);
          font-family: inherit;
          font-size: 0.95rem;
        }

        .input:focus {
          outline: none;
          border-color: var(--accent-cyan, #00d4ff);
          box-shadow: 0 0 0 3px rgba(0,212,255,0.15);
        }

        .btn {
          padding: 12px 20px;
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

        .btn-danger {
          background: rgba(220,50,50,0.85);
          color: #fff;
        }

        .btn:hover { opacity: 0.92; transform: translateY(-1px); }

        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        @media (max-width: 900px) {
          .grid { grid-template-columns: 1fr; }
          .admin-header { flex-direction: column; gap: 12px; align-items: flex-start; }
          .form-row { flex-direction: column; }
        }

        .list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 16px;
        }

        .list-item {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
          padding: 12px 14px;
          background: rgba(0,0,0,0.18);
          border: 1px solid rgba(0,212,255,0.12);
          border-radius: 10px;
        }

        .muted { color: var(--text-muted, #8b8b8b); font-size: 0.85rem; }
        .error-box {
          background: rgba(220,50,50,0.15);
          border: 1px solid rgba(220,50,50,0.5);
          border-radius: 8px;
          padding: 14px;
          margin-bottom: 16px;
          color: #ff6b6b;
        }
        .message-box {
          background: rgba(74,222,128,0.12);
          border: 1px solid rgba(74,222,128,0.4);
          border-radius: 8px;
          padding: 14px;
          margin-bottom: 16px;
          color: #4ade80;
        }
        .topbar {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }
      `}</style>

      <div className="admin-viewer">
        <div className="admin-header">
          <h1 className="admin-title">🛡 Blacklist Admin</h1>
          {isAuthenticated && <button className="btn btn-primary" onClick={logout}>Logout</button>}
        </div>

        {!isAuthenticated ? (
          <div className="panel">
            <h2 style={{ marginBottom: 16, color: 'var(--accent-cyan, #00d4ff)' }}>Enter Access Token</h2>
            <form onSubmit={handleTokenSubmit} className="form-row">
              <input
                type="password"
                className="input"
                placeholder="Enter ACCESS_TOKEN..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn btn-primary">{loading ? 'Verifying...' : 'Verify'}</button>
            </form>
            {error && <div className="error-box">{error}</div>}
            <p className="muted" style={{ marginBottom: 0 }}>
              Hidden route: /admin. Requires your ACCESS_TOKEN.
            </p>
          </div>
        ) : (
          <div className="grid">
            <div className="panel">
              <h2 style={{ marginBottom: 16, color: 'var(--accent-cyan, #00d4ff)' }}>Add User to Blacklist</h2>
              <form onSubmit={addToBlacklist}>
                <div className="form-row">
                  <input
                    type="text"
                    className="input"
                    placeholder="Reddit username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <input
                    type="text"
                    className="input"
                    placeholder="Reason (optional)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-danger">{loading ? 'Saving...' : 'Blacklist User'}</button>
              </form>
              {error && <div className="error-box" style={{ marginTop: 16 }}>{error}</div>}
              {message && <div className="message-box" style={{ marginTop: 16 }}>{message}</div>}
            </div>

            <div className="panel">
              <div className="topbar">
                <h2 style={{ margin: 0, color: 'var(--accent-cyan, #00d4ff)' }}>Blacklisted Users</h2>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <label className="muted">Limit</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    className="input"
                    style={{ width: 110, minWidth: 110, flex: '0 0 auto' }}
                    value={limit}
                    onChange={(e) => setLimit(parseInt(e.target.value) || 500)}
                  />
                  <button className="btn btn-primary" onClick={fetchBlacklist} disabled={loading}>
                    {loading ? 'Loading...' : 'Refresh'}
                  </button>
                </div>
              </div>

              {error && <div className="error-box">{error}</div>}
              {message && <div className="message-box">{message}</div>}

              <div className="list">
                {blacklistedUsers.length === 0 ? (
                  <div className="muted">No blacklisted users yet.</div>
                ) : (
                  blacklistedUsers.map((user) => (
                    <div key={user.username} className="list-item">
                      <div>
                        <div style={{ color: 'var(--accent-cyan, #00d4ff)', fontWeight: 700 }}>u/{user.username}</div>
                        <div className="muted">{user.reason || 'No reason provided'}</div>
                        <div className="muted">{new Date(user.created_at).toLocaleString()}</div>
                      </div>
                      <button className="btn btn-danger" onClick={() => removeFromBlacklist(user)} disabled={loading}>
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
