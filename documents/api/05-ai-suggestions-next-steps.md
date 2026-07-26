# AI Suggestions & Next Steps — API

**Jira:** [SCRUM-6](https://acornslearningcentre.atlassian.net/browse/SCRUM-6) · Epic [SCRUM-1](https://acornslearningcentre.atlassian.net/browse/SCRUM-1)

Turn the AI brief and suggestion counters into real, actionable, trackable recommendations.

## Endpoints

| Method | Endpoint | What it's for |
|---|---|---|
| `GET` | `/api/next-steps` | Lists suggested next steps, optionally filtered to a child or status. |
| `POST` | `/api/next-steps/:id/accept` | A teacher accepts a suggestion. |
| `POST` | `/api/next-steps/:id/dismiss` | A teacher dismisses a suggestion they don't want to use. |
| `POST` | `/api/ai/brief` | Generates fresh suggestions for a teacher based on real recent observations. |

## Acceptance criteria per endpoint

### `GET /api/next-steps`

Lists suggested next steps, optionally filtered to a child or status.

- [ ] Filtering to 'pending' shows exactly the suggestions still awaiting a teacher's decision — this is what powers the 'awaiting review' count.
### `POST /api/next-steps/:id/accept`

A teacher accepts a suggestion.

- [ ] The suggestion is marked accepted and immediately stops counting as 'awaiting review'.
- [ ] Accepting a suggestion that's already been accepted or dismissed is rejected with a clear message, not silently allowed twice.
### `POST /api/next-steps/:id/dismiss`

A teacher dismisses a suggestion they don't want to use.

- [ ] A dismissed suggestion is recorded as dismissed (not deleted) so there's a record it was offered and declined.
### `POST /api/ai/brief`

Generates fresh suggestions for a teacher based on real recent observations.

- [ ] The suggestions produced reference real children and real recent notes, not placeholder names.
- [ ] If there isn't enough recent observation data for a child, the brief says so rather than inventing a suggestion.

## Related feature

See [`documents/features/05-ai-suggestions-next-steps.md`](../features/05-ai-suggestions-next-steps.md) for what this looks like from a teacher/parent/student/leader's point of view.
