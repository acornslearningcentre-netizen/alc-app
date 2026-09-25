// Pure helpers for School Leader Analytics Dashboards (SCRUM-76/80/81) — no
// DB, no Express. Every number/pattern here must be derivable from real
// children/teachers/progress data; nothing invented for demo polish.

/**
 * Buckets children by their latest computed mastery. A child with no
 * mastery yet (null — not enough decided lesson-plan data) is excluded
 * from every bucket, never silently counted as "needs support".
 * @param {{ mastery: number|null }[]} children
 */
export function bucketMasteryDistribution(children) {
  const buckets = { exceeding: 0, meeting: 0, needsSupport: 0 };
  for (const c of children) {
    if (c.mastery === null || c.mastery === undefined) continue;
    if (c.mastery >= 75) buckets.exceeding++;
    else if (c.mastery >= 60) buckets.meeting++;
    else buckets.needsSupport++;
  }
  return buckets;
}

// Percentage points a cohort's average mastery must sit below the school
// average before it's flagged — avoids flagging every cohort on tiny noise.
const COHORT_BELOW_AVERAGE_GAP = 10;

/**
 * Real, data-grounded patterns only: a declining/improving trend already
 * computed by lib/progress.js, a flag a teacher already set on the child's
 * profile, or a cohort average meaningfully below the school average. No
 * invented tag/mood correlation analytics — observation tags aren't used
 * consistently enough yet to honestly support that kind of claim.
 * @param {{ children: { id: number, name: string, teacherName: string|null, mastery: number|null, previousMastery: number|null, trend: string, flags: string[] }[], cohorts: { teacherId: number, teacherName: string, avgMastery: number|null }[], schoolAvgMastery: number|null }} input
 */
export function detectPatterns({ children, cohorts, schoolAvgMastery }) {
  const patterns = [];

  for (const c of children) {
    if (c.trend === 'down') {
      patterns.push({
        type: 'declining_mastery', severity: 'watch',
        childId: c.id, childName: c.name, teacherName: c.teacherName,
        mastery: c.mastery, previousMastery: c.previousMastery,
      });
    } else if (c.trend === 'up') {
      patterns.push({
        type: 'improving_mastery', severity: 'positive',
        childId: c.id, childName: c.name, teacherName: c.teacherName,
        mastery: c.mastery, previousMastery: c.previousMastery,
      });
    }
    if (c.flags && c.flags.length) {
      patterns.push({
        type: 'flagged_child', severity: 'watch',
        childId: c.id, childName: c.name, teacherName: c.teacherName,
        flags: c.flags,
      });
    }
  }

  if (schoolAvgMastery !== null && schoolAvgMastery !== undefined) {
    for (const cohort of cohorts) {
      if (cohort.avgMastery === null || cohort.avgMastery === undefined) continue;
      if (cohort.avgMastery <= schoolAvgMastery - COHORT_BELOW_AVERAGE_GAP) {
        patterns.push({
          type: 'cohort_below_average', severity: 'watch',
          teacherId: cohort.teacherId, teacherName: cohort.teacherName,
          avgMastery: cohort.avgMastery, schoolAvgMastery,
        });
      }
    }
  }

  return patterns;
}
