import React, { useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid
} from 'recharts';

export default function ActivityTimeline({ activity, loading }) {
    const [freq, setFreq] = useState('month');

    if (loading) return <Skeleton />;

    const postData = activity?.posts?.data || [];
    const commentData = activity?.comments?.data || [];

    // Build merged timeline keyed by date
    const map = {};
    postData.forEach(d => {
        const key = d.created_utc || d.date || d.period;
        if (!map[key]) map[key] = { date: key, posts: 0, comments: 0 };
        map[key].posts = d.count || 0;
    });
    commentData.forEach(d => {
        const key = d.created_utc || d.date || d.period;
        if (!map[key]) map[key] = { date: key, posts: 0, comments: 0 };
        map[key].comments = d.count || 0;
    });

    const chartData = Object.values(map)
        .sort((a, b) => String(a.date).localeCompare(String(b.date)))
        .map(d => ({
            ...d,
            label: formatDateLabel(d.date, freq),
        }));

    return (
        <div className="card animate-fade-up" style={{ animationDelay: '0.25s', opacity: 0 }}>
            <div className="section-header">
                <span className="section-icon">📈</span>
                <h2>Activity Timeline</h2>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                    {['month', 'week', 'day'].map(f => (
                        <button
                            key={f}
                            className={`btn-ghost ${freq === f ? 'active' : ''}`}
                            style={{ padding: '4px 10px', fontSize: '0.78rem', textTransform: 'capitalize' }}
                            onClick={() => setFreq(f)}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {chartData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No timeline data available yet.
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="postsGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="commentsGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis
                            dataKey="label"
                            tick={{ fill: '#8892b0', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                            interval="preserveStartEnd"
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            tick={{ fill: '#8892b0', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            wrapperStyle={{ fontSize: '0.8rem', color: '#8892b0', paddingTop: 8, fontFamily: 'Space Grotesk' }}
                        />
                        <Area type="monotone" dataKey="posts" stroke="#00d4ff" strokeWidth={2} fill="url(#postsGrad)" dot={false} activeDot={{ r: 4, fill: '#00d4ff' }} />
                        <Area type="monotone" dataKey="comments" stroke="#00ff88" strokeWidth={2} fill="url(#commentsGrad)" dot={false} activeDot={{ r: 4, fill: '#00ff88' }} />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}

function formatDateLabel(raw, freq) {
    if (!raw) return '';
    const str = String(raw);
    // epoch seconds
    if (/^\d{10}$/.test(str)) {
        const d = new Date(parseInt(str) * 1000);
        if (freq === 'month') return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    // ISO or year-month string
    if (str.length >= 7) {
        return str.slice(0, 7);
    }
    return str;
}

function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="custom-tooltip">
            <div style={{ color: 'var(--accent-cyan)', marginBottom: 4, fontWeight: 600 }}>{label}</div>
            {payload.map(p => (
                <div key={p.dataKey} style={{ color: p.color }}>
                    {p.dataKey}: {p.value}
                </div>
            ))}
        </div>
    );
}

function Skeleton() {
    return (
        <div className="card">
            <div className="skeleton" style={{ height: 24, width: 180, marginBottom: 20 }} />
            <div className="skeleton" style={{ height: 200, borderRadius: 8 }} />
        </div>
    );
}
