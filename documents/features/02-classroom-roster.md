# Classroom Roster — Children, Parents & Teachers

**Jira:** [SCRUM-3](https://acornslearningcentre.atlassian.net/browse/SCRUM-3) · Epic [SCRUM-1](https://acornslearningcentre.atlassian.net/browse/SCRUM-1)

Give the app a real, editable list of children, their parents/carers, and teachers.

## Where things stand today

Every child and every parent/carer shown in the app comes from a fixed list baked into the code. There is no way to add a new child, edit a child's details, or record which teacher looks after them — and there isn't even a record for teachers yet.

## Acceptance criteria

This feature is done when all of the following are true:

- [ ] A school leader or admin can add a new child to the system with their name, age, and which teacher looks after them.
- [ ] A teacher can open any child in their class and see up-to-date details, not a fixed demo list.
- [ ] Editing a child's details (like their focus areas or which teacher they're assigned to) saves permanently, so it's still there after a page refresh.
- [ ] Each child can have one or two parent/carer contacts attached, with a name and relationship (e.g. Mum, Guardian).
- [ ] Teachers themselves exist as real records in the system (name, which children they teach), not just a name typed into other screens.

## Related API

See [`documents/api/02-classroom-roster.md`](../api/02-classroom-roster.md) for the endpoints this feature needs.
