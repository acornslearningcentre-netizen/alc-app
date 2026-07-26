# Media Upload & Real Email Delivery

**Jira:** [SCRUM-15](https://acornslearningcentre.atlassian.net/browse/SCRUM-15) · Epic [SCRUM-1](https://acornslearningcentre.atlassian.net/browse/SCRUM-1)

Let staff actually upload photos/videos/voice recordings, and make 'send report' really email the parent.

## Where things stand today

Observations captured during an assessment can store a media web address (URL), but there's no actual way to upload a photo, video, or voice recording from the app — the field is just text. Separately, 'sending' a signed-off report to a parent only records that it was sent; no real email goes out.

## Acceptance criteria

This feature is done when all of the following are true:

- [ ] A teacher can actually attach a photo, video, or voice recording from their device when capturing an observation, not just type in a web address.
- [ ] Uploaded files are stored safely and can be viewed again later from the child's or prospect's observation history.
- [ ] When a staff member clicks 'send' on a signed-off report, the parent genuinely receives an email with the report, not just an internal timestamp update.
- [ ] If the email fails to send for any reason, the staff member is told clearly, rather than the system silently marking it as sent.

## Related API

See [`documents/api/14-media-upload-email-delivery.md`](../api/14-media-upload-email-delivery.md) for the endpoints this feature needs.
