// Express server: API-only backend, backed by Postgres. The frontend is a
// separate Railway service (static-server.js) that serves the built Vite
// SPA and talks to this service cross-origin — see CORS_ORIGIN below.
//   - /api/review/*    — reviewer-guide feedback (existing)
//   - /api/intake, /api/prospects/*, /api/assessments/*, /api/observations/*
//     — onboarding journey (Epic B onwards)
//   - /api/auth/*      — real login/session backend (SCRUM-16, Sprint 1)
import express from 'express';
import cors from 'cors';
import pg from 'pg';
import crypto from 'node:crypto';

const { Pool } = pg;
const PORT = Number(process.env.PORT) || 3000;

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
      child_id      TEXT,                              -- opaque ref; no children table yet
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
const PASSCODE_PEPPER = process.env.PASSCODE_PEPPER;
if (!PASSCODE_PEPPER) {
  console.warn('PASSCODE_PEPPER is not set — using an insecure dev-only default. Set it in Railway for production.');
}
const passcodePepper = PASSCODE_PEPPER || 'dev-only-insecure-pepper-change-me';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
};
const verifyPassword = (password, stored) => {
  if (!stored) return false;
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
};
const hashPasscode = (passcode) => crypto.createHmac('sha256', passcodePepper).update(passcode).digest('hex');
const genToken = () => crypto.randomBytes(32).toString('hex');

const publicUser = (u) => u && ({
  id: u.id,
  role: u.role,
  name: u.name,
  email: u.email ?? null,
  childId: u.child_id ?? null,
  teacherId: u.teacher_id ?? null,
});

const createSession = async (userId) => {
  const token = genToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  await pool.query('INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES ($1, $2, $3, $4)', [token, userId, nowIso(), expiresAt]);
  return { token, expiresAt };
};

// Very small in-memory throttle: flags unusually many failed attempts from
// the same IP without permanently locking a family out of a shared device.
const failedAttempts = new Map(); // ip -> { count, windowStart }
const FAILED_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const FAILED_ATTEMPT_LIMIT = 10;
const tooManyFailedAttempts = (ip) => {
  const entry = failedAttempts.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.windowStart > FAILED_ATTEMPT_WINDOW_MS) {
    failedAttempts.delete(ip);
    return false;
  }
  return entry.count >= FAILED_ATTEMPT_LIMIT;
};
const recordFailedAttempt = (ip) => {
  const entry = failedAttempts.get(ip);
  if (!entry || Date.now() - entry.windowStart > FAILED_ATTEMPT_WINDOW_MS) {
    failedAttempts.set(ip, { count: 1, windowStart: Date.now() });
  } else {
    entry.count += 1;
  }
};

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
      const passcodeHash = u.passcode ? hashPasscode(u.passcode) : null;
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
const corsOrigins = (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({ origin: corsOrigins.length > 0 ? corsOrigins : true }));

app.use(express.json({ limit: '64kb' }));

// ── API ──────────────────────────────────────────────────────────────────────
const trim = (v) => (typeof v === 'string' ? v.trim() : '');
const optional = (v) => (trim(v) || null);
const PRIORITIES = new Set(['important', 'nice', 'v2']);
const cleanPriority = (v) => (PRIORITIES.has(trim(v)) ? trim(v) : null);

const idParam = (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
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
const authEmailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clientIp = (req) => req.ip ?? req.socket?.remoteAddress ?? 'unknown';

app.post('/api/auth/login', ah(async (req, res) => {
  const ip = clientIp(req);
  if (tooManyFailedAttempts(ip)) {
    return res.status(429).json({ error: 'too many failed attempts — please wait a few minutes and try again' });
  }
  const { email, password } = req.body ?? {};
  if (!authEmailRe.test(trim(email)) || !trim(password)) {
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
    [r, hashPasscode(trim(passcode))],
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

// ── Onboarding ───────────────────────────────────────────────────────────────
// Surface for the onboarding journey (intake form, owner queue, assessments,
// observations). Tables are defined in migrate() at the top of this file
// (Stories B1–B4). Email send + media upload land in later epics.

const PROSPECT_STATUSES   = new Set(['prospect','booked','assessed','enrolled','declined']);
const ASSESSMENT_STATUSES = new Set(['scheduled','in_progress','done']);
const OBSERVATION_KINDS   = new Set(['image','video','voice','text']);

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trim(s));
const toBool = (v) => {
  if (v === true || v === 1) return true;
  if (typeof v === 'string' && /^(yes|true|1)$/i.test(v.trim())) return true;
  return false;
};
const cleanProspectStatus   = (v) => (PROSPECT_STATUSES.has(trim(v))   ? trim(v) : null);
const cleanAssessmentStatus = (v) => (ASSESSMENT_STATUSES.has(trim(v)) ? trim(v) : null);
const cleanObservationKind  = (v) => (OBSERVATION_KINDS.has(trim(v))   ? trim(v) : null);

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

app.patch('/api/prospects/:id', ah(async (req, res) => {
  const id = idParam(req, res); if (!id) return;
  const existing = await getProspect(id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  const b = req.body ?? {};

  const status = b.status === undefined ? existing.status : cleanProspectStatus(b.status);
  if (b.status !== undefined && !status) return res.status(400).json({ error: 'invalid status' });

  const { rows: [row] } = await pool.query(
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
  res.json(row);
}));

// ── /api/assessments ────────────────────────────────────────────────────────
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

app.post('/api/assessments/:id/send', ah(async (req, res) => {
  const id = idParam(req, res); if (!id) return;
  const existing = await getAssessment(id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  if (!existing.report_signed_off_at) return res.status(409).json({ error: 'sign off the report before sending' });
  if (existing.sent_to_parent_at) return res.status(409).json({ error: 'already sent' });

  // NOTE: actual email send happens in F5 (Sign-off + send). For now we just
  // persist the timestamp and bump the prospect's status to 'assessed'.
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

// ── /api/observations ───────────────────────────────────────────────────────
app.get('/api/observations', ah(async (req, res) => {
  const pid = req.query.prospect_id ? Number(req.query.prospect_id) : null;
  if (pid !== null && (!Number.isInteger(pid) || pid <= 0)) {
    return res.status(400).json({ error: 'prospect_id must be a positive integer' });
  }
  const { rows } = pid
    ? await pool.query('SELECT * FROM observations WHERE prospect_id = $1 ORDER BY captured_at DESC', [pid])
    : await pool.query('SELECT * FROM observations ORDER BY captured_at DESC LIMIT 100');
  res.json(rows);
}));

app.post('/api/observations', ah(async (req, res) => {
  const { prospect_id, child_id, teacher_id, kind, media_url, transcript, comment } = req.body ?? {};
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

  const { rows: [row] } = await pool.query(
    `INSERT INTO observations (prospect_id, child_id, teacher_id, kind, media_url, transcript, comment, captured_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [pid, optional(child_id), optional(teacher_id), k, optional(media_url), optional(transcript), optional(comment), nowIso()],
  );
  res.status(201).json(row);
}));

app.delete('/api/observations/:id', ah(async (req, res) => {
  const id = idParam(req, res); if (!id) return;
  await pool.query('DELETE FROM observations WHERE id = $1', [id]);
  res.status(204).end();
}));

app.get('/api/health', ah(async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ ok: true });
}));

// TEMPORARY — one-time cleanup of duplicate demo-account rows accidentally
// inserted by a local test run against production. Dry-run by default
// (SELECT only); pass ?apply=1 to actually delete. Remove this route once
// cleanup is confirmed (see ADMIN_TASK_TOKEN in Railway variables).
if (process.env.ADMIN_TASK_TOKEN) {
  app.get('/api/_admin/dedupe-users', ah(async (req, res) => {
    const token = trim(req.query.token);
    const expected = process.env.ADMIN_TASK_TOKEN;
    const match = token.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
    if (!match) return res.status(404).end();

    const { rows: dupes } = await pool.query(`
      SELECT a.id, a.role, a.name, a.created_at FROM users a
      JOIN users b ON a.role = b.role AND a.name = b.name AND a.id > b.id
      ORDER BY a.id
    `);
    if (req.query.apply !== '1') {
      return res.json({ dryRun: true, wouldDelete: dupes });
    }
    const { rows: deleted } = await pool.query(`
      DELETE FROM users a USING users b
      WHERE a.role = b.role AND a.name = b.name AND a.id > b.id
      RETURNING a.id, a.role, a.name
    `);
    res.json({ dryRun: false, deleted });
  }));
}

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
