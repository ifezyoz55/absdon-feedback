# Absdon  Feedback System

A full-stack Web2 feedback platform for the Absdon  ecosystem. Public users submit structured feedback; internal teams review, triage, and respond through a private dashboard — enriched by AI summarisation and auto-tagging.

---

## Architecture Overview

```
Absdon-feedback/
├── backend/               # Node.js + Express API
│   ├── middleware/
│   │   ├── auth.js        # JWT verification
│   │   └── rateLimit.js   # Spam control
│   ├── models/
│   │   └── db.js          # PostgreSQL pool
│   ├── routes/
│   │   ├── auth.js        # Login, member management
│   │   ├── feedback.js    # Submit, list, update, assign
│   │   ├── notes.js       # Internal notes
│   │   └── teams.js       # Teams + stats
│   ├── services/
│   │   └── ai.js          # OpenAI summarisation + tagging
│   ├── .env.example
│   └── server.js
├── database/
│   └── schema.sql         # Full PostgreSQL schema + triggers
├── frontend/              # React + Vite + Tailwind
│   └── src/
│       ├── components/    # Shared UI components
│       ├── context/       # Auth + Notification context
│       ├── pages/
│       │   ├── SubmitPage.jsx    # Public feedback form
│       │   ├── SuccessPage.jsx   # Submission confirmation
│       │   └── dashboard/
│       │       ├── LoginPage.jsx
│       │       ├── DashboardLayout.jsx
│       │       ├── OverviewPage.jsx
│       │       ├── FeedbackListPage.jsx
│       │       ├── FeedbackDetailPage.jsx
│       │       └── TeamMembersPage.jsx
│       └── services/
│           └── api.js     # Axios API client
└── scripts/
    └── seed.js            # DB seeder
```

---

## Prerequisites

- **Node.js** 18+
- **PostgreSQL** 14+
- **npm** 9+
- **OpenAI API key** (optional — falls back gracefully)

---

## Quick Start

### 1. Clone & install

```bash
git clone <repo-url> Absdon-feedback
cd Absdon-feedback
npm run install:all
```

### 2. Create the database

```bash
createdb Absdon_feedback

# Or with psql:
psql -U postgres -c "CREATE DATABASE Absdon_feedback;"
```

### 3. Run the schema

```bash
psql -U postgres -d Absdon_feedback -f database/schema.sql
```

### 4. Configure the backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/Absdon_feedback
JWT_SECRET=your_long_random_secret_minimum_32_chars
OPENAI_API_KEY=sk-your-openai-key-here
FRONTEND_URL=http://localhost:5173
```

### 5. Seed initial accounts

```bash
# From project root
node scripts/seed.js
```

This creates:

| Username   | Password     | Role   | Team               |
|------------|--------------|--------|--------------------|
| admin      | Admin@1234   | admin  | (all teams)        |
| dev_lead   | DevLead@123  | lead   | Dev Team           |
| comms_mod  | Comms@123    | member | Community Team     |
| biz_dev    | BizDev@123   | member | Partnership Team   |

> ⚠️ Change all passwords before deploying to production!

### 6. Start the servers

**Terminal 1 — Backend:**
```bash
cd backend && npm run dev
# Runs on http://localhost:4000
```

**Terminal 2 — Frontend:**
```bash
cd frontend && npm run dev
# Runs on http://localhost:5173
```

---

## Application URLs

| URL                                    | Description              |
|----------------------------------------|--------------------------|
| `http://localhost:5173/`               | Public feedback form     |
| `http://localhost:5173/success`        | Post-submission page     |
| `http://localhost:5173/dashboard/login`| Team login               |
| `http://localhost:5173/dashboard`      | Overview & stats         |
| `http://localhost:5173/dashboard/feedback` | Feedback list + filters |
| `http://localhost:5173/dashboard/members`  | Member management (admin)|

---

## API Reference

### Public Endpoints

| Method | Path                                   | Description                 |
|--------|----------------------------------------|-----------------------------|
| POST   | `/api/feedback`                        | Submit feedback             |
| GET    | `/api/feedback/notifications/:session` | Poll notifications          |
| POST   | `/api/feedback/notifications/:id/read` | Mark notification read      |
| GET    | `/health`                              | Health check                |

### Authenticated Endpoints (Bearer JWT)

| Method | Path                              | Description               |
|--------|-----------------------------------|---------------------------|
| POST   | `/api/auth/login`                 | Team member login         |
| GET    | `/api/auth/me`                    | Current user              |
| POST   | `/api/auth/members`               | Create member (admin)     |
| GET    | `/api/auth/members`               | List members (admin)      |
| GET    | `/api/feedback`                   | List feedback (filtered)  |
| GET    | `/api/feedback/:id`               | Feedback detail           |
| PATCH  | `/api/feedback/:id/status`        | Update status             |
| PATCH  | `/api/feedback/:id/assign`        | Assign to member          |
| GET    | `/api/feedback/:id/notes`         | List internal notes       |
| POST   | `/api/feedback/:id/notes`         | Add note                  |
| DELETE | `/api/feedback/:id/notes/:noteId` | Delete note               |
| GET    | `/api/teams`                      | List teams                |
| GET    | `/api/teams/:id/members`          | Team members              |
| GET    | `/api/teams/stats/overview`       | Dashboard stats           |

---

## Features

### Public Form
- **Three submitter types**: Regular (username + wallet), Builder (name, AGW wallet, project link, metrics), Anonymous (no identity, session tracked)
- **Full classification**: Category, Type, Severity, manual tags
- **Spam protection**: 5 submissions per session/IP per 24h (configurable)
- **In-app notifications**: Poll for status changes by session ID

### AI Enrichment (async, non-blocking)
- GPT-4o-mini generates a 2-3 sentence summary
- Auto-tags (3-6 keywords) appended to manual tags
- Graceful fallback if OpenAI key is missing

### Auto-assignment
Database trigger maps categories to teams automatically:
- **Developers** → Dev Team
- **Community** → Community Team
- **Builders** → Dev/Partnership Team
- **Suggestions / Advice** → General/Founder Level

### Team Dashboard
- Role-based access: admins see all teams, members see only their team
- Filter by status, category, type, severity, text search
- Full-text detail view with AI summary, tags, submitter info
- Internal notes (team-only, supports ⌘+Enter)
- Status updates with optional notes + full audit trail
- Assign feedback to specific team members

### Security
- Passwords hashed with bcrypt (cost 10)
- JWT auth (8h expiry)
- IPs stored as SHA-256 hashes — never raw
- Helmet + CORS configured
- Input validation on all endpoints

---

## Database Schema (summary)

| Table              | Purpose                                    |
|--------------------|--------------------------------------------|
| `teams`            | 4 pre-seeded internal teams                |
| `team_members`     | Dashboard user accounts                    |
| `feedback`         | All submissions with AI enrichment fields  |
| `internal_notes`   | Team-only notes per feedback item          |
| `status_history`   | Full audit trail of status changes         |
| `notifications`    | In-app notification records                |
| `submission_limits`| Rate limiting counters per session/IP      |

---

## Environment Variables

| Variable                  | Required | Default      | Description                      |
|---------------------------|----------|--------------|----------------------------------|
| `DATABASE_URL`            | ✅       | —            | PostgreSQL connection string     |
| `JWT_SECRET`              | ✅       | —            | Min 32 char random string        |
| `OPENAI_API_KEY`          | ⚡ opt   | —            | GPT-4o-mini for AI features      |
| `PORT`                    | —        | 4000         | API server port                  |
| `FRONTEND_URL`            | —        | localhost:5173 | CORS allowed origin            |
| `MAX_SUBMISSIONS_PER_DAY` | —        | 5            | Spam limit per session/IP        |
| `JWT_EXPIRES_IN`          | —        | 8h           | Token expiry                     |

---

## Production Notes

1. **Change all seed passwords** immediately
2. Set `NODE_ENV=production` to enable SSL for PostgreSQL
3. Use a proper secret manager for `JWT_SECRET` and `OPENAI_API_KEY`
4. Add database connection pooling (e.g., PgBouncer) for high traffic
5. Deploy frontend to Vercel/Netlify, backend to Railway/Render/EC2
6. Set up PostgreSQL backups
7. Consider adding email notifications (SendGrid/Resend) to replace in-app polling

---

## Tech Stack

| Layer    | Technology                         |
|----------|------------------------------------|
| Frontend | React 18, Vite, Tailwind CSS       |
| Routing  | React Router v6                    |
| HTTP     | Axios                              |
| Backend  | Node.js, Express 4                 |
| Database | PostgreSQL 14+ (pg driver)         |
| Auth     | JWT (jsonwebtoken), bcryptjs       |
| AI       | OpenAI GPT-4o-mini                 |
| Security | Helmet, express-rate-limit         |
| Fonts    | Syne, DM Sans, JetBrains Mono      |
