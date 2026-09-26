// Client for the real AI Suggestions & Next Steps backend (SCRUM-39-44).
// Replaces the fixed ALC_DATA.nextSteps sample suggestions.
import { apiUrl } from './api-base';

export type NextStepStatus = 'pending' | 'accepted' | 'dismissed';

export interface RealNextStep {
  id: number;
  child_id: number;
  type: string;
  title: string;
  rationale: string | null;
  status: NextStepStatus;
  suggested_at: string;
  resolved_at: string | null;
}

async function asJson<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Something went wrong (${res.status}).`);
  return body as T;
}

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

/** GET /api/next-steps?child_id=X — a child's real suggestion history. */
export const fetchChildNextSteps = (token: string, childId: number | string, status?: NextStepStatus): Promise<RealNextStep[]> =>
  fetch(apiUrl(`/api/next-steps?child_id=${childId}${status ? `&status=${status}` : ''}`), { headers: authHeaders(token) }).then(asJson<RealNextStep[]>);

/** GET /api/next-steps?status=X — every suggestion across a teacher's own class (or, for a leader, everyone's). */
export const fetchNextSteps = (token: string, status?: NextStepStatus): Promise<RealNextStep[]> =>
  fetch(apiUrl(`/api/next-steps${status ? `?status=${status}` : ''}`), { headers: authHeaders(token) }).then(asJson<RealNextStep[]>);

/** POST /api/next-steps/:id/accept */
export const acceptNextStep = (token: string, id: number): Promise<RealNextStep> =>
  fetch(apiUrl(`/api/next-steps/${id}/accept`), { method: 'POST', headers: authHeaders(token) }).then(asJson<RealNextStep>);

/** POST /api/next-steps/:id/dismiss */
export const dismissNextStep = (token: string, id: number): Promise<RealNextStep> =>
  fetch(apiUrl(`/api/next-steps/${id}/dismiss`), { method: 'POST', headers: authHeaders(token) }).then(asJson<RealNextStep>);
