# Teacher ⇄ Parent Messaging

**Jira:** [SCRUM-9](https://acornslearningcentre.atlassian.net/browse/SCRUM-9) · Epic [SCRUM-1](https://acornslearningcentre.atlassian.net/browse/SCRUM-1)

Make messages between teachers and parents actually send, arrive, and persist.

## Where things stand today

The Messages screens for both teachers and parents show a fixed set of sample conversations. Sending a reply only changes what's on screen for that moment — it disappears on refresh and the other person never actually receives it.

## Acceptance criteria

This feature is done when all of the following are true:

- [ ] When a parent sends a message to a teacher, the teacher can see that exact message when they next open the app (and vice versa).
- [ ] Conversations are kept per family/child, so a teacher with several children in their class sees a separate thread for each family.
- [ ] Messages stay in order, are clearly marked with who sent them, and are still there after closing and reopening the app.
- [ ] A teacher or parent can tell which messages they haven't read yet.

## Related API

See [`documents/api/08-teacher-parent-messaging.md`](../api/08-teacher-parent-messaging.md) for the endpoints this feature needs.
