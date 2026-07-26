# Lesson Planning

**Jira:** [SCRUM-7](https://acornslearningcentre.atlassian.net/browse/SCRUM-7) · Epic [SCRUM-1](https://acornslearningcentre.atlassian.net/browse/SCRUM-1)

Make the weekly lesson plan and each student's plan status persist for real.

## Where things stand today

The weekly lesson plan (subjects, activities, and each student's individual plan status) is a fixed sample list. Marking a plan as 'accepted' or 'edited' for a student doesn't actually save.

## Acceptance criteria

This feature is done when all of the following are true:

- [ ] A teacher can see this week's real lesson plan, and it's different from last week's once they've changed it.
- [ ] A teacher can create a new lesson slot (day, time, subject, and what the activity is).
- [ ] A teacher can mark an individual student's plan for a lesson as accepted, edited, or still pending, and that choice is remembered after refreshing the page.
- [ ] If a teacher edits a student's activity or adds a note, that change is saved and visible the next time anyone opens the plan.

## Related API

See [`documents/api/06-lesson-planning.md`](../api/06-lesson-planning.md) for the endpoints this feature needs.
