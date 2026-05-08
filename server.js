// Express server: serves the built Vite SPA and exposes the API + SQLite store.
// Two surfaces share the same database (DATA_DIR/review.db):
//   - /api/review/*    — reviewer-guide feedback (existing)
//   - /api/intake, /api/prospects/*, /api/assessments/*, /api/observations/*
//     — onboarding journey (Epic B onwards)
// In Railway, set DATA_DIR=/data and mount a volume there so data survives redeploys.
import express from 'express';
import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
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

const app = express();
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

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ── Static SPA ───────────────────────────────────────────────────────────────
const distDir = path.join(__dirname, 'dist');
app.use(express.static(distDir));
app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')));

app.listen(PORT, () => {
  console.log(`alc-app server listening on :${PORT} (data: ${DATA_DIR})`);
});
