import React, { useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { formatNumber } from '../utils/formatters';

const COLORS = [
    '#00d4ff', '#00ff88', '#9d4edd', '#ff9f1c', '#ff3366',
    '#4cc9f0', '#7bed9f', '#f8b500', '#ff6b9d', '#c77dff',
    '#0096c7', '#48cae4', '#80b918', '#e63946', '#f4a261',
];

export default function SubredditBreakdown({ subreddits, loading, onSubredditClick, activeFilter }) {
    const [showAll, setShowAll] = useState(false);
    const [view, setView] = useState('bar');

    if (loading) return <Skeleton />;

    const data = subreddits || [];
    const topData = showAll || view === 'bar' ? data : data.slice(0, 20);
    const totalCount = data.reduce((s, d) => s + (d.count || 0), 0);
    const chartHeight = Math.max(260, topData.length * 34 + 20);

    const chartData = topData.map((s, i) => ({
        name: s.subreddit,
        count: s.count || 0,
        pct: totalCount ? Math.round((s.count / totalCount) * 100) : 0,
        fill: COLORS[i % COLORS.length],
    }));

    if (!data.length) {
        return (
            <div className="card animate-fade-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
                <div className="section-header">
                    <span className="section-icon">🌐</span>
                    <h2>Active Subreddits</h2>
                </div>
                <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>🏜</div>
                    <p style={{ fontSize: '0.9rem' }}>No subreddit activity found.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card animate-fade-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
            <div className="section-header">
                <span className="section-icon">🌐</span>
                <h2>Active Subreddits</h2>
                <span className="section-badge">{data.length}</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                    <button className={`btn-ghost ${view === 'bar' ? 'active' : ''}`} onClick={() => setView('bar')} style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
                        ▌▌ Bar
                    </button>
                    <button className={`btn-ghost ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')} style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
                        ≡ List
                    </button>
                </div>
            </div>

            {view === 'bar' && (
                <div style={{ marginBottom: 16, maxHeight: 560, overflowY: 'auto', overflowX: 'hidden' }}>
                    <ResponsiveContainer width="100%" height={chartHeight}>
                        <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 72, top: 4, bottom: 4 }} barCategoryGap={8}>
                            <XAxis type="number" hide />
                            <YAxis
                                type="category" dataKey="name" width={150}
                                tick={{ fill: '#8892b0', fontSize: 12, fontFamily: 'JetBrains Mono' }}
                                tickFormatter={v => `r/${v}`}
                            />
                            <Tooltip content={<CustomTooltip total={totalCount} />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                {chartData.map((entry, i) => (
                                    <Cell key={i} fill={entry.name === activeFilter ? '#fff' : entry.fill} opacity={activeFilter && entry.name !== activeFilter ? 0.4 : 1} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {view === 'list' && (
                <div className="scroll-list" style={{ maxHeight: 420 }}>
                    {topData.map((s, i) => {
                        const pct = totalCount ? Math.round((s.count / totalCount) * 100) : 0;
                        const isActive = activeFilter === s.subreddit;
                        return (
                            <div
                                key={s.subreddit}
                                className={`sub-row ${isActive ? 'sub-row-active' : ''}`}
                                onClick={() => onSubredditClick && onSubredditClick(s.subreddit)}
                                style={{ cursor: onSubredditClick ? 'pointer' : 'default' }}
                            >
                                <span className="sub-rank mono">{i + 1}</span>
                                <span className="sub-name mono">r/{s.subreddit}</span>
                                <div className="sub-bar-outer">
                                    <div className="sub-bar-inner" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                                </div>
                                <span className="sub-count mono">{formatNumber(s.count)}</span>
                                <span className="sub-pct">{pct}%</span>
                            </div>
                        );
                    })}
                </div>
            )}

            {!showAll && data.length > 20 && view === 'list' && (
                <button className="btn-ghost" style={{ width: '100%', marginTop: 12, padding: '10px' }} onClick={() => setShowAll(true)}>
                    Show all {data.length} subreddits ↓
                </button>
            )}

            <style>{`
        .sub-row {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 10px; border-radius: var(--radius-sm);
          transition: 0.15s; background: var(--bg-secondary);
          border: 1px solid var(--border-subtle);
        }
        .sub-row:hover { background: var(--bg-card-hover); border-color: rgba(0,212,255,0.2); }
        .sub-row-active { border-color: var(--accent-cyan) !important; background: var(--accent-cyan-dim) !important; }
        .sub-rank { color: var(--text-muted); font-size: 0.78rem; width: 20px; flex-shrink: 0; }
        .sub-name { font-size: 0.82rem; color: var(--accent-cyan); min-width: 120px; }
        .sub-bar-outer { flex: 1; height: 4px; background: rgba(255,255,255,0.06); border-radius: 2px; overflow: hidden; }
        .sub-bar-inner { height: 100%; border-radius: 2px; transition: width 0.5s ease; }
        .sub-count { font-size: 0.78rem; color: var(--text-primary); width: 36px; text-align: right; }
        .sub-pct { font-size: 0.72rem; color: var(--text-muted); width: 32px; text-align: right; }
      `}</style>
        </div>
    );
}

function CustomTooltip({ active, payload }) {
    if (!active || !payload?.[0]) return null;
    const d = payload[0].payload;
    return (
        <div className="custom-tooltip">
            <div style={{ color: d.fill, marginBottom: 4 }}>r/{d.name}</div>
            <div>{formatNumber(d.count)} interactions ({d.pct}%)</div>
        </div>
    );
}

function Skeleton() {
    return (
        <div className="card">
            <div className="skeleton" style={{ height: 24, width: 200, marginBottom: 20 }} />
            {[...Array(8)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 20, marginBottom: 10, width: `${90 - i * 7}%` }} />
            ))}
        </div>
    );
}
