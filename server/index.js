const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const redditRoutes = require('./routes/reddit');
const {
    initDb,
    logRequest,
    getMetrics,
    getRecentLogs,
    isBlacklisted,
    addBlacklistedUser,
    removeBlacklistedUser,
    getBlacklistedUsers,
} = require('./services/db');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database on startup (logs to console if DATABASE_URL not set)
initDb().catch(err => console.error('Database init failed:', err.message));

app.use(cors());
app.use(express.json());

const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: { error: 'Too many requests. Please wait a moment.' },
});

app.use('/api', limiter);

// liveness probe for load balancers and uptime monitoring
app.get('/api/healthz', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Logging middleware — track requests for metrics
app.use((req, res, next) => {
    const startTime = Date.now();
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // skip logging for non-user endpoints such as health, assets, logs pages, and admin APIs
    if (req.path.startsWith('/api/healthz') || req.path.startsWith('/assets/') || req.path.startsWith('/logs') || req.path.startsWith('/admin')) {
        return next();
    }

    const userMatch = req.path.match(/\/user\/([^\/]+)/);
    if (!userMatch) return next();

    const username = decodeURIComponent(userMatch[1]).replace(/^u\//i, '').trim();
    
    // Capture response status and error
    res.on('finish', () => {
        const responseTimeMs = Date.now() - startTime;
        
        // Log to database
        logRequest({
            username,
            endpoint: req.path,
            method: req.method,
            statusCode: res.statusCode,
            ip,
            userAgent,
            responseTimeMs,
            errorMessage: res.locals.errorMessage || null,
        }).catch(err => console.error('Failed to log request:', err.message));
    });
    
    next();
});

// Block blacklisted usernames from user-facing API endpoints
app.use('/api', async (req, res, next) => {
    const userMatch = req.path.match(/^\/user\/([^\/]+)/);
    if (!userMatch) return next();

    const username = decodeURIComponent(userMatch[1]).replace(/^u\//i, '').trim();
    if (!username) return next();

    try {
        if (await isBlacklisted(username)) {
            return res.status(403).json({ error: 'Access denied. You are not allowed to view this user.' });
        }
        return next();
    } catch (err) {
        console.error('Blacklist check failed:', err.message);
        return next();
    }
});

app.use('/api', redditRoutes);

// Optional: serve built frontend from `../client/dist` when available or when SERVE_STATIC=true
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (process.env.SERVE_STATIC === 'true' || fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));

    // SPA fallback for non-API routes — use middleware instead of route pattern
    app.use((req, res, next) => {
        if (req.path.startsWith('/api')) return next();
        res.sendFile(path.join(clientDist, 'index.html'));
    });
}

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Token verification middleware for admin endpoints
function verifyAccessToken(req, res, next) {
    const token = req.headers['x-access-token'] || req.headers['x-log-token'] || req.query.token || req.body.token;
    const expectedToken = process.env.ACCESS_TOKEN || process.env.LOG_VIEWER_TOKEN;
    
    if (!expectedToken) {
        return res.status(503).json({ error: 'Access token not configured' });
    }
    
    if (!token || token !== expectedToken) {
        return res.status(401).json({ error: 'Unauthorized: invalid or missing token' });
    }
    
    next();
}

// Metrics endpoint — view request logs and usage stats
app.get('/api/metrics', async (req, res) => {
    const days = Math.min(parseInt(req.query.days) || 7, 365); // Max 1 year
    const metrics = await getMetrics(days);
    res.json(metrics);
});

// Admin endpoint — view recent logs (protected by token)
app.get('/api/admin/logs', verifyAccessToken, async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
    const logs = await getRecentLogs(limit);
    res.json({ count: logs.length, logs, fetched_at: new Date().toISOString() });
});

// Admin endpoint — list blacklisted users
app.get('/api/admin/blacklist', verifyAccessToken, async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 500, 1000);
    const users = await getBlacklistedUsers(limit);
    res.json({ count: users.length, users });
});

// Admin endpoint — add a username to blacklist
app.post('/api/admin/blacklist', verifyAccessToken, async (req, res) => {
    const username = req.body?.username;
    const reason = req.body?.reason || '';

    if (!username || !String(username).trim()) {
        return res.status(400).json({ error: 'Username is required' });
    }

    const user = await addBlacklistedUser(username, reason);
    res.status(201).json({ message: 'User added to blacklist', user });
});

// Admin endpoint — remove a username from blacklist
app.delete('/api/admin/blacklist/:username', verifyAccessToken, async (req, res) => {
    const removed = await removeBlacklistedUser(req.params.username);
    if (!removed) {
        return res.status(404).json({ error: 'User not found in blacklist' });
    }

    res.json({ message: 'User removed from blacklist', user: removed });
});

app.listen(PORT, () => {
    console.log(`\n🚀 Reddit Exposer Server running on port ${PORT}\n`);
});
