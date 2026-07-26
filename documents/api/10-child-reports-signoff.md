# Child Reports & Sign-off — API

**Jira:** Epic [SCRUM-63](https://acornslearningcentre.atlassian.net/browse/SCRUM-63)

Give enrolled children the same draft → sign-off → send workflow that onboarding assessments already have.

## Endpoints

| Method | Endpoint | What it's for |
|---|---|---|
| `GET` | `/api/children/:id/reports` | Lists a child's reports. |
| `POST` | `/api/children/:id/reports/:reportId/sign-off` | A staff member approves a draft report as final. |
| `POST` | `/api/children/:id/reports/:reportId/send` | Sends a signed-off report to the parent. |

## Acceptance criteria per endpoint

### `GET /api/children/:id/reports`

Lists a child's reports.

- [ ] A teacher/leader sees every report including drafts; a parent only ever sees reports that are signed off.
### `POST /api/children/:id/reports/:reportId/sign-off`

A staff member approves a draft report as final.

- [ ] A report can't be signed off if it has no content yet.
- [ ] Once signed off, who approved it and when is permanently recorded and can't be quietly changed.
- [ ] A report that's already signed off can't be signed off again.
### `POST /api/children/:id/reports/:reportId/send`

Sends a signed-off report to the parent.

- [ ] A report can only be sent after it has been signed off — attempting to send a draft is rejected.
- [ ] A report that's already been sent can't be sent again by accident.

## Related feature

See [`documents/features/10-child-reports-signoff.md`](../features/10-child-reports-signoff.md) for what this looks like from a teacher/parent/student/leader's point of view.
