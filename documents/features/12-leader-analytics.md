# School Leader Analytics Dashboards

**Jira:** Epic [SCRUM-76](https://acornslearningcentre.atlassian.net/browse/SCRUM-76)

Base every leader-facing number and chart on real school data instead of fixed demo figures.

## Where things stand today

Every number and chart on the School Leader's Today, Cohorts, Outcomes, Patterns, and Teachers screens is fixed sample data written into the code. It doesn't reflect anything actually happening in the school.

## Acceptance criteria

This feature is done when all of the following are true:

- [ ] A school leader sees real, current numbers for how many children are in today, overall mastery trends, and flagged patterns — not fixed demo figures.
- [ ] If a teacher logs a new observation or a child's progress changes, the leader's dashboard reflects that change (after a normal refresh, no special action needed).
- [ ] The leader can see a breakdown by cohort (e.g. by year group or classroom) and by individual teacher.
- [ ] The numbers a leader sees line up with what teachers see on their own screens for the same children — no two screens disagreeing about the same child's mastery score.

## Related API

See [`documents/api/12-leader-analytics.md`](../api/12-leader-analytics.md) for the endpoints this feature needs.
