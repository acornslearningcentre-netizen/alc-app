# Acorns Learning Centre — alc-app

A multi-role web app for a Montessori-style tuition centre. Four personas — **Teacher / Parent / Student / School Leader** — each with their own dashboard.

## Mission, in one line

> Empower educators to access the benefits of AI-driven personalisation in group educational settings — bringing observation-led Montessori teaching to a wider system.

The app is **not** an AI that teaches. It wraps existing learning tools (IXL, Century, Discovery Education) with observation capture, AI-drafted reports, and personalised plans.

## Active milestone

**Onboarding journey for client demo on 2026-05-10** (compressed one-week sprint).
- Plan: [documents/planning/PLAN-onboarding-journey.md](documents/planning/PLAN-onboarding-journey.md)
- Latest interview: [documents/meetings/2026-05-03-meeting-summary.md](documents/meetings/2026-05-03-meeting-summary.md)
- Real intake form questions: [documents/planning/onboarding-form-schema.md](documents/planning/onboarding-form-schema.md)
- Design brief: [documents/planning/onboarding-design-prompt.md](documents/planning/onboarding-design-prompt.md)
- Requirements: [documents/features/15-onboarding.md](documents/features/15-onboarding.md) / [documents/api/15-onboarding.md](documents/api/15-onboarding.md)
- JIRA project: [`SCRUM` on acornslearningcentre.atlassian.net](https://acornslearningcentre.atlassian.net/jira/software/projects/SCRUM/boards/34/backlog).

When working on onboarding, **start from the schema doc** above — it captures the exact question set Aishat uses today.

The public intake form itself (Epic A) is done and correct. What's still missing is entirely staff-facing screens — the owner queue, assessment booking, report sign-off/send, and in-visit observation capture only exist as backend API today, with zero frontend. Tracked as Jira Epic [SCRUM-89](https://acornslearningcentre.atlassian.net/browse/SCRUM-89), scoped in [documents/features/15-onboarding.md](documents/features/15-onboarding.md).

## Sprint sequence (16 sprints, one epic each)

Sprint 1 (Login & Accounts) shipped. The remaining 15 sprints were reordered on 2026-07-26 to front-load the onboarding journey — it's the client-demo priority, and three existing epics turned out to be part of the same user journey once audited, so they got pulled forward together rather than left in their original build-order slots:

1. Real Login & Accounts (SCRUM-16) — **done**
2. Onboarding Journey: Staff-Facing Screens (SCRUM-89) — no new DB/API needed, pure frontend against the already-working prospects/assessments/observations backend
3. AI-Drafted Assessment Reports (SCRUM-82) — completes the "sign off and send" story's draft step
4. Media Upload & Real Email Delivery (SCRUM-85) — completes the same story's actual send step
5. Classroom Roster (SCRUM-22) — real children/teachers tables, needed by...
6. User Creation & Account Provisioning (SCRUM-95) — depends on #2 and #5 both existing (needs a real "enrolled" trigger and real child/teacher records to link accounts to)
7. Today's Daily Flow (SCRUM-30)
8. Classroom Observations for Enrolled Children (SCRUM-35)
9. AI Suggestions & Next Steps (SCRUM-39)
10. Lesson Planning (SCRUM-45)
11. Child & Class Progress Tracking (SCRUM-50)
12. Teacher ⇄ Parent Messaging (SCRUM-54)
13. AI Assistant Chat (SCRUM-59)
14. Child Reports & Sign-off (SCRUM-63)
15. Student Self-Service Progress (SCRUM-68)
16. School Leader Analytics Dashboards (SCRUM-76)

Sprints 7 onward kept their original relative order — only #2–6 moved. If priorities shift again, re-run the same pattern: rename+redate the existing Jira sprints via `PUT /rest/agile/1.0/sprint/{id}` (must include `state`, or the call is rejected) rather than deleting and recreating them, since only genuinely new epics need a new sprint object.

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

Build-time only — read via `import.meta.env.VITE_*` at `vite build` time, so changing a flag means redeploying (`railway up --service alc-app-frontend -c`), not just restarting.

### `VITE_SHOW_V1`

- **Default:** unset (treated as `false`).
- **`true`** — variant pill renders, `/` and `/v2` paths toggle between v1 and v2 surfaces, `body.v2` follows the path.
- **`false`** — `body.v2` is forced on every page, the variant pill is hidden, every URL renders the v2 surface.

The flag itself lives in [`frontend/src/lib/feature-flags.ts`](frontend/src/lib/feature-flags.ts) — add new flags there alongside `showV1`. Type the env var in [`frontend/src/vite-env.d.ts`](frontend/src/vite-env.d.ts) so TypeScript doesn't infer `string | undefined` everywhere it's read.

Production / demo Railway service ships with `VITE_SHOW_V1=false` so the client only sees v2.

### `VITE_API_BASE_URL`

Build-time origin of the backend API: `https://alc-app-api.up.railway.app` (no trailing slash). Required now that frontend and backend are separate Railway services — API calls can't assume same-origin `/api/...` anymore. See [`frontend/src/lib/api-base.ts`](frontend/src/lib/api-base.ts) (`apiUrl()` helper) — always call the API through it, never `fetch('/api/...')` directly.

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

documents/
├── api/                                        per-feature API requirement docs (endpoints + acceptance criteria) — see "Requirement doc standard" below
├── features/                                   per-feature UX requirement docs (plain-language acceptance criteria)
├── planning/                                   raw source docs (plans, schemas, design briefs) — not the standardized format
└── meetings/                                   meeting notes
```

## Requirement doc standard

Every feature in this app (existing or planned) gets exactly two files, numbered and named identically across both folders — `documents/features/NN-slug.md` and `documents/api/NN-slug.md`. Both link to each other and to the feature's Jira Epic. Update [`documents/features/README.md`](documents/features/README.md) and [`documents/api/README.md`](documents/api/README.md) (the index tables) whenever a feature is added — they're the source of truth for numbering, don't let them drift from what's actually in each folder.

**`documents/features/NN-slug.md`** (the user-facing view):
- `# Title`, then `**Jira:** Epic [KEY](url)`, then a one-line summary.
- `## Where things stand today` — plain description of the current gap, written for a non-technical reader (what's mocked/missing/broken, not how to fix it).
- `## Acceptance criteria` — a markdown checklist (`- [ ]`), each item a complete, layman-readable sentence describing observable behaviour ("A parent can see...", never "the API returns..."). No jargon, no code, no endpoint names.
- `## Related API` — a link to the matching `documents/api/NN-slug.md`.

**`documents/api/NN-slug.md`** (the implementation view):
- Same header pattern, linking back to the features file.
- `## Endpoints` (or `## Existing endpoints...` if nothing new is needed) — a table of method/path/purpose.
- One `###` subsection per endpoint with its own plain-language acceptance-criteria checklist (success case, validation/error case, persistence guarantee) — still no jargon in the criteria themselves, even though the surrounding doc is technical.
- If the feature needs new database tables, include the actual `CREATE TABLE` SQL in a fenced code block, not just prose — this is also what should be pasted into the corresponding Jira ticket's "DB:" sub-task.

A feature whose backend already exists (like onboarding's staff screens, #15) still gets both files — the API doc just documents which *existing* endpoints each screen must wire up to, rather than proposing new ones.

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
| **alc-app-backend** (renamed from `alc-app` 2026-07-26) | `backend` | `npm ci` | `npm start` (`node server.js`) | `https://alc-app-api.up.railway.app` |
| **alc-app-frontend** | `frontend` | `npm run build` (Nixpacks runs `npm ci` first, automatically) | `npm start` (`node static-server.js`) | `https://alc-app-frontend-production.up.railway.app` |
| **Postgres** | — (managed plugin) | — | — | internal only (`DATABASE_URL`) |

- Both the service name and its domain now read as "backend"/"api" (renamed 2026-07-26 via the Railway GraphQL API — `serviceDomainUpdate`, not achievable through `railway domain` alone since that only generates a fresh domain when none exists). Two older URLs are dead: `alc-app-production.up.railway.app` (the original combined-service domain, replaced) and `alc-app.up.railway.app` (a stale orphaned domain from even earlier, never actually pointed at this service per the domain records — don't treat either as a real endpoint).
- **Changing the backend's domain requires updating `VITE_API_BASE_URL` on alc-app-frontend and redeploying it** — the URL is baked into the frontend bundle at build time, so the old URL keeps working from the frontend's point of view until that rebuild happens. Don't rename the backend domain without immediately following up with a frontend redeploy.
- **Don't put `npm ci` in a custom `buildCommand`** — Nixpacks already runs it as a separate install phase; doing it again causes an `EBUSY` file-lock error on `node_modules/.vite`. `buildCommand` should be build-only.
- Both app services **are connected to GitHub and auto-deploy on push to `main`** (confirmed 2026-06-28, still true after the 2026-07-26 service split — `railway status` shows a live `repo:` link and deploys firing on push per service). Don't assume a push alone is silent.
- `NPM_CONFIG_PRODUCTION=false` is set on **alc-app-frontend** alongside `NODE_ENV=production`. **Required** — without it, `npm ci` skips `devDependencies` (including `typescript`/`vite`) under `NODE_ENV=production` and the build fails with `tsc: not found`. Not needed on the backend (no devDependencies, no build step).
- `CORS_ORIGIN` on **alc-app-backend** must list the frontend's live domain(s), comma-separated — the frontend calls the API cross-origin now. Falls back to reflecting any origin (permissive) if unset, so don't leave it unset in production.
- `VITE_API_BASE_URL` on **alc-app-frontend** must point at the backend's URL — it's baked in at build time, so changing it means a rebuild, not just a restart.
- `DATABASE_URL` on **alc-app-backend** references the Postgres plugin (`${{Postgres.DATABASE_URL}}`) — set once via `railway variables`, don't hardcode a connection string.
- To force/re-trigger a deploy manually:
  ```bash
  railway link --project alc-app                    # interactive — answer prompts once, only needed the first time
  railway up --service alc-app-backend -c            # backend — streams build logs, exits when done
  railway up --service alc-app-frontend -c           # frontend
  ```
- Health checks: `/api/health` (backend, checks Postgres connectivity too), `/health` (frontend static server).
- DB: **Postgres** (Railway managed plugin), not SQLite — migrated 2026-07-26. `backend/server.js` runs its own schema migration (`CREATE TABLE IF NOT EXISTS ...`) on boot; no separate migration tool.

### "Deploy code" instruction

When the user says **"deploy code"**, do the following without asking for confirmation first:
1. Commit the current changes to `main` (with a normal descriptive commit message).
2. Push `main` to the GitHub remote.
3. Confirm the change actually deployed to Railway: check `railway status` for **both** `alc-app-backend` and `alc-app-frontend` (a frontend-only change won't show up on the backend's deployment, and vice versa), and if either doesn't show up or fails, run `railway up --service <name> -c` for that service and watch the build/deploy logs until it succeeds (or report the failure with the relevant log lines).

## Feature workflow: Jira → branch → CI → merge

CI runs both test suites via GitHub Actions on every push/PR to `main` — see [`.github/workflows/test.yml`](.github/workflows/test.yml) (`backend` job: `npm ci && npm test` in `backend/`; `frontend` job: `npm ci && npm test && npm run lint && npm run build` in `frontend/`). Neither service's Railway deploy trigger runs tests itself — passing CI is a separate signal, not something Railway blocks on.

**When the prompt names an epic, not a single ticket** (e.g. "implement SCRUM-89", "do the Onboarding epic"): pick up every story under that epic and work through them **one at a time, sequentially**, running the full steps 1–9 below for each. Give status updates while working (branch created, PR opened, etc. — same as ever), but **only give a wrap-up/completion summary once every story under the epic is merged, deployed, and confirmed working** — not one after each individual ticket. If a story turns out to be blocked (needs a dependency that isn't done yet), say so and either skip to the next unblocked story or stop and ask, rather than silently reporting partial completion as done.

When picking up a piece of work that starts from a Jira ticket (e.g. "pick up SCRUM-17", "work on the next story"):

1. **Create a new branch named exactly the ticket key** — e.g. `SCRUM-17`, nothing appended. Never implement ticket work directly on `main`.
2. **Transition the ticket to "In Progress" in Jira** (`POST /rest/api/3/issue/{key}/transitions`, transition id `21` — see *JIRA & secrets* for creds) as soon as the branch is created, before doing the implementation work.
3. Do the implementation work on that branch, committing normally — **include the ticket key in commit messages** (e.g. `SCRUM-17: add users/sessions schema`), not just the branch name. Push the branch (not `main`) as work progresses.
4. Open a PR from the branch into `main` once the work is ready, **with the ticket key in the PR title** — combined with the ticket-key branch name and commits, this is what makes the work show up in the ticket's Jira "Development" panel (assuming the GitHub-for-Jira app is connected, see below).
5. **Merge as soon as CI is green — no manual approval or "test complete" gate at all.** (Changed 2026-07-26, then changed again same day: there is no pre-merge testing step anymore, human or otherwise. CI passing is a basic build/test sanity check, not a review gate.) Because both app services auto-deploy on push to `main`, merging **is** the deploy trigger.
6. **All real testing happens on the deployed app, after merge.** Confirm both Railway services redeployed successfully, then actually exercise the feature live (curl the endpoint, click through the UI — whatever's appropriate). This replaces any pre-merge QA step.
7. **If live testing finds a problem, fix it forward** — new commit, same ticket, same auto-merge-on-green flow. Don't revert the merge; don't treat the ticket as blocked, just not yet Done.
8. **Transition the ticket to "Done" in Jira** (transition id `41`) once live testing confirms it actually works. Don't mark it Done before that confirmation, even if the merge itself succeeded.
9. **Delete the feature branch** — both locally and on `origin` — once its merge into `main` is confirmed deployed and working (step 6/7). Verify with `git merge-base --is-ancestor origin/<branch> origin/main` before deleting if there's any doubt.

### Jira Development panel — one-time setup needed from you

Ticket branches/commits/PRs only show up automatically in a Jira ticket's "Development" panel if the **GitHub for Jira** app is connected — this is a one-time Jira-admin action that has to happen in the browser (install from the Atlassian Marketplace on `acornslearningcentre.atlassian.net`, then authorize it against the `acornslearningcentre-netizen` GitHub org). It can't be done via the REST API or CLI, so it isn't something I can set up myself. Once it's connected, everything above (ticket-key branch names, commit messages, PR titles) will make the Development panel populate automatically — no other change needed on my side.

This is separate from the **"Deploy code"** instruction above, which is for direct, non-ticket-driven pushes straight to `main` (hotfixes, config tweaks) — that one skips the branch/PR/testing-gate ceremony entirely, by design, since the user is asking for something immediate.

## Working agreements

- **No new features without a problem.** This project is moving from "build everything" to "solve the most painful onboarding step first." Anything that doesn't move the demo forward goes in `documents/` as a future-feature note.
- **Aishat signs off everything.** Reports, lesson plans, AI suggestions — every artefact has a one-tap mobile sign-off step. Don't auto-publish.
- **The "hobbies" question (Q17 on the intake form) is the single highest-signal data point.** AI prompts that draft assessment reports should weight it heavily.
- **The first 4 weeks of a child's enrolment are continuous reassessment.** The baseline isn't a single moment — it's a window. Schemas and prompts must accommodate "I thought X but actually Y" updates.
- **GDPR matters.** Storing minor children's data needs a plain-language consent line on the intake form (Q22 + Q23). Don't ship to real prospects without it.
- **Whenever a ticket touches login/credentials, surface working test credentials when reporting completion.** The user needs to actually log in and try it — don't make them ask for it separately.
- **Completion summaries are short, punchy, bullet-pointed, plain language — never verbose.** What changed, what's next, what's needed from them, and **what they can actually go test/click on**. No headers-within-headers, no restating the whole ticket back.

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
