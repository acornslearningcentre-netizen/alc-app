# Student Self-Service Progress

**Jira:** Epic [SCRUM-68](https://acornslearningcentre.atlassian.net/browse/SCRUM-68)

Save the Garden, Growing checklist, and Try Today choices so a child's progress survives beyond the current browser tab.

## Where things stand today

The student-facing 'water your garden', 'growing checklist', and 'try this today' screens all track progress only in the browser's temporary memory. Closing the app or switching devices loses everything a child has done.

## Acceptance criteria

This feature is done when all of the following are true:

- [ ] If a child waters a plant in their garden today, it's still watered when they open the app again tomorrow, even on a different device.
- [ ] A child's growing checklist remembers which items they've already ticked off.
- [ ] When a child picks an activity to try, that choice is saved so a teacher could see what a child chose to focus on.
- [ ] None of this student self-service progress is lost by closing the browser tab or restarting the device.

## Related API

See [`documents/api/11-student-self-service.md`](../api/11-student-self-service.md) for the endpoints this feature needs.
