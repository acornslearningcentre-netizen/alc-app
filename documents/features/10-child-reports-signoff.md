# Child Reports & Sign-off

**Jira:** Epic [SCRUM-63](https://acornslearningcentre.atlassian.net/browse/SCRUM-63)

Give enrolled children the same draft → sign-off → send workflow that onboarding assessments already have.

## Where things stand today

The onboarding assessment flow already has a working sign-off step for a child's very first report before they join. But there's no equivalent for ongoing progress reports once a child is enrolled — there's no way to draft, review, sign off, or send a report from the child's profile screen.

## Acceptance criteria

This feature is done when all of the following are true:

- [ ] A teacher can generate a draft progress report for a child at any time, based on that child's real observations and progress.
- [ ] A report cannot be sent to a parent until a named staff member has explicitly signed it off — there is no way to auto-send an unreviewed report.
- [ ] Once a report is signed off, it's clearly marked as final and who approved it and when.
- [ ] A parent only ever sees reports that have been signed off, never a draft.

## Related API

See [`documents/api/10-child-reports-signoff.md`](../api/10-child-reports-signoff.md) for the endpoints this feature needs.
