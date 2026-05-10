import { useState, useCallback, useEffect, useRef } from 'react';
import './index.css';

import SearchBar from './components/SearchBar';
import UserProfile from './components/UserProfile';
import PostsList from './components/PostsList';
import CommentsList from './components/CommentsList';
import SubredditBreakdown from './components/SubredditBreakdown';
import ActivityTimeline from './components/ActivityTimeline';
import UserInteractions from './components/UserInteractions';
import FlairBadges from './components/FlairBadges';
import InsightsSummary from './components/InsightsSummary';
import LogsViewer from './components/LogsViewer';
import AdminRestrictions from './components/AdminRestrictions';

import {
  fetchUserProfile,
  fetchUserPosts,
  fetchUserComments,
  fetchUserSubreddits,
  fetchUserInteractions,
  fetchUserFlairs,
  fetchUserActivity,
} from './utils/api';

const POSTS_PER_PAGE = 100;
const COMMENTS_PER_PAGE = 100;

// Tab options
const TABS = ['Overview', 'Posts', 'Comments'];

function getViewStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return {
    user: params.get('user')?.trim() || '',
    tab: TABS.includes(params.get('tab')) ? params.get('tab') : 'Overview',
    subFilter: params.get('subreddit')?.trim() || '',
  };
}

function writeViewStateToUrl({ user, tab, subFilter }) {
  const nextUrl = new URL(window.location.href);
  if (user) nextUrl.searchParams.set('user', user);
  else nextUrl.searchParams.delete('user');

  if (tab && tab !== 'Overview') nextUrl.searchParams.set('tab', tab);
  else nextUrl.searchParams.delete('tab');

  if (subFilter) nextUrl.searchParams.set('subreddit', subFilter);
  else nextUrl.searchParams.delete('subreddit');

  window.history.replaceState({}, '', `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
}

export default function App() {
  const [username, setUsername] = useState('');
  const [activeTab, setActiveTab] = useState('Overview');
  const [subFilter, setSubFilter] = useState('');

  const [states, setStates] = useState({
    profile: { data: null, loading: false, error: null },
    posts: { data: [], loading: false, error: null, hasMore: false },
    comments: { data: [], loading: false, error: null, hasMore: false },
    subreddits: { data: null, loading: false, error: null },
    interactions: { data: null, loading: false, error: null },
    flairs: { data: null, loading: false, error: null },
    activity: { data: null, loading: false, error: null },
  });

  const [globalError, setGlobalError] = useState(null);
  const [isRestricted, setIsRestricted] = useState(false);
  const [toast, setToast] = useState(null);
  const abortRef = useRef(null);
  const initialLoadRef = useRef(false);

  function resetDashboard() {
    setUsername('');
    setActiveTab('Overview');
    setSubFilter('');
    setGlobalError(null);
    setIsRestricted(false);
    setStates({
      profile: { data: null, loading: false, error: null },
      posts: { data: [], loading: false, error: null, hasMore: false },
      comments: { data: [], loading: false, error: null, hasMore: false },
      subreddits: { data: null, loading: false, error: null },
      interactions: { data: null, loading: false, error: null },
      flairs: { data: null, loading: false, error: null },
      activity: { data: null, loading: false, error: null },
    });
  }

  function setSection(key, updates) {
    setStates(prev => ({ ...prev, [key]: { ...prev[key], ...updates } }));
  }

  function showToast(msg, type = 'error') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  const goHome = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    resetDashboard();
    window.history.replaceState({}, '', '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSearch = useCallback(async (uname, options = {}) => {
    const clean = uname.replace(/^u\//i, '').trim();
    if (!clean) return;
    const nextTab = options.tab && TABS.includes(options.tab) ? options.tab : 'Overview';
    const nextSubFilter = options.subFilter || '';

    // Abort previous requests
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setUsername(clean);
    setActiveTab(nextTab);
    setSubFilter(nextSubFilter);
    setGlobalError(null);

    writeViewStateToUrl({ user: clean, tab: nextTab, subFilter: nextSubFilter });

    // Reset all
    setStates({
      profile: { data: null, loading: true, error: null },
      posts: { data: [], loading: true, error: null, hasMore: false },
      comments: { data: [], loading: true, error: null, hasMore: false },
      subreddits: { data: null, loading: true, error: null },
      interactions: { data: null, loading: true, error: null },
      flairs: { data: null, loading: true, error: null },
      activity: { data: null, loading: true, error: null },
    });

    // Fetch all in parallel, update as each resolves
    async function run(key, fetcher) {
      try {
        const data = await fetcher();
        setSection(key, { data, loading: false });
      } catch (err) {
        const msg = err?.response?.data?.error || err.message || 'Failed to fetch';
        setSection(key, { loading: false, error: msg });
        if (key === 'profile') {
          // Check if user is blacklisted
          if (msg.toLowerCase().includes('access denied') || err?.response?.status === 403) {
            setIsRestricted(true);
          }
          showToast(msg);
        }
      }
    }

    run('profile', () => fetchUserProfile(clean));
    run('subreddits', () => fetchUserSubreddits(clean, { limit: '' }));
    run('activity', () => fetchUserActivity(clean, { frequency: 'month' }));
    run('interactions', () => fetchUserInteractions(clean, { min_count: 2, limit: 50 }));
    run('flairs', () => fetchUserFlairs(clean));

    // Posts
    try {
      const postData = await fetchUserPosts(clean, { limit: POSTS_PER_PAGE, sort: 'desc' });
      const posts = postData?.data || [];
      setSection('posts', {
        data: posts,
        loading: false,
        hasMore: posts.length >= POSTS_PER_PAGE,
        lastUtc: posts.length ? posts[posts.length - 1].created_utc : null,
      });
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Failed to load posts';
      setSection('posts', { loading: false, error: msg });
    }

    // Comments
    try {
      const commentData = await fetchUserComments(clean, { limit: COMMENTS_PER_PAGE, sort: 'desc' });
      const comments = commentData?.data || [];
      setSection('comments', {
        data: comments,
        loading: false,
        hasMore: comments.length >= COMMENTS_PER_PAGE,
        lastUtc: comments.length ? comments[comments.length - 1].created_utc : null,
      });
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Failed to load comments';
      setSection('comments', { loading: false, error: msg });
    }
  }, []);

  useEffect(() => {
    const syncFromUrl = () => {
      const { user, tab, subFilter: nextSubFilter } = getViewStateFromUrl();

      if (!user) {
        resetDashboard();
        return;
      }

      if (user !== username) {
        handleSearch(user, { tab, subFilter: nextSubFilter });
      } else {
        setActiveTab(tab);
        setSubFilter(nextSubFilter);
      }
    };

    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      syncFromUrl();
    }

    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, [handleSearch, username]);

  useEffect(() => {
    if (!username) return;
    writeViewStateToUrl({ user: username, tab: activeTab, subFilter });
  }, [activeTab, subFilter, username]);

  async function loadMorePosts() {
    const { data, lastUtc } = states.posts;
    if (!lastUtc || !username) return;
    setSection('posts', { loading: true });
    try {
      const res = await fetchUserPosts(username, {
        limit: POSTS_PER_PAGE, sort: 'desc', before: lastUtc,
        subreddit: subFilter || undefined,
      });
      const newPosts = res?.data || [];
      setSection('posts', {
        data: [...data, ...newPosts],
        loading: false,
        hasMore: newPosts.length >= POSTS_PER_PAGE,
        lastUtc: newPosts.length ? newPosts[newPosts.length - 1].created_utc : null,
      });
    } catch {
      setSection('posts', { loading: false });
    }
  }

  async function loadMoreComments() {
    const { data, lastUtc } = states.comments;
    if (!lastUtc || !username) return;
    setSection('comments', { loading: true });
    try {
      const res = await fetchUserComments(username, {
        limit: COMMENTS_PER_PAGE, sort: 'desc', before: lastUtc,
        subreddit: subFilter || undefined,
      });
      const newComments = res?.data || [];
      setSection('comments', {
        data: [...data, ...newComments],
        loading: false,
        hasMore: newComments.length >= COMMENTS_PER_PAGE,
        lastUtc: newComments.length ? newComments[newComments.length - 1].created_utc : null,
      });
    } catch {
      setSection('comments', { loading: false });
    }
  }

  const s = states;
  const isSearched = !!username;
  const isLogsPage = window.location.pathname === '/logs';
  const isAdminPage = window.location.pathname === '/admin';

  const refreshCurrentSearch = () => {
    if (!username) return;
    handleSearch(username, { tab: activeTab, subFilter });
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Share link copied', 'info');
    } catch {
      showToast('Could not copy link');
    }
  };

  return (
    <div className="app">
      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`} key={toast.msg}>
          <span style={{ marginRight: 8 }}>{toast.type === 'error' ? '⚠' : 'ℹ'}</span>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <button type="button" className="header-brand header-brand-btn" onClick={goHome} aria-label="Go to homepage and clear search">
          <span className="brand-icon">🕵️</span>
          <span className="brand-name mono">Reddit<span className="text-accent">Exposer</span></span>
        </button>
        {isSearched && (
          <div className="header-search">
            <SearchBar onSearch={handleSearch} loading={s.profile.loading} initialValue={username} />
          </div>
        )}
      </header>

      {/* Logs View (hidden, only accessible via /logs route) */}
      {isLogsPage && <LogsViewer />}

      {/* Admin Restrictions View (hidden, only accessible via /admin route) */}
      {isAdminPage && <AdminRestrictions />}

      {/* Search View */}
      {!isLogsPage && !isAdminPage && (
        <>
          {/* Hero (shown only before search) */}
          {!isSearched && (
        <section className="hero">
          <div className="hero-glow" />
          <div className="hero-content">
            <div className="hero-badge mono">v1.0 · Open Source Intelligence</div>
            <h1 className="hero-title">
              <span className="text-accent">Unmask</span> any<br />
              Reddit user
            </h1>
            <p className="hero-subtitle">
              Enter a username — we'll expose their posts, comments,<br />
              active subreddits, behavioral patterns & more.
            </p>
            <SearchBar onSearch={handleSearch} loading={false} initialValue="" />
            <p className="hero-hint">
              Try: <span className="mono text-accent" style={{ cursor: 'pointer' }} onClick={() => handleSearch('spez')}>spez</span>
              {' · '}
              <span className="mono text-accent" style={{ cursor: 'pointer' }} onClick={() => handleSearch('GallowBoob')}>GallowBoob</span>
            </p>
          </div>
        </section>
      )}

      {/* Dashboard */}
      {isSearched && (
        <main className="dashboard">
          {/* Access Restricted Error Message */}
          {isRestricted && (
            <div className="restrictions-error-container">
              <div className="restrictions-error-message">
                <div className="restrictions-error-icon">⛔</div>
                <div className="restrictions-error-content">
                  <h2>Access Restricted</h2>
                  <p>The system administrator has restricted access to this user's profile. You are not permitted to view details for <strong>u/{username}</strong>.</p>
                  <button className="btn-search-again" onClick={() => {
                    goHome();
                    setTimeout(() => window.scrollTo({ top: 0 }), 0);
                  }}>
                    ← Search Another User
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Dashboard Content (shown only if not restricted) */}
          {!isRestricted && (
            <>
              {/* User header strip */}
              <div className="user-strip animate-fade-in">
            <div className="user-strip-main">
              <span className="mono user-strip-name">
                🔍 Exposing: <span className="text-accent">u/{username}</span>
              </span>
              {(activeTab !== 'Overview' || subFilter) && (
                <span className="user-strip-state mono">
                  {activeTab !== 'Overview' ? activeTab : 'Overview'}
                  {subFilter ? ` · r/${subFilter}` : ''}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: '0.78rem' }} onClick={copyShareLink}>
                Copy Link
              </button>
              <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: '0.78rem' }} onClick={refreshCurrentSearch}>
                Refresh
              </button>
            </div>
          </div>

          {/* Tab bar */}
          <div className="tab-bar" style={{ marginBottom: 20, maxWidth: 360 }}>
            {TABS.map(tab => (
              <button
                key={tab}
                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Overview tab */}
          {activeTab === 'Overview' && (
            <div className="dashboard-grid">
              {/* Left column */}
              <div className="left-col">
                <UserProfile
                  profile={s.profile.data}
                  username={username}
                  postsCount={s.posts.data.length}
                  commentsCount={s.comments.data.length}
                />
                <UserInteractions
                  interactions={s.interactions.data}
                  loading={s.interactions.loading}
                  onUserClick={handleSearch}
                />
                <FlairBadges flairs={s.flairs.data} loading={s.flairs.loading} />
              </div>

              {/* Right column */}
              <div className="right-col">
                <SubredditBreakdown
                  subreddits={s.subreddits.data?.data}
                  loading={s.subreddits.loading}
                  onSubredditClick={sub => {
                    setSubFilter(sub === subFilter ? '' : sub);
                  }}
                  activeFilter={subFilter}
                />
                <ActivityTimeline
                  activity={s.activity.data}
                  loading={s.activity.loading}
                />
              </div>

              {/* Full width insights */}
              <InsightsSummary
                posts={s.posts.data}
                comments={s.comments.data}
                subreddits={s.subreddits.data?.data}
                loading={s.posts.loading && s.comments.loading}
              />
            </div>
          )}

          {/* Posts tab */}
          {activeTab === 'Posts' && (
            <PostsList
              posts={s.posts.data}
              loading={s.posts.loading}
              onLoadMore={loadMorePosts}
              hasMore={s.posts.hasMore}
              subreddits={s.subreddits.data?.data || []}
            />
          )}

          {/* Comments tab */}
          {activeTab === 'Comments' && (
            <CommentsList
              comments={s.comments.data}
              loading={s.comments.loading}
              onLoadMore={loadMoreComments}
              hasMore={s.comments.hasMore}
              subreddits={s.subreddits.data?.data || []}
            />
          )}
            </>
          )}
        </main>
      )}
      </>
      )}

      <style>{`
        .app { min-height: 100vh; display: flex; flex-direction: column; }

        /* Header */
        .app-header {
          position: sticky; top: 0; z-index: 50;
          display: flex; align-items: center; gap: 16px;
          padding: 14px 32px;
          background: rgba(8,8,15,0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border-subtle);
        }
        .header-brand { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .header-brand-btn {
          background: transparent;
          border: none;
          color: inherit;
          padding: 0;
          cursor: pointer;
          text-align: left;
        }
        .header-brand-btn:hover .brand-name { opacity: 0.95; }
        .header-brand-btn:focus-visible {
          outline: 2px solid var(--accent-cyan);
          outline-offset: 6px;
          border-radius: 8px;
        }
        .brand-icon { font-size: 1.3rem; }
        .brand-name { font-size: 1.1rem; letter-spacing: 1px; }
        .header-search { flex: 1; max-width: 500px; }
        .header-actions { margin-left: auto; flex-shrink: 0; }

        /* Hero */
        .hero {
          flex: 1; display: flex; align-items: center; justify-content: center;
          min-height: calc(100vh - 70px);
          position: relative; overflow: hidden;
          padding: 40px 20px;
        }
        .hero-glow {
          position: absolute; width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%);
          top: 50%; left: 50%; transform: translate(-50%,-50%);
          pointer-events: none;
        }
        .hero-content {
          display: flex; flex-direction: column; align-items: center;
          text-align: center; gap: 24px; position: relative; z-index: 1;
          max-width: 720px;
        }
        .hero-badge {
          background: var(--accent-cyan-dim); color: var(--accent-cyan);
          border: 1px solid rgba(0,212,255,0.25); border-radius: 20px;
          padding: 5px 16px; font-size: 0.8rem; letter-spacing: 1px;
          animation: fadeIn 0.5s ease;
        }
        .hero-title {
          font-size: clamp(2.8rem, 7vw, 5rem); font-weight: 700;
          line-height: 1.1; letter-spacing: -1px;
          animation: fadeUp 0.5s ease 0.1s both;
        }
        .hero-subtitle {
          font-size: 1.1rem; color: var(--text-secondary); line-height: 1.7;
          animation: fadeUp 0.5s ease 0.2s both;
        }
        .hero-hint {
          font-size: 0.85rem; color: var(--text-muted);
          animation: fadeUp 0.5s ease 0.4s both;
        }

        /* Dashboard */
        .dashboard { padding: 24px 32px; flex: 1; max-width: 1400px; margin: 0 auto; width: 100%; }

        /* Access Restricted Error Message */
        .restrictions-error-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          padding: 40px 20px;
        }

        .restrictions-error-message {
          background: linear-gradient(135deg, rgba(50,30,30,0.8) 0%, rgba(30,20,20,0.9) 100%);
          border: 2px solid var(--accent-red, #ff4444);
          border-radius: 16px;
          padding: 40px;
          max-width: 500px;
          text-align: center;
          backdrop-filter: blur(20px);
          box-shadow: 0 8px 32px rgba(255, 68, 68, 0.15);
        }

        .restrictions-error-icon {
          font-size: 3rem;
          margin-bottom: 16px;
          animation: pulse-restricted 2s infinite;
        }

        @keyframes pulse-restricted {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .restrictions-error-content h2 {
          font-size: 1.8rem;
          font-weight: 700;
          color: var(--accent-red, #ff6b6b);
          margin-bottom: 12px;
          letter-spacing: 1px;
        }

        .restrictions-error-content p {
          font-size: 1rem;
          color: var(--text-secondary, #b0b0b0);
          line-height: 1.6;
          margin-bottom: 24px;
        }

        .restrictions-error-content strong {
          color: var(--accent-cyan, #00d4ff);
          font-weight: 600;
        }

        .btn-search-again {
          background: var(--accent-cyan, #00d4ff);
          color: #000;
          border: none;
          padding: 12px 28px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          letter-spacing: 1px;
          transition: all 0.2s ease;
        }

        .btn-search-again:hover {
          opacity: 0.9;
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 212, 255, 0.3);
        }

        .user-strip {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 16px; padding: 10px 16px;
          background: var(--accent-cyan-dim); border: 1px solid var(--border-accent);
          border-radius: var(--radius-md);
          flex-wrap: wrap; gap: 8px;
        }
        .user-strip-main { display: flex; flex-direction: column; gap: 2px; }
        .user-strip-name { font-size: 0.88rem; color: var(--text-primary); }
        .user-strip-state { font-size: 0.72rem; color: var(--text-secondary); }
        .user-strip-count { font-size: 0.82rem; color: var(--accent-green); }

        /* Grid */
        .dashboard-grid {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 20px;
          align-items: start;
        }
        .left-col { display: flex; flex-direction: column; gap: 20px; }
        .right-col { display: flex; flex-direction: column; gap: 20px; }

        @media (max-width: 1024px) {
          .dashboard-grid { grid-template-columns: 1fr; }
          .dashboard { padding: 20px 16px; }
          .app-header { padding: 12px 16px; }
        }

        @media (max-width: 820px) {
          .app-header {
            flex-wrap: wrap;
            gap: 10px;
            align-items: flex-start;
          }

          .header-brand {
            width: 100%;
          }

          .header-search {
            flex: 1 1 100%;
            max-width: 100%;
            width: 100%;
          }

          .dashboard {
            padding: 16px 12px;
          }
        }

        /* Toast */
        .toast {
          position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
          padding: 12px 24px; border-radius: var(--radius-md);
          font-size: 0.88rem; z-index: 9999;
          animation: fadeUp 0.3s ease;
          max-width: 90vw; text-align: center;
        }
        .toast-error {
          background: rgba(255,51,102,0.15); color: var(--accent-red);
          border: 1px solid rgba(255,51,102,0.3);
          backdrop-filter: blur(12px);
        }
        .toast-info {
          background: var(--accent-cyan-dim); color: var(--accent-cyan);
          border: 1px solid var(--border-accent);
          backdrop-filter: blur(12px);
        }
      `}</style>
    </div>
  );
}
