// Client for the real leader analytics backend (SCRUM-76/78-81). Replaces
// the fixed ALC_DATA sample numbers on the leader Today/Cohorts/Outcomes/
// Patterns screens. Every endpoint here is leader-only — pass the signed-in
// leader's session token.
import { apiUrl } from './api-base';

export type MasteryTrend = 'up' | 'down' | 'flat' | 'steady';

export interface LeaderOverview {
  date: string;
  children_count: number;
  avg_mastery: number | null;
  avg_attendance: number | null;
  trend: MasteryTrend;
  observations_today: number;
  flagged_children: number;
}

export interface CohortChild {
  child_id: number;
  child_name: string;
  mastery: number | null;
  attendance: number | null;
  trend: MasteryTrend;
  flags: string[];
}

export interface Cohort {
  teacher_id: number;
  teacher_name: string;
  child_count: number;
  avg_mastery: number | null;
  avg_attendance: number | null;
  trend: MasteryTrend;
  children: CohortChild[];
}

export interface LeaderCohorts {
  date: string;
  cohorts: Cohort[];
}

export interface OutcomeTrendPoint {
  date: string;
  avg_mastery: number | null;
  avg_attendance: number | null;
  child_count: number;
}

export interface LeaderOutcomes {
  trend: OutcomeTrendPoint[];
  distribution: { exceeding: number; meeting: number; needsSupport: number };
}

export type LeaderPattern =
  | { type: 'declining_mastery' | 'improving_mastery'; severity: 'watch' | 'positive'; childId: number; childName: string; teacherName: string | null; mastery: number | null; previousMastery: number | null }
  | { type: 'flagged_child'; severity: 'watch'; childId: number; childName: string; teacherName: string | null; flags: string[] }
  | { type: 'cohort_below_average'; severity: 'watch'; teacherId: number; teacherName: string; avgMastery: number; schoolAvgMastery: number };

export interface LeaderPatterns {
  date: string;
  patterns: LeaderPattern[];
}

async function asJson<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Something went wrong (${res.status}).`);
  return body as T;
}

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

export const fetchLeaderOverview = (token: string): Promise<LeaderOverview> =>
  fetch(apiUrl('/api/leader/overview'), { headers: authHeaders(token) }).then(asJson<LeaderOverview>);

export const fetchLeaderCohorts = (token: string): Promise<LeaderCohorts> =>
  fetch(apiUrl('/api/leader/cohorts'), { headers: authHeaders(token) }).then(asJson<LeaderCohorts>);

export const fetchLeaderOutcomes = (token: string): Promise<LeaderOutcomes> =>
  fetch(apiUrl('/api/leader/outcomes'), { headers: authHeaders(token) }).then(asJson<LeaderOutcomes>);

export const fetchLeaderPatterns = (token: string): Promise<LeaderPatterns> =>
  fetch(apiUrl('/api/leader/patterns'), { headers: authHeaders(token) }).then(asJson<LeaderPatterns>);
