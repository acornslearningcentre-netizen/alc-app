// Plain-language copy + display hints for a real LeaderPattern (SCRUM-101).
// Shared between the leader Today screen (top 3) and the full Patterns
// screen, so the same real pattern always reads the same way everywhere.
import type { LeaderPattern } from './leader-api';
import type { IconName } from '../components/ui';

const pct = (n: number | null) => (n === null ? '—' : `${n}%`);

export function patternTitle(p: LeaderPattern): string {
  switch (p.type) {
    case 'declining_mastery': return `${p.childName} — mastery trending down`;
    case 'improving_mastery': return `${p.childName} — mastery trending up`;
    case 'flagged_child': return `${p.childName} — flagged for follow-up`;
    case 'cohort_below_average': return `${p.teacherName}'s cohort — below school average`;
  }
}

export function patternDescription(p: LeaderPattern): string {
  switch (p.type) {
    case 'declining_mastery':
      return `Mastery moved from ${pct(p.previousMastery)} to ${pct(p.mastery)}${p.teacherName ? ` · ${p.teacherName}'s class` : ''}.`;
    case 'improving_mastery':
      return `Mastery moved from ${pct(p.previousMastery)} to ${pct(p.mastery)}${p.teacherName ? ` · ${p.teacherName}'s class` : ''}.`;
    case 'flagged_child':
      return `Flags: ${p.flags.join(', ')}${p.teacherName ? ` · ${p.teacherName}'s class` : ''}.`;
    case 'cohort_below_average':
      return `Averaging ${pct(p.avgMastery)} vs a school average of ${pct(p.schoolAvgMastery)}.`;
  }
}

export function patternTone(p: LeaderPattern): 'sage' | 'ochre' {
  return p.severity === 'positive' ? 'sage' : 'ochre';
}

export function patternIcon(p: LeaderPattern): IconName {
  switch (p.type) {
    case 'declining_mastery': return 'arrow-down';
    case 'improving_mastery': return 'arrow-up';
    case 'flagged_child': return 'flag';
    case 'cohort_below_average': return 'users';
  }
}
