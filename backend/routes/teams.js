const router = require('express').Router();
const { query } = require('../models/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// ─── GET /api/teams ───────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT t.*, COUNT(f.id)::int AS feedback_count
       FROM teams t
       LEFT JOIN feedback f ON f.assigned_team = t.id
       GROUP BY t.id
       ORDER BY t.name`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── GET /api/teams/:id/members ───────────────────────────
router.get('/:id/members', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, username, display_name, role
       FROM team_members
       WHERE team_id = $1 AND is_active = TRUE
       ORDER BY display_name`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── GET /api/teams/stats ── Dashboard Overview ───────────
router.get('/stats/overview', authenticate, async (req, res) => {
  try {
    const teamFilter = req.user.role !== 'admin' && req.user.teamId
      ? `WHERE f.assigned_team = '${req.user.teamId}'` : '';

    const [statusStats, severityStats, categoryStats, recentActivity] = await Promise.all([
      query(`SELECT status, COUNT(*)::int AS count FROM feedback ${teamFilter} GROUP BY status`),
      query(`SELECT severity, COUNT(*)::int AS count FROM feedback ${teamFilter} GROUP BY severity`),
      query(`SELECT category, COUNT(*)::int AS count FROM feedback ${teamFilter} GROUP BY category`),
      query(
        `SELECT f.id, f.title, f.status, f.severity, f.updated_at
         FROM feedback f ${teamFilter}
         ORDER BY f.updated_at DESC LIMIT 5`
      ),
    ]);

    res.json({
      byStatus: statusStats.rows,
      bySeverity: severityStats.rows,
      byCategory: categoryStats.rows,
      recentActivity: recentActivity.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
