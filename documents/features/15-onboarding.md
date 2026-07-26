# Onboarding Journey: Staff-Facing Screens

**Jira:** Epic [SCRUM-89](https://acornslearningcentre.atlassian.net/browse/SCRUM-89)

The public intake form and its backend (prospects, assessments, observations) already work end to end. What's missing is any staff-facing screen to use that data — today the owner queue, assessment booking, sign-off/send, and in-visit observation capture only exist as APIs, reachable by curl, not by Aishat.

## Where things stand today

Epic A (the public intake form at `frontend/src/screens/intake/`) is complete and correct: every submitted family lands in Postgres, per-question validation works, and the GDPR consent questions (Q22/Q23) are handled exactly as the working agreements require — a family can't submit without explicitly agreeing to both. From there, everything backend (storing the assessment, the AI-drafted report, observations captured during a visit) already exists and is deployed.

**None of it has a staff-facing screen.** The only two things the frontend ever calls are the public intake form's own submit, and an unrelated internal feedback tool. A staff member cannot see the list of families who've applied, book an assessment, review or sign off a report, or capture an observation during a visit — all of that only exists as an API endpoint today.

## Acceptance criteria

This feature is done when all of the following are true:

- [ ] A staff member can see every family that's submitted the intake form, in one list, most recent first — not by asking a developer to query the database.
- [ ] A staff member can open one family and see their full intake answers, with the hobbies answer visually called out as the most important one, matching the existing working agreement.
- [ ] A staff member can tell at a glance whether a family gave both required consents, and can't accidentally miss one that didn't.
- [ ] A staff member can book a family's assessment (pick a date/time) without knowing any technical detail.
- [ ] A staff member can review an AI-drafted assessment report, edit it, sign it off, and only then send it — sending before sign-off is not possible.
- [ ] A staff member can capture a photo, voice note, or written observation during a family's assessment visit and have it saved against that specific family — not against the wrong, unrelated classroom system.

## Related API

See [`documents/api/15-onboarding.md`](../api/15-onboarding.md) for how each screen wires up to the already-existing backend.

## Source material

The original plan, meeting notes, and design brief this feature was scoped from now live in [`documents/planning/`](../planning/) and [`documents/meetings/`](../meetings/).
