import React from 'react';

const FLAIR_COLORS = [
    ['rgba(0,212,255,0.15)', '#00d4ff', 'rgba(0,212,255,0.3)'],
    ['rgba(0,255,136,0.12)', '#00ff88', 'rgba(0,255,136,0.25)'],
    ['rgba(157,78,221,0.15)', '#c77dff', 'rgba(157,78,221,0.3)'],
    ['rgba(255,159,28,0.15)', '#ff9f1c', 'rgba(255,159,28,0.25)'],
    ['rgba(255,51,102,0.12)', '#ff3366', 'rgba(255,51,102,0.2)'],
];

export default function FlairBadges({ flairs, loading }) {
    if (loading) return <Skeleton />;

    let data = [];
    if (flairs?.data && typeof flairs.data === 'object' && !Array.isArray(flairs.data)) {
        data = Object.entries(flairs.data).map(([sub, obj]) => ({
            subreddit: sub.replace(/^r\//, ''),
            flairs: Object.keys(obj || {})
        }));
    } else if (Array.isArray(flairs?.data)) {
        data = flairs.data;
    }

    if (!data.length) {
        return (
            <div className="card animate-fade-up" style={{ animationDelay: '0.35s', opacity: 0 }}>
                <div className="section-header">
                    <span className="section-icon">🏷</span>
                    <h2>Flair Identities</h2>
                </div>
                <div style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>🪪</div>
                    <p style={{ fontSize: '0.9rem' }}>No flair data found.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card animate-fade-up" style={{ animationDelay: '0.35s', opacity: 0 }}>
            <div className="section-header">
                <span className="section-icon">🏷</span>
                <h2>Flair Identities</h2>
                <span className="section-badge">{data.length}</span>
            </div>

            <div className="flair-grid">
                {data.map((entry, i) => {
                    const [bg, color, border] = FLAIR_COLORS[i % FLAIR_COLORS.length];
                    const flairList = Array.isArray(entry.flairs) ? entry.flairs : [];

                    return (
                        <div key={entry.subreddit || i} className="flair-group">
                            <div className="flair-subreddit">r/{entry.subreddit}</div>
                            <div className="flair-tags">
                                {flairList.slice(0, 5).map((f, j) => (
                                    <span
                                        key={j}
                                        className="flair-tag"
                                        style={{ background: bg, color, border: `1px solid ${border}` }}
                                    >
                                        {f.flair_text || f.text || f}
                                    </span>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <style>{`
        .flair-grid { display: flex; flex-direction: column; gap: 10px; }
        .flair-group {
          padding: 10px 12px; background: var(--bg-secondary);
          border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);
        }
        .flair-subreddit { font-size: 0.78rem; color: var(--text-muted); margin-bottom: 6px; font-family: var(--font-mono); }
        .flair-tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .flair-tag {
          padding: 3px 10px; border-radius: 20px;
          font-size: 0.75rem; font-weight: 500;
        }
      `}</style>
        </div>
    );
}

function Skeleton() {
    return (
        <div className="card">
            <div className="skeleton" style={{ height: 24, width: 160, marginBottom: 20 }} />
            {[...Array(4)].map((_, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                    <div className="skeleton" style={{ height: 12, width: 80, marginBottom: 8 }} />
                    <div style={{ display: 'flex', gap: 6 }}>
                        <div className="skeleton" style={{ height: 22, width: 70, borderRadius: 20 }} />
                        <div className="skeleton" style={{ height: 22, width: 90, borderRadius: 20 }} />
                    </div>
                </div>
            ))}
        </div>
    );
}
