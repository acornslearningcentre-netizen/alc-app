// Client for the real Classroom Roster backend (SCRUM-22/24-27). Replaces
// the fixed ALC_DATA.children sample list across the teacher screens.
import { apiUrl } from './api-base';

export type Tone = 'sage' | 'ochre' | 'plum' | 'sky';
export type Pronoun = 'he' | 'she' | 'they';

export interface RealParent {
  id: number;
  child_id: number;
  name: string;
  relation: string;
}

export interface RealChild {
  id: number;
  name: string;
  dob: string | null;
  initials: string | null;
  tone: Tone | null;
  teacher_id: number | null;
  pronoun: Pronoun | null;
  focus: string[];
  strengths: string[];
  gaps: string[];
  style: string | null;
  flags: string[];
  prospect_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface RealChildDetail extends RealChild {
  parents: RealParent[];
}

async function asJson<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Something went wrong (${res.status}).`);
  return body as T;
}

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

/** GET /api/children — a teacher's own class, or every child for a leader. */
export const fetchChildren = (token: string): Promise<RealChild[]> =>
  fetch(apiUrl('/api/children'), { headers: authHeaders(token) }).then(asJson<RealChild[]>);

/** GET /api/children/:id — one child's full profile, including parent/carer contacts. */
export const fetchChild = (token: string, id: number | string): Promise<RealChildDetail> =>
  fetch(apiUrl(`/api/children/${id}`), { headers: authHeaders(token) }).then(asJson<RealChildDetail>);
