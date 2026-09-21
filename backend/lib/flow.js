// Pure helpers for Today's Daily Flow (SCRUM-30/32/33/34) — no DB, no
// Express. Extracted so they're unit-testable without a live Postgres
// connection.

/**
 * A leader can see/edit any teacher's flow step; a teacher only their own.
 * Same shape as children.js's canSeeChild — callers should treat "false" as
 * "not found" (404), never confirm that a step exists for another teacher.
 */
export const canSeeFlowStep = (userRole, userTeacherId, stepTeacherId) =>
  userRole === 'leader' || (userTeacherId !== null && userTeacherId === stepTeacherId);
