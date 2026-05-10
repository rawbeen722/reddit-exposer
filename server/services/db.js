const { Pool } = require('pg');

// Create a connection pool using DATABASE_URL from Render
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

/**
 * Initialize the database — create tables if they don't exist
 */
async function initDb() {
  try {
    const client = await pool.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS request_logs (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255),
        endpoint VARCHAR(100),
        method VARCHAR(10),
        status_code INT,
        requester_ip VARCHAR(45),
        user_agent TEXT,
        response_time_ms INT,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS blacklisted_users (
        username VARCHAR(255) PRIMARY KEY,
        reason TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_username ON request_logs(username);
      CREATE INDEX IF NOT EXISTS idx_created_at ON request_logs(created_at);
      CREATE INDEX IF NOT EXISTS idx_endpoint ON request_logs(endpoint);
    `);
    client.release();
    console.log('✓ Database initialized');
  } catch (err) {
    console.error('Database init error:', err.message);
    if (process.env.DATABASE_URL) throw err; // only fail if DATABASE_URL exists
  }
}

/**
 * Log a request
 */
async function logRequest(data) {
  try {
    const { username, endpoint, method, statusCode, ip, userAgent, responseTimeMs, errorMessage } = data;
    await pool.query(
      `INSERT INTO request_logs (username, endpoint, method, status_code, requester_ip, user_agent, response_time_ms, error_message, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [username, endpoint, method, statusCode, ip, userAgent, responseTimeMs, errorMessage]
    );
  } catch (err) {
    // Log to console but don't crash if DB is unavailable
    console.warn('Failed to log request:', err.message);
  }
}

function normalizeUsername(username) {
  return String(username || '')
    .replace(/^u\//i, '')
    .trim()
    .toLowerCase();
}

async function isBlacklisted(username) {
  const clean = normalizeUsername(username);
  if (!clean) return false;

  try {
    const result = await pool.query(
      'SELECT username FROM blacklisted_users WHERE username = $1 LIMIT 1',
      [clean]
    );
    return result.rowCount > 0;
  } catch (err) {
    console.warn('Blacklist check failed:', err.message);
    return false;
  }
}

async function addBlacklistedUser(username, reason = '') {
  const clean = normalizeUsername(username);
  if (!clean) throw new Error('Username is required');

  await pool.query(
    `INSERT INTO blacklisted_users (username, reason, created_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (username)
     DO UPDATE SET reason = EXCLUDED.reason`,
    [clean, reason]
  );

  return { username: clean, reason };
}

async function removeBlacklistedUser(username) {
  const clean = normalizeUsername(username);
  if (!clean) throw new Error('Username is required');

  const result = await pool.query(
    'DELETE FROM blacklisted_users WHERE username = $1 RETURNING username, reason, created_at',
    [clean]
  );
  return result.rows[0] || null;
}

async function getBlacklistedUsers(limit = 500) {
  const result = await pool.query(
    `SELECT username, reason, created_at
     FROM blacklisted_users
     ORDER BY created_at DESC
     LIMIT $1`,
    [Math.min(Math.max(parseInt(limit) || 500, 1), 1000)]
  );
  return result.rows;
}

/**
 * Get metrics: top searched users in the last N days
 */
async function getMetrics(days = 7) {
  try {
    const client = await pool.connect();
    
    const topUsers = await client.query(`
      SELECT username, COUNT(*) as search_count
      FROM request_logs
      WHERE endpoint = '/api/user/[username]' AND created_at > NOW() - INTERVAL '${days} days'
      GROUP BY username
      ORDER BY search_count DESC
      LIMIT 20;
    `);
    
    const hourlyUsage = await client.query(`
      SELECT 
        DATE_TRUNC('hour', created_at) as hour,
        COUNT(*) as request_count
      FROM request_logs
      WHERE created_at > NOW() - INTERVAL '${days} days'
      GROUP BY DATE_TRUNC('hour', created_at)
      ORDER BY hour DESC
      LIMIT 168;
    `);
    
    const totalRequests = await client.query(`
      SELECT COUNT(*) as total FROM request_logs
      WHERE created_at > NOW() - INTERVAL '${days} days';
    `);
    
    const recentErrors = await client.query(`
      SELECT endpoint, error_message, COUNT(*) as error_count
      FROM request_logs
      WHERE error_message IS NOT NULL AND created_at > NOW() - INTERVAL '${days} days'
      GROUP BY endpoint, error_message
      ORDER BY error_count DESC
      LIMIT 10;
    `);
    
    client.release();
    
    return {
      period_days: days,
      total_requests: parseInt(totalRequests.rows[0]?.total || 0),
      top_searched_users: topUsers.rows,
      hourly_usage: hourlyUsage.rows,
      recent_errors: recentErrors.rows,
      generated_at: new Date().toISOString(),
    };
  } catch (err) {
    console.error('Metrics query error:', err.message);
    return { error: 'Failed to fetch metrics', message: err.message };
  }
}

/**
 * Get recent requests logs
 */
async function getRecentLogs(limit = 100) {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT * FROM request_logs
      ORDER BY created_at DESC
      LIMIT $1;
    `, [limit]);
    client.release();
    return result.rows;
  } catch (err) {
    console.error('Logs query error:', err.message);
    return [];
  }
}

module.exports = {
  initDb,
  logRequest,
  getMetrics,
  getRecentLogs,
  isBlacklisted,
  addBlacklistedUser,
  removeBlacklistedUser,
  getBlacklistedUsers,
  normalizeUsername,
  pool,
};
