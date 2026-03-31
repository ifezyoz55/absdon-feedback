const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../models/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// ─── POST /api/auth/login ────────────────────────────────
router.post('/login', [
  body('username').trim().notEmpty().withMessage('Username required'),
  body('password').notEmpty().withMessage('Password required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, password } = req.body;

  try {
    const result = await query(
      `SELECT tm.*, t.name AS team_name, t.slug AS team_slug
       FROM team_members tm
       LEFT JOIN teams t ON t.id = tm.team_id
       WHERE tm.username = $1 AND tm.is_active = TRUE`,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const member = result.rows[0];
    const valid = await bcrypt.compare(password, member.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });

    // Update last login
    await query('UPDATE team_members SET last_login = NOW() WHERE id = $1', [member.id]);

    const token = jwt.sign(
      {
        id: member.id,
        username: member.username,
        displayName: member.display_name,
        role: member.role,
        teamId: member.team_id,
        teamSlug: member.team_slug,
        teamName: member.team_name,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      token,
      user: {
        id: member.id,
        username: member.username,
        displayName: member.display_name,
        role: member.role,
        teamId: member.team_id,
        teamName: member.team_name,
      },
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── GET /api/auth/me ────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT tm.id, tm.username, tm.display_name, tm.role, tm.team_id, tm.last_login,
              t.name AS team_name, t.slug AS team_slug
       FROM team_members tm
       LEFT JOIN teams t ON t.id = tm.team_id
       WHERE tm.id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── POST /api/auth/members (admin only) ─────────────────
router.post('/members', authenticate, requireAdmin, [
  body('username').trim().isLength({ min: 3, max: 50 }),
  body('password').isLength({ min: 8 }),
  body('displayName').trim().notEmpty(),
  body('role').isIn(['admin', 'lead', 'member']),
  body('teamId').optional().isUUID(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, password, displayName, role, teamId } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO team_members (username, password_hash, display_name, role, team_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, username, display_name, role, team_id`,
      [username, hash, displayName, role, teamId || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Username already exists.' });
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── GET /api/auth/members (admin only) ──────────────────
router.get('/members', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT tm.id, tm.username, tm.display_name, tm.role, tm.is_active, tm.last_login,
              t.name AS team_name
       FROM team_members tm
       LEFT JOIN teams t ON t.id = tm.team_id
       ORDER BY tm.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
