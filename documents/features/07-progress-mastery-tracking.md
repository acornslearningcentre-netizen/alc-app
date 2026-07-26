# Child & Class Progress Tracking

**Jira:** [SCRUM-8](https://acornslearningcentre.atlassian.net/browse/SCRUM-8) · Epic [SCRUM-1](https://acornslearningcentre.atlassian.net/browse/SCRUM-1)

Base mastery, attendance, streak and trend on real recorded activity instead of fixed numbers.

## Where things stand today

Every number shown for a child's progress — mastery percentage, attendance, streak, trend arrow — is a fixed value written into the sample data. It never changes no matter what happens in the app.

## Acceptance criteria

This feature is done when all of the following are true:

- [ ] A child's mastery, attendance, and streak numbers reflect their real recorded activity, not a fixed demo value.
- [ ] The trend arrow (up/down/flat) is calculated by comparing recent progress to previous progress, not hand-set.
- [ ] A teacher can see how a child's or the whole class's progress has changed over time (e.g. this month vs last month), not just a single snapshot.
- [ ] These same real numbers are what feed the school leader's outcomes and cohort screens, so leadership and teachers are always looking at the same picture.

## Related API

See [`documents/api/07-progress-mastery-tracking.md`](../api/07-progress-mastery-tracking.md) for the endpoints this feature needs.
