# AI-Drafted Assessment Reports for New Families

**Jira:** [SCRUM-14](https://acornslearningcentre.atlassian.net/browse/SCRUM-14) · Epic [SCRUM-1](https://acornslearningcentre.atlassian.net/browse/SCRUM-1)

Auto-generate a first-draft report from a family's intake answers and assessment observations.

## Where things stand today

When a prospective family completes their assessment, there's already a place to store a report and a sign-off step, but nothing currently writes the first draft of that report — a staff member would have to write it from scratch.

## Acceptance criteria

This feature is done when all of the following are true:

- [ ] A staff member can click a button to generate a first draft of a child's assessment report, based on the answers the family gave on the intake form and any observations captured during the visit.
- [ ] The generated draft specifically takes into account what the family said about the child's hobbies and interests, since that's flagged as the most important question on the form.
- [ ] The generated draft is clearly labelled as a draft and still requires a staff sign-off before it can be sent, in line with the existing 'someone always signs off' rule.
- [ ] A staff member can edit the AI-generated text before signing it off — nothing is sent automatically.

## Related API

See [`documents/api/13-ai-drafted-assessment-reports.md`](../api/13-ai-drafted-assessment-reports.md) for the endpoints this feature needs.
