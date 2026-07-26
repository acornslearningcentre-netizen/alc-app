# AI-Drafted Assessment Reports for New Families — API

**Jira:** [SCRUM-14](https://acornslearningcentre.atlassian.net/browse/SCRUM-14) · Epic [SCRUM-1](https://acornslearningcentre.atlassian.net/browse/SCRUM-1)

Auto-generate a first-draft report from a family's intake answers and assessment observations.

## Endpoints

| Method | Endpoint | What it's for |
|---|---|---|
| `POST` | `/api/assessments/:id/draft-report` | Generates an AI first draft of an assessment report. |

## Acceptance criteria per endpoint

### `POST /api/assessments/:id/draft-report`

Generates an AI first draft of an assessment report.

- [ ] The draft references real answers from that family's intake form and real observations from that assessment, not generic text.
- [ ] The child's stated hobbies/interests are visibly reflected in the draft, since that's the single most important intake answer.
- [ ] Generating a draft never signs it off or sends it — it only fills in the draft text for a human to review.
- [ ] Running this again after edits have been made asks for confirmation rather than silently overwriting a staff member's edits.

## Related feature

See [`documents/features/13-ai-drafted-assessment-reports.md`](../features/13-ai-drafted-assessment-reports.md) for what this looks like from a teacher/parent/student/leader's point of view.
