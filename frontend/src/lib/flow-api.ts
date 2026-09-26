// Client for the real Today's Daily Flow backend (SCRUM-30-34). Replaces
// the fixed ALC_DATA sample timeline on the teacher Today screen.
import { apiUrl } from './api-base';

export type FlowState = 'done' | 'now' | 'next';

export interface RealFlowStep {
  id: number;
  teacher_id: number;
  date: string;
  time: string;
  label: string;
  state: FlowState;
  ai_suggested: boolean;
  sort_order: number;
}

async function asJson<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Something went wrong (${res.status}).`);
  return body as T;
}

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

/** GET /api/flow?date=YYYY-MM-DD — a teacher's real steps for one day, already ordered. */
export const fetchFlowSteps = (token: string, date: string, teacherId?: number): Promise<RealFlowStep[]> =>
  fetch(apiUrl(`/api/flow?date=${date}${teacherId ? `&teacher_id=${teacherId}` : ''}`), { headers: authHeaders(token) }).then(asJson<RealFlowStep[]>);

/** PATCH /api/flow/:id — most commonly used to mark a step done/now. */
export const updateFlowStep = (token: string, id: number, input: { state?: FlowState; time?: string; label?: string }): Promise<RealFlowStep> =>
  fetch(apiUrl(`/api/flow/${id}`), {
    method: 'PATCH',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then(asJson<RealFlowStep>);
