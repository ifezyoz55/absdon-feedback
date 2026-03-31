const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const { query } = require('../models/db');

/** General API rate limiter */
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

/** Hash an IP address — we never store raw IPs */
function hashIP(ip) {
  return crypto.createHash('sha256').update(ip + process.env.JWT_SECRET).digest('hex');
}

/**
 * Check if a session/IP has hit the daily submission limit.
 * Inserts or increments a counter in submission_limits.
 */
async function checkSubmissionLimit(req, res, next) {
  const maxPerDay = parseInt(process.env.MAX_SUBMISSIONS_PER_DAY) || 5;
  const sessionId = req.headers['x-session-id'] || req.sessionID;
  const ipHash = hashIP(req.ip);

  try {
    // Check by session
    const existing = await query(
      `SELECT count FROM submission_limits
       WHERE identifier = $1
         AND window_start > NOW() - INTERVAL '24 hours'`,
      [sessionId || ipHash]
    );

    if (existing.rows.length > 0 && existing.rows[0].count >= maxPerDay) {
      return res.status(429).json({
        error: `Submission limit reached. You can submit up to ${maxPerDay} feedback items per day.`,
        retryAfter: '24 hours',
      });
    }

    // Attach identifiers for the route to store after successful insert
    req.spamMeta = { sessionId, ipHash };
    next();
  } catch (err) {
    console.error('[Rate Limit] DB error:', err.message);
    next(); // fail open — don't block users on DB issues
  }
}

/** Increment submission count after a successful insert */
async function incrementSubmissionCount(sessionId, ipHash) {
  const identifier = sessionId || ipHash;
  if (!identifier) return;

  await query(
    `INSERT INTO submission_limits (identifier, count, window_start)
     VALUES ($1, 1, NOW())
     ON CONFLICT (identifier)
     DO UPDATE SET count = submission_limits.count + 1`,
    [identifier]
  );
}

module.exports = { apiLimiter, checkSubmissionLimit, incrementSubmissionCount, hashIP };
