# Real Login & Accounts

**Jira:** Epic [SCRUM-16](https://acornslearningcentre.atlassian.net/browse/SCRUM-16)

Replace the fake, browser-only login with real accounts checked on the server.

## Where things stand today

The login screen checks a 4-character passcode against a hardcoded list written into the app's code, and "being logged in" is just a flag saved in the browser. Anyone who reads the app's code can see every family's passcode.

## Acceptance criteria

This feature is done when all of the following are true:

- [ ] A teacher can log in with an email and password that only they know, and the system checks it on the server, not just in the browser.
- [ ] A parent or student can still log in with a short passcode, but that passcode is checked and stored securely on the server, not visible in the app's code.
- [ ] If someone enters the wrong passcode or password, they see a clear error and are not let in.
- [ ] Once logged in, refreshing the page or closing and reopening the browser keeps you logged in until you explicitly log out.
- [ ] Logging out actually ends the session on the server, so the same link/device can't be reused to get back in without logging in again.

## Related API

See [`documents/api/01-login-accounts.md`](../api/01-login-accounts.md) for the endpoints this feature needs.
