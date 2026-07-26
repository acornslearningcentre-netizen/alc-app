# Classroom Observations for Enrolled Children — API

**Jira:** Epic [SCRUM-35](https://acornslearningcentre.atlassian.net/browse/SCRUM-35)

Let day-to-day classroom observations (not just pre-enrolment ones) save for real, with tags and mood.

## Endpoints

| Method | Endpoint | What it's for |
|---|---|---|
| `GET` | `/api/observations` | Lists observations, optionally filtered to one child. |
| `POST` | `/api/observations` | Saves a new observation for an enrolled child. |

## Acceptance criteria per endpoint

### `GET /api/observations`

Lists observations, optionally filtered to one child.

- [ ] Filtering by a specific child returns only that child's observations, most recent first.
- [ ] Tags and mood come back along with the rest of each observation's details.
### `POST /api/observations`

Saves a new observation for an enrolled child.

- [ ] An observation needs at least one of a photo/media, a written note, or a transcript — an empty observation is rejected.
- [ ] Tags and mood are optional but, when provided, are saved and retrievable later exactly as entered.
- [ ] The observation is linked to a real child on the roster, not a made-up ID.

## Related feature

See [`documents/features/04-classroom-observations.md`](../features/04-classroom-observations.md) for what this looks like from a teacher/parent/student/leader's point of view.
