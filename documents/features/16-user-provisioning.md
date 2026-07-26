# User Creation & Account Provisioning (All Personas)

**Jira:** Epic [SCRUM-95](https://acornslearningcentre.atlassian.net/browse/SCRUM-95)

Real login and password/passcode checking exist ([SCRUM-16](https://acornslearningcentre.atlassian.net/browse/SCRUM-16)), but nothing actually creates a user account except a hardcoded demo seed that runs once when the server starts. This feature is about how every persona's account actually comes into existence in the first place.

## Where things stand today

There is no way for a school leader to add a new teacher, no way to create another leader account, and no way for a parent or student to get a real login once their child is enrolled. Right now the *only* accounts that exist are the two demo staff accounts and the handful of demo family passcodes seeded from environment variables — everything else about "who has an account" is entirely hardcoded.

## Acceptance criteria

This feature is done when all of the following are true:

- [ ] A school leader can create a new teacher or leader account with a name, email, and password — the new person can log in immediately.
- [ ] A staff account can't be created with an email that's already taken, and only a leader (not a teacher) can create new staff accounts.
- [ ] The moment a child is enrolled, their parent(s) automatically get a real, unique passcode — nobody has to remember to set this up by hand.
- [ ] The moment a child is enrolled, the child automatically gets their own real, unique student passcode.
- [ ] Staff can look up a family's current passcode, or issue them a brand new one if it's lost — the old one stops working as soon as a new one is issued.

## Dependencies

This depends on [Classroom Roster](02-classroom-roster.md) (SCRUM-22, for real teacher/child records to link accounts to) and [Onboarding Journey](15-onboarding.md) (SCRUM-89, for the "enrolled" moment that should trigger parent/student account creation). It should be built after both, not before — see [documents/api/16-user-provisioning.md](../api/16-user-provisioning.md) for the full note on sequencing and the one accepted limitation (bootstrapping the very first leader account).

## Related API

See [`documents/api/16-user-provisioning.md`](../api/16-user-provisioning.md).
