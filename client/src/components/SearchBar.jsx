import React, { useState, useRef, useEffect } from 'react';

const RECENT_KEY = 're_recent_searches';

function normalizeRecent(item) {
  if (!item) return null;
  if (typeof item === 'string') {
    return { username: item, lastSearchedAt: Date.now() };
  }
  if (typeof item === 'object' && item.username) {
    return {
      username: item.username,
      lastSearchedAt: item.lastSearchedAt || Date.now(),
    };
  }
  return null;
}

function getRecent() {
  try {
    return (JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') || [])
      .map(normalizeRecent)
      .filter(Boolean)
      .sort((a, b) => (b.lastSearchedAt || 0) - (a.lastSearchedAt || 0));
  }
    catch { return []; }
}

function saveRecent(username) {
  const prev = getRecent().filter(u => u.username !== username);
  localStorage.setItem(
    RECENT_KEY,
    JSON.stringify([{ username, lastSearchedAt: Date.now() }, ...prev].slice(0, 8))
  );
}

function formatAgo(timestamp) {
  const diff = Math.max(0, Date.now() - timestamp);
  if (diff < 60_000) return 'just now';
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function SearchBar({ onSearch, loading, initialValue = '' }) {
    const [value, setValue] = useState('');
    const [recents, setRecents] = useState(getRecent());
    const [showRecent, setShowRecent] = useState(false);
    const inputRef = useRef(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'Escape') { setValue(''); inputRef.current?.blur(); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    function handleSubmit(e) {
        e.preventDefault();
        const clean = value.replace(/^u\//, '').trim();
        if (!clean) return;
        saveRecent(clean);
        setRecents(getRecent());
        setShowRecent(false);
        onSearch(clean);
    }

    function handleRecent(username) {
        setValue(username);
        setShowRecent(false);
        saveRecent(username);
        setRecents(getRecent());
        onSearch(username);
    }

    function clearRecent(e, username) {
        e.stopPropagation();
      const updated = getRecent().filter(u => u.username !== username);
        localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
        setRecents(updated);
    }

    return (
        <div className="search-bar-wrapper">
            <form onSubmit={handleSubmit} className="search-form">
                <div className="search-input-group">
                    <span className="search-icon">⌕</span>
                    <input
                        ref={inputRef}
                        id="username-search"
                        type="text"
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        onFocus={() => setShowRecent(true)}
                        onBlur={() => setTimeout(() => setShowRecent(false), 150)}
                        placeholder="Enter a Reddit username to expose..."
                        autoComplete="off"
                        spellCheck="false"
                        className="search-input"
                    />
                    {value && (
                        <button type="button" className="search-clear" onMouseDown={e => e.preventDefault()} onClick={() => setValue('')}>✕</button>
                    )}
                </div>
                <button type="submit" className="btn-primary search-btn" disabled={loading || !value.trim()}>
                    {loading ? <span className="search-loading">●●●</span> : 'EXPOSE'}
                </button>
            </form>

            {showRecent && recents.length > 0 && (
                <div className="recent-dropdown">
                    <p className="recent-label">Recent Searches</p>
                    {recents.map(u => (
                      <div
                        key={u.username}
                        className="recent-item"
                        onMouseDown={e => {
                          e.preventDefault();
                          handleRecent(u.username);
                        }}
                      >
                            <span className="recent-icon">⏱</span>
                            <span className="recent-username mono">u/{u.username}</span>
                            <span className="recent-time">{formatAgo(u.lastSearchedAt)}</span>
                        <button
                          type="button"
                          className="recent-clear"
                          onMouseDown={e => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onClick={e => clearRecent(e, u.username)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                </div>
            )}

            <style>{`
        .search-bar-wrapper { position: relative; width: 100%; max-width: 680px; }
        .search-form { display: flex; gap: 12px; align-items: center; }
        .search-input-group {
          flex: 1; position: relative; display: flex; align-items: center;
          background: linear-gradient(180deg, rgba(13,23,42,0.86) 0%, rgba(12,20,36,0.94) 100%);
          border: 1px solid rgba(90, 168, 255, 0.35);
          border-radius: 16px;
          backdrop-filter: blur(18px);
          transition: 0.2s;
          box-shadow: 0 8px 24px rgba(3, 7, 18, 0.34);
        }
        .search-input-group:focus-within {
          border-color: #7ddfff;
          box-shadow: 0 0 0 3px rgba(125, 223, 255, 0.14), 0 0 36px rgba(33, 212, 253, 0.13);
        }
        .search-icon {
          position: absolute; left: 18px;
          color: var(--accent-cyan); font-size: 1.4rem; pointer-events: none;
        }
        .search-input {
          width: 100%; background: transparent; border: none;
          padding: 16px 16px 16px 52px;
          font-size: 1rem; color: var(--text-primary);
          border-radius: 16px;
          font-family: var(--font-mono);
          letter-spacing: 0.3px;
        }
        .search-input::placeholder { color: var(--text-muted); font-family: var(--font-ui); }
        .search-input:focus { box-shadow: none; border: none; }
        .search-clear {
          position: absolute; right: 14px;
          background: transparent; border: none; color: var(--text-muted);
          cursor: pointer; font-size: 0.8rem; padding: 4px;
          transition: 0.15s;
        }
        .search-clear:hover { color: var(--text-primary); }
        .search-btn {
          padding: 16px 32px; font-size: 0.9rem; letter-spacing: 1.5px;
          border-radius: 16px; flex-shrink: 0;
          animation: glow-pulse 2s ease-in-out infinite;
          box-shadow: 0 10px 24px rgba(30, 169, 255, 0.26);
        }
        .search-btn:disabled { opacity: 0.6; cursor: not-allowed; animation: none; transform: none; }
        .search-loading { font-family: var(--font-mono); animation: pulse 0.8s ease-in-out infinite; }
        .recent-dropdown {
          position: absolute; top: calc(100% + 8px); left: 0;
          right: 0; background: var(--bg-card);
          border: 1px solid var(--border-accent);
          border-radius: var(--radius-md);
          overflow: hidden; z-index: 100;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          animation: fadeUp 0.15s ease;
        }
        .recent-label {
          font-size: 0.72rem; text-transform: uppercase; letter-spacing: 1px;
          color: var(--text-muted); padding: 10px 16px 6px;
        }
        .recent-item {
          display: flex; align-items: center; gap: 10px;
          width: 100%; padding: 10px 16px; cursor: pointer;
          transition: 0.15s; color: var(--text-secondary);
          font-size: 0.88rem;
          background: transparent; border: none; text-align: left;
        }
        .recent-item:hover { background: var(--accent-cyan-dim); color: var(--accent-cyan); }
        .recent-icon { font-size: 0.85rem; opacity: 0.5; flex-shrink: 0; }
        .recent-username { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
        .recent-time { font-size: 0.72rem; color: var(--text-muted); white-space: nowrap; flex-shrink: 0; }
        .recent-clear { background: transparent; border: none; color: var(--text-muted); font-size: 0.7rem; cursor: pointer; padding: 2px 4px; flex-shrink: 0; }
        .recent-clear:hover { color: var(--accent-red); }

        @media (max-width: 820px) {
          .search-form {
            gap: 8px;
          }

          .search-btn {
            padding: 12px 16px;
            font-size: 0.78rem;
            letter-spacing: 1px;
            border-radius: 12px;
          }

          .search-input {
            padding: 14px 14px 14px 46px;
            font-size: 0.92rem;
          }

          .search-icon {
            left: 14px;
            font-size: 1.15rem;
          }
        }

        @media (max-width: 560px) {
          .search-form {
            flex-direction: column;
            align-items: stretch;
          }

          .search-btn {
            width: 100%;
          }
        }
      `}</style>
        </div>
    );
}
