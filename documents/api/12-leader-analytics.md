# School Leader Analytics Dashboards — API

**Jira:** Epic [SCRUM-76](https://acornslearningcentre.atlassian.net/browse/SCRUM-76)

Base every leader-facing number and chart on real school data instead of fixed demo figures.

## Endpoints

| Method | Endpoint | What it's for |
|---|---|---|
| `GET` | `/api/leader/overview` | Today's school-wide snapshot. |
| `GET` | `/api/leader/cohorts` | Progress broken down by cohort (e.g. year group). |
| `GET` | `/api/leader/outcomes` | School-wide outcome trends over time. |
| `GET` | `/api/leader/patterns` | Flags patterns needing attention (e.g. a child or cohort trending down). |

## Acceptance criteria per endpoint

### `GET /api/leader/overview`

Today's school-wide snapshot.

- [ ] Reflects real attendance and activity for today, not a fixed sample number.
### `GET /api/leader/cohorts`

Progress broken down by cohort (e.g. year group).

- [ ] Each cohort's numbers are a genuine summary of the real children in that cohort.
### `GET /api/leader/outcomes`

School-wide outcome trends over time.

- [ ] Trends are calculated from real historical progress data, not hand-set.
### `GET /api/leader/patterns`

Flags patterns needing attention (e.g. a child or cohort trending down).

- [ ] A pattern is only flagged when the underlying real data genuinely supports it — not a fixed example flag.

## Related feature

See [`documents/features/12-leader-analytics.md`](../features/12-leader-analytics.md) for what this looks like from a teacher/parent/student/leader's point of view.
