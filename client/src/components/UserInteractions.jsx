import React from 'react';
import { generateAvatarColor, formatNumber } from '../utils/formatters';

export default function UserInteractions({ interactions, loading, onUserClick }) {
    if (loading) return <Skeleton />;

    const data = interactions?.data || [];

    return (
        <div className="card animate-fade-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
            <div className="section-header">
                <span className="section-icon">🤝</span>
                <h2>Top Interactions</h2>
                <span className="section-badge">{data.length}</span>
            </div>

            {data.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="scroll-list" style={{ maxHeight: 380 }}>
                    {data.slice(0, 25).map((item, i) => {
                        const username = item.author || item.user || item.name || '';
                        const count = item.count || 0;
                        const color = generateAvatarColor(username);
                        return (
                            <div
                                key={username || i}
                                className="interaction-row"
                                onClick={() => onUserClick && username && onUserClick(username)}
                                style={{ cursor: onUserClick && username ? 'pointer' : 'default' }}
                            >
                                <div className="interaction-rank mono">{i + 1}</div>
                                <div className="interaction-avatar" style={{ background: color }}>
                                    {username ? username[0].toUpperCase() : '?'}
                                </div>
                                <div className="interaction-info">
                                    <span className="interaction-user mono">u/{username || 'unknown'}</span>
                                    {item.subreddit && (
                                        <span className="interaction-sub">in r/{item.subreddit}</span>
                                    )}
                                </div>
                                <div className="interaction-count">
                                    <span className="mono">{formatNumber(count)}</span>
                                    <span className="interaction-label">interactions</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <style>{`
        .interaction-row {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 12px; border-radius: var(--radius-sm);
          background: var(--bg-secondary); border: 1px solid var(--border-subtle);
          transition: 0.15s;
        }
        .interaction-row:hover { border-color: rgba(0,212,255,0.25); background: var(--bg-card-hover); }
        .interaction-rank { color: var(--text-muted); font-size: 0.78rem; width: 20px; flex-shrink: 0; text-align: right; }
        .interaction-avatar {
          width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.85rem; font-weight: 700; color: #fff;
        }
        .interaction-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .interaction-user { font-size: 0.88rem; color: var(--accent-cyan); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .interaction-sub { font-size: 0.75rem; color: var(--text-muted); }
        .interaction-count { text-align: right; display: flex; flex-direction: column; align-items: flex-end; }
        .interaction-count .mono { font-size: 0.9rem; color: var(--text-primary); font-weight: 600; }
        .interaction-label { font-size: 0.68rem; color: var(--text-muted); }
      `}</style>
        </div>
    );
}

function EmptyState() {
    return (
        <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>🤷</div>
            <p style={{ fontSize: '0.9rem' }}>No interaction data available.</p>
        </div>
    );
}

function Skeleton() {
    return (
        <div className="card">
            <div className="skeleton" style={{ height: 24, width: 160, marginBottom: 20 }} />
            {[...Array(6)].map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'center' }}>
                    <div className="skeleton" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
                    <div className="skeleton" style={{ flex: 1, height: 14 }} />
                    <div className="skeleton" style={{ width: 40, height: 14 }} />
                </div>
            ))}
        </div>
    );
}
