import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { computeActivityHour, computeActivityDay, formatNumber } from '../utils/formatters';

const HOUR_COLOR = '#00d4ff';
const DAY_COLOR = '#00ff88';
const DAY_COLORS = ['#ff3366', '#ff9f1c', '#ffd60a', '#00ff88', '#00d4ff', '#9d4edd', '#c77dff'];

export default function InsightsSummary({ posts, comments, subreddits, loading }) {
    if (loading) return <Skeleton />;

    const allItems = [...(posts || []), ...(comments || [])];
    const hourData = computeActivityHour(allItems);
    const dayData = computeActivityDay(allItems);

    const topSub = subreddits?.[0]?.subreddit ? `r/${subreddits[0].subreddit}` : 'N/A';
    const totalCount = (subreddits || []).reduce((s, d) => s + (d.count || 0), 0);
    const topSubPct = subreddits?.[0] && totalCount
        ? Math.round(((subreddits[0].count || 0) / totalCount) * 100)
        : 0;

    const peakHour = hourData.reduce((max, h) => h.count > max.count ? h : max, hourData[0] || { hour: '?', count: 0 });
    const peakDay = dayData.reduce((max, d) => d.count > max.count ? d : max, dayData[0] || { day: '?', count: 0 });

    const avgPostScore = posts?.length
        ? (posts.reduce((s, p) => s + (p.score || 0), 0) / posts.length).toFixed(1)
        : '0';
    const avgCommentScore = comments?.length
        ? (comments.reduce((s, c) => s + (c.score || 0), 0) / comments.length).toFixed(1)
        : '0';

    const nsfwPosts = (posts || []).filter(p => p.over_18).length;
    const nsfwPct = posts?.length ? Math.round((nsfwPosts / posts.length) * 100) : 0;

    const postRatio = allItems.length
        ? Math.round(((posts?.length || 0) / allItems.length) * 100)
        : 0;

    const pieData = [
        { name: 'Posts', value: posts?.length || 0, color: '#00d4ff' },
        { name: 'Comments', value: comments?.length || 0, color: '#00ff88' },
    ];

    return (
        <div className="card animate-fade-up full-col" style={{ animationDelay: '0.4s', opacity: 0 }}>
            <div className="section-header">
                <span className="section-icon">🧠</span>
                <h2>Behavioral Insights</h2>
            </div>

            <div className="insights-grid">
                {/* Quick stats */}
                <div className="insights-stats stagger">
                    <StatItem label="Top Community" value={topSub} sub={topSubPct ? `${topSubPct}% of activity` : ''} color="var(--accent-cyan)" />
                    <StatItem label="Peak Hour (UTC)" value={peakHour.hour} sub={`${peakHour.count} actions`} color="var(--accent-green)" />
                    <StatItem label="Peak Day" value={peakDay.day} sub={`${peakDay.count} actions`} color="var(--accent-purple)" />
                    <StatItem label="Avg Post Score" value={avgPostScore} color="var(--accent-orange)" />
                    <StatItem label="Avg Comment Score" value={avgCommentScore} color="var(--accent-yellow)" />
                    <StatItem label="NSFW Posts" value={`${nsfwPct}%`} sub={`${nsfwPosts} posts`} color={nsfwPct > 30 ? 'var(--accent-red)' : 'var(--text-secondary)'} />
                </div>

                {/* Post/Comment ratio pie */}
                {allItems.length > 0 && (
                    <div className="insights-chart-mini">
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                            Post vs Comment Ratio
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <PieChart width={100} height={100}>
                                <Pie data={pieData} innerRadius={30} outerRadius={46} dataKey="value" strokeWidth={0}>
                                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                                </Pie>
                            </PieChart>
                            <div>
                                {pieData.map(d => (
                                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                            {d.name}: <span className="mono" style={{ color: d.color }}>{formatNumber(d.value)}</span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Activity by hour */}
                {allItems.length > 0 && (
                    <div className="insights-chart">
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                            Activity by Hour (UTC)
                        </p>
                        <ResponsiveContainer width="100%" height={100}>
                            <BarChart data={hourData} margin={{ top: 0, right: 0, bottom: 0, left: -30 }}>
                                <XAxis dataKey="hour" tick={false} axisLine={false} tickLine={false} />
                                <YAxis tick={false} axisLine={false} tickLine={false} />
                                <Tooltip content={<HourTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                <Bar dataKey="count" fill={HOUR_COLOR} radius={[2, 2, 0, 0]} opacity={0.8} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Activity by day */}
                {allItems.length > 0 && (
                    <div className="insights-chart">
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                            Activity by Day (UTC)
                        </p>
                        <ResponsiveContainer width="100%" height={100}>
                            <BarChart data={dayData} margin={{ top: 0, right: 0, bottom: 0, left: -30 }}>
                                <XAxis dataKey="day" tick={{ fill: '#8892b0', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis tick={false} axisLine={false} tickLine={false} />
                                <Tooltip content={<DayTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                                    {dayData.map((_, i) => <Cell key={i} fill={DAY_COLORS[i]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            <style>{`
        .insights-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 16px;
        }
        .insights-stats {
          display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
          grid-column: span 2;
        }
        .insights-chart-mini { grid-column: span 1; }
        .insights-chart { grid-column: span 1; }
        @media (max-width: 900px) {
          .insights-grid { grid-template-columns: 1fr 1fr; }
          .insights-stats { grid-column: span 2; }
          .insights-chart-mini { grid-column: span 1; }
          .insights-chart { grid-column: span 1; }
        }
        @media (max-width: 600px) {
          .insights-grid { grid-template-columns: 1fr; }
          .insights-stats, .insights-chart-mini, .insights-chart { grid-column: span 1; }
        }
      `}</style>
        </div>
    );
}

function StatItem({ label, value, sub, color }) {
    return (
        <div className="animate-fade-up" style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)', padding: '12px', opacity: 0,
        }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: color || 'var(--accent-cyan)', marginBottom: 2 }}>
                {value}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>{label}</div>
            {sub && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
        </div>
    );
}

function HourTooltip({ active, payload, label }) {
    if (!active || !payload?.[0]) return null;
    return <div className="custom-tooltip"><span style={{ color: '#00d4ff' }}>{label}</span> — {payload[0].value} actions</div>;
}

function DayTooltip({ active, payload, label }) {
    if (!active || !payload?.[0]) return null;
    return <div className="custom-tooltip"><span style={{ color: '#00ff88' }}>{label}</span> — {payload[0].value} actions</div>;
}

function Skeleton() {
    return (
        <div className="card full-col">
            <div className="skeleton" style={{ height: 24, width: 200, marginBottom: 20 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: 60, borderRadius: 10 }} />
                ))}
            </div>
        </div>
    );
}
