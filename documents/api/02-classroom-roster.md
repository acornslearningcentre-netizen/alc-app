# Classroom Roster — Children, Parents & Teachers — API

**Jira:** [SCRUM-3](https://acornslearningcentre.atlassian.net/browse/SCRUM-3) · Epic [SCRUM-1](https://acornslearningcentre.atlassian.net/browse/SCRUM-1)

Give the app a real, editable list of children, their parents/carers, and teachers.

## Endpoints

| Method | Endpoint | What it's for |
|---|---|---|
| `GET` | `/api/children` | Lists the children a teacher or leader is allowed to see. |
| `POST` | `/api/children` | Adds a new child to the roster (typically once a family has enrolled). |
| `GET` | `/api/children/:id` | Shows one child's full profile. |
| `PATCH` | `/api/children/:id` | Updates a child's details (e.g. focus areas, assigned teacher). |
| `GET` | `/api/teachers` | Lists teaching staff. |
| `POST` | `/api/teachers` | Adds a new teacher record. |

## Acceptance criteria per endpoint

### `GET /api/children`

Lists the children a teacher or leader is allowed to see.

- [ ] A teacher only sees children in their own class; a school leader can see every child.
- [ ] The list reflects the real, current roster — a child added five minutes ago shows up without needing a rebuild or redeploy.
### `POST /api/children`

Adds a new child to the roster (typically once a family has enrolled).

- [ ] A new child cannot be created without a name and an assigned teacher.
- [ ] The newly added child immediately appears on their teacher's class list.
### `GET /api/children/:id`

Shows one child's full profile.

- [ ] Returns the child's real, current details plus their parent/carer contacts.
- [ ] Asking for a child that doesn't exist, or one outside your class/permissions, gives a clear 'not found' rather than someone else's data.
### `PATCH /api/children/:id`

Updates a child's details (e.g. focus areas, assigned teacher).

- [ ] Only fields that are sent get changed — everything else about the child stays as it was.
- [ ] The change is visible to anyone who looks at that child immediately afterwards, on any device.
### `GET /api/teachers`

Lists teaching staff.

- [ ] Shows every current teacher, used e.g. when assigning a child to a class.
### `POST /api/teachers`

Adds a new teacher record.

- [ ] A teacher cannot be created without a name, and duplicate email addresses are rejected with a clear message.

## Related feature

See [`documents/features/02-classroom-roster.md`](../features/02-classroom-roster.md) for what this looks like from a teacher/parent/student/leader's point of view.
