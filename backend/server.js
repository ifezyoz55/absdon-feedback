require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { apiLimiter } = require('./middleware/rateLimit');
const feedbackRouter = require('./routes/feedback');
const authRouter = require('./routes/auth');
const teamsRouter = require('./routes/teams');
const notesRouter = require('./routes/notes');

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Security & Logging ───────────────────────────────────
app.set('trust proxy', 1);
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── CORS ─────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// ─── Body Parsing ─────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── General Rate Limiter ─────────────────────────────────
app.use('/api/', apiLimiter);

// ─── Routes ───────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/feedback/:feedbackId/notes', notesRouter);

// ─── Health Check ─────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ─── 404 ──────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));

// ─── Global Error Handler ─────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Absdon Feedback API running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
