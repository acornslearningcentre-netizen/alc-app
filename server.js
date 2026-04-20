// Express server: serves the built Vite SPA and exposes /api/review/* endpoints
// backed by a small SQLite database. In Railway, set DATA_DIR=/data and mount a
// volume there so feedback survives redeploys.
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
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feature TEXT NOT NULL,
    description TEXT NOT NULL,
    author TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const app = express();
app.use(express.json({ limit: '64kb' }));

// ── API ──────────────────────────────────────────────────────────────────────
const trim = (v) => (typeof v === 'string' ? v.trim() : '');
const optional = (v) => (trim(v) || null);

app.get('/api/review/area-feedback', (_req, res) => {
  const rows = db.prepare('SELECT * FROM area_feedback ORDER BY created_at DESC').all();
  res.json(rows);
});
app.post('/api/review/area-feedback', (req, res) => {
  const { area_key, area_label, comment, author, role } = req.body ?? {};
  if (!trim(area_key) || !trim(area_label) || !trim(comment)) {
    return res.status(400).json({ error: 'area_key, area_label, and comment are required' });
  }
  const stmt = db.prepare(
    'INSERT INTO area_feedback (area_key, area_label, comment, author, role) VALUES (?, ?, ?, ?, ?)'
  );
  const info = stmt.run(trim(area_key), trim(area_label), trim(comment), optional(author), optional(role));
  res.status(201).json(db.prepare('SELECT * FROM area_feedback WHERE id = ?').get(info.lastInsertRowid));
});

app.get('/api/review/feature-feedback', (_req, res) => {
  const rows = db.prepare('SELECT * FROM feature_feedback ORDER BY created_at DESC').all();
  res.json(rows);
});
app.post('/api/review/feature-feedback', (req, res) => {
  const { feature_key, feature_label, comment, author, role } = req.body ?? {};
  if (!trim(feature_key) || !trim(feature_label) || !trim(comment)) {
    return res.status(400).json({ error: 'feature_key, feature_label, and comment are required' });
  }
  const stmt = db.prepare(
    'INSERT INTO feature_feedback (feature_key, feature_label, comment, author, role) VALUES (?, ?, ?, ?, ?)'
  );
  const info = stmt.run(trim(feature_key), trim(feature_label), trim(comment), optional(author), optional(role));
  res.status(201).json(db.prepare('SELECT * FROM feature_feedback WHERE id = ?').get(info.lastInsertRowid));
});

app.get('/api/review/requests', (_req, res) => {
  const rows = db.prepare('SELECT * FROM requests ORDER BY created_at DESC').all();
  res.json(rows);
});
app.post('/api/review/requests', (req, res) => {
  const { feature, description, author } = req.body ?? {};
  if (!trim(feature) || !trim(description)) {
    return res.status(400).json({ error: 'feature and description are required' });
  }
  const stmt = db.prepare('INSERT INTO requests (feature, description, author) VALUES (?, ?, ?)');
  const info = stmt.run(trim(feature), trim(description), optional(author));
  res.status(201).json(db.prepare('SELECT * FROM requests WHERE id = ?').get(info.lastInsertRowid));
});
app.put('/api/review/requests/:id', (req, res) => {
  const id = Number(req.params.id);
  const { feature, description, author } = req.body ?? {};
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid id' });
  if (!trim(feature) || !trim(description)) {
    return res.status(400).json({ error: 'feature and description are required' });
  }
  const existing = db.prepare('SELECT id FROM requests WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  db.prepare(
    "UPDATE requests SET feature = ?, description = ?, author = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(trim(feature), trim(description), optional(author), id);
  res.json(db.prepare('SELECT * FROM requests WHERE id = ?').get(id));
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ── Static SPA ───────────────────────────────────────────────────────────────
const distDir = path.join(__dirname, 'dist');
app.use(express.static(distDir));
app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')));

app.listen(PORT, () => {
  console.log(`alc-app server listening on :${PORT} (data: ${DATA_DIR})`);
});
