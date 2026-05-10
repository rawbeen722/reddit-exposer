import React, { useState } from 'react';
import { formatDate, formatNumber, formatRelative, truncate } from '../utils/formatters';

export default function PostsList({ posts, loading, onLoadMore, hasMore, subreddits = [] }) {
    const [filter, setFilter] = useState('');
    const [sort, setSort] = useState('newest');
    const [query, setQuery] = useState('');
    const [minScore, setMinScore] = useState('');
    const [expanded, setExpanded] = useState({});

    if (loading && !posts.length) return <PostsSkeleton />;

    const filtered = [...(posts || [])]
        .filter(p => !filter || p.subreddit?.toLowerCase() === filter.toLowerCase())
        .filter(p => !query || `${p.title || ''} ${p.selftext || ''}`.toLowerCase().includes(query.toLowerCase()))
        .filter(p => minScore === '' || (p.score || 0) >= Number(minScore))
        .sort((a, b) => {
            if (sort === 'newest') return b.created_utc - a.created_utc;
            if (sort === 'oldest') return a.created_utc - b.created_utc;
            if (sort === 'score') return (b.score || 0) - (a.score || 0);
            return 0;
        });

    return (
        <div className="card animate-fade-up" style={{ animationDelay: '0.15s', opacity: 0 }}>
            <div className="section-header">
                <span className="section-icon">📄</span>
                <h2>Posts</h2>
                <span className="section-badge">{formatNumber(posts?.length || 0)}</span>
            </div>

            <div className="list-controls">
                <input
                    type="text"
                    placeholder="Search titles / text..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    style={{ flex: 2, minWidth: 180 }}
                />
                <select
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    style={{ flex: 1 }}
                >
                    <option value="">All Subreddits</option>
                    {subreddits.slice(0, 40).map(s => (
                        <option key={s.subreddit} value={s.subreddit}>r/{s.subreddit}</option>
                    ))}
                </select>
                <Select value={sort} onChange={setSort} options={[
                    { value: 'newest', label: 'Newest' },
                    { value: 'oldest', label: 'Oldest' },
                    { value: 'score', label: 'Top Score' },
                ]} />
                <input
                    type="number"
                    min="0"
                    placeholder="Min score"
                    value={minScore}
                    onChange={e => setMinScore(e.target.value)}
                    style={{ width: 110 }}
                />
            </div>

            {filtered.length === 0 && !loading ? (
                <EmptyState
                    message={query || filter || minScore !== ''
                        ? 'No posts match the current filters.'
                        : 'No posts found.'}
                    hint="Try clearing filters or loading more results."
                />
            ) : (
                <div className="scroll-list">
                    {filtered.map((post, i) => (
                        <PostCard
                            key={post.id || i}
                            post={post}
                            expanded={expanded[post.id]}
                            onToggle={() => setExpanded(p => ({ ...p, [post.id]: !p[post.id] }))}
                        />
                    ))}
                    {loading && <MiniLoader />}
                    {!loading && hasMore && (
                        <button className="btn-ghost load-more-btn" onClick={onLoadMore}>
                            Load More Posts ↓
                        </button>
                    )}
                </div>
            )}

            <style>{`
                .list-controls { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
                .list-controls select, .list-controls input { font-size: 0.85rem; padding: 8px 12px; }
        .load-more-btn { width: 100%; margin-top: 8px; padding: 12px; }
      `}</style>
        </div>
    );
}

function PostCard({ post, expanded, onToggle }) {
    const score = post.score || 0;
    const redditLink = `https://reddit.com/r/${post.subreddit}/comments/${post.id}`;

    return (
        <div className="post-card">
            <div className="post-card-header">
                <div className="post-card-badges">
                    <span className="badge badge-sub">r/{post.subreddit}</span>
                    {post.over_18 && <span className="badge badge-nsfw">NSFW</span>}
                    {post.spoiler && <span className="badge badge-spoiler">SPOILER</span>}
                </div>
                <span className="post-date">{formatRelative(post.created_utc)}</span>
            </div>
            <a href={redditLink} target="_blank" rel="noopener noreferrer" className="post-title">
                {post.title}
            </a>
            {post.selftext && (
                <div className="post-selftext">
                    {expanded ? post.selftext : truncate(post.selftext, 160)}
                    {post.selftext.length > 160 && (
                        <button className="expand-btn" onClick={onToggle}>
                            {expanded ? ' Show less' : ' Show more'}
                        </button>
                    )}
                </div>
            )}
            <div className="post-card-footer">
                <span className={`score ${score > 0 ? 'positive' : 'neutral'}`}>
                    ▲ {formatNumber(score)}
                </span>
                <span className="post-stat">💬 {formatNumber(post.num_comments || 0)}</span>
                <span className="post-date">{formatDate(post.created_utc)}</span>
            </div>
            <style>{`
        .post-card {
          background: var(--bg-secondary); border-radius: var(--radius-md);
          padding: 14px; border: 1px solid var(--border-subtle);
          transition: 0.15s;
        }
        .post-card:hover { border-color: rgba(0,212,255,0.2); }
        .post-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 6px; }
        .post-card-badges { display: flex; gap: 6px; flex-wrap: wrap; }
        .post-date { font-size: 0.75rem; color: var(--text-muted); flex-shrink: 0; }
        .post-title {
          display: block; font-size: 0.9rem; font-weight: 500;
          color: var(--text-primary); text-decoration: none;
          line-height: 1.4; margin-bottom: 8px;
          transition: 0.15s;
        }
        .post-title:hover { color: var(--accent-cyan); }
        .post-selftext { font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5; }
        .expand-btn { background: none; border: none; color: var(--accent-cyan); font-size: 0.8rem; cursor: pointer; padding: 0; }
        .post-card-footer { display: flex; align-items: center; gap: 14px; margin-top: 8px; }
        .post-stat { font-size: 0.8rem; color: var(--text-muted); }
      `}</style>
        </div>
    );
}

function Select({ value, onChange, options }) {
    return (
        <select value={value} onChange={e => onChange(e.target.value)} style={{ fontSize: '0.85rem', padding: '8px 36px 8px 12px' }}>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    );
}

function PostsSkeleton() {
    return (
        <div className="card">
            <div className="skeleton" style={{ height: 24, width: 120, marginBottom: 20 }} />
            {[...Array(5)].map((_, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                    <div className="skeleton" style={{ height: 14, width: '30%', marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 18, width: '90%', marginBottom: 6 }} />
                    <div className="skeleton" style={{ height: 12, width: '60%' }} />
                </div>
            ))}
        </div>
    );
}

function EmptyState({ message, hint }) {
    return (
        <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>📭</div>
            <p style={{ fontSize: '0.9rem' }}>{message}</p>
            {hint && <p style={{ fontSize: '0.78rem', marginTop: 6 }}>{hint}</p>}
        </div>
    );
}

function MiniLoader() {
    return (
        <div style={{ textAlign: 'center', padding: '12px', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', animation: 'pulse 1s ease-in-out infinite' }}>
            Loading...
        </div>
    );
}
