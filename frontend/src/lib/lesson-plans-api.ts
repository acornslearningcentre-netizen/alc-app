// Client for the real Lesson Planning backend (SCRUM-45-49). Replaces the
// fixed ALC_DATA sample week.
import { apiUrl } from './api-base';

export type Day = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';
export type PlanStatus = 'accepted' | 'edited' | 'pending';

export interface LessonPlanStudent {
  id: number;
  lesson_plan_id: number;
  child_id: number;
  status: PlanStatus;
  activity: string;
  note: string | null;
}

export interface RealLessonPlan {
  id: number;
  teacher_id: number;
  day: Day;
  week_of: string;
  time: string;
  subject: string;
  title: string;
  summary: string | null;
  students: LessonPlanStudent[];
}

async function asJson<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Something went wrong (${res.status}).`);
  return body as T;
}

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

/** GET /api/lesson-plans?week_of=YYYY-MM-DD — a teacher's real week (leader must also pass teacherId). */
export const fetchLessonPlans = (token: string, weekOf: string, teacherId?: number): Promise<RealLessonPlan[]> =>
  fetch(apiUrl(`/api/lesson-plans?week_of=${weekOf}${teacherId ? `&teacher_id=${teacherId}` : ''}`), { headers: authHeaders(token) }).then(asJson<RealLessonPlan[]>);

export interface NewLessonPlan {
  day: Day;
  week_of: string;
  time: string;
  subject: string;
  title: string;
  summary?: string;
  teacher_id?: number;
}

/** POST /api/lesson-plans — creates a new lesson slot. */
export const createLessonPlan = (token: string, input: NewLessonPlan): Promise<RealLessonPlan> =>
  fetch(apiUrl('/api/lesson-plans'), {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then(asJson<RealLessonPlan>);

/** PATCH /api/lesson-plans/:id/students/:childId — updates (or creates) one student's status/activity/note for a lesson. */
export const updateLessonPlanStudent = (
  token: string, planId: number, childId: number | string,
  input: { status?: PlanStatus; activity?: string; note?: string },
): Promise<LessonPlanStudent> =>
  fetch(apiUrl(`/api/lesson-plans/${planId}/students/${childId}`), {
    method: 'PATCH',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then(asJson<LessonPlanStudent>);
