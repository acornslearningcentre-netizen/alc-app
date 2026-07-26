# User Creation & Account Provisioning (All Personas) — API

**Jira:** Epic [SCRUM-95](https://acornslearningcentre.atlassian.net/browse/SCRUM-95)

Builds on the `users` table and hashing helpers from [SCRUM-16/17](01-login-accounts.md) — no new tables, just the missing write paths into that same table.

## Endpoints

| Method | Endpoint | What it's for |
|---|---|---|
| `POST` | `/api/users` | A leader creates a new teacher or leader account |
| `POST` | `/api/children/:id/provision-parent` | Auto-called when a child's status becomes `enrolled`; creates a parent login |
| `POST` | `/api/children/:id/provision-student` | Auto-called when a child's status becomes `enrolled`; creates the student's own login |
| `GET` | `/api/users/:id/passcode-holder` | Staff looks up which child/family a passcode belongs to (never returns the passcode itself — see note) |
| `POST` | `/api/users/:id/reissue-passcode` | Staff generates a brand new passcode, invalidating the old one |

**Security note:** passcode hashes are one-way (HMAC, per [SCRUM-16](01-login-accounts.md)) — there is no way to "look up" a lost passcode's original value, only to issue a new one. The "look up" story (SCRUM-99) is really a reissue flow with a confirmation step, not a retrieval flow. Make sure the UI copy for that story doesn't promise showing the old code back.

## Acceptance criteria per endpoint

### `POST /api/users` — create a staff account
- [ ] Requires the caller to be authenticated as a `leader` (via the existing session/`requireAuth` middleware) — a `teacher`-role caller gets rejected.
- [ ] Requires `name`, `email`, `password`, and `role` (`teacher` or `leader`); rejects any other role value.
- [ ] Rejects a duplicate email with a clear error, matching the existing unique constraint on `users.email`.
- [ ] Hashes the password with the same `hashPassword` helper already used for the demo seed — never stores it in plain text.
- [ ] Returns the created account's public fields only (no `password_hash`), same shape as the existing `publicUser()` helper.

### `POST /api/children/:id/provision-parent` — create a parent login on enrolment
- [ ] Only creates an account if one doesn't already exist for that parent on that child — calling it twice for the same family doesn't create duplicates.
- [ ] Generates a passcode with the same randomness/hashing approach as the existing demo passcodes (`hashPasscode` + `passcodePepper`).
- [ ] Returns the plaintext passcode exactly once, in this response only — it is never retrievable again after this call (see reissue flow instead).
- [ ] If a child has two parents/carers on file, this can be called once per parent to give each their own passcode.

### `POST /api/children/:id/provision-student` — create a student login on enrolment
- [ ] Same idempotency guarantee as the parent version — calling it again for an already-provisioned child doesn't create a duplicate account.
- [ ] Returns the plaintext passcode exactly once, same as above.

### `GET /api/users/:id/passcode-holder` — identify whose passcode this is
- [ ] Returns the child/family name and role this account belongs to, for staff to confirm they've found the right person — never returns the passcode value itself.

### `POST /api/users/:id/reissue-passcode` — replace a lost/compromised passcode
- [ ] Generates a new passcode and overwrites `passcode_hash` — the previous passcode stops authenticating immediately, in the same request.
- [ ] Returns the new plaintext passcode exactly once, same rule as provisioning.
- [ ] Requires staff (`teacher` or `leader`) authentication — a parent/student cannot reissue their own or anyone else's passcode through this endpoint.
