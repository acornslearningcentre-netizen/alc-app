# Student Self-Service Progress — API

**Jira:** Epic [SCRUM-68](https://acornslearningcentre.atlassian.net/browse/SCRUM-68)

Save the Garden, Growing checklist, and Try Today choices so a child's progress survives beyond the current browser tab.

## Endpoints

| Method | Endpoint | What it's for |
|---|---|---|
| `GET` | `/api/students/:childId/garden` | Shows a child's garden watering state. |
| `POST` | `/api/students/:childId/garden` | Records that a child watered a plant. |
| `GET` | `/api/students/:childId/growing` | Shows a child's growing checklist progress. |
| `POST` | `/api/students/:childId/growing` | Ticks an item on the growing checklist. |
| `GET` | `/api/students/:childId/try-today` | Shows what a child has chosen to try. |
| `POST` | `/api/students/:childId/try-today` | Records a child's activity choice. |

## Acceptance criteria per endpoint

### `GET /api/students/:childId/garden`

Shows a child's garden watering state.

- [ ] Shows exactly which plants have been watered and when, matching what the child last did — on any device.
### `POST /api/students/:childId/garden`

Records that a child watered a plant.

- [ ] Watering the same plant again doesn't lose the earlier record — history is kept, not overwritten.
### `GET /api/students/:childId/growing`

Shows a child's growing checklist progress.

- [ ] Reflects exactly which items are ticked, matching what the child last did.
### `POST /api/students/:childId/growing`

Ticks an item on the growing checklist.

- [ ] Ticking the same item twice doesn't create two records — it's still just 'done'.
### `GET /api/students/:childId/try-today`

Shows what a child has chosen to try.

- [ ] A teacher looking at a child's profile can see this same choice, so it's genuinely shared, not just local to the child's device.
### `POST /api/students/:childId/try-today`

Records a child's activity choice.

- [ ] The choice is saved immediately and is visible to the child's teacher afterwards.

## Related feature

See [`documents/features/11-student-self-service.md`](../features/11-student-self-service.md) for what this looks like from a teacher/parent/student/leader's point of view.
