# Lesson Planning — API

**Jira:** [SCRUM-7](https://acornslearningcentre.atlassian.net/browse/SCRUM-7) · Epic [SCRUM-1](https://acornslearningcentre.atlassian.net/browse/SCRUM-1)

Make the weekly lesson plan and each student's plan status persist for real.

## Endpoints

| Method | Endpoint | What it's for |
|---|---|---|
| `GET` | `/api/lesson-plans` | Lists a teacher's lesson plans, typically for the current week. |
| `POST` | `/api/lesson-plans` | Creates a new lesson slot. |
| `PATCH` | `/api/lesson-plans/:id/students/:childId` | Updates one student's status/activity/note within a lesson plan. |

## Acceptance criteria per endpoint

### `GET /api/lesson-plans`

Lists a teacher's lesson plans, typically for the current week.

- [ ] Returns plans in day/time order for the requested week, not a fixed sample week.
### `POST /api/lesson-plans`

Creates a new lesson slot.

- [ ] A lesson needs a day, time, subject, and title before it can be saved.
### `PATCH /api/lesson-plans/:id/students/:childId`

Updates one student's status/activity/note within a lesson plan.

- [ ] Changing one student's status doesn't affect any other student's status in the same lesson.
- [ ] The saved status (accepted/edited/pending) is exactly what shows up next time the plan is opened, on any device.

## Related feature

See [`documents/features/06-lesson-planning.md`](../features/06-lesson-planning.md) for what this looks like from a teacher/parent/student/leader's point of view.
