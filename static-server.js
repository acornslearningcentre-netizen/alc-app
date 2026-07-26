// Static file server for the frontend Railway service. Serves the built
// Vite SPA (dist/) with a client-side-routing fallback to index.html.
// The API lives on a separate Railway service now — see server.js and
// src/lib/api-base.ts (VITE_API_BASE_URL) for how the frontend finds it.
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const distDir = path.join(__dirname, 'dist');

const app = express();
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use(express.static(distDir));
app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')));

app.listen(PORT, () => {
  console.log(`alc-app static frontend listening on :${PORT}`);
});
