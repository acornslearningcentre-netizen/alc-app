# Acorns Learning Centre — alc-app

A multi-role web app for a Montessori-style tuition centre. Four personas — **Teacher / Parent / Student / School Leader** — each with their own dashboard.

## Mission, in one line

> Empower educators to access the benefits of AI-driven personalisation in group educational settings — bringing observation-led Montessori teaching to a wider system.

The app is **not** an AI that teaches. It wraps existing learning tools (IXL, Century, Discovery Education) with observation capture, AI-drafted reports, and personalised plans.

## Active milestone

**Onboarding journey for client demo on 2026-05-10** (compressed one-week sprint).
- Plan: [documents/PLAN-onboarding-journey.md](documents/PLAN-onboarding-journey.md)
- Latest interview: [documents/2026-05-03-meeting-summary.md](documents/2026-05-03-meeting-summary.md)
- Real intake form questions: [documents/onboarding-form-schema.md](documents/onboarding-form-schema.md)
- JIRA project: [`SCRUM` on acornslearningcentre.atlassian.net](https://acornslearningcentre.atlassian.net/jira/software/projects/SCRUM/boards/34/backlog).

When working on onboarding, **start from the schema doc** above — it captures the exact question set Aishat uses today.

## Stack

- **React 18** + **TypeScript** + **Vite 5** (`frontend/`)
- **Express 4** + **Postgres** (`backend/server.js`) for the API — separate deployable service from the frontend
- **Zustand** for client state (role, variant, auth, active child)
- Plain CSS with custom tokens — **no Tailwind, no CSS-in-JS**
- **Node 20.x pinned** in both `frontend/package.json` and `backend/package.json` engines

## Two services, two folders

The app is **two independent projects in one repo**, each with its own `package.json`, `node_modules`, and Railway service — there is no shared root `package.json` anymore.

- **`backend/`** — API only. `server.js` talks to Postgres (`DATABASE_URL`) and exposes `/api/*`. No static file serving, no knowledge of the frontend build. CORS-gated via `CORS_ORIGIN` since the frontend calls it cross-origin.
- **`frontend/`** — the Vite/React app plus `static-server.js`, a minimal Express static file server (serves `dist/` + SPA fallback) used only in production. The frontend never assumes same-origin API calls — see `VITE_API_BASE_URL` below.
- Root-level files (`CLAUDE.md`, `documents/`, `.env.local`) are repo-wide, not part of either service.

**When working on this app, `cd` into the right folder first** — `cd frontend` for UI work, `cd backend` for API/DB work. Commands below assume you've done that.

## Two design variants live in the same build

- **v2 "Watercolor Glass" (default and shipping surface)** — frosted vellum cards on a warm watercolor wash, single Moss accent, soft pill chips, Nunito display. Scoped under `body.v2`.
- **v1** — original Montessori cream/sage/ochre/plum surface. Now legacy. Reachable only when the `VITE_SHOW_V1` flag is `true` (see *Feature flags* below).
- New feature work is **v2-only** — do not add v1 components for new screens. Touching existing v1 components for bug fixes is fine; everything else skips v1 entirely.

## Feature flags

Build-time only — read via `import.meta.env.VITE_*` at `vite build` time, so changing a flag means redeploying (`railway up --service alc-app-frontend -c`).

### `VITE_SHOW_V1`

- **Default:** unset (treated as `false`).
- **`true`** — variant pill renders, `/` and `/v2` paths toggle between v1 and v2 surfaces, `body.v2` follows the path.
- **`false`** — `body.v2` is forced on every page, the variant pill is hidden, every URL renders the v2 surface.

The flag itself lives in [`frontend/src/lib/feature-flags.ts`](frontend/src/lib/feature-flags.ts) — add new flags there alongside `showV1`. Type the env var in [`frontend/src/vite-env.d.ts`](frontend/src/vite-env.d.ts) so TypeScript doesn't infer `string | undefined` everywhere it's read.

Production / demo Railway service ships with `VITE_SHOW_V1=false` so the client only sees v2.

### `VITE_API_BASE_URL`

Build-time origin of the backend API, e.g. `https://alc-app-production.up.railway.app` (no trailing slash). Required now that frontend and backend are separate Railway services — API calls can't assume same-origin `/api/...` anymore. See [`frontend/src/lib/api-base.ts`](frontend/src/lib/api-base.ts) (`apiUrl()` helper) — always call the API through it, never `fetch('/api/...')` directly.

Files for v2:
- `frontend/src/styles/v2/tokens.css` — Watercolor Glass tokens
- `frontend/src/styles/v2/base.css` — surfaces, buttons, type system
- `frontend/src/styles/v2/login.css`, `teacher-today.css` — page-specific
- `frontend/src/styles/v2/v1-bridge.css` — retones every v1 class under `body.v2` so existing screens inherit the new look without per-component rewrites
- `frontend/src/screens/v2/{login,teacher,parent,student,leader}/*LayoutV2.tsx` — v2 shell wrappers
- `frontend/src/components/v2/VariantSwitch.{tsx,css}` — the floating pill
- `frontend/src/styles/v2/DESIGN.md` — the design brief itself

**When making visual changes, prefer extending `v1-bridge.css` over editing v1 components.** Anything in there is scoped to `body.v2` and won't affect v1.

## Commands

```bash
# Frontend
cd frontend
npm install
npm run dev          # Vite dev server on :5173, proxies /api to :3000 (see vite.config.ts)
npm run build         # tsc -b && vite build → frontend/dist/
npm start             # serve dist/ via static-server.js (used in production)
npm run lint

# Backend
cd backend
npm install
npm run dev            # Express + Postgres API on :3000 (needs DATABASE_URL — see below)
npm start
```

To run both locally: two terminals, `cd backend && npm run dev` in one, `cd frontend && npm run dev` in the other. The Vite dev proxy forwards `/api/*` to `:3000` so you don't need `VITE_API_BASE_URL` locally.

## Project structure

```text
backend/
├── server.js                                 Express API — Postgres-backed, CORS-gated, no static serving
└── package.json                              express, cors, pg only — no build step

frontend/
├── static-server.js                          production static file server (dist/ + SPA fallback)
├── src/
│   ├── lib/
│   │   ├── api-base.ts                       VITE_API_BASE_URL → apiUrl() helper, use for every fetch
│   │   └── feature-flags.ts
│   ├── styles/
│   │   ├── tokens.css, base.css, variants.css   v1
│   │   └── v2/                                   v2 Watercolor Glass + bridge
│   ├── data/                                     typed seed data
│   ├── store/                                    Zustand store
│   ├── components/
│   │   ├── ui/                                   shared primitives (Icon, BrandLogo, Sparkline, …)
│   │   ├── layout/                               ResponsiveAppShell
│   │   ├── review/                               Reviewer Guide (split-pane "Schoolbook" theme)
│   │   └── v2/                                   VariantSwitch
│   └── screens/
│       ├── login/
│       ├── teacher/                              v1 Today, Children, Observe, Profile, Planning, Progress, Assistant, Messages
│       ├── parent/, student/, leader/            v1 layouts + inner views
│       └── v2/                                   v2 layouts (Teacher Today is bespoke; the rest reuse v1 inner views inside a v2 shell)
└── package.json                              react, vite, express (for static-server.js only)

documents/                                    meeting summaries, plans, schemas, feature/API requirement docs
```

## Reviewer guide

A standalone in-app page at hash `#review` — for non-technical reviewers leaving feedback per role / per screen / per clickable area.
- Two-pane "Schoolbook" theme: deep ink-green sidebar (notebook cover), warm parchment content (Baloo 2 display, terracotta active accent).
- "Try these clicks" tab is the **interactive** feedback collector (per clickable area).
- "What's in this prototype" tab is **read-only** (descriptive feature inventory).
- "Your ideas" tab is free-form requests.
- Backed by the Express API in `backend/server.js` — only writes when the API is reachable.

## Deployment — Railway

Three services in one Railway project (`alc-app`), all sharing the same repo/branch but scoped to different subfolders via each service's **Root Directory** setting:

| Service | Root Directory | Build | Start | URL |
|---|---|---|---|---|
| **alc-app** (backend/API) | `backend` | `npm ci` | `npm start` (`node server.js`) | `https://alc-app-production.up.railway.app` (also aliased at `https://alc-app.up.railway.app`) |
| **alc-app-frontend** | `frontend` | `npm run build` (Nixpacks runs `npm ci` first, automatically) | `npm start` (`node static-server.js`) | `https://alc-app-frontend-production.up.railway.app` |
| **Postgres** | — (managed plugin) | — | — | internal only (`DATABASE_URL`) |

- **Don't put `npm ci` in a custom `buildCommand`** — Nixpacks already runs it as a separate install phase; doing it again causes an `EBUSY` file-lock error on `node_modules/.vite`. `buildCommand` should be build-only.
- Both app services **are connected to GitHub and auto-deploy on push to `main`** (confirmed 2026-06-28, still true after the 2026-07-26 service split — `railway status` shows a live `repo:` link and deploys firing on push per service). Don't assume a push alone is silent.
- `NPM_CONFIG_PRODUCTION=false` is set on **alc-app-frontend** alongside `NODE_ENV=production`. **Required** — without it, `npm ci` skips `devDependencies` (including `typescript`/`vite`) under `NODE_ENV=production` and the build fails with `tsc: not found`. Not needed on the backend (no devDependencies, no build step).
- `CORS_ORIGIN` on **alc-app** must list the frontend's live domain(s), comma-separated — the frontend calls the API cross-origin now. Falls back to reflecting any origin (permissive) if unset, so don't leave it unset in production.
- `VITE_API_BASE_URL` on **alc-app-frontend** must point at the backend's URL — it's baked in at build time, so changing it means a rebuild, not just a restart.
- `DATABASE_URL` on **alc-app** references the Postgres plugin (`${{Postgres.DATABASE_URL}}`) — set once via `railway variables`, don't hardcode a connection string.
- To force/re-trigger a deploy manually:
  ```bash
  railway link --project alc-app          # interactive — answer prompts once, only needed the first time
  railway up --service alc-app -c          # backend — streams build logs, exits when done
  railway up --service alc-app-frontend -c # frontend
  ```
- Health checks: `/api/health` (backend, checks Postgres connectivity too), `/health` (frontend static server).
- DB: **Postgres** (Railway managed plugin), not SQLite — migrated 2026-07-26. `backend/server.js` runs its own schema migration (`CREATE TABLE IF NOT EXISTS ...`) on boot; no separate migration tool.

### "Deploy code" instruction

When the user says **"deploy code"**, do the following without asking for confirmation first:
1. Commit the current changes to `main` (with a normal descriptive commit message).
2. Push `main` to the GitHub remote.
3. Confirm the change actually deployed to Railway: check `railway status` for **both** `alc-app` and `alc-app-frontend` (a frontend-only change won't show up on the backend's deployment, and vice versa), and if either doesn't show up or fails, run `railway up --service <name> -c` for that service and watch the build/deploy logs until it succeeds (or report the failure with the relevant log lines).

## Working agreements

- **No new features without a problem.** This project is moving from "build everything" to "solve the most painful onboarding step first." Anything that doesn't move the demo forward goes in `documents/` as a future-feature note.
- **Aishat signs off everything.** Reports, lesson plans, AI suggestions — every artefact has a one-tap mobile sign-off step. Don't auto-publish.
- **The "hobbies" question (Q17 on the intake form) is the single highest-signal data point.** AI prompts that draft assessment reports should weight it heavily.
- **The first 4 weeks of a child's enrolment are continuous reassessment.** The baseline isn't a single moment — it's a window. Schemas and prompts must accommodate "I thought X but actually Y" updates.
- **GDPR matters.** Storing minor children's data needs a plain-language consent line on the intake form (Q22 + Q23). Don't ship to real prospects without it.

## Not in scope (yet)

- Full lesson-planning AI (Aishat already has this in ClickUp + ChatGPT — next milestone)
- Public API for IXL / Century / Discovery Education (depends on each vendor)
- AI bot phone calls to prospects
- Multi-tenant admin layer (architect for it; don't build it yet)
- Family-Hub-style parent-side companion app (separate codebase)

## JIRA & secrets

- `.env.local` holds `JIRA_*` creds. Already covered by `*.local` in `.gitignore`. Never commit.
- The Atlassian instance is `https://acornslearningcentre.atlassian.net/`. Project key is `SCRUM`.
- Scripts that talk to JIRA live under `/tmp/alc-*.py` during a session — promote them to `scripts/` if they become permanent.
