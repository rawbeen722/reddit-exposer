const axios = require('axios');

const BASE_URL = 'https://arctic-shift.photon-reddit.com';

const CACHE = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key) {
    const entry = CACHE.get(key);
    if (!entry) return null;
    if (Date.now() - entry.time > CACHE_TTL) {
        CACHE.delete(key);
        return null;
    }
    return entry.data;
}

function setCache(key, data) {
    CACHE.set(key, { data, time: Date.now() });
}

async function arcticGet(endpoint, params = {}) {
    const cacheKey = endpoint + JSON.stringify(params);
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const response = await axios.get(`${BASE_URL}${endpoint}`, {
        params,
        timeout: 30000,
        headers: {
            'User-Agent': 'RedditExposer/1.0',
        },
    });

    setCache(cacheKey, response.data);
    return response.data;
}

function cleanUsername(username) {
    return username.replace(/^u\//, '').trim();
}

const ArcticShift = {
    async getUserProfile(username) {
        const author = cleanUsername(username);
        return arcticGet('/api/users/search', { author, limit: 1 });
    },

    async getUserPosts(username, params = {}) {
        const author = cleanUsername(username);
        return arcticGet('/api/posts/search', {
            author,
            limit: params.limit || 100,
            sort: params.sort || 'desc',
            after: params.after,
            before: params.before,
            subreddit: params.subreddit,
            fields: 'author,created_utc,id,subreddit,score,num_comments,over_18,spoiler,title,url,selftext,link_flair_text',
        });
    },

    async getUserComments(username, params = {}) {
        const author = cleanUsername(username);
        return arcticGet('/api/comments/search', {
            author,
            limit: params.limit || 100,
            sort: params.sort || 'desc',
            after: params.after,
            before: params.before,
            subreddit: params.subreddit,
            fields: 'author,created_utc,id,subreddit,score,body,link_id,parent_id',
        });
    },

    async getUserSubreddits(username, params = {}) {
        const author = cleanUsername(username);
        return arcticGet('/api/users/interactions/subreddits', {
            author,
            limit: params.limit !== undefined ? params.limit : '',
            weight_posts: params.weight_posts || 1.0,
            weight_comments: params.weight_comments || 1.0,
            after: params.after,
            before: params.before,
        });
    },

    async getUserInteractions(username, params = {}) {
        const author = cleanUsername(username);
        return arcticGet('/api/users/interactions/users', {
            author,
            limit: params.limit !== undefined ? params.limit : 50,
            min_count: params.min_count || 2,
            after: params.after,
            before: params.before,
        });
    },

    async getUserFlairs(username) {
        const author = cleanUsername(username);
        return arcticGet('/api/users/aggregate_flairs', { author });
    },

    async getPostActivity(username, params = {}) {
        const author = cleanUsername(username);
        const [posts, comments] = await Promise.all([
            arcticGet('/api/posts/search/aggregate', {
                author,
                aggregate: 'created_utc',
                frequency: params.frequency || 'month',
                after: params.after,
                before: params.before,
            }),
            arcticGet('/api/comments/search/aggregate', {
                author,
                aggregate: 'created_utc',
                frequency: params.frequency || 'month',
                after: params.after,
                before: params.before,
            }),
        ]);
        return { posts, comments };
    },
};

module.exports = ArcticShift;
