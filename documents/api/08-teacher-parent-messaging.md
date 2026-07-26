# Teacher ⇄ Parent Messaging — API

**Jira:** [SCRUM-9](https://acornslearningcentre.atlassian.net/browse/SCRUM-9) · Epic [SCRUM-1](https://acornslearningcentre.atlassian.net/browse/SCRUM-1)

Make messages between teachers and parents actually send, arrive, and persist.

## Endpoints

| Method | Endpoint | What it's for |
|---|---|---|
| `GET` | `/api/threads` | Lists a person's message threads. |
| `GET` | `/api/threads/:id/messages` | Loads the messages in one conversation. |
| `POST` | `/api/threads/:id/messages` | Sends a new message in a thread. |

## Acceptance criteria per endpoint

### `GET /api/threads`

Lists a person's message threads.

- [ ] A teacher sees one thread per family in their class; a parent sees just their own child's thread(s).
- [ ] Threads with unread messages are clearly distinguishable from ones that are all read.
### `GET /api/threads/:id/messages`

Loads the messages in one conversation.

- [ ] Messages come back in the order they were sent, each clearly labelled with who sent it.
- [ ] Opening a thread that isn't yours (wrong teacher/family) is rejected.
### `POST /api/threads/:id/messages`

Sends a new message in a thread.

- [ ] An empty message can't be sent.
- [ ] As soon as it's sent, it's saved and visible to the other person the next time they open that thread — not just on the sender's screen.

## Related feature

See [`documents/features/08-teacher-parent-messaging.md`](../features/08-teacher-parent-messaging.md) for what this looks like from a teacher/parent/student/leader's point of view.
