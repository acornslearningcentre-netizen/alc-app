// Express server: API-only backend, backed by Postgres. The frontend is a
// separate Railway service (static-server.js) that serves the built Vite
// SPA and talks to this service cross-origin — see CORS_ORIGIN below.
//   - /api/review/*    — reviewer-guide feedback (existing)
//   - /api/intake, /api/prospects/*, /api/assessments/*, /api/observations/*
//     — onboarding journey (Epic B onwards)
//   - /api/auth/*      — real login/session backend (SCRUM-16, Sprint 1)
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import pg from 'pg';
import { hashPassword, verifyPassword, hashPasscode, genToken, genPasscode, publicUser } from './lib/auth.js';
import { createAttemptThrottle } from './lib/throttle.js';
import {
  trim, optional, cleanPriority, isEmail, toBool,
  PROSPECT_STATUSES, ASSESSMENT_STATUSES, OBSERVATION_KINDS,
  cleanProspectStatus, cleanAssessmentStatus, cleanObservationKind,
  cleanTone, cleanPronoun, cleanFlowState, isIsoDate, isTimeHHMM, cleanNextStepStatus, cleanDay, cleanPlanStatus,
  parsePositiveIntId, parseCorsOrigins,
} from './lib/validators.js';
import { composeDraftReport } from './lib/report-draft.js';
import { isAllowedMimeType, extensionFor, MAX_UPLOAD_BYTES } from './lib/media.js';
import { sendReportEmail } from './lib/report-email.js';
import { parseChildRow, toJsonArrayColumn, parseJsonArray, canSeeChild } from './lib/children.js';
import { canSeeFlowStep } from './lib/flow.js';
import { canSeeThread } from './lib/messaging.js';
import { composeNextStepSuggestion } from './lib/next-steps.js';
import { computeMastery, computeAttendance, computeStreak, computeTrend } from './lib/progress.js';

const { Pool } = pg;
const PORT = Number(process.env.PORT) || 3000;

// SCRUM-87 — uploaded media (photos/videos/voice recordings) lands here.
// Defaults to the Railway volume mount when one is attached (persists across
// deploys); falls back to a local folder for dev, where persistence doesn't matter.
const DATA_DIR = process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(process.cwd(), 'data');
const MEDIA_DIR = path.join(DATA_DIR, 'media');
fs.mkdirSync(MEDIA_DIR, { recursive: true });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set — link the Postgres service and set it as an env var.');
}
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const nowIso = () => new Date().toISOString();

async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS area_feedback (
      id SERIAL PRIMARY KEY,
      area_key TEXT NOT NULL,
      area_label TEXT NOT NULL,
      comment TEXT NOT NULL,
      author TEXT,
      role TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS feature_feedback (
      id SERIAL PRIMARY KEY,
      feature_key TEXT NOT NULL,
      feature_label TEXT NOT NULL,
      comment TEXT NOT NULL,
      author TEXT,
      role TEXT,
      priority TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS requests (
      id SERIAL PRIMARY KEY,
      feature TEXT NOT NULL,
      description TEXT NOT NULL,
      author TEXT,
      priority TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Onboarding: one row per family that submits the public intake form.
    -- High-signal answers from the intake are mirrored here as indexed columns
    -- so the owner queue can filter quickly; the full answer set lives in
    -- intake_responses.answers (JSON) — see Story B2.
    CREATE TABLE IF NOT EXISTS prospects (
      id                  SERIAL PRIMARY KEY,
      parent_email        TEXT NOT NULL,
      parent_name         TEXT,
      parent_phone        TEXT,
      child_first_name    TEXT,
      child_dob           TEXT,           -- ISO date YYYY-MM-DD; age is derived
      year_group          TEXT,           -- Reception | Year 1..6
      homework_in_plan    TEXT,           -- yes | no | maybe
      tech_comfort_parent TEXT,           -- intake Q8
      tech_comfort_child  TEXT,           -- intake Q9
      flagged_needs       BOOLEAN NOT NULL DEFAULT false,  -- true if Q19 has any non-None
      consent_notes       BOOLEAN NOT NULL DEFAULT false,  -- Q22 (required to enrol)
      consent_media       BOOLEAN NOT NULL DEFAULT false,  -- Q23 (required to enrol)
      status              TEXT NOT NULL DEFAULT 'prospect'
                            CHECK (status IN ('prospect','booked','assessed','enrolled','declined')),
      created_at          TEXT NOT NULL,
      updated_at          TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_prospects_status      ON prospects(status);
    CREATE INDEX IF NOT EXISTS idx_prospects_parent_mail ON prospects(parent_email);
    CREATE INDEX IF NOT EXISTS idx_prospects_created_at  ON prospects(created_at DESC);

    -- Onboarding: full intake answer set, one row per prospect.
    -- The high-signal answers are mirrored on prospects (B1) for fast filtering;
    -- everything else (goals, focus aids, hobbies Q17, etc.) lives here as JSON
    -- so the report-draft prompt (F2) can read the whole picture.
    CREATE TABLE IF NOT EXISTS intake_responses (
      id            SERIAL PRIMARY KEY,
      prospect_id   INTEGER NOT NULL UNIQUE
                      REFERENCES prospects(id) ON DELETE CASCADE,
      answers       TEXT    NOT NULL,         -- JSON: { [questionId]: value }
      submitted_at  TEXT    NOT NULL
    );

    -- Onboarding: the 2-hour assessment session a prospect books, plus the
    -- AI-drafted report that gets signed off and emailed to the parent.
    -- Multiple rows per prospect are allowed (re-assessment within the
    -- 4-week reassessment window — see project CLAUDE.md "working agreements").
    CREATE TABLE IF NOT EXISTS assessments (
      id                    SERIAL PRIMARY KEY,
      prospect_id           INTEGER NOT NULL
                              REFERENCES prospects(id) ON DELETE CASCADE,
      scheduled_for         TEXT,                 -- ISO datetime
      teacher_id            TEXT,                 -- loose for now (no teachers table yet)
      status                TEXT NOT NULL DEFAULT 'scheduled'
                              CHECK (status IN ('scheduled','in_progress','done')),
      report_draft          TEXT,                 -- HTML/Markdown body, populated by F2
      report_signed_off_at  TEXT,
      sent_to_parent_at     TEXT,
      created_at            TEXT NOT NULL,
      updated_at            TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_assessments_prospect    ON assessments(prospect_id);
    CREATE INDEX IF NOT EXISTS idx_assessments_status      ON assessments(status);
    CREATE INDEX IF NOT EXISTS idx_assessments_scheduled   ON assessments(scheduled_for);

    -- Onboarding: in-the-moment observations captured by a teacher during
    -- (or outside of) an assessment. prospect_id and child_id are both
    -- nullable so an observation can belong to a prospect (pre-enrolment),
    -- a child (post-enrolment), or be a free-floating teacher note.
    CREATE TABLE IF NOT EXISTS observations (
      id            SERIAL PRIMARY KEY,
      prospect_id   INTEGER REFERENCES prospects(id) ON DELETE CASCADE,
      child_id      TEXT,                              -- stores children.id as text once real (SCRUM-22); still opaque pre-enrolment
      teacher_id    TEXT,
      kind          TEXT NOT NULL
                      CHECK (kind IN ('image','video','voice','text')),
      media_url     TEXT,                              -- relative path under data/media/ for now (B6)
      transcript    TEXT,                              -- for voice → text (E3)
      comment       TEXT,                              -- teacher's typed note
      captured_at   TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_observations_prospect ON observations(prospect_id);
    CREATE INDEX IF NOT EXISTS idx_observations_child    ON observations(child_id);
    CREATE INDEX IF NOT EXISTS idx_observations_kind     ON observations(kind);
    CREATE INDEX IF NOT EXISTS idx_observations_captured ON observations(captured_at DESC);

    -- Classroom Observations for Enrolled Children (SCRUM-35/36) — extends
    -- the observations table that already existed for the pre-enrolment
    -- onboarding flow, rather than creating a parallel one. Existing rows
    -- are untouched (both columns are nullable, no backfill needed).
    ALTER TABLE observations ADD COLUMN IF NOT EXISTS tags TEXT; -- JSON array of strings, e.g. ["curious","focused"]
    ALTER TABLE observations ADD COLUMN IF NOT EXISTS mood TEXT;

    -- Classroom Roster (SCRUM-22/23): real children/teachers/parents records,
    -- replacing the fixed demo list baked into the frontend. Linking an auth
    -- user (users.teacher_id) to a real teachers.id row is Sprint 6's job
    -- (User Provisioning, SCRUM-95) — until then, teacher accounts see an
    -- empty roster rather than someone else's class, which is the correct
    -- (not broken) default.
    CREATE TABLE IF NOT EXISTS teachers (
      id         SERIAL PRIMARY KEY,
      name       TEXT NOT NULL,
      email      TEXT UNIQUE,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS children (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL,
      dob         TEXT,                              -- ISO date; age is derived
      initials    TEXT,
      tone        TEXT CHECK (tone IN ('sage','ochre','plum','sky')),
      teacher_id  INTEGER REFERENCES teachers(id),
      pronoun     TEXT CHECK (pronoun IN ('he','she','they')),
      focus       TEXT,                              -- JSON array of strings
      strengths   TEXT,                              -- JSON array of strings
      gaps        TEXT,                              -- JSON array of strings
      style       TEXT,
      flags       TEXT,                              -- JSON array of strings
      prospect_id INTEGER REFERENCES prospects(id),  -- kept if this child enrolled from onboarding
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_children_teacher  ON children(teacher_id);
    CREATE INDEX IF NOT EXISTS idx_children_prospect ON children(prospect_id);

    CREATE TABLE IF NOT EXISTS parents (
      id       SERIAL PRIMARY KEY,
      child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      name     TEXT NOT NULL,
      relation TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_parents_child ON parents(child_id);

    -- Today's Daily Flow (SCRUM-30/31) — replaces the fixed sample timeline
    -- on the Teacher Today screen. One row per step; each belongs to exactly
    -- one teacher and one date, so different teachers' (and different days')
    -- schedules never mix. sort_order is a tiebreaker for steps that share
    -- the same time value — ORDER BY time, sort_order gives a stable sort.
    CREATE TABLE IF NOT EXISTS daily_flow_steps (
      id           SERIAL PRIMARY KEY,
      teacher_id   INTEGER NOT NULL REFERENCES teachers(id),
      date         TEXT NOT NULL,           -- YYYY-MM-DD
      time         TEXT NOT NULL,           -- HH:MM, 24hr
      label        TEXT NOT NULL,
      state        TEXT NOT NULL DEFAULT 'next' CHECK (state IN ('done','now','next')),
      ai_suggested BOOLEAN NOT NULL DEFAULT false,
      sort_order   INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_flow_teacher_date ON daily_flow_steps(teacher_id, date);

    -- AI Suggestions & Next Steps (SCRUM-39/40) — turns the "AI suggestions
    -- awaiting review" counter and the "three things to try today" brief on
    -- Teacher Today from hand-written example text into real, trackable
    -- recommendations. Resolved (accepted/dismissed) rows are kept, never
    -- deleted, so a leader can later see how often suggestions get used.
    CREATE TABLE IF NOT EXISTS next_steps (
      id           SERIAL PRIMARY KEY,
      child_id     INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      type         TEXT NOT NULL,
      title        TEXT NOT NULL,
      rationale    TEXT,
      status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','dismissed')),
      suggested_at TEXT NOT NULL,
      resolved_at  TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_next_steps_child  ON next_steps(child_id);
    CREATE INDEX IF NOT EXISTS idx_next_steps_status ON next_steps(status);

    -- Lesson Planning (SCRUM-45/46) — the weekly lesson plan and each
    -- student's per-lesson status, replacing the fixed sample week. A
    -- student can only have one status row per lesson (UNIQUE below);
    -- deleting a lesson plan cascades to its per-student rows.
    CREATE TABLE IF NOT EXISTS lesson_plans (
      id         SERIAL PRIMARY KEY,
      teacher_id INTEGER NOT NULL REFERENCES teachers(id),
      day        TEXT NOT NULL CHECK (day IN ('Mon','Tue','Wed','Thu','Fri')),
      week_of    TEXT NOT NULL,           -- ISO date of that week's Monday
      time       TEXT NOT NULL,           -- HH:MM, 24hr
      subject    TEXT NOT NULL,
      title      TEXT NOT NULL,
      summary    TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_lesson_plans_teacher_week ON lesson_plans(teacher_id, week_of);

    CREATE TABLE IF NOT EXISTS lesson_plan_students (
      id             SERIAL PRIMARY KEY,
      lesson_plan_id INTEGER NOT NULL REFERENCES lesson_plans(id) ON DELETE CASCADE,
      child_id       INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('accepted','edited','pending')),
      activity       TEXT NOT NULL,
      note           TEXT,
      UNIQUE (lesson_plan_id, child_id)
    );
    CREATE INDEX IF NOT EXISTS idx_lesson_plan_students_plan ON lesson_plan_students(lesson_plan_id);

    -- Child & Class Progress Tracking (SCRUM-50/51) — replaces the fixed
    -- mastery/attendance/streak/trend numbers with real computed ones. One
    -- row per child per day (UNIQUE below); GET /api/children/:id/progress
    -- (SCRUM-52) computes and upserts today's row from real observations and
    -- lesson-plan activity on every call, rather than needing a separate
    -- write endpoint — re-running the calculation updates that day's row,
    -- it never duplicates it.
    CREATE TABLE IF NOT EXISTS progress_snapshots (
      id         SERIAL PRIMARY KEY,
      child_id   INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      date       TEXT NOT NULL,
      mastery    REAL,
      attendance REAL,
      streak     INTEGER,
      trend      TEXT CHECK (trend IN ('up','down','flat','steady')),
      UNIQUE (child_id, date)
    );
    CREATE INDEX IF NOT EXISTS idx_progress_child_date ON progress_snapshots(child_id, date DESC);

    -- Teacher ⇄ Parent Messaging (SCRUM-54/55) — real, persistent
    -- conversations replacing the fixed sample threads. One thread per
    -- teacher+child pair (shared by every parent/carer of that child — the
    -- conversation is with the family, not a single parent account).
    -- Deleting a thread cascades to its messages, no orphans left behind.
    CREATE TABLE IF NOT EXISTS message_threads (
      id          SERIAL PRIMARY KEY,
      teacher_id  INTEGER NOT NULL REFERENCES teachers(id),
      child_id    INTEGER NOT NULL REFERENCES children(id),
      parent_name TEXT NOT NULL,
      created_at  TEXT NOT NULL,
      UNIQUE (teacher_id, child_id)
    );
    CREATE INDEX IF NOT EXISTS idx_threads_teacher ON message_threads(teacher_id);
    CREATE INDEX IF NOT EXISTS idx_threads_child   ON message_threads(child_id);

    CREATE TABLE IF NOT EXISTS messages (
      id          SERIAL PRIMARY KEY,
      thread_id   INTEGER NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
      sender_role TEXT NOT NULL CHECK (sender_role IN ('teacher','parent')),
      sender_name TEXT NOT NULL,
      body        TEXT NOT NULL,
      sent_at     TEXT NOT NULL,
      read_at     TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id, sent_at);

    -- Auth (SCRUM-16 / SCRUM-17): real accounts and sessions, replacing the
    -- passcode-in-the-frontend-bundle login. Staff (teacher/leader) sign in
    -- with email+password; parent/student sign in with a short passcode.
    -- child_id / teacher_id are loose opaque refs for now — the real children
    -- and teachers tables land in SCRUM-22 (Classroom Roster, Sprint 2).
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      role          TEXT NOT NULL CHECK (role IN ('teacher','parent','student','leader')),
      email         TEXT UNIQUE,           -- staff login only (teacher/leader)
      password_hash TEXT,                  -- staff login only; salt:scrypt-hash, never plain text
      passcode_hash TEXT,                  -- parent/student login only; HMAC-SHA256, never plain text
      name          TEXT NOT NULL,
      child_id      TEXT,                  -- opaque ref; no children table yet (SCRUM-22)
      teacher_id    TEXT,                  -- opaque ref; no teachers table yet (SCRUM-22)
      created_at    TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_users_role_passcode ON users(role, passcode_hash);

    CREATE TABLE IF NOT EXISTS sessions (
      id          TEXT PRIMARY KEY,        -- opaque session token (also the bearer token)
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at  TEXT NOT NULL,
      expires_at  TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  `);
}

// ── Auth helpers (SCRUM-16) ─────────────────────────────────────────────────
// Passwords: per-user random salt + scrypt (verified after an email lookup).
// Passcodes: keyed HMAC so a family/child can be found by passcode alone,
// the way the login screen already works — no separate username field.
// Pure hashing/token logic lives in ./lib/auth.js (unit-tested there).
const PASSCODE_PEPPER = process.env.PASSCODE_PEPPER;
if (!PASSCODE_PEPPER) {
  console.warn('PASSCODE_PEPPER is not set — using an insecure dev-only default. Set it in Railway for production.');
}
const passcodePepper = PASSCODE_PEPPER || 'dev-only-insecure-pepper-change-me';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const createSession = async (userId) => {
  const token = genToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  await pool.query('INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES ($1, $2, $3, $4)', [token, userId, nowIso(), expiresAt]);
  return { token, expiresAt };
};

// Very small in-memory throttle: flags unusually many failed attempts from
// the same IP without permanently locking a family out of a shared device.
// Factory lives in ./lib/throttle.js (unit-tested there).
const { tooManyFailedAttempts, recordFailedAttempt } = createAttemptThrottle();

const requireAuth = async (req, res, next) => {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) return res.status(401).json({ error: 'not signed in' });

  const { rows: [session] } = await pool.query('SELECT * FROM sessions WHERE id = $1', [token]);
  if (!session || session.expires_at < new Date().toISOString()) {
    if (session) await pool.query('DELETE FROM sessions WHERE id = $1', [token]);
    return res.status(401).json({ error: 'session expired, please sign in again' });
  }
  const { rows: [user] } = await pool.query('SELECT * FROM users WHERE id = $1', [session.user_id]);
  if (!user) return res.status(401).json({ error: 'not signed in' });

  req.user = user;
  req.token = token;
  next();
};

// Classroom Roster (SCRUM-24+) — first use of role-gating in this API.
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'forbidden' });
  next();
};

// Demo seed accounts — mirrors the passcodes already in src/data/seed.ts so
// the same demo login story works with a real backend behind it. Each
// account is seeded independently (checked by email or by role+passcode) so
// that e.g. adding DEMO_TEACHER_PASSWORD later still seeds the teacher
// account even though the parent/student passcodes were already seeded on
// an earlier boot — this is NOT a single "table is empty" gate.
//
// Passcodes are the same ones already shown on the login screen ("Demo
// passcodes: ...") and hardcoded in src/data/seed.ts, so seeding them here
// doesn't expose anything new. Staff passwords are real credentials and are
// NEVER hardcoded — they're only seeded if DEMO_TEACHER_PASSWORD /
// DEMO_LEADER_PASSWORD are set as env vars (e.g. in Railway); otherwise
// those two accounts are skipped and a warning is logged.
async function seedDemoAccounts() {
  const AUTH_SEED = [
    { role: 'teacher', email: 'ana@acornslearningcentre.com', password: process.env.DEMO_TEACHER_PASSWORD, name: 'Ana' },
    { role: 'leader', email: 'leader@acornslearningcentre.com', password: process.env.DEMO_LEADER_PASSWORD, name: 'Dr. Okafor' },
    { role: 'parent', passcode: '0000', name: 'Ravi Shah', child_id: 'c5' },
    { role: 'student', passcode: '0000', name: 'Amara', child_id: 'c1' },
    { role: 'student', passcode: '1111', name: 'Mei', child_id: 'c3' },
  ].filter((u) => u.password !== undefined || u.passcode !== undefined);

  for (const { role, envVar } of [{ role: 'teacher', envVar: 'DEMO_TEACHER_PASSWORD' }, { role: 'leader', envVar: 'DEMO_LEADER_PASSWORD' }]) {
    if (!process.env[envVar]) {
      console.warn(`${envVar} is not set — skipping demo ${role} account seed. Set it (in Railway for production) to enable demo ${role} login.`);
    }
  }

  let seeded = 0;
  await withTransaction(async (client) => {
    for (const u of AUTH_SEED) {
      const email = u.email ? u.email.toLowerCase() : null;
      const passcodeHash = u.passcode ? hashPasscode(u.passcode, passcodePepper) : null;
      const { rows: [exists] } = email
        ? await client.query('SELECT 1 FROM users WHERE email = $1', [email])
        : await client.query('SELECT 1 FROM users WHERE role = $1 AND passcode_hash = $2', [u.role, passcodeHash]);
      if (exists) continue;
      await client.query(
        `INSERT INTO users (role, email, password_hash, passcode_hash, name, child_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [u.role, email, u.password ? hashPassword(u.password) : null, passcodeHash, u.name, u.child_id ?? null, nowIso()],
      );
      seeded += 1;
    }
  });
  if (seeded > 0) console.log(`Seeded ${seeded} demo auth account(s)`);
}

const app = express();
app.set('trust proxy', 1); // Railway sits behind a proxy — needed for accurate req.ip

// CORS_ORIGIN: comma-separated list of allowed frontend origins, e.g.
// "https://alc-app-frontend.up.railway.app". Falls back to reflecting the
// request origin (permissive) if unset, so local dev keeps working without
// extra config — set it explicitly in Railway once the frontend domain is known.
const corsOrigins = parseCorsOrigins(process.env.CORS_ORIGIN);
app.use(cors({ origin: corsOrigins.length > 0 ? corsOrigins : true }));

app.use(express.json({ limit: '64kb' }));

// Serves uploaded observation media back out (SCRUM-87) — this is serving
// user-uploaded assets, not the frontend SPA (that stays static-server.js's job).
app.use('/media', express.static(MEDIA_DIR));

// ── API ──────────────────────────────────────────────────────────────────────
const idParam = (req, res) => {
  const id = parsePositiveIntId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: 'invalid id' });
    return null;
  }
  return id;
};

// Wrap async route handlers so a rejected promise reaches Express's error
// handling instead of crashing the process / hanging the request.
const ah = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// ── area_feedback ─────────────────────────────────────────────────────────
app.get('/api/review/area-feedback', ah(async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM area_feedback ORDER BY created_at DESC');
  res.json(rows);
}));
app.post('/api/review/area-feedback', ah(async (req, res) => {
  const { area_key, area_label, comment, author, role } = req.body ?? {};
  if (!trim(area_key) || !trim(area_label) || !trim(comment)) {
    return res.status(400).json({ error: 'area_key, area_label, and comment are required' });
  }
  const { rows: [row] } = await pool.query(
    'INSERT INTO area_feedback (area_key, area_label, comment, author, role, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [trim(area_key), trim(area_label), trim(comment), optional(author), optional(role), nowIso()],
  );
  res.status(201).json(row);
}));
app.put('/api/review/area-feedback/:id', ah(async (req, res) => {
  const id = idParam(req, res); if (!id) return;
  const { comment, author } = req.body ?? {};
  if (!trim(comment)) return res.status(400).json({ error: 'comment is required' });
  const { rows: [row] } = await pool.query(
    'UPDATE area_feedback SET comment = $1, author = $2 WHERE id = $3 RETURNING *',
    [trim(comment), optional(author), id],
  );
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json(row);
}));
app.delete('/api/review/area-feedback/:id', ah(async (req, res) => {
  const id = idParam(req, res); if (!id) return;
  await pool.query('DELETE FROM area_feedback WHERE id = $1', [id]);
  res.status(204).end();
}));

// ── feature_feedback ──────────────────────────────────────────────────────
app.get('/api/review/feature-feedback', ah(async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM feature_feedback ORDER BY created_at DESC');
  res.json(rows);
}));
app.post('/api/review/feature-feedback', ah(async (req, res) => {
  const { feature_key, feature_label, comment, author, role, priority } = req.body ?? {};
  if (!trim(feature_key) || !trim(feature_label) || !trim(comment)) {
    return res.status(400).json({ error: 'feature_key, feature_label, and comment are required' });
  }
  const { rows: [row] } = await pool.query(
    `INSERT INTO feature_feedback (feature_key, feature_label, comment, author, role, priority, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [trim(feature_key), trim(feature_label), trim(comment), optional(author), optional(role), cleanPriority(priority), nowIso()],
  );
  res.status(201).json(row);
}));
app.put('/api/review/feature-feedback/:id', ah(async (req, res) => {
  const id = idParam(req, res); if (!id) return;
  const { comment, author, priority } = req.body ?? {};
  if (!trim(comment)) return res.status(400).json({ error: 'comment is required' });
  const { rows: [row] } = await pool.query(
    'UPDATE feature_feedback SET comment = $1, author = $2, priority = $3 WHERE id = $4 RETURNING *',
    [trim(comment), optional(author), cleanPriority(priority), id],
  );
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json(row);
}));
app.delete('/api/review/feature-feedback/:id', ah(async (req, res) => {
  const id = idParam(req, res); if (!id) return;
  await pool.query('DELETE FROM feature_feedback WHERE id = $1', [id]);
  res.status(204).end();
}));

// ── requests ──────────────────────────────────────────────────────────────
app.get('/api/review/requests', ah(async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM requests ORDER BY created_at DESC');
  res.json(rows);
}));
app.post('/api/review/requests', ah(async (req, res) => {
  const { feature, description, author, priority } = req.body ?? {};
  if (!trim(feature) || !trim(description)) {
    return res.status(400).json({ error: 'feature and description are required' });
  }
  const ts = nowIso();
  const { rows: [row] } = await pool.query(
    'INSERT INTO requests (feature, description, author, priority, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $5) RETURNING *',
    [trim(feature), trim(description), optional(author), cleanPriority(priority), ts],
  );
  res.status(201).json(row);
}));
app.put('/api/review/requests/:id', ah(async (req, res) => {
  const id = idParam(req, res); if (!id) return;
  const { feature, description, author, priority } = req.body ?? {};
  if (!trim(feature) || !trim(description)) {
    return res.status(400).json({ error: 'feature and description are required' });
  }
  const { rows: [row] } = await pool.query(
    'UPDATE requests SET feature = $1, description = $2, author = $3, priority = $4, updated_at = $5 WHERE id = $6 RETURNING *',
    [trim(feature), trim(description), optional(author), cleanPriority(priority), nowIso(), id],
  );
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json(row);
}));
app.delete('/api/review/requests/:id', ah(async (req, res) => {
  const id = idParam(req, res); if (!id) return;
  await pool.query('DELETE FROM requests WHERE id = $1', [id]);
  res.status(204).end();
}));

// ── /api/auth (SCRUM-16) ────────────────────────────────────────────────────
const clientIp = (req) => req.ip ?? req.socket?.remoteAddress ?? 'unknown';

app.post('/api/auth/login', ah(async (req, res) => {
  const ip = clientIp(req);
  if (tooManyFailedAttempts(ip)) {
    return res.status(429).json({ error: 'too many failed attempts — please wait a few minutes and try again' });
  }
  const { email, password } = req.body ?? {};
  if (!isEmail(email) || !trim(password)) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  const { rows: [user] } = await pool.query(
    "SELECT * FROM users WHERE email = $1 AND role IN ('teacher','leader')",
    [trim(email).toLowerCase()],
  );
  if (!user || !verifyPassword(password, user.password_hash)) {
    recordFailedAttempt(ip);
    return res.status(401).json({ error: 'that email and password combination is incorrect' });
  }
  const { token } = await createSession(user.id);
  res.status(201).json({ token, user: publicUser(user) });
}));

app.post('/api/auth/passcode', ah(async (req, res) => {
  const ip = clientIp(req);
  if (tooManyFailedAttempts(ip)) {
    return res.status(429).json({ error: 'too many failed attempts — please wait a few minutes and try again' });
  }
  const { passcode, role } = req.body ?? {};
  const r = trim(role);
  if (r !== 'parent' && r !== 'student') {
    return res.status(400).json({ error: "role must be 'parent' or 'student'" });
  }
  if (!trim(passcode)) {
    return res.status(400).json({ error: 'passcode is required' });
  }
  const { rows: [user] } = await pool.query(
    'SELECT * FROM users WHERE role = $1 AND passcode_hash = $2',
    [r, hashPasscode(trim(passcode), passcodePepper)],
  );
  if (!user) {
    recordFailedAttempt(ip);
    return res.status(401).json({ error: "that passcode doesn't match" });
  }
  const { token } = await createSession(user.id);
  res.status(201).json({ token, user: publicUser(user) });
}));

app.post('/api/auth/logout', requireAuth, ah(async (req, res) => {
  await pool.query('DELETE FROM sessions WHERE id = $1', [req.token]);
  res.status(204).end();
}));

app.get('/api/auth/me', requireAuth, ah(async (req, res) => {
  res.json(publicUser(req.user));
}));

// SCRUM-96 — a leader creates a new staff account. When the new account is a
// teacher, it's linked to a real teachers row (find-by-email, else create)
// so GET /api/children's class-scoping (SCRUM-24) works for them immediately
// — without this, a brand-new teacher would see an empty class forever, the
// same "unlinked account" gap flagged when Classroom Roster shipped.
app.post('/api/users', requireAuth, requireRole('leader'), ah(async (req, res) => {
  const { name, email, password, role } = req.body ?? {};
  if (role !== 'teacher' && role !== 'leader') return res.status(400).json({ error: "role must be 'teacher' or 'leader'" });
  if (!trim(name)) return res.status(400).json({ error: 'name is required' });
  if (!isEmail(email)) return res.status(400).json({ error: 'email is required and must look like an email' });
  if (!trim(password)) return res.status(400).json({ error: 'password is required' });

  const cleanEmail = trim(email).toLowerCase();
  const { rows: [existingUser] } = await pool.query('SELECT 1 FROM users WHERE email = $1', [cleanEmail]);
  if (existingUser) return res.status(409).json({ error: 'a staff account with that email already exists' });

  try {
    const user = await withTransaction(async (client) => {
      const ts = nowIso();
      let teacherId = null;
      if (role === 'teacher') {
        const { rows: [existingTeacher] } = await client.query('SELECT id FROM teachers WHERE email = $1', [cleanEmail]);
        if (existingTeacher) {
          teacherId = existingTeacher.id;
        } else {
          const { rows: [newTeacher] } = await client.query(
            'INSERT INTO teachers (name, email, created_at) VALUES ($1, $2, $3) RETURNING id',
            [trim(name), cleanEmail, ts],
          );
          teacherId = newTeacher.id;
        }
      }
      const { rows: [row] } = await client.query(
        `INSERT INTO users (role, email, password_hash, name, teacher_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [role, cleanEmail, hashPassword(password), trim(name), teacherId !== null ? String(teacherId) : null, ts],
      );
      return row;
    });
    res.status(201).json(publicUser(user));
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'a staff account with that email already exists' });
    throw err;
  }
}));

// SCRUM-99 — only ever resolves to a parent/student account (passcodes don't
// apply to staff logins), and only if the caller is allowed to see the
// child that account belongs to — same canSeeChild rule as the children
// endpoints, so a teacher can't probe passcode accounts outside their class.
async function getPasscodeHolderContext(req, targetId) {
  const { rows: [target] } = await pool.query('SELECT * FROM users WHERE id = $1', [targetId]);
  if (!target || (target.role !== 'parent' && target.role !== 'student')) return null;
  const childId = parsePositiveIntId(target.child_id);
  const child = childId ? await getChild(childId) : null;
  if (!child || !canSeeChild(req.user.role, parsePositiveIntId(req.user.teacher_id), child.teacher_id)) return null;
  return { target, child };
}

// Never returns the passcode itself — passcode_hash is one-way (HMAC), so
// there is no "original value" to show back. This confirms who an account
// belongs to; see reissue-passcode below for actually changing it.
app.get('/api/users/:id/passcode-holder', requireAuth, requireRole('teacher', 'leader'), ah(async (req, res) => {
  const id = idParam(req, res); if (!id) return;
  const ctx = await getPasscodeHolderContext(req, id);
  if (!ctx) return res.status(404).json({ error: 'not found' });
  res.json({
    user_id: ctx.target.id,
    role: ctx.target.role,
    name: ctx.target.name,
    child_id: ctx.child.id,
    child_name: ctx.child.name,
  });
}));

// Only ever touches passcode_hash — never role/name/child_id — so reissuing
// can't accidentally reassign which child or family the account belongs to.
app.post('/api/users/:id/reissue-passcode', requireAuth, requireRole('teacher', 'leader'), ah(async (req, res) => {
  const id = idParam(req, res); if (!id) return;
  const ctx = await getPasscodeHolderContext(req, id);
  if (!ctx) return res.status(404).json({ error: 'not found' });

  const passcode = genPasscode();
  const { rows: [updated] } = await pool.query(
    'UPDATE users SET passcode_hash = $1 WHERE id = $2 RETURNING *',
    [hashPasscode(passcode, passcodePepper), id],
  );
  res.json({ user: publicUser(updated), passcode });
}));

// ── Onboarding ───────────────────────────────────────────────────────────────
// Surface for the onboarding journey (intake form, owner queue, assessments,
// observations). Tables are defined in migrate() at the top of this file
// (Stories B1–B4). Email send + media upload land in later epics.

const getProspect = async (id) => {
  const { rows: [row] } = await pool.query('SELECT * FROM prospects WHERE id = $1', [id]);
  return row ?? null;
};
const getAssessment = async (id) => {
  const { rows: [row] } = await pool.query('SELECT * FROM assessments WHERE id = $1', [id]);
  return row ?? null;
};

// ── /api/intake ─────────────────────────────────────────────────────────────
// Atomic create: one prospect row + one intake_responses row.
app.post('/api/intake', ah(async (req, res) => {
  const { parent_email, parent_name, parent_phone, prospect = {}, answers } = req.body ?? {};
  if (!isEmail(parent_email)) return res.status(400).json({ error: 'parent_email is required and must look like an email' });
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    return res.status(400).json({ error: 'answers must be an object' });
  }

  try {
    const id = await withTransaction(async (client) => {
      const ts = nowIso();
      const { rows: [{ id: newId }] } = await client.query(
        `INSERT INTO prospects (
          parent_email, parent_name, parent_phone,
          child_first_name, child_dob, year_group, homework_in_plan,
          tech_comfort_parent, tech_comfort_child,
          flagged_needs, consent_notes, consent_media,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $13)
        RETURNING id`,
        [
          trim(parent_email).toLowerCase(),
          optional(parent_name),
          optional(parent_phone),
          optional(prospect.child_first_name),
          optional(prospect.child_dob),
          optional(prospect.year_group),
          optional(prospect.homework_in_plan),
          optional(prospect.tech_comfort_parent),
          optional(prospect.tech_comfort_child),
          toBool(prospect.flagged_needs),
          toBool(prospect.consent_notes),
          toBool(prospect.consent_media),
          ts,
        ],
      );
      await client.query(
        'INSERT INTO intake_responses (prospect_id, answers, submitted_at) VALUES ($1, $2, $3)',
        [newId, JSON.stringify(answers), ts],
      );
      return newId;
    });
    res.status(201).json(await getProspect(id));
  } catch (err) {
    console.error('POST /api/intake failed:', err);
    res.status(500).json({ error: 'failed to save intake' });
  }
}));

// ── /api/prospects ──────────────────────────────────────────────────────────
app.get('/api/prospects', ah(async (req, res) => {
  const status = cleanProspectStatus(req.query.status);
  const { rows } = status
    ? await pool.query('SELECT * FROM prospects WHERE status = $1 ORDER BY created_at DESC', [status])
    : await pool.query('SELECT * FROM prospects ORDER BY created_at DESC');
  res.json(rows);
}));

app.get('/api/prospects/:id', ah(async (req, res) => {
  const id = idParam(req, res); if (!id) return;
  const prospect = await getProspect(id);
  if (!prospect) return res.status(404).json({ error: 'not found' });
  const { rows: [intakeRow] } = await pool.query('SELECT answers, submitted_at FROM intake_responses WHERE prospect_id = $1', [id]);
  const intake = intakeRow ? { answers: JSON.parse(intakeRow.answers), submitted_at: intakeRow.submitted_at } : null;
  const { rows: assessments } = await pool.query('SELECT * FROM assessments WHERE prospect_id = $1 ORDER BY scheduled_for, created_at', [id]);
  const { rows: observations } = await pool.query('SELECT * FROM observations WHERE prospect_id = $1 ORDER BY captured_at DESC', [id]);
  res.json({ ...prospect, intake, assessments, observations });
}));

// SCRUM-97 — the moment a prospect's status becomes 'enrolled', auto-create
// their real children row (if one doesn't already exist — children.prospect_id
// is the link kept from SCRUM-23) plus a parent/carer contact from the
// prospect's on-file parent details, then provision that parent a real login.
// Idempotent: re-saving status='enrolled' on an already-enrolled prospect
// does nothing extra (no duplicate child/parent/account).
async function enrollProspect(client, prospect) {
  const { rows: [existingChild] } = await client.query('SELECT * FROM children WHERE prospect_id = $1', [prospect.id]);
  let child = existingChild;
  if (!child) {
    const name = prospect.child_first_name || 'Unnamed child';
    const initials = name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    const ts = nowIso();
    const { rows: [newChild] } = await client.query(
      `INSERT INTO children (name, dob, initials, prospect_id, focus, strengths, gaps, flags, created_at, updated_at)
       VALUES ($1, $2, $3, $4, '[]', '[]', '[]', '[]', $5, $5) RETURNING *`,
      [name, prospect.child_dob, initials, prospect.id, ts],
    );
    child = newChild;
  }

  const { rows: [existingParent] } = await client.query('SELECT * FROM parents WHERE child_id = $1 ORDER BY id LIMIT 1', [child.id]);
  let parent = existingParent;
  if (!parent) {
    const { rows: [newParent] } = await client.query(
      'INSERT INTO parents (child_id, name, relation) VALUES ($1, $2, $3) RETURNING *',
      [child.id, prospect.parent_name || prospect.parent_email, 'Parent'],
    );
    parent = newParent;
  }

  const parentResult = await provisionParentAccount(client, child.id, parent);
  const studentResult = await provisionStudentAccount(client, child);
  return {
    child_id: child.id,
    parent_passcode: parentResult.alreadyExists ? null : parentResult.passcode,
    student_passcode: studentResult.alreadyExists ? null : studentResult.passcode,
  };
}

app.patch('/api/prospects/:id', ah(async (req, res) => {
  const id = idParam(req, res); if (!id) return;
  const existing = await getProspect(id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  const b = req.body ?? {};

  const status = b.status === undefined ? existing.status : cleanProspectStatus(b.status);
  if (b.status !== undefined && !status) return res.status(400).json({ error: 'invalid status' });

  const { row, enrollment } = await withTransaction(async (client) => {
    const { rows: [updated] } = await client.query(
      `UPDATE prospects SET
        parent_email        = $1,
        parent_name         = $2,
        parent_phone         = $3,
        child_first_name    = $4,
        child_dob            = $5,
        year_group          = $6,
        homework_in_plan    = $7,
        tech_comfort_parent = $8,
        tech_comfort_child  = $9,
        flagged_needs       = $10,
        consent_notes       = $11,
        consent_media       = $12,
        status               = $13,
        updated_at           = $14
      WHERE id = $15
      RETURNING *`,
      [
        b.parent_email !== undefined ? trim(b.parent_email).toLowerCase() : existing.parent_email,
        b.parent_name !== undefined ? optional(b.parent_name) : existing.parent_name,
        b.parent_phone !== undefined ? optional(b.parent_phone) : existing.parent_phone,
        b.child_first_name !== undefined ? optional(b.child_first_name) : existing.child_first_name,
        b.child_dob !== undefined ? optional(b.child_dob) : existing.child_dob,
        b.year_group !== undefined ? optional(b.year_group) : existing.year_group,
        b.homework_in_plan !== undefined ? optional(b.homework_in_plan) : existing.homework_in_plan,
        b.tech_comfort_parent !== undefined ? optional(b.tech_comfort_parent) : existing.tech_comfort_parent,
        b.tech_comfort_child !== undefined ? optional(b.tech_comfort_child) : existing.tech_comfort_child,
        b.flagged_needs !== undefined ? toBool(b.flagged_needs) : existing.flagged_needs,
        b.consent_notes !== undefined ? toBool(b.consent_notes) : existing.consent_notes,
        b.consent_media !== undefined ? toBool(b.consent_media) : existing.consent_media,
        status,
        nowIso(),
        id,
      ],
    );
    let enrollmentResult = null;
    if (existing.status !== 'enrolled' && updated.status === 'enrolled') {
      enrollmentResult = await enrollProspect(client, updated);
    }
    return { row: updated, enrollment: enrollmentResult };
  });
  res.json(enrollment ? { ...row, enrollment } : row);
}));

// ── /api/assessments ────────────────────────────────────────────────────────
// Added for SCRUM-92 (Book an assessment) — staff need to see upcoming
// assessments across every family in one place, not by opening each
// prospect's page individually.
app.get('/api/assessments', ah(async (req, res) => {
  const status = cleanAssessmentStatus(req.query.status);
  if (req.query.status !== undefined && !status) {
    return res.status(400).json({ error: `status must be one of: ${[...ASSESSMENT_STATUSES].join(', ')}` });
  }
  const { rows } = status
    ? await pool.query('SELECT * FROM assessments WHERE status = $1 ORDER BY scheduled_for ASC NULLS LAST', [status])
    : await pool.query('SELECT * FROM assessments ORDER BY scheduled_for ASC NULLS LAST LIMIT 100');
  res.json(rows);
}));

app.post('/api/assessments', ah(async (req, res) => {
  const { prospect_id, scheduled_for, teacher_id } = req.body ?? {};
  const pid = Number(prospect_id);
  if (!Number.isInteger(pid) || pid <= 0) return res.status(400).json({ error: 'prospect_id is required' });
  if (!await getProspect(pid)) return res.status(404).json({ error: 'prospect not found' });

  const ts = nowIso();
  const { rows: [row] } = await pool.query(
    'INSERT INTO assessments (prospect_id, scheduled_for, teacher_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $4) RETURNING *',
    [pid, optional(scheduled_for), optional(teacher_id), ts],
  );

  // Mark the prospect as booked when its first assessment is scheduled.
  if (scheduled_for) {
    await pool.query("UPDATE prospects SET status = 'booked', updated_at = $1 WHERE id = $2 AND status = 'prospect'", [nowIso(), pid]);
  }
  res.status(201).json(row);
}));

app.get('/api/assessments/:id', ah(async (req, res) => {
  const id = idParam(req, res); if (!id) return;
  const row = await getAssessment(id);
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json(row);
}));

app.patch('/api/assessments/:id', ah(async (req, res) => {
  const id = idParam(req, res); if (!id) return;
  const existing = await getAssessment(id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  const b = req.body ?? {};

  const status = b.status === undefined ? existing.status : cleanAssessmentStatus(b.status);
  if (b.status !== undefined && !status) return res.status(400).json({ error: 'invalid status' });

  const { rows: [row] } = await pool.query(
    `UPDATE assessments SET
      scheduled_for = $1,
      teacher_id    = $2,
      status        = $3,
      report_draft  = $4,
      updated_at    = $5
    WHERE id = $6
    RETURNING *`,
    [
      b.scheduled_for !== undefined ? optional(b.scheduled_for) : existing.scheduled_for,
      b.teacher_id !== undefined ? optional(b.teacher_id) : existing.teacher_id,
      status,
      b.report_draft !== undefined ? optional(b.report_draft) : existing.report_draft,
      nowIso(),
      id,
    ],
  );
  res.json(row);
}));

// SCRUM-84 — generates a first draft from real intake answers + real
// observations (template-based composer, see lib/report-draft.js). Never
// signs off or sends. If a draft already exists and differs from the
// freshly-generated one, requires confirm:true so a staff member's edits
// are never silently overwritten. Signed-off reports are final — the AI
// draft can't touch them.
app.post('/api/assessments/:id/draft-report', ah(async (req, res) => {
  const id = idParam(req, res); if (!id) return;
  const existing = await getAssessment(id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  if (existing.report_signed_off_at) return res.status(409).json({ error: 'this report is already signed off and final' });

  const prospect = await getProspect(existing.prospect_id);
  if (!prospect) return res.status(404).json({ error: 'prospect not found' });

  const { rows: [intakeRow] } = await pool.query('SELECT answers FROM intake_responses WHERE prospect_id = $1', [prospect.id]);
  const answers = intakeRow ? JSON.parse(intakeRow.answers) : {};
  const { rows: observations } = await pool.query('SELECT * FROM observations WHERE prospect_id = $1 ORDER BY captured_at ASC', [prospect.id]);

  const draft = composeDraftReport(prospect, answers, observations);

  const hasExistingDraft = Boolean(trim(existing.report_draft));
  const confirm = toBool(req.body?.confirm);
  if (hasExistingDraft && existing.report_draft !== draft && !confirm) {
    return res.status(409).json({ error: 'A draft already exists for this assessment. Confirm to overwrite it.' });
  }

  const ts = nowIso();
  const { rows: [row] } = await pool.query(
    'UPDATE assessments SET report_draft = $1, updated_at = $2 WHERE id = $3 RETURNING *',
    [draft, ts, id],
  );
  res.json(row);
}));

app.post('/api/assessments/:id/sign-off', ah(async (req, res) => {
  const id = idParam(req, res); if (!id) return;
  const existing = await getAssessment(id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  if (!trim(existing.report_draft)) return res.status(400).json({ error: 'report_draft is empty' });
  if (existing.report_signed_off_at) return res.status(409).json({ error: 'already signed off' });

  const ts = nowIso();
  const { rows: [row] } = await pool.query(
    `UPDATE assessments SET
      status = 'done',
      report_signed_off_at = $1,
      updated_at = $1
    WHERE id = $2
    RETURNING *`,
    [ts, id],
  );
  res.json(row);
}));

// SCRUM-88 — sends the signed-off report to the parent by real email
// (Resend). If the email genuinely fails, the assessment is NOT marked
// sent — the staff member sees the real error instead of a false "sent".
app.post('/api/assessments/:id/send', ah(async (req, res) => {
  const id = idParam(req, res); if (!id) return;
  const existing = await getAssessment(id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  if (!existing.report_signed_off_at) return res.status(409).json({ error: 'sign off the report before sending' });
  if (existing.sent_to_parent_at) return res.status(409).json({ error: 'already sent' });

  const prospect = await getProspect(existing.prospect_id);
  if (!prospect) return res.status(404).json({ error: 'prospect not found' });

  try {
    await sendReportEmail({
      to: prospect.parent_email,
      parentName: prospect.parent_name,
      childFirstName: prospect.child_first_name,
      reportText: existing.report_draft,
    });
  } catch (err) {
    console.error(`POST /api/assessments/${id}/send — email failed:`, err);
    return res.status(502).json({ error: `Could not send the email: ${err.message}` });
  }

  const row = await withTransaction(async (client) => {
    const ts = nowIso();
    const { rows: [updated] } = await client.query(
      'UPDATE assessments SET sent_to_parent_at = $1, updated_at = $1 WHERE id = $2 RETURNING *',
      [ts, id],
    );
    await client.query("UPDATE prospects SET status = 'assessed', updated_at = $1 WHERE id = $2", [ts, existing.prospect_id]);
    return updated;
  });
  res.json(row);
}));

// ── /api/media ───────────────────────────────────────────────────────────────
// SCRUM-87 — real file upload for observations (photo/video/voice recording),
// replacing the free-text media_url field. Returns a /media/<file> address
// the observation can be saved with and reopened from later.
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, MEDIA_DIR),
    filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${extensionFor(file.mimetype, file.originalname)}`),
  }),
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!isAllowedMimeType(file.mimetype)) {
      return cb(new Error(`Unsupported file type (${file.mimetype || 'unknown'}) — only images, videos, and audio recordings are accepted.`));
    }
    cb(null, true);
  },
});

app.post('/api/media/upload', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: `File is too large — max ${Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024))}MB.` });
    }
    if (err) return res.status(400).json({ error: err.message || 'Upload failed.' });
    if (!req.file) return res.status(400).json({ error: 'file is required' });

    res.status(201).json({
      url: `/media/${req.file.filename}`,
      mime_type: req.file.mimetype,
      size_bytes: req.file.size,
    });
  });
});

// ── /api/observations ───────────────────────────────────────────────────────
const parseObservationRow = (row) => ({ ...row, tags: parseJsonArray(row.tags) });

// SCRUM-37 — extends the existing (SCRUM-94) endpoint with child_id
// filtering. Filtering by child_id merges that child's post-enrolment
// observations with any pre-enrolment ones captured before they existed —
// live-joined via children.prospect_id rather than a one-time backfill, so
// it stays correct for every future enrolment too, not just a snapshot.
app.get('/api/observations', ah(async (req, res) => {
  const pid = req.query.prospect_id ? Number(req.query.prospect_id) : null;
  if (pid !== null && (!Number.isInteger(pid) || pid <= 0)) {
    return res.status(400).json({ error: 'prospect_id must be a positive integer' });
  }
  const cid = req.query.child_id !== undefined ? parsePositiveIntId(req.query.child_id) : null;
  if (req.query.child_id !== undefined && !cid) {
    return res.status(400).json({ error: 'child_id must be a positive integer' });
  }

  let rows;
  if (cid) {
    const child = await getChild(cid);
    if (!child) return res.status(404).json({ error: 'child not found' });
    ({ rows } = child.prospect_id
      ? await pool.query(
          'SELECT * FROM observations WHERE child_id = $1 OR prospect_id = $2 ORDER BY captured_at DESC',
          [String(cid), child.prospect_id],
        )
      : await pool.query('SELECT * FROM observations WHERE child_id = $1 ORDER BY captured_at DESC', [String(cid)]));
  } else if (pid) {
    ({ rows } = await pool.query('SELECT * FROM observations WHERE prospect_id = $1 ORDER BY captured_at DESC', [pid]));
  } else {
    ({ rows } = await pool.query('SELECT * FROM observations ORDER BY captured_at DESC LIMIT 100'));
  }
  res.json(rows.map(parseObservationRow));
}));

// SCRUM-38 — extends the existing (SCRUM-94) endpoint: child_id, when given,
// must now reference a real roster child (previously an unvalidated opaque
// string), plus optional tags/mood. prospect_id-only observations (the
// pre-enrolment flow) are untouched — this doesn't force every observation
// to have a child.
app.post('/api/observations', ah(async (req, res) => {
  const { prospect_id, child_id, teacher_id, kind, media_url, transcript, comment, tags, mood } = req.body ?? {};
  const k = cleanObservationKind(kind);
  if (!k) return res.status(400).json({ error: `kind must be one of: ${[...OBSERVATION_KINDS].join(', ')}` });
  if (!trim(media_url) && !trim(transcript) && !trim(comment)) {
    return res.status(400).json({ error: 'observation must have at least one of media_url, transcript, or comment' });
  }

  let pid = null;
  if (prospect_id !== undefined && prospect_id !== null && prospect_id !== '') {
    const n = Number(prospect_id);
    if (!Number.isInteger(n) || n <= 0) return res.status(400).json({ error: 'prospect_id must be a positive integer' });
    if (!await getProspect(n)) return res.status(404).json({ error: 'prospect not found' });
    pid = n;
  }

  let cidStr = null;
  if (child_id !== undefined && child_id !== null && child_id !== '') {
    const n = parsePositiveIntId(child_id);
    if (!n || !await getChild(n)) return res.status(400).json({ error: 'child_id does not reference a real child on the roster' });
    cidStr = String(n);
  }

  const { rows: [row] } = await pool.query(
    `INSERT INTO observations (prospect_id, child_id, teacher_id, kind, media_url, transcript, comment, tags, mood, captured_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [pid, cidStr, optional(teacher_id), k, optional(media_url), optional(transcript), optional(comment), toJsonArrayColumn(tags), optional(mood), nowIso()],
  );
  res.status(201).json(parseObservationRow(row));
}));

app.delete('/api/observations/:id', ah(async (req, res) => {
  const id = idParam(req, res); if (!id) return;
  await pool.query('DELETE FROM observations WHERE id = $1', [id]);
  res.status(204).end();
}));

// ── /api/children ───────────────────────────────────────────────────────────
// Classroom Roster (SCRUM-22/24) — the app's first real, editable class
// list, replacing the fixed demo data. A teacher only sees their own class;
// a leader sees everyone. Linking an auth account to a real teachers.id row
// is Sprint 6's job — until then a teacher account correctly sees nothing.
app.get('/api/children', requireAuth, requireRole('teacher', 'leader'), ah(async (req, res) => {
  const { rows } = req.user.role === 'leader'
    ? await pool.query('SELECT * FROM children ORDER BY name')
    : await pool.query('SELECT * FROM children WHERE teacher_id = $1 ORDER BY name', [parsePositiveIntId(req.user.teacher_id)]);
  res.json(rows.map(parseChildRow));
}));

const getTeacher = async (id) => {
  const { rows: [row] } = await pool.query('SELECT * FROM teachers WHERE id = $1', [id]);
  return row ?? null;
};

// SCRUM-25 — a school leader adds a new child to the roster. Optionally
// takes 1–2 parent/carer contacts in the same call (parents.child_id is
// NOT NULL, so they can't exist before the child does).
app.post('/api/children', requireAuth, requireRole('leader'), ah(async (req, res) => {
  const b = req.body ?? {};
  const name = trim(b.name);
  if (!name) return res.status(400).json({ error: 'name is required' });

  const teacherId = parsePositiveIntId(b.teacher_id);
  if (!teacherId) return res.status(400).json({ error: 'teacher_id is required' });
  if (!await getTeacher(teacherId)) return res.status(400).json({ error: 'teacher_id does not reference a real teacher' });

  let prospectId = null;
  if (b.prospect_id !== undefined && b.prospect_id !== null) {
    prospectId = parsePositiveIntId(b.prospect_id);
    if (!prospectId || !await getProspect(prospectId)) {
      return res.status(400).json({ error: 'prospect_id does not reference a real prospect' });
    }
  }

  const tone = b.tone !== undefined ? cleanTone(b.tone) : null;
  if (b.tone !== undefined && b.tone !== null && !tone) return res.status(400).json({ error: 'invalid tone' });
  const pronoun = b.pronoun !== undefined ? cleanPronoun(b.pronoun) : null;
  if (b.pronoun !== undefined && b.pronoun !== null && !pronoun) return res.status(400).json({ error: 'invalid pronoun' });

  const initials = optional(b.initials) || name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const parents = Array.isArray(b.parents)
    ? b.parents.filter((p) => trim(p?.name) && trim(p?.relation)).slice(0, 2)
    : [];

  const row = await withTransaction(async (client) => {
    const ts = nowIso();
    const { rows: [child] } = await client.query(
      `INSERT INTO children (
        name, dob, initials, tone, teacher_id, pronoun,
        focus, strengths, gaps, style, flags, prospect_id,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $13)
      RETURNING *`,
      [
        name, optional(b.dob), initials, tone, teacherId, pronoun,
        toJsonArrayColumn(b.focus), toJsonArrayColumn(b.strengths), toJsonArrayColumn(b.gaps),
        optional(b.style), toJsonArrayColumn(b.flags), prospectId,
        ts,
      ],
    );
    for (const p of parents) {
      await client.query('INSERT INTO parents (child_id, name, relation) VALUES ($1, $2, $3)', [child.id, trim(p.name), trim(p.relation)]);
    }
    return child;
  });
  res.status(201).json(parseChildRow(row));
}));

const getChild = async (id) => {
  const { rows: [row] } = await pool.query('SELECT * FROM children WHERE id = $1', [id]);
  return row ?? null;
};

// SCRUM-26 — one child's full profile, including their parent/carer contacts.
app.get('/api/children/:id', requireAuth, requireRole('teacher', 'leader'), ah(async (req, res) => {
  const id = idParam(req, res); if (!id) return;
  const child = await getChild(id);
  if (!child || !canSeeChild(req.user.role, parsePositiveIntId(req.user.teacher_id), child.teacher_id)) {
    return res.status(404).json({ error: 'not found' });
  }

  const { rows: parents } = await pool.query('SELECT * FROM parents WHERE child_id = $1 ORDER BY id', [id]);
  res.json({ ...parseChildRow(child), parents });
}));

// SCRUM-27 — partial update. Same permission rule as GET /:id (404, not
// 403, for a child outside your class). Only fields sent in the body get
// changed; teacher_id/prospect_id/tone/pronoun are validated the same way
// as on create when they're included.
app.patch('/api/children/:id', requireAuth, requireRole('teacher', 'leader'), ah(async (req, res) => {
  const id = idParam(req, res); if (!id) return;
  const existing = await getChild(id);
  if (!existing || !canSeeChild(req.user.role, parsePositiveIntId(req.user.teacher_id), existing.teacher_id)) {
    return res.status(404).json({ error: 'not found' });
  }
  const b = req.body ?? {};

  let teacherId = existing.teacher_id;
  if (b.teacher_id !== undefined) {
    teacherId = parsePositiveIntId(b.teacher_id);
    if (!teacherId || !await getTeacher(teacherId)) return res.status(400).json({ error: 'teacher_id does not reference a real teacher' });
  }

  let prospectId = existing.prospect_id;
  if (b.prospect_id !== undefined) {
    if (b.prospect_id === null) {
      prospectId = null;
    } else {
      prospectId = parsePositiveIntId(b.prospect_id);
      if (!prospectId || !await getProspect(prospectId)) return res.status(400).json({ error: 'prospect_id does not reference a real prospect' });
    }
  }

  let tone = existing.tone;
  if (b.tone !== undefined) {
    tone = b.tone === null ? null : cleanTone(b.tone);
    if (b.tone !== null && !tone) return res.status(400).json({ error: 'invalid tone' });
  }

  let pronoun = existing.pronoun;
  if (b.pronoun !== undefined) {
    pronoun = b.pronoun === null ? null : cleanPronoun(b.pronoun);
    if (b.pronoun !== null && !pronoun) return res.status(400).json({ error: 'invalid pronoun' });
  }

  const { rows: [row] } = await pool.query(
    `UPDATE children SET
      name       = $1,
      dob        = $2,
      initials   = $3,
      tone       = $4,
      teacher_id = $5,
      pronoun    = $6,
      focus      = $7,
      strengths  = $8,
      gaps       = $9,
      style      = $10,
      flags      = $11,
      prospect_id = $12,
      updated_at = $13
    WHERE id = $14
    RETURNING *`,
    [
      b.name !== undefined ? trim(b.name) || existing.name : existing.name,
      b.dob !== undefined ? optional(b.dob) : existing.dob,
      b.initials !== undefined ? optional(b.initials) : existing.initials,
      tone,
      teacherId,
      pronoun,
      b.focus !== undefined ? toJsonArrayColumn(b.focus) : existing.focus,
      b.strengths !== undefined ? toJsonArrayColumn(b.strengths) : existing.strengths,
      b.gaps !== undefined ? toJsonArrayColumn(b.gaps) : existing.gaps,
      b.style !== undefined ? optional(b.style) : existing.style,
      b.flags !== undefined ? toJsonArrayColumn(b.flags) : existing.flags,
      prospectId,
      nowIso(),
      id,
    ],
  );
  res.json(parseChildRow(row));
}));

// SCRUM-97 — creates a parent login for one parent/carer on a child.
// Idempotency key is (role='parent', child_id, name) since users has no
// direct FK to parents — the only stable link available without adding a
// column. Returns the plaintext passcode exactly once; it can never be
// retrieved again (see POST /api/users/:id/reissue-passcode, SCRUM-99).
async function provisionParentAccount(client, childId, parent) {
  const childIdStr = String(childId);
  const { rows: [existing] } = await client.query(
    "SELECT 1 FROM users WHERE role = 'parent' AND child_id = $1 AND name = $2",
    [childIdStr, parent.name],
  );
  if (existing) return { alreadyExists: true };

  const passcode = genPasscode();
  const { rows: [user] } = await client.query(
    `INSERT INTO users (role, name, child_id, passcode_hash, created_at)
     VALUES ('parent', $1, $2, $3, $4) RETURNING *`,
    [parent.name, childIdStr, hashPasscode(passcode, passcodePepper), nowIso()],
  );
  return { passcode, user };
}

app.post('/api/children/:id/provision-parent', requireAuth, requireRole('teacher', 'leader'), ah(async (req, res) => {
  const id = idParam(req, res); if (!id) return;
  const child = await getChild(id);
  if (!child || !canSeeChild(req.user.role, parsePositiveIntId(req.user.teacher_id), child.teacher_id)) {
    return res.status(404).json({ error: 'not found' });
  }
  const parentId = parsePositiveIntId(req.body?.parent_id);
  if (!parentId) return res.status(400).json({ error: 'parent_id is required' });
  const { rows: [parent] } = await pool.query('SELECT * FROM parents WHERE id = $1 AND child_id = $2', [parentId, id]);
  if (!parent) return res.status(400).json({ error: 'parent_id does not reference a parent/carer on this child' });

  const result = await withTransaction((client) => provisionParentAccount(client, id, parent));
  if (result.alreadyExists) {
    return res.status(409).json({ error: 'a login already exists for this parent — reissue a passcode instead of creating a new one' });
  }
  res.status(201).json({ user: publicUser(result.user), passcode: result.passcode });
}));

// SCRUM-98 — creates the child's own student login. Idempotency key is just
// (role='student', child_id) — unlike parents, a child has exactly one
// student account, so no name-based disambiguation is needed.
async function provisionStudentAccount(client, child) {
  const childIdStr = String(child.id);
  const { rows: [existing] } = await client.query("SELECT 1 FROM users WHERE role = 'student' AND child_id = $1", [childIdStr]);
  if (existing) return { alreadyExists: true };

  const passcode = genPasscode();
  const { rows: [user] } = await client.query(
    `INSERT INTO users (role, name, child_id, passcode_hash, created_at)
     VALUES ('student', $1, $2, $3, $4) RETURNING *`,
    [child.name, childIdStr, hashPasscode(passcode, passcodePepper), nowIso()],
  );
  return { passcode, user };
}

app.post('/api/children/:id/provision-student', requireAuth, requireRole('teacher', 'leader'), ah(async (req, res) => {
  const id = idParam(req, res); if (!id) return;
  const child = await getChild(id);
  if (!child || !canSeeChild(req.user.role, parsePositiveIntId(req.user.teacher_id), child.teacher_id)) {
    return res.status(404).json({ error: 'not found' });
  }

  const result = await withTransaction((client) => provisionStudentAccount(client, child));
  if (result.alreadyExists) {
    return res.status(409).json({ error: 'a login already exists for this child — reissue a passcode instead of creating a new one' });
  }
  res.status(201).json({ user: publicUser(result.user), passcode: result.passcode });
}));

// ── /api/teachers ───────────────────────────────────────────────────────────
// SCRUM-28 — every current teacher, e.g. for the "assign to a class" picker
// on POST/PATCH /api/children. Staff-only (teacher or leader), same as the
// children endpoints — not for parent/student accounts.
app.get('/api/teachers', requireAuth, requireRole('teacher', 'leader'), ah(async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM teachers ORDER BY name');
  res.json(rows);
}));

// SCRUM-29 — leader-only (creating a staff record), same as POST /api/children.
app.post('/api/teachers', requireAuth, requireRole('leader'), ah(async (req, res) => {
  const b = req.body ?? {};
  const name = trim(b.name);
  if (!name) return res.status(400).json({ error: 'name is required' });

  const email = optional(b.email) ? trim(b.email).toLowerCase() : null;
  if (email && !isEmail(email)) return res.status(400).json({ error: 'email must look like an email' });
  if (email) {
    const { rows: [existing] } = await pool.query('SELECT 1 FROM teachers WHERE email = $1', [email]);
    if (existing) return res.status(409).json({ error: 'a teacher with that email already exists' });
  }

  try {
    const { rows: [row] } = await pool.query(
      'INSERT INTO teachers (name, email, created_at) VALUES ($1, $2, $3) RETURNING *',
      [name, email, nowIso()],
    );
    res.status(201).json(row);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'a teacher with that email already exists' });
    throw err;
  }
}));

// ── /api/flow ────────────────────────────────────────────────────────────────
// Today's Daily Flow (SCRUM-30/32) — a teacher's real, editable schedule,
// replacing the fixed sample timeline on the Teacher Today screen. A teacher
// always sees their own day; a leader must specify which teacher's day to view.
app.get('/api/flow', requireAuth, requireRole('teacher', 'leader'), ah(async (req, res) => {
  const date = trim(req.query.date);
  if (!isIsoDate(date)) return res.status(400).json({ error: 'date is required and must be YYYY-MM-DD' });

  let teacherId;
  if (req.user.role === 'leader') {
    teacherId = parsePositiveIntId(req.query.teacher_id);
    if (!teacherId) return res.status(400).json({ error: 'teacher_id is required' });
  } else {
    teacherId = parsePositiveIntId(req.user.teacher_id);
  }

  const { rows } = await pool.query(
    'SELECT * FROM daily_flow_steps WHERE teacher_id = $1 AND date = $2 ORDER BY time ASC, sort_order ASC',
    [teacherId, date],
  );
  res.json(rows);
}));

// SCRUM-33 — adds a step. sort_order defaults to "append at the end of that
// day" (count of existing steps) so same-time ties still land in a stable,
// predictable order without the caller having to think about it.
app.post('/api/flow', requireAuth, requireRole('teacher', 'leader'), ah(async (req, res) => {
  const b = req.body ?? {};
  const date = trim(b.date);
  if (!isIsoDate(date)) return res.status(400).json({ error: 'date is required and must be YYYY-MM-DD' });
  const time = trim(b.time);
  if (!isTimeHHMM(time)) return res.status(400).json({ error: 'time is required and must be HH:MM (24hr)' });
  const label = trim(b.label);
  if (!label) return res.status(400).json({ error: 'label is required' });

  let teacherId;
  if (req.user.role === 'leader') {
    teacherId = parsePositiveIntId(b.teacher_id);
    if (!teacherId || !await getTeacher(teacherId)) return res.status(400).json({ error: 'teacher_id does not reference a real teacher' });
  } else {
    teacherId = parsePositiveIntId(req.user.teacher_id);
    if (!teacherId) return res.status(400).json({ error: 'your account is not linked to a teacher record yet' });
  }

  const state = b.state !== undefined ? cleanFlowState(b.state) : 'next';
  if (b.state !== undefined && !state) return res.status(400).json({ error: 'invalid state' });

  let sortOrder = Number.isInteger(b.sort_order) ? b.sort_order : null;
  if (sortOrder === null) {
    const { rows: [{ count }] } = await pool.query(
      'SELECT COUNT(*)::int AS count FROM daily_flow_steps WHERE teacher_id = $1 AND date = $2',
      [teacherId, date],
    );
    sortOrder = count;
  }

  const { rows: [row] } = await pool.query(
    `INSERT INTO daily_flow_steps (teacher_id, date, time, label, state, ai_suggested, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [teacherId, date, time, label, state, toBool(b.ai_suggested), sortOrder],
  );
  res.status(201).json(row);
}));

// SCRUM-34 — updates a step, most commonly marking it done/now. Same 404-not-
// 403 permission rule as the children endpoints (canSeeFlowStep). date and
// teacher_id are deliberately not patchable fields at all — there's no way
// to move a step to a different teacher or a different day through this
// endpoint, which is the strongest form of "rejected" for that case.
app.patch('/api/flow/:id', requireAuth, requireRole('teacher', 'leader'), ah(async (req, res) => {
  const id = idParam(req, res); if (!id) return;
  const { rows: [existing] } = await pool.query('SELECT * FROM daily_flow_steps WHERE id = $1', [id]);
  if (!existing || !canSeeFlowStep(req.user.role, parsePositiveIntId(req.user.teacher_id), existing.teacher_id)) {
    return res.status(404).json({ error: 'not found' });
  }
  const b = req.body ?? {};

  let time = existing.time;
  if (b.time !== undefined) {
    if (!isTimeHHMM(b.time)) return res.status(400).json({ error: 'time must be HH:MM (24hr)' });
    time = trim(b.time);
  }
  let label = existing.label;
  if (b.label !== undefined) {
    label = trim(b.label);
    if (!label) return res.status(400).json({ error: 'label cannot be empty' });
  }
  let state = existing.state;
  if (b.state !== undefined) {
    state = cleanFlowState(b.state);
    if (!state) return res.status(400).json({ error: 'invalid state' });
  }

  const { rows: [row] } = await pool.query(
    `UPDATE daily_flow_steps SET
      time         = $1,
      label        = $2,
      state        = $3,
      ai_suggested = $4,
      sort_order   = $5
    WHERE id = $6
    RETURNING *`,
    [
      time,
      label,
      state,
      b.ai_suggested !== undefined ? toBool(b.ai_suggested) : existing.ai_suggested,
      Number.isInteger(b.sort_order) ? b.sort_order : existing.sort_order,
      id,
    ],
  );
  res.json(row);
}));

// ── /api/next-steps ─────────────────────────────────────────────────────────
// AI Suggestions & Next Steps (SCRUM-39/41) — real, trackable recommendations
// replacing the hand-written example text on Teacher Today. Filtering to
// 'pending' is what powers the "awaiting review" count.
app.get('/api/next-steps', requireAuth, requireRole('teacher', 'leader'), ah(async (req, res) => {
  const status = req.query.status !== undefined ? cleanNextStepStatus(req.query.status) : null;
  if (req.query.status !== undefined && !status) {
    return res.status(400).json({ error: 'status must be one of: pending, accepted, dismissed' });
  }

  if (req.query.child_id !== undefined) {
    const cid = parsePositiveIntId(req.query.child_id);
    if (!cid) return res.status(400).json({ error: 'child_id must be a positive integer' });
    const child = await getChild(cid);
    if (!child || !canSeeChild(req.user.role, parsePositiveIntId(req.user.teacher_id), child.teacher_id)) {
      return res.status(404).json({ error: 'not found' });
    }
    const { rows } = status
      ? await pool.query('SELECT * FROM next_steps WHERE child_id = $1 AND status = $2 ORDER BY suggested_at DESC', [cid, status])
      : await pool.query('SELECT * FROM next_steps WHERE child_id = $1 ORDER BY suggested_at DESC', [cid]);
    return res.json(rows);
  }

  // No child_id — a teacher only ever sees suggestions for their own class;
  // a leader sees everyone's, same scoping shape as GET /api/children.
  const params = [];
  let where = '1=1';
  if (req.user.role !== 'leader') {
    params.push(parsePositiveIntId(req.user.teacher_id));
    where += ` AND child_id IN (SELECT id FROM children WHERE teacher_id = $${params.length})`;
  }
  if (status) {
    params.push(status);
    where += ` AND status = $${params.length}`;
  }
  const { rows } = await pool.query(`SELECT * FROM next_steps WHERE ${where} ORDER BY suggested_at DESC`, params);
  res.json(rows);
}));

const getNextStep = async (id) => {
  const { rows: [row] } = await pool.query('SELECT * FROM next_steps WHERE id = $1', [id]);
  return row ?? null;
};

// Shared by accept (SCRUM-42) and dismiss (SCRUM-43) — same permission rule,
// same "already resolved" guard, only the target status differs.
async function resolveNextStep(req, res, id, newStatus) {
  const step = await getNextStep(id);
  if (!step) return res.status(404).json({ error: 'not found' });
  const child = await getChild(step.child_id);
  if (!child || !canSeeChild(req.user.role, parsePositiveIntId(req.user.teacher_id), child.teacher_id)) {
    return res.status(404).json({ error: 'not found' });
  }
  if (step.status !== 'pending') {
    return res.status(409).json({ error: `this suggestion has already been ${step.status}` });
  }
  const { rows: [row] } = await pool.query(
    'UPDATE next_steps SET status = $1, resolved_at = $2 WHERE id = $3 RETURNING *',
    [newStatus, nowIso(), id],
  );
  res.json(row);
}

// SCRUM-42 — accepting immediately stops the suggestion counting as
// "awaiting review" (GET /api/next-steps?status=pending won't return it
// anymore). Accepting a resolved suggestion again is a clear 409, not a
// silent no-op.
app.post('/api/next-steps/:id/accept', requireAuth, requireRole('teacher', 'leader'), ah(async (req, res) => {
  const id = idParam(req, res); if (!id) return;
  await resolveNextStep(req, res, id, 'accepted');
}));

// SCRUM-43 — dismissing keeps the row (never deletes it), so there's a
// permanent record it was offered and declined. Same shared handler,
// permission rule, and already-resolved guard as accept.
app.post('/api/next-steps/:id/dismiss', requireAuth, requireRole('teacher', 'leader'), ah(async (req, res) => {
  const id = idParam(req, res); if (!id) return;
  await resolveNextStep(req, res, id, 'dismissed');
}));

// ── /api/ai ──────────────────────────────────────────────────────────────────
// SCRUM-44 — generates real, trackable next-step suggestions for a teacher's
// class from real recent observations (composeNextStepSuggestion, template-
// based — no LLM API key is provisioned for this deployment, same reasoning
// as the assessment-report draft, SCRUM-84). A child with no recent
// observations gets no suggestion, never an invented one. A child who
// already has a pending suggestion isn't given a second one — "fresh" means
// not piling duplicates into the review queue.
const RECENT_OBSERVATION_DAYS = 14;

app.post('/api/ai/brief', requireAuth, requireRole('teacher', 'leader'), ah(async (req, res) => {
  let teacherId;
  if (req.user.role === 'leader') {
    teacherId = parsePositiveIntId(req.body?.teacher_id);
    if (!teacherId || !await getTeacher(teacherId)) return res.status(400).json({ error: 'teacher_id does not reference a real teacher' });
  } else {
    teacherId = parsePositiveIntId(req.user.teacher_id);
    if (!teacherId) return res.status(400).json({ error: 'your account is not linked to a teacher record yet' });
  }

  const { rows: children } = await pool.query('SELECT * FROM children WHERE teacher_id = $1 ORDER BY name', [teacherId]);
  const cutoff = new Date(Date.now() - RECENT_OBSERVATION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const results = [];
  for (const child of children) {
    const { rows: [existingPending] } = await pool.query(
      "SELECT * FROM next_steps WHERE child_id = $1 AND status = 'pending' ORDER BY suggested_at DESC LIMIT 1",
      [child.id],
    );
    if (existingPending) {
      results.push({ child_id: child.id, child_name: child.name, generated: false, next_step: existingPending });
      continue;
    }

    const { rows: recentObs } = await pool.query(
      'SELECT * FROM observations WHERE child_id = $1 AND captured_at >= $2 ORDER BY captured_at DESC LIMIT 5',
      [String(child.id), cutoff],
    );
    const suggestion = composeNextStepSuggestion(child, recentObs.map(parseObservationRow));
    if (!suggestion) {
      results.push({ child_id: child.id, child_name: child.name, generated: false, next_step: null, reason: 'not enough recent observation data' });
      continue;
    }

    const { rows: [row] } = await pool.query(
      'INSERT INTO next_steps (child_id, type, title, rationale, suggested_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [child.id, suggestion.type, suggestion.title, suggestion.rationale, nowIso()],
    );
    results.push({ child_id: child.id, child_name: child.name, generated: true, next_step: row });
  }
  res.status(201).json(results);
}));

// ── /api/lesson-plans ────────────────────────────────────────────────────────
// Lesson Planning (SCRUM-45/47) — a teacher's real weekly plan, replacing
// the fixed sample week. day is stored as 'Mon'..'Fri' text, which sorts
// wrong alphabetically (Fri, Mon, Thu, Tue, Wed) — DAY_ORDER_SQL fixes that.
const DAY_ORDER_SQL = "CASE day WHEN 'Mon' THEN 1 WHEN 'Tue' THEN 2 WHEN 'Wed' THEN 3 WHEN 'Thu' THEN 4 WHEN 'Fri' THEN 5 END";

app.get('/api/lesson-plans', requireAuth, requireRole('teacher', 'leader'), ah(async (req, res) => {
  const weekOf = trim(req.query.week_of);
  if (!isIsoDate(weekOf)) return res.status(400).json({ error: 'week_of is required and must be YYYY-MM-DD' });

  let teacherId;
  if (req.user.role === 'leader') {
    teacherId = parsePositiveIntId(req.query.teacher_id);
    if (!teacherId) return res.status(400).json({ error: 'teacher_id is required' });
  } else {
    teacherId = parsePositiveIntId(req.user.teacher_id);
  }

  const { rows: plans } = await pool.query(
    `SELECT * FROM lesson_plans WHERE teacher_id = $1 AND week_of = $2 ORDER BY ${DAY_ORDER_SQL}, time ASC`,
    [teacherId, weekOf],
  );
  if (plans.length === 0) return res.json([]);

  const { rows: students } = await pool.query(
    'SELECT * FROM lesson_plan_students WHERE lesson_plan_id = ANY($1::int[])',
    [plans.map((p) => p.id)],
  );
  const byPlan = new Map();
  for (const s of students) {
    if (!byPlan.has(s.lesson_plan_id)) byPlan.set(s.lesson_plan_id, []);
    byPlan.get(s.lesson_plan_id).push(s);
  }
  res.json(plans.map((p) => ({ ...p, students: byPlan.get(p.id) ?? [] })));
}));

// SCRUM-48 — creates a new lesson slot. Per-student status/activity/note
// isn't set here — that's PATCH /api/lesson-plans/:id/students/:childId
// (SCRUM-49), so a fresh lesson starts with no students attached.
app.post('/api/lesson-plans', requireAuth, requireRole('teacher', 'leader'), ah(async (req, res) => {
  const b = req.body ?? {};
  const day = cleanDay(b.day);
  if (!day) return res.status(400).json({ error: 'day must be one of: Mon, Tue, Wed, Thu, Fri' });
  const time = trim(b.time);
  if (!isTimeHHMM(time)) return res.status(400).json({ error: 'time is required and must be HH:MM (24hr)' });
  const subject = trim(b.subject);
  if (!subject) return res.status(400).json({ error: 'subject is required' });
  const title = trim(b.title);
  if (!title) return res.status(400).json({ error: 'title is required' });
  const weekOf = trim(b.week_of);
  if (!isIsoDate(weekOf)) return res.status(400).json({ error: 'week_of is required and must be YYYY-MM-DD' });

  let teacherId;
  if (req.user.role === 'leader') {
    teacherId = parsePositiveIntId(b.teacher_id);
    if (!teacherId || !await getTeacher(teacherId)) return res.status(400).json({ error: 'teacher_id does not reference a real teacher' });
  } else {
    teacherId = parsePositiveIntId(req.user.teacher_id);
    if (!teacherId) return res.status(400).json({ error: 'your account is not linked to a teacher record yet' });
  }

  const { rows: [row] } = await pool.query(
    `INSERT INTO lesson_plans (teacher_id, day, week_of, time, subject, title, summary)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [teacherId, day, weekOf, time, subject, title, optional(b.summary)],
  );
  res.status(201).json({ ...row, students: [] });
}));

// SCRUM-49 — updates (or, if none exists yet, creates) one student's
// status/activity/note within a lesson. There's no separate "add a student
// to a lesson" endpoint, so this upserts — UNIQUE(lesson_plan_id, child_id)
// on lesson_plan_students guarantees exactly one row per student per lesson,
// so changing one student's status can never touch any other student's row.
app.patch('/api/lesson-plans/:id/students/:childId', requireAuth, requireRole('teacher', 'leader'), ah(async (req, res) => {
  const planId = idParam(req, res); if (!planId) return;
  const childId = parsePositiveIntId(req.params.childId);
  if (!childId) return res.status(400).json({ error: 'invalid child id' });

  const { rows: [plan] } = await pool.query('SELECT * FROM lesson_plans WHERE id = $1', [planId]);
  if (!plan || !canSeeFlowStep(req.user.role, parsePositiveIntId(req.user.teacher_id), plan.teacher_id)) {
    return res.status(404).json({ error: 'not found' });
  }
  if (!await getChild(childId)) return res.status(404).json({ error: 'child not found' });

  const b = req.body ?? {};
  const { rows: [existing] } = await pool.query(
    'SELECT * FROM lesson_plan_students WHERE lesson_plan_id = $1 AND child_id = $2',
    [planId, childId],
  );

  let status = existing?.status ?? 'pending';
  if (b.status !== undefined) {
    status = cleanPlanStatus(b.status);
    if (!status) return res.status(400).json({ error: 'status must be one of: accepted, edited, pending' });
  }
  const activity = b.activity !== undefined ? trim(b.activity) : existing?.activity;
  if (!activity) return res.status(400).json({ error: 'activity is required' });
  const note = b.note !== undefined ? optional(b.note) : (existing?.note ?? null);

  const { rows: [row] } = await pool.query(
    `INSERT INTO lesson_plan_students (lesson_plan_id, child_id, status, activity, note)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (lesson_plan_id, child_id) DO UPDATE SET status = $3, activity = $4, note = $5
     RETURNING *`,
    [planId, childId, status, activity, note],
  );
  res.json(row);
}));

// ── /api/children/:id/progress, /api/progress/class ────────────────────────
// Child & Class Progress Tracking (SCRUM-50/52/53) — every number here comes
// from real observations and real lesson-plan decisions, computed fresh
// (and upserted into progress_snapshots) on each call. See lib/progress.js
// for the actual calculations; this is just the DB glue around them.
async function computeAndSaveSnapshot(childId, forDate) {
  const { rows: obsRows } = await pool.query('SELECT captured_at FROM observations WHERE child_id = $1', [String(childId)]);
  const observationDates = obsRows.map((r) => r.captured_at);

  const { rows: studentRows } = await pool.query('SELECT status FROM lesson_plan_students WHERE child_id = $1', [childId]);

  const mastery = computeMastery(studentRows);
  const attendance = computeAttendance(observationDates, forDate);
  const streak = computeStreak(observationDates, forDate);

  const { rows: [previous] } = await pool.query(
    'SELECT mastery FROM progress_snapshots WHERE child_id = $1 AND date < $2 ORDER BY date DESC LIMIT 1',
    [childId, forDate],
  );
  const trend = computeTrend(mastery, previous?.mastery ?? null);

  const { rows: [row] } = await pool.query(
    `INSERT INTO progress_snapshots (child_id, date, mastery, attendance, streak, trend)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (child_id, date) DO UPDATE SET mastery = $3, attendance = $4, streak = $5, trend = $6
     RETURNING *`,
    [childId, forDate, mastery, attendance, streak, trend],
  );
  return row;
}

app.get('/api/children/:id/progress', requireAuth, requireRole('teacher', 'leader'), ah(async (req, res) => {
  const id = idParam(req, res); if (!id) return;
  const child = await getChild(id);
  if (!child || !canSeeChild(req.user.role, parsePositiveIntId(req.user.teacher_id), child.teacher_id)) {
    return res.status(404).json({ error: 'not found' });
  }

  const today = nowIso().slice(0, 10);
  await computeAndSaveSnapshot(id, today);

  const requestedDays = Number(req.query.days);
  const days = Number.isInteger(requestedDays) && requestedDays > 0 ? requestedDays : 30;
  const { rows: snapshots } = await pool.query(
    'SELECT * FROM progress_snapshots WHERE child_id = $1 ORDER BY date DESC LIMIT $2',
    [id, days],
  );
  res.json({ child_id: child.id, child_name: child.name, trend: snapshots[0]?.trend ?? null, snapshots });
}));

// SCRUM-53 — aggregates real per-child snapshots (computing/upserting each
// child's today first, same as the single-child endpoint) into a genuine
// class-wide average, not a placeholder figure. A class trend is computed
// the same way an individual child's is — comparing today's class average
// against the average of each child's previous snapshot.
const average = (values) => {
  const nums = values.filter((v) => v !== null && v !== undefined);
  return nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : null;
};

app.get('/api/progress/class', requireAuth, requireRole('teacher', 'leader'), ah(async (req, res) => {
  let teacherId;
  if (req.user.role === 'leader') {
    teacherId = parsePositiveIntId(req.query.teacher_id);
    if (!teacherId || !await getTeacher(teacherId)) return res.status(400).json({ error: 'teacher_id does not reference a real teacher' });
  } else {
    teacherId = parsePositiveIntId(req.user.teacher_id);
    if (!teacherId) return res.status(400).json({ error: 'your account is not linked to a teacher record yet' });
  }

  const { rows: children } = await pool.query('SELECT * FROM children WHERE teacher_id = $1 ORDER BY name', [teacherId]);
  const today = nowIso().slice(0, 10);

  const perChild = [];
  for (const child of children) {
    const snapshot = await computeAndSaveSnapshot(child.id, today);
    const { rows: [previous] } = await pool.query(
      'SELECT mastery FROM progress_snapshots WHERE child_id = $1 AND date < $2 ORDER BY date DESC LIMIT 1',
      [child.id, today],
    );
    perChild.push({ child_id: child.id, child_name: child.name, snapshot, previousMastery: previous?.mastery ?? null });
  }

  const avgMastery = average(perChild.map((c) => c.snapshot.mastery));
  const previousAvgMastery = average(perChild.map((c) => c.previousMastery));

  res.json({
    teacher_id: teacherId,
    date: today,
    child_count: children.length,
    avg_mastery: avgMastery,
    avg_attendance: average(perChild.map((c) => c.snapshot.attendance)),
    avg_streak: average(perChild.map((c) => c.snapshot.streak)),
    trend: computeTrend(avgMastery, previousAvgMastery),
    children: perChild.map((c) => ({
      child_id: c.child_id, child_name: c.child_name,
      mastery: c.snapshot.mastery, attendance: c.snapshot.attendance, streak: c.snapshot.streak, trend: c.snapshot.trend,
    })),
  });
}));

// ── /api/threads ─────────────────────────────────────────────────────────────
// Teacher ⇄ Parent Messaging (SCRUM-54/56) — real, persistent conversations.
// There's no POST /api/threads in this sprint's scope, so a thread is
// found-or-created on access (same "compute on read" pattern as Progress
// Tracking's snapshots) — ensureThread relies on message_threads'
// UNIQUE(teacher_id, child_id) to make that safe under concurrent calls.
const ensureThread = async (teacherId, childId) => {
  const { rows: [existing] } = await pool.query(
    'SELECT * FROM message_threads WHERE teacher_id = $1 AND child_id = $2',
    [teacherId, childId],
  );
  if (existing) return existing;
  const { rows: [parent] } = await pool.query('SELECT name FROM parents WHERE child_id = $1 ORDER BY id LIMIT 1', [childId]);
  const { rows: [row] } = await pool.query(
    `INSERT INTO message_threads (teacher_id, child_id, parent_name, created_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (teacher_id, child_id) DO UPDATE SET teacher_id = EXCLUDED.teacher_id
     RETURNING *`,
    [teacherId, childId, parent?.name || 'Parent', nowIso()],
  );
  return row;
};

app.get('/api/threads', requireAuth, requireRole('teacher', 'leader', 'parent'), ah(async (req, res) => {
  let threads;
  if (req.user.role === 'parent') {
    const childId = parsePositiveIntId(req.user.child_id);
    const child = childId ? await getChild(childId) : null;
    if (!child || !child.teacher_id) return res.json([]);
    await ensureThread(child.teacher_id, childId);
    ({ rows: threads } = await pool.query(
      'SELECT mt.*, c.name AS child_name FROM message_threads mt JOIN children c ON c.id = mt.child_id WHERE mt.child_id = $1 ORDER BY mt.created_at DESC',
      [childId],
    ));
  } else if (req.user.role === 'teacher') {
    const teacherId = parsePositiveIntId(req.user.teacher_id);
    if (!teacherId) return res.json([]);
    const { rows: children } = await pool.query('SELECT id FROM children WHERE teacher_id = $1', [teacherId]);
    for (const c of children) await ensureThread(teacherId, c.id);
    ({ rows: threads } = await pool.query(
      'SELECT mt.*, c.name AS child_name FROM message_threads mt JOIN children c ON c.id = mt.child_id WHERE mt.teacher_id = $1 ORDER BY mt.created_at DESC',
      [teacherId],
    ));
  } else {
    const teacherId = req.query.teacher_id !== undefined ? parsePositiveIntId(req.query.teacher_id) : null;
    if (req.query.teacher_id !== undefined && !teacherId) return res.status(400).json({ error: 'teacher_id must be a positive integer' });
    ({ rows: threads } = teacherId
      ? await pool.query('SELECT mt.*, c.name AS child_name FROM message_threads mt JOIN children c ON c.id = mt.child_id WHERE mt.teacher_id = $1 ORDER BY mt.created_at DESC', [teacherId])
      : await pool.query('SELECT mt.*, c.name AS child_name FROM message_threads mt JOIN children c ON c.id = mt.child_id ORDER BY mt.created_at DESC'));
  }

  if (threads.length === 0) return res.json([]);

  // Unread = from the other party, for a teacher/parent participant; for a
  // leader (not a participant in the conversation) it's "anything unread".
  let unreadSql = 'SELECT thread_id, COUNT(*)::int AS unread_count FROM messages WHERE thread_id = ANY($1::int[]) AND read_at IS NULL';
  const unreadParams = [threads.map((t) => t.id)];
  if (req.user.role === 'teacher' || req.user.role === 'parent') {
    unreadSql += ' AND sender_role = $2';
    unreadParams.push(req.user.role === 'teacher' ? 'parent' : 'teacher');
  }
  const { rows: unreadRows } = await pool.query(`${unreadSql} GROUP BY thread_id`, unreadParams);
  const unreadByThread = new Map(unreadRows.map((r) => [r.thread_id, r.unread_count]));

  res.json(threads.map((t) => ({ ...t, unread_count: unreadByThread.get(t.id) ?? 0 })));
}));

const getMessageThread = async (id) => {
  const { rows: [row] } = await pool.query('SELECT * FROM message_threads WHERE id = $1', [id]);
  return row ?? null;
};

// SCRUM-57 — loads a conversation in order, and marks the other party's
// messages read as a side effect (opening a thread is how "read" happens —
// there's no separate mark-as-read endpoint in this sprint's scope). A
// leader viewing doesn't mark anything read, since they aren't a real
// participant in the conversation.
app.get('/api/threads/:id/messages', requireAuth, requireRole('teacher', 'leader', 'parent'), ah(async (req, res) => {
  const id = idParam(req, res); if (!id) return;
  const thread = await getMessageThread(id);
  if (!thread || !canSeeThread(req.user.role, parsePositiveIntId(req.user.teacher_id), parsePositiveIntId(req.user.child_id), thread)) {
    return res.status(404).json({ error: 'not found' });
  }

  if (req.user.role === 'teacher' || req.user.role === 'parent') {
    const otherRole = req.user.role === 'teacher' ? 'parent' : 'teacher';
    await pool.query(
      'UPDATE messages SET read_at = $1 WHERE thread_id = $2 AND sender_role = $3 AND read_at IS NULL',
      [nowIso(), id, otherRole],
    );
  }

  const { rows } = await pool.query('SELECT * FROM messages WHERE thread_id = $1 ORDER BY sent_at ASC', [id]);
  res.json(rows);
}));

app.get('/api/health', ah(async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ ok: true });
}));

// API-only 404 — the frontend is a separate service now (static-server.js);
// this service no longer serves dist/ or the SPA fallback.
app.use((req, res) => {
  res.status(404).json({ error: `no route for ${req.method} ${req.path}` });
});

// Central error handler — catches anything ah() forwarded via next(err).
app.use((err, _req, res, _next) => {
  console.error('Unhandled API error:', err);
  res.status(500).json({ error: 'internal server error' });
});

async function main() {
  await migrate();
  await seedDemoAccounts();
  app.listen(PORT, () => {
    console.log(`alc-app server listening on :${PORT} (Postgres)`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
