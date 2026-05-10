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
- JIRA project: [`ALC` on qualicion2.atlassian.net](https://qualicion2.atlassian.net/jira/software/projects/ALC/boards) — 8 epics, 36 stories.

When working on onboarding, **start from the schema doc** above — it captures the exact question set Aishat uses today.

## Stack

- **React 18** + **TypeScript** + **Vite 5**
- **Express 4** + **better-sqlite3** (`server.js`) for the backend / API / static serve
- **Zustand** for client state (role, variant, auth, active child)
- Plain CSS with custom tokens — **no Tailwind, no CSS-in-JS**
- **Node 20.x pinned** in `package.json` engines (Node 24 has no prebuilt `better-sqlite3` binary and Nixpacks doesn't ship Python)

## Two design variants live in the same build

- **v2 "Watercolor Glass" (default and shipping surface)** — frosted vellum cards on a warm watercolor wash, single Moss accent, soft pill chips, Nunito display. Scoped under `body.v2`.
- **v1** — original Montessori cream/sage/ochre/plum surface. Now legacy. Reachable only when the `VITE_SHOW_V1` flag is `true` (see *Feature flags* below).
- New feature work is **v2-only** — do not add v1 components for new screens. Touching existing v1 components for bug fixes is fine; everything else skips v1 entirely.

## Feature flags

Build-time only — read via `import.meta.env.VITE_*` at `vite build` time, so changing a flag means redeploying (`railway up --service alc-app -c`).

### `VITE_SHOW_V1`

- **Default:** unset (treated as `false`).
- **`true`** — variant pill renders, `/` and `/v2` paths toggle between v1 and v2 surfaces, `body.v2` follows the path.
- **`false`** — `body.v2` is forced on every page, the variant pill is hidden, every URL renders the v2 surface.

The flag itself lives in [`src/lib/feature-flags.ts`](src/lib/feature-flags.ts) — add new flags there alongside `showV1`. Type the env var in [`src/vite-env.d.ts`](src/vite-env.d.ts) so TypeScript doesn't infer `string | undefined` everywhere it's read.

Production / demo Railway service ships with `VITE_SHOW_V1=false` so the client only sees v2.

Files for v2:
- `src/styles/v2/tokens.css` — Watercolor Glass tokens
- `src/styles/v2/base.css` — surfaces, buttons, type system
- `src/styles/v2/login.css`, `teacher-today.css` — page-specific
- `src/styles/v2/v1-bridge.css` — retones every v1 class under `body.v2` so existing screens inherit the new look without per-component rewrites
- `src/screens/v2/{login,teacher,parent,student,leader}/*LayoutV2.tsx` — v2 shell wrappers
- `src/components/v2/VariantSwitch.{tsx,css}` — the floating pill
- `src/styles/v2/DESIGN.md` — the design brief itself

**When making visual changes, prefer extending `v1-bridge.css` over editing v1 components.** Anything in there is scoped to `body.v2` and won't affect v1.

## Commands

```bash
npm install
npm run dev          # Vite only on :5173 (no API — review feedback will 500)
npm run dev:server   # Express + SQLite API on :3000 — run in a 2nd terminal if you need /api/*
npm run build        # tsc -b && vite build → dist/
npm run start        # serve dist via server.js (used in production)
npm run lint
```

## Project structure

```text
src/
├── styles/
│   ├── tokens.css, base.css, variants.css   v1
│   └── v2/                                   v2 Watercolor Glass + bridge
├── data/                                     typed seed data
├── store/                                    Zustand store
├── components/
│   ├── ui/                                   shared primitives (Icon, BrandLogo, Sparkline, …)
│   ├── layout/                               ResponsiveAppShell
│   ├── review/                               Reviewer Guide (split-pane "Schoolbook" theme)
│   └── v2/                                   VariantSwitch
└── screens/
    ├── login/
    ├── teacher/                              v1 Today, Children, Observe, Profile, Planning, Progress, Assistant, Messages
    ├── parent/, student/, leader/            v1 layouts + inner views
    └── v2/                                   v2 layouts (Teacher Today is bespoke; the rest reuse v1 inner views inside a v2 shell)
documents/                                    meeting summaries, plans, schemas
```

## Reviewer guide

A standalone in-app page at hash `#review` — for non-technical reviewers leaving feedback per role / per screen / per clickable area.
- Two-pane "Schoolbook" theme: deep ink-green sidebar (notebook cover), warm parchment content (Baloo 2 display, terracotta active accent).
- "Try these clicks" tab is the **interactive** feedback collector (per clickable area).
- "What's in this prototype" tab is **read-only** (descriptive feature inventory).
- "Your ideas" tab is free-form requests.
- Backed by the Express API in `server.js` — only writes when the API is reachable.

## Deployment — Railway

- Service: **alc-app** at `https://alc-app.up.railway.app`
- Build: Nixpacks → `npm ci` → `npm run build`. Run: `npm run start` (Express serves `dist/` + the SPA fallback at `app.get('*', ...)`).
- **Auto-deploy is OFF** in this Railway project — pushing to `main` does **not** trigger a deploy. Force a deploy with:
  ```bash
  railway link --project alc-app    # interactive — answer prompts once
  railway up --service alc-app -c   # streams build logs, exits when done
  ```
- Health check: `/api/health`
- DB: SQLite at `$DATA_DIR/review.db` (Railway: mount a volume at `/data` and set `DATA_DIR=/data`).

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
- The Atlassian instance is `https://qualicion2.atlassian.net/`. Project key is `ALC`.
- Scripts that talk to JIRA live under `/tmp/alc-*.py` during a session — promote them to `scripts/` if they become permanent.
