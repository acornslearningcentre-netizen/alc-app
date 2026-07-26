# Real Login & Accounts — API

**Jira:** [SCRUM-2](https://acornslearningcentre.atlassian.net/browse/SCRUM-2) · Epic [SCRUM-1](https://acornslearningcentre.atlassian.net/browse/SCRUM-1)

Replace the fake, browser-only login with real accounts checked on the server.

## Endpoints

| Method | Endpoint | What it's for |
|---|---|---|
| `POST` | `/api/auth/login` | A teacher or school leader signs in with their email and password. |
| `POST` | `/api/auth/passcode` | A parent or student signs in with their family/child passcode. |
| `POST` | `/api/auth/logout` | Signs the current person out. |
| `GET` | `/api/auth/me` | Tells the app who is currently signed in, so the right dashboard loads. |

## Acceptance criteria per endpoint

### `POST /api/auth/login`

A teacher or school leader signs in with their email and password.

- [ ] If the email and password match a real staff account, the person is signed in and given something that keeps them signed in (a session).
- [ ] If the email or password is wrong, the person sees a plain 'that didn't match' message — the system never hints at which part was wrong.
- [ ] Typing the password incorrectly does not reveal whether the email address itself was valid.
### `POST /api/auth/passcode`

A parent or student signs in with their family/child passcode.

- [ ] A correct passcode signs the person in and opens the right child's profile — never someone else's.
- [ ] An incorrect passcode shows a friendly error and does not say which digit was wrong.
- [ ] Repeated wrong attempts don't lock a family out permanently, but the system notices unusually many failed tries in a row.
### `POST /api/auth/logout`

Signs the current person out.

- [ ] After logging out, that person can no longer see any private information without logging in again.
- [ ] Logging out on one device doesn't log the person out anywhere else they may be signed in.
### `GET /api/auth/me`

Tells the app who is currently signed in, so the right dashboard loads.

- [ ] If someone is signed in, this confirms their role (teacher, parent, student, or leader) and name.
- [ ] If no one is signed in, this clearly says so, and the app sends the person back to the login screen instead of showing any private data.

## Related feature

See [`documents/features/01-login-accounts.md`](../features/01-login-accounts.md) for what this looks like from a teacher/parent/student/leader's point of view.
