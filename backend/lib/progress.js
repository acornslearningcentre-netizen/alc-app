// Pure metric calculations for Child & Class Progress Tracking (SCRUM-50/52).
// No DB, no Express — callers fetch the real rows and pass them in here.
// Every number is derived from real recorded activity (observations,
// lesson-plan decisions); nothing here invents a value that isn't backed by
// at least one real row.

const dayKey = (isoLike) => String(isoLike).slice(0, 10);

/**
 * % of lesson_plan_students rows with status 'accepted', among rows with a
 * decided status (accepted or edited) — still-pending rows don't count
 * either way yet. Null (not 0) when there's no decided data — an empty
 * curriculum isn't "0% mastery", it's "not enough data".
 * @param {{ status: string }[]} studentRows
 */
export function computeMastery(studentRows) {
  const decided = (studentRows || []).filter((r) => r.status === 'accepted' || r.status === 'edited');
  if (decided.length === 0) return null;
  const accepted = decided.filter((r) => r.status === 'accepted').length;
  return Math.round((accepted / decided.length) * 1000) / 10;
}

/**
 * % of the last `windowDays` days (ending at asOfDate, inclusive) that had
 * at least one observation captured for this child.
 * @param {string[]} observationDates - captured_at timestamps
 * @param {string} asOfDate - YYYY-MM-DD
 */
export function computeAttendance(observationDates, asOfDate, windowDays = 30) {
  const daySet = new Set((observationDates || []).map(dayKey));
  const asOf = new Date(`${asOfDate}T00:00:00Z`);
  let present = 0;
  for (let i = 0; i < windowDays; i++) {
    const d = new Date(asOf);
    d.setUTCDate(d.getUTCDate() - i);
    if (daySet.has(d.toISOString().slice(0, 10))) present++;
  }
  return Math.round((present / windowDays) * 1000) / 10;
}

/**
 * Consecutive days ending at asOfDate (inclusive, walking backward) with at
 * least one observation. Breaks — and stops counting — at the first gap.
 * @param {string[]} observationDates
 * @param {string} asOfDate - YYYY-MM-DD
 */
export function computeStreak(observationDates, asOfDate) {
  const daySet = new Set((observationDates || []).map(dayKey));
  const asOf = new Date(`${asOfDate}T00:00:00Z`);
  let streak = 0;
  for (let i = 0; ; i++) {
    const d = new Date(asOf);
    d.setUTCDate(d.getUTCDate() - i);
    if (!daySet.has(d.toISOString().slice(0, 10))) break;
    streak++;
  }
  return streak;
}

/**
 * 'steady' when there's no prior snapshot (or either value is null) — not
 * enough history for a real trend yet. Otherwise a genuine up/down/flat
 * comparison against the previous day's mastery.
 */
export function computeTrend(currentMastery, previousMastery) {
  if (previousMastery === null || previousMastery === undefined) return 'steady';
  if (currentMastery === null || currentMastery === undefined) return 'steady';
  if (currentMastery > previousMastery) return 'up';
  if (currentMastery < previousMastery) return 'down';
  return 'flat';
}
