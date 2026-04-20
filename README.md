# Acorns App

A 4-role desktop education platform prototype for Acorns Learning Centre.

## Tech Stack

- Vite 5 + React 18 + TypeScript (strict)
- Zustand (global state + localStorage persistence)
- Plain CSS with custom properties (no Tailwind, no CSS-in-JS)
- Google Fonts: Nunito + JetBrains Mono

## Getting Started

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173)

## Passcodes

| Role   | Passcode | Unlocks                                     |
|--------|----------|---------------------------------------------|
| Parent | A023     | Priya Shah (guardian: Ravi Shah)            |
| Parent | B024     | Oscar Lindqvist (guardian: Freja Lindqvist) |

## Roles

| Role    | Login path       | Identity                    |
|---------|------------------|-----------------------------|
| Teacher | SSO / email link | Ms. Pereira, Acorns Primary |
| Parent  | 4-char passcode  | Family view for one child   |
| Student | Class code + PIN | Child learning space        |
| Leader  | SSO + 2FA        | Dr. Okafor, Head Teacher    |

Student demo: class code `ACO24`, pick any avatar, select 3 picture squares as PIN.

## Role + Variant Switching (Designer QA)

A tweaks panel is fixed at the bottom-right of every screen. Use it to:

- Switch between Teacher / Parent / Student / Leader without logging out
- Toggle Calm vs Playful visual variant

State persists in localStorage: `alc.authed`, `alc.role`, `alc.variant`, `alc.parentChildId`.

## Build

```bash
npm run build
```

Output in `dist/`. Bundle: ~300 KB JS, ~9 KB CSS (gzip: ~80 KB / ~3 KB).
