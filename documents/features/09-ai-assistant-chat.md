# AI Assistant Chat

**Jira:** [SCRUM-10](https://acornslearningcentre.atlassian.net/browse/SCRUM-10) · Epic [SCRUM-1](https://acornslearningcentre.atlassian.net/browse/SCRUM-1)

Replace the canned 'Ask about [child]' answers with real, child-specific AI answers that remember the conversation.

## Where things stand today

The 'Ask about [child]' assistant on both the teacher and parent side responds with pre-written canned answers regardless of what's typed, and nothing about the conversation is remembered.

## Acceptance criteria

This feature is done when all of the following are true:

- [ ] When a teacher or parent asks a real question about a specific child, the answer is generated based on that child's actual observations and progress, not a generic pre-written reply.
- [ ] If someone asks two different questions, they get two different, relevant answers.
- [ ] A teacher or parent can scroll back and see the questions they've asked before and the answers they got, even after leaving and returning to the app.
- [ ] The assistant makes clear these are suggestions, in line with how the app already frames AI content ('suggestions, not prescriptions').

## Related API

See [`documents/api/09-ai-assistant-chat.md`](../api/09-ai-assistant-chat.md) for the endpoints this feature needs.
