# AI Assistant Chat — API

**Jira:** [SCRUM-10](https://acornslearningcentre.atlassian.net/browse/SCRUM-10) · Epic [SCRUM-1](https://acornslearningcentre.atlassian.net/browse/SCRUM-1)

Replace the canned 'Ask about [child]' answers with real, child-specific AI answers that remember the conversation.

## Endpoints

| Method | Endpoint | What it's for |
|---|---|---|
| `POST` | `/api/assistant/ask` | Asks the assistant a question about a child. |
| `GET` | `/api/assistant/history` | Retrieves a past conversation. |

## Acceptance criteria per endpoint

### `POST /api/assistant/ask`

Asks the assistant a question about a child.

- [ ] The answer draws on that specific child's real observations and progress, not a generic canned reply.
- [ ] Every question and answer is saved to that conversation's history as it happens.
- [ ] The response is clearly framed as a suggestion, not a definitive judgement about the child.
### `GET /api/assistant/history`

Retrieves a past conversation.

- [ ] Returns the full back-and-forth in the order it happened, so nothing looks out of context.
- [ ] A parent can only ever retrieve conversations about their own child.

## Related feature

See [`documents/features/09-ai-assistant-chat.md`](../features/09-ai-assistant-chat.md) for what this looks like from a teacher/parent/student/leader's point of view.
