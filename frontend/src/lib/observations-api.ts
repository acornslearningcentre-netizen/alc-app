// Client for the real Observations backend (SCRUM-35-38, extending the
// earlier onboarding observations table). Replaces ALC_DATA.observations.
import { apiUrl } from './api-base';

export type ObservationKind = 'image' | 'video' | 'voice' | 'text';

export interface RealObservation {
  id: number;
  prospect_id: number | null;
  child_id: string | null;
  teacher_id: string | null;
  kind: ObservationKind;
  media_url: string | null;
  transcript: string | null;
  comment: string | null;
  tags: string[];
  mood: string | null;
  captured_at: string;
}

async function asJson<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Something went wrong (${res.status}).`);
  return body as T;
}

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

/** GET /api/observations?child_id=X — every real observation for one child, newest first. */
export const fetchChildObservations = (token: string, childId: number | string): Promise<RealObservation[]> =>
  fetch(apiUrl(`/api/observations?child_id=${childId}`), { headers: authHeaders(token) }).then(asJson<RealObservation[]>);

/**
 * GET /api/observations — the most recent observations system-wide (up to
 * 100), unscoped by class. This endpoint has no teacher/class filter, so a
 * caller building a "my class" feed must cross-reference the result against
 * a real roster (e.g. fetchChildren) and filter by child_id itself.
 */
export const fetchRecentObservations = (token: string): Promise<RealObservation[]> =>
  fetch(apiUrl('/api/observations'), { headers: authHeaders(token) }).then(asJson<RealObservation[]>);

export interface NewObservation {
  child_id: number | string;
  kind: ObservationKind;
  media_url?: string;
  transcript?: string;
  comment?: string;
  tags?: string[];
  mood?: string;
}

/** POST /api/observations — records a new observation for an enrolled child. */
export const createObservation = (token: string, input: NewObservation): Promise<RealObservation> =>
  fetch(apiUrl('/api/observations'), {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then(asJson<RealObservation>);
