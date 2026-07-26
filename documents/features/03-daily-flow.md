# Today's Daily Flow / Schedule

**Jira:** Epic [SCRUM-30](https://acornslearningcentre.atlassian.net/browse/SCRUM-30)

Make the classroom's daily timeline real and editable instead of a fixed sample.

## Where things stand today

The "Today's flow" timeline on the Teacher Today screen (arrival, group time, lunch, etc.) is a fixed list written into the code — it's identical every day and can't be changed.

## Acceptance criteria

This feature is done when all of the following are true:

- [ ] A teacher can see today's actual planned schedule, not the same sample schedule every day.
- [ ] A teacher can mark a step as done, or that it's happening 'now', and that status is saved and shows correctly if they reload the page.
- [ ] A teacher can add, edit, or remove a step in the day's flow (e.g. add an extra outdoor play slot).
- [ ] Each day gets its own schedule — yesterday's completed steps don't carry over and mark today's steps as done.

## Related API

See [`documents/api/03-daily-flow.md`](../api/03-daily-flow.md) for the endpoints this feature needs.
