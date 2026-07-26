# Onboarding Journey: Staff-Facing Screens — API

**Jira:** Epic [SCRUM-89](https://acornslearningcentre.atlassian.net/browse/SCRUM-89)

Unlike every other feature in this backlog, **no new endpoints are needed here** — `backend/server.js` already has a full, deployed, Postgres-backed API for prospects, assessments, and observations. This doc maps each staff-facing screen to the existing endpoint(s) it must call, and the acceptance criteria are about the screen using them correctly, not about building anything new on the backend.

## Existing endpoints these screens must use

| Method | Endpoint | Used by |
|---|---|---|
| `GET` | `/api/prospects` | Owner queue: prospect list |
| `GET` | `/api/prospects/:id` | Owner queue: prospect detail |
| `PATCH` | `/api/prospects/:id` | Owner queue: prospect detail (status change) |
| `POST` | `/api/assessments` | Book an assessment |
| `PATCH` | `/api/assessments/:id` | Assessment report: draft, sign off, and send (editing the draft) |
| `POST` | `/api/assessments/:id/sign-off` | Assessment report: sign off |
| `POST` | `/api/assessments/:id/send` | Assessment report: send |
| `GET` | `/api/observations?prospect_id=` | Owner queue: prospect detail (history) |
| `POST` | `/api/observations` | Capture an observation during an assessment |

## Acceptance criteria per screen

### Owner queue: prospect list → `GET /api/prospects`
- [ ] The list a staff member sees is exactly what this endpoint returns — no separate mock data, no stale cache.
- [ ] Filtering by status in the UI passes `?status=` through to the same endpoint rather than filtering a full list client-side (so it stays correct as the list grows).

### Owner queue: prospect detail → `GET /api/prospects/:id`, `PATCH /api/prospects/:id`
- [ ] Opening a family's page shows the real `intake`, `assessments`, and `observations` sub-objects this endpoint already returns — nothing is re-fetched from three separate places.
- [ ] Changing a family's status calls `PATCH` with just the changed field — it doesn't require resending every field on the record.
- [ ] An invalid status change (not one of `prospect`/`booked`/`assessed`/`enrolled`/`declined`) is rejected by the existing API and the screen shows that rejection clearly, not a silent failure.

### Book an assessment → `POST /api/assessments`
- [ ] Booking calls this endpoint with a real `prospect_id`, `scheduled_for`, and (for now, free-text until the Classroom Roster epic ships a real teacher list) `teacher_id`.
- [ ] The existing side effect — the prospect's status automatically flipping to `booked` — is reflected in the UI immediately after booking, without a manual refresh.

### Assessment report: draft, sign off, send → `PATCH /api/assessments/:id`, `POST /api/assessments/:id/sign-off`, `POST /api/assessments/:id/send`
- [ ] Editing the draft text calls `PATCH` with the new `report_draft` value.
- [ ] The sign-off button is only enabled when there's a non-empty draft, matching the existing API's own validation (it rejects signing off an empty draft) — the UI shouldn't let a staff member hit an error that the API would already catch.
- [ ] The send button is only enabled after sign-off, matching the existing API's own validation (it rejects sending before sign-off).
- [ ] Both actions are one-tap from this screen, in line with the "someone always signs off" working agreement — there's no way to skip straight to sending.

### Capture an observation during an assessment → `POST /api/observations`, `GET /api/observations?prospect_id=`
- [ ] A captured observation is sent with the real `prospect_id` for the family whose assessment is in progress, plus whichever of `media_url`/`transcript`/`comment` applies — matching the existing endpoint's validation that at least one must be present.
- [ ] This screen is entirely separate from the existing classroom "Capture an observation" screen (which writes to local mock data for enrolled children) — no shared code path that could send a pre-enrolment observation to the wrong place or vice versa.
