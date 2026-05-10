import React, { useState } from 'react';
import { formatDate, formatNumber, formatRelative, truncate } from '../utils/formatters';

export default function CommentsList({ comments, loading, onLoadMore, hasMore, subreddits = [] }) {
    const [filter, setFilter] = useState('');
    const [sort, setSort] = useState('newest');
    const [keyword, setKeyword] = useState('');
    const [minScore, setMinScore] = useState('');
    const [expanded, setExpanded] = useState({});

    if (loading && !comments.length) return <CommentsSkeleton />;

    const filtered = [...(comments || [])]
        .filter(c => !filter || c.subreddit?.toLowerCase() === filter.toLowerCase())
        .filter(c => !keyword || c.body?.toLowerCase().includes(keyword.toLowerCase()))
        .filter(c => minScore === '' || (c.score || 0) >= Number(minScore))
        .sort((a, b) => {
            if (sort === 'newest') return b.created_utc - a.created_utc;
            if (sort === 'oldest') return a.created_utc - b.created_utc;
            if (sort === 'score') return (b.score || 0) - (a.score || 0);
            return 0;
        });

    return (
        <div className="card animate-fade-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
            <div className="section-header">
                <span className="section-icon">💬</span>
                <h2>Comments</h2>
                <span className="section-badge">{formatNumber(comments?.length || 0)}</span>
            </div>

            <div className="list-controls" style={{ flexWrap: 'wrap' }}>
                <input
                    type="text"
                    placeholder="Search comments..."
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                    style={{ flex: 2, minWidth: 140, fontSize: '0.85rem', padding: '8px 12px' }}
                />
                <select
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    style={{ flex: 1, minWidth: 120, fontSize: '0.85rem', padding: '8px 36px 8px 12px' }}
                >
                    <option value="">All Subreddits</option>
                    {subreddits.slice(0, 40).map(s => (
                        <option key={s.subreddit} value={s.subreddit}>r/{s.subreddit}</option>
                    ))}
                </select>
                <select
                    value={sort}
                    onChange={e => setSort(e.target.value)}
                    style={{ flex: 1, minWidth: 110, fontSize: '0.85rem', padding: '8px 36px 8px 12px' }}
                >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="score">Top Score</option>
                </select>
                <input
                    type="number"
                    min="0"
                    placeholder="Min score"
                    value={minScore}
                    onChange={e => setMinScore(e.target.value)}
                    style={{ flex: 1, minWidth: 110, fontSize: '0.85rem', padding: '8px 12px' }}
                />
            </div>

            {filtered.length === 0 && !loading ? (
                <EmptyState
                    message={keyword || filter || minScore !== ''
                        ? 'No comments match the current filters.'
                        : 'No comments found.'}
                    hint="Try a different keyword or clear the filters."
                />
            ) : (
                <div className="scroll-list">
                    {filtered.map((comment, i) => (
                        <CommentCard
                            key={comment.id || i}
                            comment={comment}
                            expanded={expanded[comment.id]}
                            onToggle={() => setExpanded(p => ({ ...p, [comment.id]: !p[comment.id] }))}
                        />
                    ))}
                    {loading && <MiniLoader />}
                    {!loading && hasMore && (
                        <button className="btn-ghost load-more-btn" onClick={onLoadMore}>
                            Load More Comments ↓
                        </button>
                    )}
                </div>
            )}

            <style>{`
        .list-controls { display: flex; gap: 8px; margin-bottom: 14px; }
        .load-more-btn { width: 100%; margin-top: 8px; padding: 12px; }
      `}</style>
        </div>
    );
}

function CommentCard({ comment, expanded, onToggle }) {
    const score = comment.score || 0;
    const postId = comment.link_id?.replace('t3_', '');
    const commentId = comment.id;
    const redditLink = postId
        ? `https://reddit.com/r/${comment.subreddit}/comments/${postId}/_/${commentId}`
        : '#';
    const body = comment.body || '';

    return (
        <div className="comment-card">
            <div className="comment-header">
                <span className="badge badge-sub">r/{comment.subreddit}</span>
                <span className="comment-date">{formatRelative(comment.created_utc)}</span>
            </div>
            <div className="comment-body">
                {expanded || body.length <= 240 ? body : truncate(body, 240)}
                {body.length > 240 && (
                    <button className="expand-btn" onClick={onToggle}>
                        {expanded ? ' ▲ Collapse' : ' ▼ Expand'}
                    </button>
                )}
            </div>
            <div className="comment-footer">
                <span className={`score ${score >= 0 ? 'positive' : 'neutral'}`}>
                    ▲ {formatNumber(score)}
                </span>
                <span className="comment-date">{formatDate(comment.created_utc)}</span>
                <a href={redditLink} target="_blank" rel="noopener noreferrer" className="comment-link">
                    View in context ↗
                </a>
            </div>
            <style>{`
        .comment-card {
          background: var(--bg-secondary); border-radius: var(--radius-md);
          padding: 14px; border: 1px solid var(--border-subtle);
          border-left: 3px solid rgba(0,212,255,0.2);
          transition: 0.15s;
        }
        .comment-card:hover { border-left-color: var(--accent-cyan); }
        .comment-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .comment-date { font-size: 0.75rem; color: var(--text-muted); }
        .comment-body {
          font-size: 0.87rem; color: var(--text-secondary);
          line-height: 1.6; white-space: pre-wrap; word-break: break-word;
        }
        .expand-btn { background: none; border: none; color: var(--accent-cyan); font-size: 0.79rem; cursor: pointer; padding: 0 0 0 4px; }
        .comment-footer { display: flex; align-items: center; gap: 14px; margin-top: 10px; flex-wrap: wrap; }
        .comment-link { font-size: 0.78rem; color: var(--text-muted); text-decoration: none; margin-left: auto; transition: 0.15s; }
        .comment-link:hover { color: var(--accent-cyan); }
      `}</style>
        </div>
    );
}

function CommentsSkeleton() {
    return (
        <div className="card">
            <div className="skeleton" style={{ height: 24, width: 140, marginBottom: 20 }} />
            {[...Array(5)].map((_, i) => (
                <div key={i} style={{ marginBottom: 12, padding: 14, borderLeft: '3px solid var(--border-subtle)', borderRadius: 8, background: 'var(--bg-secondary)' }}>
                    <div className="skeleton" style={{ height: 12, width: '25%', marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 14, width: '95%', marginBottom: 4 }} />
                    <div className="skeleton" style={{ height: 14, width: '80%' }} />
                </div>
            ))}
        </div>
    );
}

function EmptyState({ message }) {
    return (
        <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>💭</div>
            <p style={{ fontSize: '0.9rem' }}>{message}</p>
            <p style={{ fontSize: '0.78rem', marginTop: 6 }}>Use the search and score filters to narrow results.</p>
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
