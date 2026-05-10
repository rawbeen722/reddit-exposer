import React, { useState } from 'react';

const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');
const BLACKLIST_ENDPOINT = API_BASE.endsWith('/api')
  ? `${API_BASE}/admin/blacklist`
  : `${API_BASE}/api/admin/blacklist`;

export default function AdminBlacklist() {
  const [token, setToken] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [blacklistedUsers, setBlacklistedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchBlacklist = async (e, tokenOverride) => {
    e?.preventDefault?.();
    const tokenToUse = (tokenOverride ?? token).trim();
    if (!tokenToUse) {
      setError('Please provide a valid token');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${BLACKLIST_ENDPOINT}?_=${Date.now()}`, {
        headers: {
          'x-access-token': tokenToUse,
          'cache-control': 'no-cache',
        },
      });

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
      setBlacklistedUsers(data.blacklist || []);
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
    if (token.trim()) {
      fetchBlacklist(e, token);
    }
  };

  const addUser = async (e) => {
    e.preventDefault();
    const username = newUsername.trim();
    if (!username) {
      setError('Please enter a username');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(BLACKLIST_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token,
        },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      setNewUsername('');
      setSuccess(`Added "${username}" to blacklist`);
      await fetchBlacklist(null, token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeUser = async (username) => {
    if (!confirm(`Remove "${username}" from blacklist?`)) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(BLACKLIST_ENDPOINT, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token,
        },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      setSuccess(`Removed "${username}" from blacklist`);
      await fetchBlacklist(null, token);
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
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="blacklist-container">
      <style>{`
        .blacklist-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
          padding: 40px 20px;
          font-family: var(--font-mono), monospace;
          color: var(--text-primary, #e0e0e0);
        }

        .blacklist-page {
          max-width: 1000px;
          margin: 0 auto;
        }

        .blacklist-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(0,212,255,0.2);
        }

        .blacklist-title {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: 2px;
          color: var(--accent-cyan, #00d4ff);
        }

        .blacklist-auth {
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

        .btn-primary:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-2px);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: rgba(200,50,50,0.8);
          color: #fff;
          font-size: 0.85rem;
          padding: 8px 16px;
        }

        .btn-secondary:hover {
          background: rgba(220,70,70,0.9);
        }

        .btn-logout {
          background: rgba(100,100,100,0.6);
          color: #fff;
          font-size: 0.8rem;
          padding: 8px 16px;
        }

        .error-message {
          background: rgba(220,50,50,0.15);
          border: 1px solid rgba(220,50,50,0.5);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
          color: #ff6b6b;
          font-size: 0.9rem;
        }

        .success-message {
          background: rgba(100,200,100,0.15);
          border: 1px solid rgba(100,200,100,0.5);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
          color: #4ade80;
          font-size: 0.9rem;
        }

        .add-user-form {
          background: rgba(19,19,31,0.8);
          border: 1px solid rgba(0,212,255,0.3);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 30px;
          backdrop-filter: blur(16px);
        }

        .add-user-form h2 {
          margin-bottom: 16px;
          color: var(--accent-cyan, #00d4ff);
          font-size: 1.1rem;
        }

        .add-user-input {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }

        .add-user-input input {
          flex: 1;
          padding: 12px 16px;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(0,212,255,0.25);
          border-radius: 8px;
          color: var(--text-primary, #e0e0e0);
          font-family: inherit;
          font-size: 0.95rem;
        }

        .add-user-input input:focus {
          outline: none;
          border-color: var(--accent-cyan, #00d4ff);
          box-shadow: 0 0 0 3px rgba(0,212,255,0.15);
        }

        .blacklist-table {
          width: 100%;
          border-collapse: collapse;
          background: rgba(19,19,31,0.6);
          border: 1px solid rgba(0,212,255,0.2);
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 30px;
        }

        .blacklist-table thead {
          background: rgba(0,212,255,0.1);
          border-bottom: 2px solid rgba(0,212,255,0.3);
        }

        .blacklist-table th {
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          font-size: 0.85rem;
          letter-spacing: 1px;
          color: var(--accent-cyan, #00d4ff);
          text-transform: uppercase;
        }

        .blacklist-table td {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(0,212,255,0.1);
          font-size: 0.9rem;
        }

        .blacklist-table tr:hover {
          background: rgba(0,212,255,0.05);
        }

        .username-cell {
          color: var(--accent-cyan, #00d4ff);
          font-weight: 600;
        }

        .date-cell {
          color: var(--text-secondary, #b0b0b0);
          font-size: 0.85rem;
        }

        .action-cell {
          text-align: right;
        }

        .blacklist-empty {
          text-align: center;
          padding: 60px 20px;
          color: var(--text-muted, #666);
          font-size: 1.1rem;
        }

        .blacklist-loading {
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

        @media (max-width: 768px) {
          .blacklist-table {
            font-size: 0.75rem;
          }

          .blacklist-table th,
          .blacklist-table td {
            padding: 8px;
          }

          .auth-form {
            flex-direction: column;
          }

          .add-user-input {
            flex-direction: column;
          }

          .blacklist-header {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }
        }
      `}</style>

      <div className="blacklist-page">
        <div className="blacklist-header">
          <h1 className="blacklist-title">🚫 Blacklist Manager</h1>
          {isAuthenticated && <button className="btn btn-logout" onClick={logout}>Logout</button>}
        </div>

        {!isAuthenticated ? (
          <div className="blacklist-auth">
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
            {error && <div className="error-message">{error}</div>}
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #999)', marginBottom: 0 }}>
              Token is required to manage blacklist. Ask your administrator for the ACCESS_TOKEN.
            </p>
          </div>
        ) : (
          <>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="add-user-form">
              <h2>➕ Add User to Blacklist</h2>
              <form onSubmit={addUser}>
                <div className="add-user-input">
                  <input
                    type="text"
                    placeholder="Enter username (e.g., john_doe)..."
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    disabled={loading}
                  />
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </form>
            </div>

            {loading && <div className="blacklist-loading">⏳ Loading...</div>}

            {!loading && blacklistedUsers.length === 0 && (
              <div className="blacklist-empty">No blacklisted users. The blacklist is empty.</div>
            )}

            {!loading && blacklistedUsers.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table className="blacklist-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Added</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blacklistedUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="username-cell">{user.username}</td>
                        <td className="date-cell">{new Date(user.created_at).toLocaleString()}</td>
                        <td className="action-cell">
                          <button
                            className="btn btn-secondary"
                            onClick={() => removeUser(user.username)}
                            disabled={loading}
                          >
                            Remove
                          </button>
                        </td>
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
