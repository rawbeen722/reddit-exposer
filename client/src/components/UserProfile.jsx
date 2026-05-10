import React from 'react';
import { formatDate, formatNumber, accountAge, generateAvatarGradient } from '../utils/formatters';

export default function UserProfile({ profile, username, postsCount, commentsCount }) {
    const user = profile?.arcticShift?.data?.[0] || profile?.data?.[0] || null;
    const reddit = profile?.redditProfile || null;
    console.log({ reddit })

    if (!user && !reddit) {
        return (
            <div className="card animate-fade-up" style={{ animationDelay: '0.05s', opacity: 0 }}>
                <div className="profile-no-data">
                    <div className="profile-avatar-large" style={{ background: generateAvatarGradient(username) }}>
                        {username[0].toUpperCase()}
                    </div>
                    <div>
                        <h2 className="mono" style={{ color: 'var(--accent-cyan)' }}>u/{username}</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4 }}>
                            No profile data found.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const meta = user?._meta || {};
    const isDeleted = !reddit;

    const karma = reddit?.total_karma ?? (meta.total_karma || ((meta.post_karma || 0) + (meta.comment_karma || 0)) || 0);
    const numPosts = meta.num_posts || postsCount || 0;
    const numComments = meta.num_comments || commentsCount || 0;
    const firstSeen = reddit?.created_utc || meta.earliest_post_at || meta.earliest_comment_at;
    const totalActivity = numPosts + numComments;
    const exposureLevel = Math.min(100, Math.round((Math.log10(totalActivity + 1) / 5) * 100));

    const stats = [
        { label: 'Total Karma', value: formatNumber(karma) },
        { label: 'Posts', value: formatNumber(numPosts) },
        { label: 'Comments', value: formatNumber(numComments) },
        { label: 'Account Age', value: accountAge(firstSeen) },
    ];

    const avatarUrl = reddit?.icon_img?.replace(/&amp;/g, '&');

    return (
        <div className="card animate-fade-up" style={{ animationDelay: '0.05s', opacity: 0 }}>
            <div className="profile-header">
                {avatarUrl ? (
                    <img src={avatarUrl} alt={username} className="profile-avatar" />
                ) : (
                    <div className="profile-avatar" style={{ background: generateAvatarGradient(username) }}>
                        {username[0].toUpperCase()}
                    </div>
                )}
                <div className="profile-meta">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <h2 className="mono profile-username">u/{username}</h2>
                        {reddit?.is_suspended && <span className="profile-badge badge-suspended">SUSPENDED</span>}
                        {isDeleted && <span className="profile-badge badge-deleted">DELETED</span>}
                        {reddit?.verified && <span className="profile-badge badge-verified">✓ VERIFIED</span>}
                        {reddit?.over_18 && <span className="profile-badge badge-nsfw">18+</span>}
                    </div>
                    {firstSeen && (
                        <p className="profile-dates">
                            Joined: <span className="text-accent">{formatDate(firstSeen)}</span>
                        </p>
                    )}
                </div>
            </div>

            <div className="divider" />

            <div className="stats-grid stagger">
                {stats.map(({ label, value }) => (
                    <div key={label} className="stat-cell animate-fade-up">
                        <div className="stat-number">{value}</div>
                        <div className="stat-label">{label}</div>
                    </div>
                ))}
            </div>

            <div className="divider" />

            <div className="exposure-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                        Exposure Level
                    </span>
                    <span className="mono" style={{
                        color: exposureLevel > 70 ? 'var(--accent-red)' : exposureLevel > 40 ? 'var(--accent-orange)' : 'var(--accent-green)',
                        fontSize: '0.85rem', fontWeight: 700
                    }}>
                        {exposureLevel}%
                    </span>
                </div>
                <div className="exposure-bar-bg">
                    <div
                        className="exposure-bar-fill"
                        style={{
                            width: `${exposureLevel}%`,
                            background: exposureLevel > 70 ? 'var(--accent-red)' : exposureLevel > 40 ? 'var(--accent-orange)' : 'var(--accent-cyan)',
                        }}
                    />
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>
                    Based on archived activity volume
                </p>
            </div>

            <style>{`
        .profile-header { display: flex; gap: 16px; align-items: flex-start; }
        .profile-no-data { display: flex; gap: 16px; align-items: center; }
        .profile-avatar {
          width: 60px; height: 60px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.4rem; font-weight: 700; color: #fff;
          box-shadow: 0 4px 16px rgba(0,0,0,0.4); border: 2px solid var(--border-subtle);
          object-fit: cover;
        }
        .profile-avatar-large {
          width: 52px; height: 52px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.2rem; font-weight: 700; color: #fff;
        }
        .profile-meta { flex: 1; min-width: 0; }
        .profile-username { font-size: 1.1rem; color: var(--accent-cyan); }
        .profile-dates { font-size: 0.78rem; color: var(--text-muted); margin-top: 6px; }
        .profile-badge {
          font-size: 0.65rem; padding: 2px 6px; border-radius: 4px;
          font-weight: 700; letter-spacing: 0.5px;
        }
        .badge-suspended { background: rgba(255,51,102,0.15); color: var(--accent-red); border: 1px solid rgba(255,51,102,0.3); }
        .badge-deleted { background: rgba(136,146,176,0.15); color: var(--text-secondary); border: 1px solid rgba(136,146,176,0.3); }
        .badge-verified { background: rgba(0,255,136,0.15); color: var(--accent-green); border: 1px solid rgba(0,255,136,0.3); }
        .badge-nsfw { background: rgba(255,159,28,0.15); color: var(--accent-orange); border: 1px solid rgba(255,159,28,0.3); }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 4px; }
        .stat-cell {
          background: var(--bg-secondary); border-radius: var(--radius-md);
          padding: 14px; border: 1px solid var(--border-subtle); opacity: 0;
        }
        .exposure-bar-bg { height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; }
        .exposure-bar-fill {
          height: 100%; border-radius: 3px;
          transition: width 1s cubic-bezier(0.4,0,0.2,1);
          box-shadow: 0 0 8px currentColor;
        }
      `}</style>
        </div>
    );
}