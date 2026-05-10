export function formatDate(utcSeconds) {
    if (!utcSeconds) return 'Unknown';
    const d = new Date(utcSeconds * 1000);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatRelative(utcSeconds) {
    if (!utcSeconds) return '';
    const now = Date.now() / 1000;
    const diff = now - utcSeconds;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
    if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo ago`;
    return `${Math.floor(diff / 31536000)}y ago`;
}

export function formatNumber(n) {
    if (n === null || n === undefined) return '0';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
}

export function formatScore(n) {
    const num = formatNumber(Math.abs(n || 0));
    return n < 0 ? `-${num}` : num;
}

export function accountAge(utcSeconds) {
    if (!utcSeconds) return 'Unknown';
    const diff = Date.now() / 1000 - utcSeconds;
    const years = Math.floor(diff / 31536000);
    const months = Math.floor((diff % 31536000) / 2592000);
    if (years > 0) return `${years}y ${months}mo`;
    return `${months}mo`;
}

export function stripPrefix(name) {
    return (name || '').replace(/^[ur]\//, '');
}

export function truncate(text, len = 200) {
    if (!text) return '';
    return text.length > len ? text.slice(0, len) + '…' : text;
}

export function computeActivityHour(items) {
    const hours = Array(24).fill(0);
    items.forEach(item => {
        if (item.created_utc) {
            const h = new Date(item.created_utc * 1000).getUTCHours();
            hours[h]++;
        }
    });
    return hours.map((count, hour) => ({ hour: `${hour}:00`, count }));
}

export function computeActivityDay(items) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = Array(7).fill(0);
    items.forEach(item => {
        if (item.created_utc) {
            const d = new Date(item.created_utc * 1000).getUTCDay();
            counts[d]++;
        }
    });
    return counts.map((count, i) => ({ day: days[i], count }));
}

export function generateAvatarColor(username) {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 55%)`;
}

export function generateAvatarGradient(username) {
    const color1 = generateAvatarColor(username);
    const color2 = generateAvatarColor(username + '1');
    return `linear-gradient(135deg, ${color1}, ${color2})`;
}

export function computeInsights(posts, comments, subreddits) {
    const allItems = [...(posts || []), ...(comments || [])];

    const topSub = subreddits && subreddits[0]
        ? `r/${subreddits[0].subreddit}`
        : 'N/A';

    const avgPostScore = posts?.length
        ? Math.round(posts.reduce((a, p) => a + (p.score || 0), 0) / posts.length)
        : 0;

    const avgCommentScore = comments?.length
        ? Math.round(comments.reduce((a, c) => a + (c.score || 0), 0) / comments.length)
        : 0;

    const hours = Array(24).fill(0);
    allItems.forEach(i => {
        if (i.created_utc) hours[new Date(i.created_utc * 1000).getUTCHours()]++;
    });
    const peakHour = hours.indexOf(Math.max(...hours));

    const nsfwCount = posts?.filter(p => p.over_18).length || 0;
    const nsfwPct = posts?.length ? Math.round((nsfwCount / posts.length) * 100) : 0;

    return { topSub, avgPostScore, avgCommentScore, peakHour, nsfwPct };
}
