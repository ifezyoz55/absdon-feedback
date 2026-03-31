const router = require('express').Router({ mergeParams: true });
const { body, validationResult } = require('express-validator');
const { query } = require('../models/db');
const { authenticate } = require('../middleware/auth');

// All notes routes require authentication
router.use(authenticate);

// ─── GET /api/feedback/:feedbackId/notes ─────────────────
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT n.id, n.content, n.created_at, n.updated_at,
              tm.display_name AS author_name, tm.username AS author_username
       FROM internal_notes n
       JOIN team_members tm ON tm.id = n.author_id
       WHERE n.feedback_id = $1
       ORDER BY n.created_at ASC`,
      [req.params.feedbackId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── POST /api/feedback/:feedbackId/notes ────────────────
router.post('/', [
  body('content').trim().isLength({ min: 1, max: 2000 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const result = await query(
      `INSERT INTO internal_notes (feedback_id, author_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, content, created_at`,
      [req.params.feedbackId, req.user.id, req.body.content]
    );

    res.status(201).json({
      ...result.rows[0],
      author_name: req.user.displayName,
      author_username: req.user.username,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── DELETE /api/feedback/:feedbackId/notes/:noteId ──────
router.delete('/:noteId', async (req, res) => {
  try {
    const result = await query(
      `DELETE FROM internal_notes
       WHERE id = $1 AND author_id = $2
       RETURNING id`,
      [req.params.noteId, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found or not yours.' });
    }
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
