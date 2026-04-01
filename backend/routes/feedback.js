const router = require('express').Router();
const { body, query: vQuery, validationResult } = require('express-validator');
const { query } = require('../models/db');
const { authenticate } = require('../middleware/auth');
const { checkSubmissionLimit, incrementSubmissionCount } = require('../middleware/rateLimit');
const { processFeedback } = require('../services/ai');

const VALID_STATUSES = ['New', 'Under Review', 'Accepted', 'Rejected', 'Implemented'];
const VALID_CATEGORIES = ['Community', 'Builders', 'Developers', 'Suggestions', 'Advice'];
const VALID_TYPES = ['Bug', 'Idea', 'Complaint', 'Praise'];
const VALID_SEVERITIES = ['Low', 'Medium', 'Critical'];

// ─── POST /api/feedback ─── Public Submission ────────────
router.post('/', checkSubmissionLimit, [
  body('submitterType').isIn(['regular', 'builder', 'anonymous']),
  body('title')
  .trim()
  .isLength({ min: 5, max: 300 })
  .withMessage('Title must be between 5 and 300 characters'),

  body('description')
  .trim()
  .isLength({ min: 10 })
  .withMessage('Description must be at least 10 characters long'),

  body('category').isIn(VALID_CATEGORIES),
  body('type').isIn(VALID_TYPES),
  body('severity').isIn(VALID_SEVERITIES),
  body('username').optional().trim().isLength({ max: 100 }),
  body('walletAddress')
  .optional({ checkFalsy: true })
  .trim()
  .matches(/^0x[a-fA-F0-9]{40}$/)
  .withMessage('Invalid wallet address'),

  body('projectLink')
  .optional({ checkFalsy: true })
  .customSanitizer(value => {
    if (!value) return value;
    if (!value.startsWith('http://') && !value.startsWith('https://')) {
      return 'https://' + value;
    }
    return value;
  })
  .isURL({
    require_protocol: true,
    require_tld: true
  })
  .withMessage('Project link must be a valid URL')
  .isLength({ max: 500 }),

  body('tags').optional().isArray({ max: 10 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const {
  submitterType,
  username,
  walletAddress,
  projectLink,
  additionalMetrics,
  title,
  description,
  category,
  type,
  severity,
  tags = [],
} = req.body;

const safeTags = Array.isArray(tags) ? tags : [];
const sessionId = req.headers['x-session-id'] || null;
const ipHash = req.ip || null;
  try {
    // Insert feedback (team auto-assigned by DB trigger)
    const insertResult = await query(
      `INSERT INTO feedback
         (submitter_type, username, wallet_address, project_link, additional_metrics,
          title, description, category, type, severity, tags, session_id, ip_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING id, title, category, type, severity, status, created_at`,
      [
        submitterType, username || null, walletAddress || null,
        projectLink || null, additionalMetrics || null,
        title, description, category, type, severity,
        JSON.stringify(safeTags), sessionId || null, ipHash || null,
      ]
    );

    const feedback = insertResult.rows[0];

    // Increment rate-limit counter
    await incrementSubmissionCount(sessionId, ipHash);

    // Create in-app notification record (for polling)
    await query(
      `INSERT INTO notifications (feedback_id, session_id, message)
       VALUES ($1, $2, $3)`,
      [feedback.id, sessionId, `Your feedback "${title}" has been received (status: New).`]
    );

    // Async AI processing — don't block the response
    processFeedback({ title, description, category, type, severity })
      .then(async ({ summary, tags: aiTags }) => {
  await query(
    `UPDATE feedback
     SET ai_summary = $1, ai_tags = $2, ai_processed = TRUE
     WHERE id = $3`,
    [summary, JSON.stringify(aiTags || []), feedback.id]
  );
})
      .catch(err => console.error('[AI Async]', err.message));

    res.status(201).json({
      id: feedback.id,
      message: 'Feedback submitted successfully.',
      status: feedback.status,
      sessionId, // client stores this for notification polling
    });
  } catch (err) {
    console.error('[Feedback Submit]', err);
    res.status(500).json({ error: 'Failed to submit feedback.' });
  }
});

// ─── GET /api/feedback ─── Dashboard List (auth) ─────────
router.get('/', authenticate, [
  vQuery('status').optional().isIn(VALID_STATUSES),
  vQuery('category').optional().isIn(VALID_CATEGORIES),
  vQuery('type').optional().isIn(VALID_TYPES),
  vQuery('severity').optional().isIn(VALID_SEVERITIES),
  vQuery('search').optional().trim().isLength({ max: 200 }),
  vQuery('page').optional().isInt({ min: 1 }),
  vQuery('limit').optional().isInt({ min: 1, max: 100 }),
], async (req, res) => {
  const { status, category, type, severity, search, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  // Non-admin members only see their team's feedback
  const restrictToTeam = req.user.role !== 'admin' && req.user.teamId;

  const conditions = [];
  const params = [];

  if (restrictToTeam) {
    params.push(req.user.teamId);
    conditions.push(`f.assigned_team = $${params.length}`);
  }
  if (status)   { params.push(status);   conditions.push(`f.status = $${params.length}`); }
  if (category) { params.push(category); conditions.push(`f.category = $${params.length}`); }
  if (type)     { params.push(type);     conditions.push(`f.type = $${params.length}`); }
  if (severity) { params.push(severity); conditions.push(`f.severity = $${params.length}`); }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(f.title ILIKE $${params.length} OR f.description ILIKE $${params.length})`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    params.push(limit, offset);
    const countResult = await query(
      `SELECT COUNT(*) FROM feedback f ${where}`,
      params.slice(0, -2)
    );

    const result = await query(
      `SELECT f.id, f.title, f.submitter_type, f.username, f.category, f.type,
              f.severity, f.status, f.tags, f.ai_tags, f.created_at, f.updated_at,
              t.name AS team_name,
              tm.display_name AS assignee_name
       FROM feedback f
       LEFT JOIN teams t ON t.id = f.assigned_team
       LEFT JOIN team_members tm ON tm.id = f.assigned_member
       ${where}
       ORDER BY
         CASE f.severity WHEN 'Critical' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END,
         f.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error('[Feedback List]', err);
    res.status(500).json({ error: 'Server error.' });
  }
});
// ─── GET /api/feedback/track/:id ── Public Tracking ──────
router.get('/track/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // simple safety check
    // Check if ID looks like UUID
const isUUID = /^[0-9a-fA-F-]{36}$/.test(id);

if (!isUUID) {
  return res.status(400).json({ error: 'Invalid feedback ID' });
}

    const result = await query(
      `SELECT id, title, status, created_at, updated_at
       FROM feedback
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error('TRACK ERROR:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/feedback/:id ── Detail (auth) ───────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT f.*,
              t.name AS team_name,
              tm.display_name AS assignee_name
       FROM feedback f
       LEFT JOIN teams t ON t.id = f.assigned_team
       LEFT JOIN team_members tm ON tm.id = f.assigned_member
       WHERE f.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found.' });

    const feedback = result.rows[0];

    // Non-admin: only allow own team's feedback
    if (req.user.role !== 'admin' && req.user.teamId &&
        feedback.assigned_team !== req.user.teamId) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Fetch internal notes
    const notes = await query(
      `SELECT n.*, tm.display_name AS author_name
       FROM internal_notes n
       JOIN team_members tm ON tm.id = n.author_id
       WHERE n.feedback_id = $1
       ORDER BY n.created_at ASC`,
      [req.params.id]
    );

    // Fetch status history
    const history = await query(
      `SELECT sh.*, tm.display_name AS changed_by_name
       FROM status_history sh
       LEFT JOIN team_members tm ON tm.id = sh.changed_by
       WHERE sh.feedback_id = $1
       ORDER BY sh.created_at DESC`,
      [req.params.id]
    );

    res.json({ ...feedback, notes: notes.rows, statusHistory: history.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── PATCH /api/feedback/:id/status ── Update Status ──────
router.patch('/:id/status', authenticate, [
  body('status').isIn(VALID_STATUSES),
  body('note').optional().trim().isLength({ max: 500 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { status, note } = req.body;

  try {
    const existing = await query('SELECT status, session_id, title FROM feedback WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Not found.' });

    const { status: oldStatus, session_id, title } = existing.rows[0];

    await query('UPDATE feedback SET status = $1 WHERE id = $2', [status, req.params.id]);

    // Audit trail
    await query(
      `INSERT INTO status_history (feedback_id, changed_by, old_status, new_status, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.params.id, req.user.id, oldStatus, status, note || null]
    );

    // In-app notification for submitter
    if (session_id) {
      await query(
        `INSERT INTO notifications (feedback_id, session_id, type, message)
         VALUES ($1, $2, 'status_change', $3)`,
        [req.params.id, session_id, `Your feedback "${title}" status changed to: ${status}`]
      );
    }

    res.json({ id: req.params.id, status });
  } catch (err) {
    console.error('[Status Update]', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── PATCH /api/feedback/:id/assign ── Assign Member ──────
router.patch('/:id/assign', authenticate, [
  body('memberId').optional().isUUID(),
], async (req, res) => {
  const { memberId } = req.body;
  try {
    await query('UPDATE feedback SET assigned_member = $1 WHERE id = $2', [memberId || null, req.params.id]);
    res.json({ id: req.params.id, assignedMember: memberId });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── GET /api/feedback/notifications/:sessionId ── Poll ───
router.get('/notifications/:sessionId', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM notifications
       WHERE session_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [req.params.sessionId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── POST /api/feedback/notifications/:id/read ───────────
router.post('/notifications/:id/read', async (req, res) => {
  await query('UPDATE notifications SET read = TRUE WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
