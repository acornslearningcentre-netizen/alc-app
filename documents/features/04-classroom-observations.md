# Classroom Observations for Enrolled Children

**Jira:** [SCRUM-5](https://acornslearningcentre.atlassian.net/browse/SCRUM-5) · Epic [SCRUM-1](https://acornslearningcentre.atlassian.net/browse/SCRUM-1)

Let day-to-day classroom observations (not just pre-enrolment ones) save for real, with tags and mood.

## Where things stand today

There is already a working system for capturing observations (photo/video/voice/text notes) during a prospective family's assessment visit, before they've enrolled. But once a child is actually enrolled, day-to-day classroom observations captured on the 'Capture an observation' screen aren't saved anywhere real, and the note's tags and mood aren't stored at all.

## Acceptance criteria

This feature is done when all of the following are true:

- [ ] When a teacher captures an observation about a specific enrolled child (photo, note, or voice memo), it's saved and appears on that child's profile every time the app is opened, not just for the current session.
- [ ] The mood and tags a teacher picks (e.g. 'curious', 'focused') are saved along with the note, and show up again when viewing the child's history.
- [ ] A teacher can see a running history of every observation ever logged for a child, most recent first.
- [ ] Observations made during a pre-enrolment assessment and observations made after a child has joined both show up in the same place once the child is enrolled, so nothing is lost in the handover.

## Related API

See [`documents/api/04-classroom-observations.md`](../api/04-classroom-observations.md) for the endpoints this feature needs.
