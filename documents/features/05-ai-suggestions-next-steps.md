# AI Suggestions & Next Steps

**Jira:** [SCRUM-6](https://acornslearningcentre.atlassian.net/browse/SCRUM-6) · Epic [SCRUM-1](https://acornslearningcentre.atlassian.net/browse/SCRUM-1)

Turn the AI brief and suggestion counters into real, actionable, trackable recommendations.

## Where things stand today

The 'AI suggestions awaiting review' counter and the 'Three things you might want to try today' brief on the Teacher Today screen are hand-written example text, not generated from real data, and there's no way to accept, edit, or dismiss a suggestion.

## Acceptance criteria

This feature is done when all of the following are true:

- [ ] The 'suggestions awaiting review' number on the Teacher Today screen reflects real suggestions waiting for that teacher, not a fixed demo number.
- [ ] A teacher can accept a suggested next step for a child, and it's then recorded as something the teacher agreed to try.
- [ ] A teacher can dismiss a suggestion they don't want to use, and it stops showing up as 'awaiting review'.
- [ ] Suggestions are generated based on that child's real recent observations, not the same three example sentences for every teacher.
- [ ] Every suggestion, whether accepted or dismissed, is saved so a school leader could later see how often AI suggestions get used.

## Related API

See [`documents/api/05-ai-suggestions-next-steps.md`](../api/05-ai-suggestions-next-steps.md) for the endpoints this feature needs.
