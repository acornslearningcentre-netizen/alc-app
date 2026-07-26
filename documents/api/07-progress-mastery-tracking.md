# Child & Class Progress Tracking — API

**Jira:** Epic [SCRUM-50](https://acornslearningcentre.atlassian.net/browse/SCRUM-50)

Base mastery, attendance, streak and trend on real recorded activity instead of fixed numbers.

## Endpoints

| Method | Endpoint | What it's for |
|---|---|---|
| `GET` | `/api/children/:id/progress` | Shows one child's progress over time. |
| `GET` | `/api/progress/class` | Shows aggregated progress across a teacher's whole class. |

## Acceptance criteria per endpoint

### `GET /api/children/:id/progress`

Shows one child's progress over time.

- [ ] Returns a real history of snapshots for that child, not a single unchanging number.
- [ ] The trend shown is calculated from that history, not typed in by hand.
### `GET /api/progress/class`

Shows aggregated progress across a teacher's whole class.

- [ ] The class-wide numbers are a genuine average/summary of the real children in that class, not a placeholder figure.

## Related feature

See [`documents/features/07-progress-mastery-tracking.md`](../features/07-progress-mastery-tracking.md) for what this looks like from a teacher/parent/student/leader's point of view.
