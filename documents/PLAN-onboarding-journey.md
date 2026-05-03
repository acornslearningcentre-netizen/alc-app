# Plan — Onboarding Journey (Demo for Client)

**Goal:** A working, end-to-end onboarding flow that the client can play with, follow a real prospect through, and give concrete feedback on.
**Demo deadline:** 2026-05-16 (before Babatunde leaves for Hajj)
**Branch:** `redesign/v2-taste` (continue) — or a fresh branch off `main` if we want a clean separation
**Style scope:** v2 "Watercolor Glass" only — no v1 work in this milestone

This document is structured so each Epic / Story below maps cleanly to a JIRA ticket. Estimates are rough, in **engineering-days** for one builder + AI tooling.

---

## Epic A — Public intake form (parent-facing)

The first thing a new family sees. Typeform-style, one question per screen, calm.

| Story | Description | Est. |
|-------|-------------|------|
| **A1** Form schema | Define questions in a typed schema (`src/data/intake-questions.ts`) — id, type (text / single-select / multi-select / longtext), label, helper, required, options. Mirror the live Google Form. | 0.5d |
| **A2** Single-question screen | One Q per screen, big Nunito heading, soft progress bar at top. Keyboard-first navigation, validates on next. | 1d |
| **A3** Final review screen | Shows the parent everything they've answered, lets them edit any answer before submit. | 0.5d |
| **A4** Submit + thank-you | POSTs to `/api/intake`, shows a calm "We've got you — what happens next" screen with the booking CTA. | 0.5d |
| **A5** Form persistence | Saves answers to `localStorage` per session so a refresh doesn't lose progress. | 0.25d |

**Acceptance:** A parent can land at `/welcome`, complete every question without confusion, edit any answer, submit, and land on a confirmation screen. Data is captured in the DB with status `prospect`.

---

## Epic B — Backend: prospects + observations data layer

The foundation that everything else hangs off. We already have an Express + better-sqlite3 server (`server.js`) — extend it.

| Story | Description | Est. |
|-------|-------------|------|
| **B1** `prospects` table | id, parent_email, parent_name, parent_phone, child_first_name, child_age, status (`prospect / booked / assessed / enrolled / declined`), created_at, updated_at. | 0.25d |
| **B2** `intake_responses` table | One row per prospect, JSON column `answers` plus indexed columns for the high-signal fields (focus, learning style hints). | 0.25d |
| **B3** `assessments` table | id, prospect_id, scheduled_for, teacher_id, status (`scheduled / in_progress / done`), report_draft, report_signed_off_at, sent_to_parent_at. | 0.25d |
| **B4** `observations` table | id, prospect_id (nullable, for general teacher observations later), child_id (nullable), teacher_id, kind (`image / video / voice / text`), media_url, transcript, comment, captured_at. | 0.5d |
| **B5** API endpoints | `POST /api/intake`, `GET/PATCH /api/prospects/:id`, `POST /api/assessments`, `POST /api/observations`, `POST /api/assessments/:id/sign-off`, `POST /api/assessments/:id/send`. | 1d |
| **B6** Media storage | For v1 — write uploaded images/audio to a local `data/media/` directory served as static. Note in code where to swap for S3/Cloudflare R2 later. | 0.5d |

**Acceptance:** A prospect's full journey can be persisted and queried via API.

---

## Epic C — Booking the assessment

Slim integration so the parent can pick a slot after submitting the intake form.

| Story | Description | Est. |
|-------|-------------|------|
| **C1** Owner-managed availability | Simple admin page where Aishat sets recurring availability windows (`Mon 09:00–11:00`, `Wed 14:00–16:00`). | 0.5d |
| **C2** Slot selector | Parent sees a calm calendar of available 2-hour slots, picks one. | 0.5d |
| **C3** Confirmation + reminder | Email confirmation to parent (Resend or similar), email summary to Aishat with prospect link. | 0.5d |
| **C4** Calendly fallback (optional) | If C1–C3 won't fit the demo, embed Calendly inline and write the slot back via Calendly webhook. | 0.5d |

**Acceptance:** A parent can book a slot, both parties get an email, the booking shows up in the prospect's record.

---

## Epic D — Owner review queue (mobile-friendly)

Aishat's primary surface for the demo. She lands here, sees prospects waiting, drills in.

| Story | Description | Est. |
|-------|-------------|------|
| **D1** Prospects list | Status-filtered list (Awaiting follow-up / Assessment scheduled / Report to sign off / Sent). Card per prospect with key facts and one-tap CTA. | 0.5d |
| **D2** Prospect detail | All form answers, scheduled session, observations attached, report draft. | 0.5d |
| **D3** Mobile-friendly layout | The whole queue must feel good on a phone (the demo with the client may be mobile-first since Aishat lives in ClickUp on her phone). | 0.5d |

**Acceptance:** From an iPhone, Aishat can see her queue, open a prospect, review the report, and tap one button to sign off and send.

---

## Epic E — Observation capture (teacher, in-the-moment)

Even though this is the *teacher's* surface, it has to land in this milestone because the assessment session produces the observations the report is built from.

| Story | Description | Est. |
|-------|-------------|------|
| **E1** Capture launcher | Big Moss-coloured "Capture observation" button on the teacher's prospect page. | 0.25d |
| **E2** Photo capture | Use `<input type="file" accept="image/*" capture="environment">` — opens the device camera on mobile, falls back to file picker on desktop. | 0.5d |
| **E3** Voice → text | MediaRecorder for audio capture, ship the blob to `/api/transcribe` which calls an LLM transcription endpoint, attach transcript to the observation. | 1d |
| **E4** Quick text note | Plain textarea for fast typed notes. | 0.25d |
| **E5** Tag + child | The capture form must let the teacher tag which prospect/child the observation belongs to (preselected when launched from a prospect page). | 0.25d |

**Acceptance:** A teacher running an assessment can fire off photos, voice notes, and text in under 5 seconds each. All observations land on the prospect's record.

---

## Epic F — AI-drafted assessment report

The heart of the demo. Without this it's just a CRM.

| Story | Description | Est. |
|-------|-------------|------|
| **F1** Report template | Mirror the existing report Aishat sends today (the one she demoed). Sections: introduction, what we observed, strengths, areas to develop, recommended next steps. | 0.5d |
| **F2** Draft generator | `POST /api/assessments/:id/draft` — bundles the intake responses + observations + transcripts and prompts Claude to fill the template. Use the Claude API with prompt caching for cost. | 1d |
| **F3** Inline editor | Rich-text editor on the prospect detail page so Aishat can tweak the draft. | 1d |
| **F4** Export to PDF | Server-side render report → PDF. Sent as attachment. | 0.5d |
| **F5** Sign-off + send | One button → marks `report_signed_off_at`, emails the parent the PDF, sets status to `assessed`. | 0.25d |

**Acceptance:** Given a prospect with a filled intake + 5 observations, Aishat can hit "Draft report", get a usable first draft, edit lightly, sign off, and the parent gets a PDF in their inbox.

---

## Epic G — Convert to student

The bridge from prospect → ALC student. Seeds the existing `data/seed.ts` shape.

| Story | Description | Est. |
|-------|-------------|------|
| **G1** Convert action | "Enrol this child" button on a signed-off prospect. | 0.25d |
| **G2** Profile seeding | Maps intake answers + assessment findings to the existing child profile shape (mastery %, focus areas, strengths, gaps, learning style, tone). | 0.5d |
| **G3** Welcome to ALC screen | Calm landing page the parent gets after enrolment, explaining what happens next (login credentials, first session). | 0.25d |

**Acceptance:** A signed-off prospect can be converted to a student with a single click; the new child shows up in the existing teacher dashboard.

---

## Epic H — Demo polish

Nothing here is a "feature" — it's the difference between a demo that lands and one that doesn't.

| Story | Description | Est. |
|-------|-------------|------|
| **H1** Seed demo data | A scripted "Demo Family" prospect that walks the client through the whole flow with realistic content. | 0.5d |
| **H2** Reset button | Hidden in admin — wipe and re-seed demo data so the client can run the journey twice cleanly. | 0.25d |
| **H3** Auth | Magic-link login for Aishat (bcrypt + token in URL, no password), so the demo isn't blocked by SSO setup. | 0.5d |
| **H4** GDPR notice | Plain-language data-handling notice on the intake form. Required for any real prospect data. | 0.25d |
| **H5** Deploy + smoke test | Get it live on Railway + walk the journey end-to-end on a phone before the demo. | 0.5d |

---

## Sequencing & critical path

```
Week 1 (May 4–10)
  Mon–Tue:  B1–B5 (data layer + APIs)            [day 1–2]
  Wed:      A1–A5 (intake form)                  [day 3]
  Thu:      C1–C3 (booking)                      [day 4]
  Fri:      D1–D3 (owner queue)                  [day 5]

Week 2 (May 11–16)
  Mon:      E1–E5 (observation capture)          [day 6]
  Tue–Wed:  F1–F5 (AI-drafted report)            [day 7–8]
  Thu:      G1–G3 (convert to student)           [day 9]
  Fri:      H1–H5 (demo polish + deploy)         [day 10]

Demo with client:    May 16 (Fri evening) or May 17 (Sat) before Hajj
```

Total: **~10 engineering-days** of focused work. Tight but doable with v2 design system already built. Risk if any epic overruns: **deprioritise C (booking)** in favour of a manual Calendly link, and **deprioritise H1–H4** in favour of just-walking-through-it live.

---

## Definition of "demo-ready"

The demo can be considered ready when, on a single Saturday morning, Aishat can:

1. Hand a parent a phone, watch them complete the intake form
2. Get a notification on her own phone within seconds
3. Open the prospect, review the answers, jump on a 5-min discovery call (out of scope of the app)
4. Run the 2-hour assessment with one of her teachers using the in-app capture
5. Hit "Draft report" and see something better than what ChatGPT gives her today
6. Tweak two sentences, hit sign-off, and the parent has the PDF in their inbox
7. Tap "Enrol" and see the child appear in the existing teacher dashboard

If she can do all 7 steps without the demo cracking, we ship it to the client.

---

## JIRA conversion notes

- **Epic A–H** above map 1:1 to JIRA epics.
- Each **A1, B1, …** is a story. Use the `Description` column verbatim as the description, the `Est.` as story points (1 day ≈ 3 SP at our cadence).
- **Acceptance criteria** at the bottom of each epic should be split into Gherkin-style scenarios when filing the stories.
- **Critical path** can be modelled as a JIRA roadmap with dependencies B → A → C → D → E → F → G → H.
- **Demo-ready definition** above is the test plan for the milestone.
