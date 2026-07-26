// Express server: serves the built Vite SPA and exposes the API + SQLite store.
// Two surfaces share the same database (DATA_DIR/review.db):
//   - /api/review/*    — reviewer-guide feedback (existing)
//   - /api/intake, /api/prospects/*, /api/assessments/*, /api/observations/*
//     — onboarding journey (Epic B onwards)
//   - /api/auth/*      — real login/session backend (SCRUM-16, Sprint 1)
// In Railway, set DATA_DIR=/data and mount a volume there so data survives redeploys.
import express from 'express';
import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');

fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new Database(path.join(DATA_DIR, 'review.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS area_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    area_key TEXT NOT NULL,
    area_label TEXT NOT NULL,
    comment TEXT NOT NULL,
    author TEXT,
    role TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS feature_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feature_key TEXT NOT NULL,
    feature_label TEXT NOT NULL,
    comment TEXT NOT NULL,
    author TEXT,
    role TEXT,
    priority TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feature TEXT NOT NULL,
    description TEXT NOT NULL,
    author TEXT,
    priority TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Onboarding: one row per family that submits the public intake form.
  -- High-signal answers from the intake are mirrored here as indexed columns
  -- so the owner queue can filter quickly; the full answer set lives in
  -- intake_responses.answers (JSON) — see Story B2.
  CREATE TABLE IF NOT EXISTS prospects (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_email        TEXT NOT NULL,
    parent_name         TEXT,
    parent_phone        TEXT,
    child_first_name    TEXT,
    child_dob           TEXT,           -- ISO date YYYY-MM-DD; age is derived
    year_group          TEXT,           -- Reception | Year 1..6
    homework_in_plan    TEXT,           -- yes | no | maybe
    tech_comfort_parent TEXT,           -- intake Q8
    tech_comfort_child  TEXT,           -- intake Q9
    flagged_needs       INTEGER NOT NULL DEFAULT 0,  -- 0/1, true if Q19 has any non-None
    consent_notes       INTEGER NOT NULL DEFAULT 0,  -- Q22 (required to enrol)
    consent_media       INTEGER NOT NULL DEFAULT 0,  -- Q23 (required to enrol)
    status              TEXT NOT NULL DEFAULT 'prospect'
                          CHECK (status IN ('prospect','booked','assessed','enrolled','declined')),
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_prospects_status      ON prospects(status);
  CREATE INDEX IF NOT EXISTS idx_prospects_parent_mail ON prospects(parent_email);
  CREATE INDEX IF NOT EXISTS idx_prospects_created_at  ON prospects(created_at DESC);

  -- Onboarding: full intake answer set, one row per prospect.
  -- The high-signal answers are mirrored on prospects (B1) for fast filtering;
  -- everything else (goals, focus aids, hobbies Q17, etc.) lives here as JSON
  -- so the report-draft prompt (F2) can read the whole picture.
  CREATE TABLE IF NOT EXISTS intake_responses (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    prospect_id   INTEGER NOT NULL UNIQUE
                    REFERENCES prospects(id) ON DELETE CASCADE,
    answers       TEXT    NOT NULL,         -- JSON: { [questionId]: value }
    submitted_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- Onboarding: the 2-hour assessment session a prospect books, plus the
  -- AI-drafted report that gets signed off and emailed to the parent.
  -- Multiple rows per prospect are allowed (re-assessment within the
  -- 4-week reassessment window — see project CLAUDE.md "working agreements").
  CREATE TABLE IF NOT EXISTS assessments (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    prospect_id           INTEGER NOT NULL
                            REFERENCES prospects(id) ON DELETE CASCADE,
    scheduled_for         TEXT,                 -- ISO datetime
    teacher_id            TEXT,                 -- loose for now (no teachers table yet)
    status                TEXT NOT NULL DEFAULT 'scheduled'
                            CHECK (status IN ('scheduled','in_progress','done')),
    report_draft          TEXT,                 -- HTML/Markdown body, populated by F2
    report_signed_off_at  TEXT,
    sent_to_parent_at     TEXT,
    created_at            TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at            TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_assessments_prospect    ON assessments(prospect_id);
  CREATE INDEX IF NOT EXISTS idx_assessments_status      ON assessments(status);
  CREATE INDEX IF NOT EXISTS idx_assessments_scheduled   ON assessments(scheduled_for);

  -- Onboarding: in-the-moment observations captured by a teacher during
  -- (or outside of) an assessment. prospect_id and child_id are both
  -- nullable so an observation can belong to a prospect (pre-enrolment),
  -- a child (post-enrolment), or be a free-floating teacher note.
  CREATE TABLE IF NOT EXISTS observations (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    prospect_id   INTEGER REFERENCES prospects(id) ON DELETE CASCADE,
    child_id      TEXT,                              -- opaque ref; no children table yet
    teacher_id    TEXT,
    kind          TEXT NOT NULL
                    CHECK (kind IN ('image','video','voice','text')),
    media_url     TEXT,                              -- relative path under data/media/ for now (B6)
    transcript    TEXT,                              -- for voice → text (E3)
    comment       TEXT,                              -- teacher's typed note
    captured_at   TEXT NOT NULL DEFAULT (datetime('now'))
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
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    role          TEXT NOT NULL CHECK (role IN ('teacher','parent','student','leader')),
    email         TEXT UNIQUE,           -- staff login only (teacher/leader)
    password_hash TEXT,                  -- staff login only; salt:scrypt-hash, never plain text
    passcode_hash TEXT,                  -- parent/student login only; HMAC-SHA256, never plain text
    name          TEXT NOT NULL,
    child_id      TEXT,                  -- opaque ref; no children table yet (SCRUM-22)
    teacher_id    TEXT,                  -- opaque ref; no teachers table yet (SCRUM-22)
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_users_role_passcode ON users(role, passcode_hash);

  CREATE TABLE IF NOT EXISTS sessions (
    id          TEXT PRIMARY KEY,        -- opaque session token (also the bearer token)
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at  TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
`);

// Idempotent migrations for databases created before priority existed.
const ensureColumn = (table, column, decl) => {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${decl}`);
  }
};
ensureColumn('feature_feedback', 'priority', 'TEXT');
ensureColumn('requests', 'priority', 'TEXT');

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

const createSession = (userId) => {
  const token = genToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').run(token, userId, expiresAt);
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

const requireAuth = (req, res, next) => {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) return res.status(401).json({ error: 'not signed in' });

  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(token);
  if (!session || session.expires_at < new Date().toISOString()) {
    if (session) db.prepare('DELETE FROM sessions WHERE id = ?').run(token);
    return res.status(401).json({ error: 'session expired, please sign in again' });
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(session.user_id);
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

{
  const insertUser = db.prepare(`
    INSERT INTO users (role, email, password_hash, passcode_hash, name, child_id)
    VALUES (@role, @email, @password_hash, @passcode_hash, @name, @child_id)
  `);
  const findByEmail = db.prepare('SELECT 1 FROM users WHERE email = ?');
  const findByPasscode = db.prepare('SELECT 1 FROM users WHERE role = ? AND passcode_hash = ?');
  let seeded = 0;
  const seedTx = db.transaction(() => {
    for (const u of AUTH_SEED) {
      const email = u.email ? u.email.toLowerCase() : null;
      const passcodeHash = u.passcode ? hashPasscode(u.passcode) : null;
      const exists = email ? findByEmail.get(email) : findByPasscode.get(u.role, passcodeHash);
      if (exists) continue;
      insertUser.run({
        role: u.role,
        email,
        password_hash: u.password ? hashPassword(u.password) : null,
        passcode_hash: passcodeHash,
        name: u.name,
        child_id: u.child_id ?? null,
      });
      seeded += 1;
    }
  });
  seedTx();
  if (seeded > 0) console.log(`Seeded ${seeded} demo auth account(s)`);
}

const app = express();
app.set('trust proxy', 1); // Railway sits behind a proxy — needed for accurate req.ip
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

// ── area_feedback ─────────────────────────────────────────────────────────
app.get('/api/review/area-feedback', (_req, res) => {
  res.json(db.prepare('SELECT * FROM area_feedback ORDER BY created_at DESC').all());
});
app.post('/api/review/area-feedback', (req, res) => {
  const { area_key, area_label, comment, author, role } = req.body ?? {};
  if (!trim(area_key) || !trim(area_label) || !trim(comment)) {
    return res.status(400).json({ error: 'area_key, area_label, and comment are required' });
  }
  const info = db.prepare(
    'INSERT INTO area_feedback (area_key, area_label, comment, author, role) VALUES (?, ?, ?, ?, ?)'
  ).run(trim(area_key), trim(area_label), trim(comment), optional(author), optional(role));
  res.status(201).json(db.prepare('SELECT * FROM area_feedback WHERE id = ?').get(info.lastInsertRowid));
});
app.put('/api/review/area-feedback/:id', (req, res) => {
  const id = idParam(req, res); if (!id) return;
  const { comment, author } = req.body ?? {};
  if (!trim(comment)) return res.status(400).json({ error: 'comment is required' });
  const existing = db.prepare('SELECT id FROM area_feedback WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  db.prepare('UPDATE area_feedback SET comment = ?, author = ? WHERE id = ?').run(
    trim(comment), optional(author), id
  );
  res.json(db.prepare('SELECT * FROM area_feedback WHERE id = ?').get(id));
});
app.delete('/api/review/area-feedback/:id', (req, res) => {
  const id = idParam(req, res); if (!id) return;
  db.prepare('DELETE FROM area_feedback WHERE id = ?').run(id);
  res.status(204).end();
});

// ── feature_feedback ──────────────────────────────────────────────────────
app.get('/api/review/feature-feedback', (_req, res) => {
  res.json(db.prepare('SELECT * FROM feature_feedback ORDER BY created_at DESC').all());
});
app.post('/api/review/feature-feedback', (req, res) => {
  const { feature_key, feature_label, comment, author, role, priority } = req.body ?? {};
  if (!trim(feature_key) || !trim(feature_label) || !trim(comment)) {
    return res.status(400).json({ error: 'feature_key, feature_label, and comment are required' });
  }
  const info = db.prepare(
    'INSERT INTO feature_feedback (feature_key, feature_label, comment, author, role, priority) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(
    trim(feature_key), trim(feature_label), trim(comment),
    optional(author), optional(role), cleanPriority(priority)
  );
  res.status(201).json(db.prepare('SELECT * FROM feature_feedback WHERE id = ?').get(info.lastInsertRowid));
});
app.put('/api/review/feature-feedback/:id', (req, res) => {
  const id = idParam(req, res); if (!id) return;
  const { comment, author, priority } = req.body ?? {};
  if (!trim(comment)) return res.status(400).json({ error: 'comment is required' });
  const existing = db.prepare('SELECT id FROM feature_feedback WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  db.prepare('UPDATE feature_feedback SET comment = ?, author = ?, priority = ? WHERE id = ?').run(
    trim(comment), optional(author), cleanPriority(priority), id
  );
  res.json(db.prepare('SELECT * FROM feature_feedback WHERE id = ?').get(id));
});
app.delete('/api/review/feature-feedback/:id', (req, res) => {
  const id = idParam(req, res); if (!id) return;
  db.prepare('DELETE FROM feature_feedback WHERE id = ?').run(id);
  res.status(204).end();
});

// ── requests ──────────────────────────────────────────────────────────────
app.get('/api/review/requests', (_req, res) => {
  res.json(db.prepare('SELECT * FROM requests ORDER BY created_at DESC').all());
});
app.post('/api/review/requests', (req, res) => {
  const { feature, description, author, priority } = req.body ?? {};
  if (!trim(feature) || !trim(description)) {
    return res.status(400).json({ error: 'feature and description are required' });
  }
  const info = db.prepare(
    'INSERT INTO requests (feature, description, author, priority) VALUES (?, ?, ?, ?)'
  ).run(trim(feature), trim(description), optional(author), cleanPriority(priority));
  res.status(201).json(db.prepare('SELECT * FROM requests WHERE id = ?').get(info.lastInsertRowid));
});
app.put('/api/review/requests/:id', (req, res) => {
  const id = idParam(req, res); if (!id) return;
  const { feature, description, author, priority } = req.body ?? {};
  if (!trim(feature) || !trim(description)) {
    return res.status(400).json({ error: 'feature and description are required' });
  }
  const existing = db.prepare('SELECT id FROM requests WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  db.prepare(
    "UPDATE requests SET feature = ?, description = ?, author = ?, priority = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(trim(feature), trim(description), optional(author), cleanPriority(priority), id);
  res.json(db.prepare('SELECT * FROM requests WHERE id = ?').get(id));
});
app.delete('/api/review/requests/:id', (req, res) => {
  const id = idParam(req, res); if (!id) return;
  db.prepare('DELETE FROM requests WHERE id = ?').run(id);
  res.status(204).end();
});

// ── /api/auth (SCRUM-16) ────────────────────────────────────────────────────
const authEmailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clientIp = (req) => req.ip ?? req.socket?.remoteAddress ?? 'unknown';

app.post('/api/auth/login', (req, res) => {
  const ip = clientIp(req);
  if (tooManyFailedAttempts(ip)) {
    return res.status(429).json({ error: 'too many failed attempts — please wait a few minutes and try again' });
  }
  const { email, password } = req.body ?? {};
  if (!authEmailRe.test(trim(email)) || !trim(password)) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  const user = db.prepare("SELECT * FROM users WHERE email = ? AND role IN ('teacher','leader')")
    .get(trim(email).toLowerCase());
  if (!user || !verifyPassword(password, user.password_hash)) {
    recordFailedAttempt(ip);
    return res.status(401).json({ error: 'that email and password combination is incorrect' });
  }
  const { token } = createSession(user.id);
  res.status(201).json({ token, user: publicUser(user) });
});

app.post('/api/auth/passcode', (req, res) => {
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
  const user = db.prepare('SELECT * FROM users WHERE role = ? AND passcode_hash = ?')
    .get(r, hashPasscode(trim(passcode)));
  if (!user) {
    recordFailedAttempt(ip);
    return res.status(401).json({ error: "that passcode doesn't match" });
  }
  const { token } = createSession(user.id);
  res.status(201).json({ token, user: publicUser(user) });
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(req.token);
  res.status(204).end();
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json(publicUser(req.user));
});

// ── Onboarding ───────────────────────────────────────────────────────────────
// Surface for the onboarding journey (intake form, owner queue, assessments,
// observations). Tables are defined in the migration block at the top of this
// file (Stories B1–B4). Email send + media upload land in later epics.

const PROSPECT_STATUSES   = new Set(['prospect','booked','assessed','enrolled','declined']);
const ASSESSMENT_STATUSES = new Set(['scheduled','in_progress','done']);
const OBSERVATION_KINDS   = new Set(['image','video','voice','text']);

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trim(s));
const toBoolInt = (v) => {
  if (v === true || v === 1) return 1;
  if (typeof v === 'string' && /^(yes|true|1)$/i.test(v.trim())) return 1;
  return 0;
};
const cleanProspectStatus   = (v) => (PROSPECT_STATUSES.has(trim(v))   ? trim(v) : null);
const cleanAssessmentStatus = (v) => (ASSESSMENT_STATUSES.has(trim(v)) ? trim(v) : null);
const cleanObservationKind  = (v) => (OBSERVATION_KINDS.has(trim(v))   ? trim(v) : null);

const serialiseProspect = (row) => row && ({
  ...row,
  flagged_needs: !!row.flagged_needs,
  consent_notes: !!row.consent_notes,
  consent_media: !!row.consent_media,
});

const getProspect    = (id) => serialiseProspect(db.prepare('SELECT * FROM prospects WHERE id = ?').get(id));
const getAssessment  = (id) => db.prepare('SELECT * FROM assessments WHERE id = ?').get(id);

// ── /api/intake ─────────────────────────────────────────────────────────────
// Atomic create: one prospect row + one intake_responses row.
app.post('/api/intake', (req, res) => {
  const { parent_email, parent_name, parent_phone, prospect = {}, answers } = req.body ?? {};
  if (!isEmail(parent_email)) return res.status(400).json({ error: 'parent_email is required and must look like an email' });
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    return res.status(400).json({ error: 'answers must be an object' });
  }

  const insert = db.transaction(() => {
    const info = db.prepare(`
      INSERT INTO prospects (
        parent_email, parent_name, parent_phone,
        child_first_name, child_dob, year_group, homework_in_plan,
        tech_comfort_parent, tech_comfort_child,
        flagged_needs, consent_notes, consent_media
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      trim(parent_email).toLowerCase(),
      optional(parent_name),
      optional(parent_phone),
      optional(prospect.child_first_name),
      optional(prospect.child_dob),
      optional(prospect.year_group),
      optional(prospect.homework_in_plan),
      optional(prospect.tech_comfort_parent),
      optional(prospect.tech_comfort_child),
      toBoolInt(prospect.flagged_needs),
      toBoolInt(prospect.consent_notes),
      toBoolInt(prospect.consent_media),
    );
    db.prepare('INSERT INTO intake_responses (prospect_id, answers) VALUES (?, ?)')
      .run(info.lastInsertRowid, JSON.stringify(answers));
    return info.lastInsertRowid;
  });

  try {
    const id = insert();
    res.status(201).json(getProspect(id));
  } catch (err) {
    console.error('POST /api/intake failed:', err);
    res.status(500).json({ error: 'failed to save intake' });
  }
});

// ── /api/prospects ──────────────────────────────────────────────────────────
app.get('/api/prospects', (req, res) => {
  const status = cleanProspectStatus(req.query.status);
  const rows = status
    ? db.prepare('SELECT * FROM prospects WHERE status = ? ORDER BY created_at DESC').all(status)
    : db.prepare('SELECT * FROM prospects ORDER BY created_at DESC').all();
  res.json(rows.map(serialiseProspect));
});

app.get('/api/prospects/:id', (req, res) => {
  const id = idParam(req, res); if (!id) return;
  const prospect = getProspect(id);
  if (!prospect) return res.status(404).json({ error: 'not found' });
  const intakeRow = db.prepare('SELECT answers, submitted_at FROM intake_responses WHERE prospect_id = ?').get(id);
  const intake = intakeRow ? { answers: JSON.parse(intakeRow.answers), submitted_at: intakeRow.submitted_at } : null;
  const assessments = db.prepare('SELECT * FROM assessments WHERE prospect_id = ? ORDER BY scheduled_for, created_at').all(id);
  const observations = db.prepare('SELECT * FROM observations WHERE prospect_id = ? ORDER BY captured_at DESC').all(id);
  res.json({ ...prospect, intake, assessments, observations });
});

app.patch('/api/prospects/:id', (req, res) => {
  const id = idParam(req, res); if (!id) return;
  const existing = getProspect(id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  const b = req.body ?? {};

  const status = b.status === undefined ? existing.status : cleanProspectStatus(b.status);
  if (b.status !== undefined && !status) return res.status(400).json({ error: 'invalid status' });

  db.prepare(`
    UPDATE prospects SET
      parent_email        = ?,
      parent_name         = ?,
      parent_phone        = ?,
      child_first_name    = ?,
      child_dob           = ?,
      year_group          = ?,
      homework_in_plan    = ?,
      tech_comfort_parent = ?,
      tech_comfort_child  = ?,
      flagged_needs       = ?,
      consent_notes       = ?,
      consent_media       = ?,
      status              = ?,
      updated_at          = datetime('now')
    WHERE id = ?
  `).run(
    b.parent_email !== undefined ? trim(b.parent_email).toLowerCase() : existing.parent_email,
    b.parent_name !== undefined ? optional(b.parent_name) : existing.parent_name,
    b.parent_phone !== undefined ? optional(b.parent_phone) : existing.parent_phone,
    b.child_first_name !== undefined ? optional(b.child_first_name) : existing.child_first_name,
    b.child_dob !== undefined ? optional(b.child_dob) : existing.child_dob,
    b.year_group !== undefined ? optional(b.year_group) : existing.year_group,
    b.homework_in_plan !== undefined ? optional(b.homework_in_plan) : existing.homework_in_plan,
    b.tech_comfort_parent !== undefined ? optional(b.tech_comfort_parent) : existing.tech_comfort_parent,
    b.tech_comfort_child !== undefined ? optional(b.tech_comfort_child) : existing.tech_comfort_child,
    b.flagged_needs !== undefined ? toBoolInt(b.flagged_needs) : (existing.flagged_needs ? 1 : 0),
    b.consent_notes !== undefined ? toBoolInt(b.consent_notes) : (existing.consent_notes ? 1 : 0),
    b.consent_media !== undefined ? toBoolInt(b.consent_media) : (existing.consent_media ? 1 : 0),
    status,
    id,
  );
  res.json(getProspect(id));
});

// ── /api/assessments ────────────────────────────────────────────────────────
app.post('/api/assessments', (req, res) => {
  const { prospect_id, scheduled_for, teacher_id } = req.body ?? {};
  const pid = Number(prospect_id);
  if (!Number.isInteger(pid) || pid <= 0) return res.status(400).json({ error: 'prospect_id is required' });
  if (!getProspect(pid)) return res.status(404).json({ error: 'prospect not found' });

  const info = db.prepare(
    'INSERT INTO assessments (prospect_id, scheduled_for, teacher_id) VALUES (?, ?, ?)'
  ).run(pid, optional(scheduled_for), optional(teacher_id));

  // Mark the prospect as booked when its first assessment is scheduled.
  if (scheduled_for) {
    db.prepare("UPDATE prospects SET status = 'booked', updated_at = datetime('now') WHERE id = ? AND status = 'prospect'").run(pid);
  }
  res.status(201).json(getAssessment(info.lastInsertRowid));
});

app.get('/api/assessments/:id', (req, res) => {
  const id = idParam(req, res); if (!id) return;
  const row = getAssessment(id);
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json(row);
});

app.patch('/api/assessments/:id', (req, res) => {
  const id = idParam(req, res); if (!id) return;
  const existing = getAssessment(id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  const b = req.body ?? {};

  const status = b.status === undefined ? existing.status : cleanAssessmentStatus(b.status);
  if (b.status !== undefined && !status) return res.status(400).json({ error: 'invalid status' });

  db.prepare(`
    UPDATE assessments SET
      scheduled_for = ?,
      teacher_id    = ?,
      status        = ?,
      report_draft  = ?,
      updated_at    = datetime('now')
    WHERE id = ?
  `).run(
    b.scheduled_for !== undefined ? optional(b.scheduled_for) : existing.scheduled_for,
    b.teacher_id !== undefined ? optional(b.teacher_id) : existing.teacher_id,
    status,
    b.report_draft !== undefined ? optional(b.report_draft) : existing.report_draft,
    id,
  );
  res.json(getAssessment(id));
});

app.post('/api/assessments/:id/sign-off', (req, res) => {
  const id = idParam(req, res); if (!id) return;
  const existing = getAssessment(id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  if (!trim(existing.report_draft)) return res.status(400).json({ error: 'report_draft is empty' });
  if (existing.report_signed_off_at) return res.status(409).json({ error: 'already signed off' });

  db.prepare(`
    UPDATE assessments SET
      status = 'done',
      report_signed_off_at = datetime('now'),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(id);
  res.json(getAssessment(id));
});

app.post('/api/assessments/:id/send', (req, res) => {
  const id = idParam(req, res); if (!id) return;
  const existing = getAssessment(id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  if (!existing.report_signed_off_at) return res.status(409).json({ error: 'sign off the report before sending' });
  if (existing.sent_to_parent_at) return res.status(409).json({ error: 'already sent' });

  // NOTE: actual email send happens in F5 (Sign-off + send). For now we just
  // persist the timestamp and bump the prospect's status to 'assessed'.
  const sendTx = db.transaction(() => {
    db.prepare("UPDATE assessments SET sent_to_parent_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(id);
    db.prepare("UPDATE prospects SET status = 'assessed', updated_at = datetime('now') WHERE id = ?").run(existing.prospect_id);
  });
  sendTx();
  res.json(getAssessment(id));
});

// ── /api/observations ───────────────────────────────────────────────────────
app.get('/api/observations', (req, res) => {
  const pid = req.query.prospect_id ? Number(req.query.prospect_id) : null;
  if (pid !== null && (!Number.isInteger(pid) || pid <= 0)) {
    return res.status(400).json({ error: 'prospect_id must be a positive integer' });
  }
  const rows = pid
    ? db.prepare('SELECT * FROM observations WHERE prospect_id = ? ORDER BY captured_at DESC').all(pid)
    : db.prepare('SELECT * FROM observations ORDER BY captured_at DESC LIMIT 100').all();
  res.json(rows);
});

app.post('/api/observations', (req, res) => {
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
    if (!getProspect(n)) return res.status(404).json({ error: 'prospect not found' });
    pid = n;
  }

  const info = db.prepare(`
    INSERT INTO observations (prospect_id, child_id, teacher_id, kind, media_url, transcript, comment)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(pid, optional(child_id), optional(teacher_id), k, optional(media_url), optional(transcript), optional(comment));
  res.status(201).json(db.prepare('SELECT * FROM observations WHERE id = ?').get(info.lastInsertRowid));
});

app.delete('/api/observations/:id', (req, res) => {
  const id = idParam(req, res); if (!id) return;
  db.prepare('DELETE FROM observations WHERE id = ?').run(id);
  res.status(204).end();
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ── Static SPA ───────────────────────────────────────────────────────────────
const distDir = path.join(__dirname, 'dist');
app.use(express.static(distDir));
app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')));

app.listen(PORT, () => {
  console.log(`alc-app server listening on :${PORT} (data: ${DATA_DIR})`);
});
