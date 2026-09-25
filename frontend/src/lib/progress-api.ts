// Client for the real Child & Class Progress Tracking backend (SCRUM-50-53).
// Replaces the fixed ALC_DATA mastery/attendance/streak/trend numbers.
import { apiUrl } from './api-base';

export type MasteryTrend = 'up' | 'down' | 'flat' | 'steady';

export interface ProgressSnapshot {
  id: number;
  child_id: number;
  date: string;
  mastery: number | null;
  attendance: number | null;
  streak: number | null;
  trend: MasteryTrend;
}

export interface ChildProgress {
  child_id: number;
  child_name: string;
  trend: MasteryTrend | null;
  snapshots: ProgressSnapshot[];
}

export interface ClassProgressChild {
  child_id: number;
  child_name: string;
  mastery: number | null;
  attendance: number | null;
  streak: number | null;
  trend: MasteryTrend;
}

export interface ClassProgress {
  teacher_id: number;
  date: string;
  child_count: number;
  avg_mastery: number | null;
  avg_attendance: number | null;
  avg_streak: number | null;
  trend: MasteryTrend;
  children: ClassProgressChild[];
}

async function asJson<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Something went wrong (${res.status}).`);
  return body as T;
}

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

/** GET /api/progress/class — real mastery/attendance/trend for every child in a teacher's class (or a specific class, for a leader passing teacher_id). */
export const fetchClassProgress = (token: string, teacherId?: number): Promise<ClassProgress> =>
  fetch(apiUrl(`/api/progress/class${teacherId ? `?teacher_id=${teacherId}` : ''}`), { headers: authHeaders(token) }).then(asJson<ClassProgress>);

/** GET /api/children/:id/progress — one child's real snapshot history. */
export const fetchChildProgress = (token: string, childId: number | string, days?: number): Promise<ChildProgress> =>
  fetch(apiUrl(`/api/children/${childId}/progress${days ? `?days=${days}` : ''}`), { headers: authHeaders(token) }).then(asJson<ChildProgress>);
