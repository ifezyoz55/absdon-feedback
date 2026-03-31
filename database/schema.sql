-- ============================================================
-- Absdon  Feedback System — PostgreSQL Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- TEAMS
-- ─────────────────────────────────────────────
CREATE TABLE teams (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) NOT NULL UNIQUE,
  slug        VARCHAR(50) NOT NULL UNIQUE,  -- e.g. 'dev-team', 'community-team'
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO teams (name, slug, description) VALUES
  ('Dev Team',              'dev-team',         'Handles developer-related feedback and bugs'),
  ('Community Team',        'community-team',   'Manages community engagement and support'),
  ('Dev/Partnership Team',  'partnership-team', 'Handles builder and partnership feedback'),
  ('General/Founder Level', 'general-team',     'Suggestions, advice, and strategic feedback');

-- ─────────────────────────────────────────────
-- TEAM MEMBERS (Internal Dashboard Users)
-- ─────────────────────────────────────────────
CREATE TABLE team_members (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username     VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  role         VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'lead', 'member')),
  team_id      UUID REFERENCES teams(id) ON DELETE SET NULL,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  last_login   TIMESTAMPTZ
);

-- Default admin account (password: 'admin123' — change before production)
INSERT INTO team_members (username, password_hash, display_name, role, team_id)
VALUES ('admin', '$2b$10$placeholder_hash_here', 'System Admin', 'admin', NULL);

-- ─────────────────────────────────────────────
-- FEEDBACK SUBMISSIONS
-- ─────────────────────────────────────────────
CREATE TABLE feedback (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Submitter identity
  submitter_type  VARCHAR(20) NOT NULL DEFAULT 'anonymous'
                    CHECK (submitter_type IN ('regular', 'builder', 'anonymous')),
  username        VARCHAR(100),
  wallet_address  VARCHAR(100),
  project_link    TEXT,
  additional_metrics TEXT,

  -- Core feedback
  title           VARCHAR(300) NOT NULL,
  description     TEXT NOT NULL,
  category        VARCHAR(50) NOT NULL
                    CHECK (category IN ('Community','Builders','Developers','Suggestions','Advice')),
  type            VARCHAR(50) NOT NULL
                    CHECK (type IN ('Bug','Idea','Complaint','Praise')),
  severity        VARCHAR(20) NOT NULL DEFAULT 'Low'
                    CHECK (severity IN ('Low','Medium','Critical')),
  tags            TEXT[] DEFAULT '{}',        -- manual + AI-generated

  -- AI enrichment
  ai_summary      TEXT,
  ai_tags         TEXT[] DEFAULT '{}',
  ai_processed    BOOLEAN DEFAULT FALSE,

  -- Assignment & workflow
  status          VARCHAR(30) NOT NULL DEFAULT 'New'
                    CHECK (status IN ('New','Under Review','Accepted','Rejected','Implemented')),
  assigned_team   UUID REFERENCES teams(id) ON DELETE SET NULL,
  assigned_member UUID REFERENCES team_members(id) ON DELETE SET NULL,

  -- Anti-spam
  session_id      VARCHAR(200),
  ip_hash         VARCHAR(64),               -- SHA-256 of IP, never raw IP

  -- Notifications
  notification_sent BOOLEAN DEFAULT FALSE,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Index for common dashboard queries
CREATE INDEX idx_feedback_status    ON feedback(status);
CREATE INDEX idx_feedback_category  ON feedback(category);
CREATE INDEX idx_feedback_severity  ON feedback(severity);
CREATE INDEX idx_feedback_team      ON feedback(assigned_team);
CREATE INDEX idx_feedback_created   ON feedback(created_at DESC);
CREATE INDEX idx_feedback_session   ON feedback(session_id);
CREATE INDEX idx_feedback_ip        ON feedback(ip_hash);

-- ─────────────────────────────────────────────
-- INTERNAL NOTES (team-only, never public)
-- ─────────────────────────────────────────────
CREATE TABLE internal_notes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feedback_id UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notes_feedback ON internal_notes(feedback_id);

-- ─────────────────────────────────────────────
-- FEEDBACK STATUS HISTORY (audit trail)
-- ─────────────────────────────────────────────
CREATE TABLE status_history (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feedback_id  UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  changed_by   UUID REFERENCES team_members(id) ON DELETE SET NULL,
  old_status   VARCHAR(30),
  new_status   VARCHAR(30) NOT NULL,
  note         TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_history_feedback ON status_history(feedback_id);

-- ─────────────────────────────────────────────
-- IN-APP NOTIFICATIONS
-- ─────────────────────────────────────────────
CREATE TABLE notifications (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feedback_id  UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  session_id   VARCHAR(200),               -- link back to submitter session
  type         VARCHAR(50) DEFAULT 'status_change',
  message      TEXT NOT NULL,
  read         BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notif_session ON notifications(session_id);

-- ─────────────────────────────────────────────
-- SPAM RATE LIMITING
-- ─────────────────────────────────────────────
CREATE TABLE submission_limits (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier   VARCHAR(200) NOT NULL,   -- session_id or ip_hash
  count        INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(identifier)
);

-- ─────────────────────────────────────────────
-- AUTO-ASSIGN TRIGGER
-- Maps category → team on insert
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION auto_assign_team()
RETURNS TRIGGER AS $$
BEGIN
  NEW.assigned_team := (
    SELECT id FROM teams WHERE slug = CASE NEW.category
      WHEN 'Developers'  THEN 'dev-team'
      WHEN 'Community'   THEN 'community-team'
      WHEN 'Builders'    THEN 'partnership-team'
      ELSE 'general-team'
    END
    LIMIT 1
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_assign
  BEFORE INSERT ON feedback
  FOR EACH ROW EXECUTE FUNCTION auto_assign_team();

-- updated_at auto-bump
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_feedback_updated
  BEFORE UPDATE ON feedback
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_notes_updated
  BEFORE UPDATE ON internal_notes
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
