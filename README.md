# Acorns Learning Centre — alc-app

Production React + TypeScript implementation of the Acorns Learning Centre prototype. A 4-role education platform (Teacher, Parent, Student, School Leader) with a calm, Montessori-inspired design system.

## Tech stack

- **React 18** + **TypeScript** + **Vite 5**
- **Zustand** for app state (role, variant, auth, active child)
- **clsx** for class composition
- Plain CSS with design tokens (`src/styles/tokens.css`) — no Tailwind, no CSS-in-JS

## Local development

```bash
npm install
npm run dev        # http://localhost:5173
```

### Demo sign-in

| Track | How | Passcode |
| --- | --- | --- |
| School (Teacher / Leader) | SSO buttons (mocked) | — |
| Family → Parent | Passcode entry | `0000` → Priya Shah's family |
| Family → Student | Passcode entry | `0000` → Amara Osei · `1111` → Mei Tanaka |

## Build & preview

```bash
npm run build      # tsc -b && vite build → dist/
npm run start      # serve dist on $PORT (default 3000)
```

## Project structure

```
src/
├── styles/            Design tokens, base utilities, variant overrides
├── data/              Typed seed data (children, observations, passcodes)
├── store/             Zustand store + localStorage persistence
├── components/
│   ├── ui/            Reusable primitives (Icon, BrandLogo, SignOutButton, Sparkline, …)
│   └── layout/        ResponsiveAppShell (sidebar + mobile drawer)
└── screens/
    ├── login/         Track → role → passcode / SSO
    ├── teacher/       Today · Children · Observe · Profile · Planning · Progress · Assistant · Messages
    ├── parent/        Home · Messages · Assistant
    ├── student/       Me · How I learn · Growing · Try today · My garden
    └── leader/        Today · Cohorts · Teachers · Patterns · Outcomes
```

## Deployment (Railway)

`railway.json` at the project root configures the Nixpacks build. After connecting the repo to Railway:

```bash
railway up         # or push to the linked GitHub branch for auto-deploy
```

Railway runs `npm ci && npm run build` during build, then `npm run start` (which serves `dist/` via `serve -s` so SPA routes fall back to `index.html`).

## Design reference

The original Claude Design handoff bundle is preserved at `design-reference/` (read-only — the source of truth for visual parity).
