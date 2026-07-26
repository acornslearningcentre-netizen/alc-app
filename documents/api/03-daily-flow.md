# Today's Daily Flow / Schedule — API

**Jira:** Epic [SCRUM-30](https://acornslearningcentre.atlassian.net/browse/SCRUM-30)

Make the classroom's daily timeline real and editable instead of a fixed sample.

## Endpoints

| Method | Endpoint | What it's for |
|---|---|---|
| `GET` | `/api/flow` | Fetches a teacher's schedule for a given date. |
| `POST` | `/api/flow` | Adds a new step to a day's schedule. |
| `PATCH` | `/api/flow/:id` | Updates a step — most commonly marking it done or 'now'. |

## Acceptance criteria per endpoint

### `GET /api/flow`

Fetches a teacher's schedule for a given date.

- [ ] Returns only that teacher's steps for that specific day, in time order.
- [ ] A day with nothing planned yet returns an empty list, not an error.
### `POST /api/flow`

Adds a new step to a day's schedule.

- [ ] A step needs at least a time and a label before it can be saved.
- [ ] The new step appears in the right time-ordered position immediately.
### `PATCH /api/flow/:id`

Updates a step — most commonly marking it done or 'now'.

- [ ] Marking a step done or 'now' is saved immediately and is still correct after refreshing the page.
- [ ] Trying to update a step that belongs to a different teacher or a different day is rejected.

## Related feature

See [`documents/features/03-daily-flow.md`](../features/03-daily-flow.md) for what this looks like from a teacher/parent/student/leader's point of view.
