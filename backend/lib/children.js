// Pure helpers for shaping children rows — no DB, no Express. Extracted so
// they're unit-testable without a live Postgres connection.
// SCRUM-24/25/26/27 (Classroom Roster).

export const parseJsonArray = (v) => {
  if (!v) return [];
  try {
    const parsed = JSON.parse(v);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/** DB row (JSON-text array columns) → API shape (real arrays). */
export const parseChildRow = (row) => ({
  ...row,
  focus: parseJsonArray(row.focus),
  strengths: parseJsonArray(row.strengths),
  gaps: parseJsonArray(row.gaps),
  flags: parseJsonArray(row.flags),
});

/** Stringifies an array-ish field for storage — undefined means "don't touch it" (PATCH semantics), anything else is JSON-encoded (empty array for null/omitted-on-create). */
export const toJsonArrayColumn = (v) => (Array.isArray(v) ? JSON.stringify(v) : JSON.stringify([]));

/**
 * A leader can see any child; a teacher only their own class. Callers should
 * treat "false" the same as "child doesn't exist" (404, never 403) — this
 * never confirms that a child exists in someone else's class.
 */
export const canSeeChild = (userRole, userTeacherId, childTeacherId) =>
  userRole === 'leader' || (userTeacherId !== null && userTeacherId === childTeacherId);

/**
 * Same access rule as canSeeChild, extended to parent/student — used by
 * Student Self-Service Progress (SCRUM-68), where a teacher, a leader, a
 * parent, and the child themself can all legitimately view the same data.
 * @param {{ role: string, teacherId: number|null, childId: number|null }} user
 * @param {{ id: number, teacherId: number|null }} child
 */
export const canSeeChildProfile = (user, child) => {
  if (user.role === 'leader') return true;
  if (user.role === 'teacher') return canSeeChild('teacher', user.teacherId, child.teacherId);
  if (user.role === 'parent' || user.role === 'student') return user.childId !== null && user.childId === child.id;
  return false;
};
