// Pure permission check for Teacher <-> Parent Messaging (SCRUM-54/57/58).
// No DB, no Express.

/**
 * A leader can see any thread (oversight); a teacher only their own class's
 * threads; a parent only their own child's thread. Callers should treat
 * "false" as "not found" (404), never confirm a thread exists for someone
 * else's class/family.
 * @param {string} userRole
 * @param {number|null} userTeacherId
 * @param {number|null} userChildId
 * @param {{ teacher_id: number, child_id: number }} thread
 */
export const canSeeThread = (userRole, userTeacherId, userChildId, thread) => {
  if (userRole === 'leader') return true;
  if (userRole === 'teacher') return userTeacherId !== null && userTeacherId === thread.teacher_id;
  if (userRole === 'parent') return userChildId !== null && userChildId === thread.child_id;
  return false;
};
