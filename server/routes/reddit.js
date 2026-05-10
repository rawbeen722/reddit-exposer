const express = require('express');
const router = express.Router();
const axios = require('axios');
const ArcticShift = require('../services/arcticShift');

const REDDIT_HEADERS = { 'User-Agent': 'RedditExposer/1.0' };

async function fetchRedditProfile(username) {
    try {
        const { data } = await axios.get(
            `https://www.reddit.com/user/${encodeURIComponent(username)}/about.json`,
            { headers: REDDIT_HEADERS, timeout: 10000 }
        );
        return data?.data || null;
    } catch {
        return null; // deleted/suspended/private — fail silently
    }
}

// GET /api/user/:username — profile (Arctic Shift + Reddit merged)
router.get('/user/:username', async (req, res) => {
    try {
        const username = req.params.username;

        const [arcticShift, redditProfile] = await Promise.all([
            ArcticShift.getUserProfile(username),
            fetchRedditProfile(username),
        ]);

        res.json({ arcticShift, redditProfile });
    } catch (err) {
        handleError(res, err);
    }
});

// GET /api/user/:username/posts
router.get('/user/:username/posts', async (req, res) => {
    try {
        const data = await ArcticShift.getUserPosts(req.params.username, req.query);
        res.json(data);
    } catch (err) {
        handleError(res, err);
    }
});

// GET /api/user/:username/comments
router.get('/user/:username/comments', async (req, res) => {
    try {
        const data = await ArcticShift.getUserComments(req.params.username, req.query);
        res.json(data);
    } catch (err) {
        handleError(res, err);
    }
});

// GET /api/user/:username/subreddits
router.get('/user/:username/subreddits', async (req, res) => {
    try {
        const data = await ArcticShift.getUserSubreddits(req.params.username, req.query);
        res.json(data);
    } catch (err) {
        handleError(res, err);
    }
});

// GET /api/user/:username/interactions
router.get('/user/:username/interactions', async (req, res) => {
    try {
        const data = await ArcticShift.getUserInteractions(req.params.username, req.query);
        res.json(data);
    } catch (err) {
        handleError(res, err);
    }
});

// GET /api/user/:username/flairs
router.get('/user/:username/flairs', async (req, res) => {
    try {
        const data = await ArcticShift.getUserFlairs(req.params.username);
        res.json(data);
    } catch (err) {
        handleError(res, err);
    }
});

// GET /api/user/:username/activity
router.get('/user/:username/activity', async (req, res) => {
    try {
        let { after, before } = req.query;
        if (!after && !before) after = '2000-01-01';
        const data = await ArcticShift.getPostActivity(req.params.username, {
            ...req.query,
            after,
            before,
        });
        res.json(data);
    } catch (err) {
        handleError(res, err);
    }
});

function handleError(res, err) {
    console.error('API Error:', err.message);
    if (err.response) {
        const status = err.response.status;
        const errorData = err.response.data;
        const message = errorData?.message || errorData?.error || errorData || 'API error';
        if (typeof message === 'string' && message.toLowerCase().includes('time out')) {
            return res.status(504).json({ error: 'Query timed out. Try a more specific date range.' });
        }
        if (typeof message === 'string' && message.toLowerCase().includes('timeout')) {
            return res.status(504).json({ error: 'Query timed out. Try a more specific date range.' });
        }
        return res.status(status).json({ error: message });
    }
    if (err.code === 'ECONNABORTED') {
        return res.status(504).json({ error: 'Request timed out. The user may have too much activity.' });
    }
    res.status(500).json({ error: 'Internal server error' });
}

module.exports = router;