const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const redditRoutes = require('./routes/reddit');
const { initDb, logRequest, getMetrics, getRecentLogs } = require('./services/db');

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

    // skip logging for health checks, /api, /logs/ /api/admin/logs, and /assets/*
    if (req.path.startsWith('/api/healthz') || req.path === '/api' || req.path.startsWith('/logs') || req.path.startsWith('/api/admin/logs') || req.path.startsWith('/assets/')) {
        return next();
    }
    
    // Capture response status and error
    res.on('finish', () => {
        const responseTimeMs = Date.now() - startTime;
        
        // Extract username if it's a user endpoint
        let username = null;
        const userMatch = req.path.match(/\/user\/([^\/]+)/);
        if (userMatch) username = decodeURIComponent(userMatch[1]);
        
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
function verifyLogViewerToken(req, res, next) {
    const token = req.headers['x-log-token'] || req.query.token || req.body.token;
    const expectedToken = process.env.LOG_VIEWER_TOKEN;
    
    if (!expectedToken) {
        return res.status(503).json({ error: 'Log viewer not configured' });
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
app.get('/api/admin/logs', verifyLogViewerToken, async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
    const logs = await getRecentLogs(limit);
    res.json({ count: logs.length, logs, fetched_at: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`\n🚀 Reddit Exposer Server running on port ${PORT}\n`);
});
