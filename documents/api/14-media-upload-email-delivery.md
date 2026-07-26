# Media Upload & Real Email Delivery — API

**Jira:** Epic [SCRUM-85](https://acornslearningcentre.atlassian.net/browse/SCRUM-85)

Let staff actually upload photos/videos/voice recordings, and make 'send report' really email the parent.

## Endpoints

| Method | Endpoint | What it's for |
|---|---|---|
| `POST` | `/api/media/upload` | Uploads a photo, video, or voice recording file. |
| `POST` | `/api/assessments/:id/send` | Sends a signed-off report to the parent by real email. |

## Acceptance criteria per endpoint

### `POST /api/media/upload`

Uploads a photo, video, or voice recording file.

- [ ] Accepts a real file from the teacher's device (not just a typed-in link) and returns an address the observation can be saved with.
- [ ] Rejects file types or sizes that aren't supported, with a clear message, rather than silently failing.
- [ ] An uploaded file can be opened again later from the observation it was attached to.
### `POST /api/assessments/:id/send`

Sends a signed-off report to the parent by real email.

- [ ] This only works after the report has been signed off — it cannot send an unreviewed draft.
- [ ] On success, the parent receives an actual email containing the report.
- [ ] If the email genuinely fails to send, the staff member sees a clear failure message and the report is not incorrectly marked as sent.

## Related feature

See [`documents/features/14-media-upload-email-delivery.md`](../features/14-media-upload-email-delivery.md) for what this looks like from a teacher/parent/student/leader's point of view.
