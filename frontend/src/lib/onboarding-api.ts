// Client for the already-working onboarding backend (prospects, intake_responses,
// assessments, observations — backend/server.js). Built alongside SCRUM-89's
// staff screens, which are the first thing to ever call these endpoints from
// the frontend; the API and DB have existed since the public intake form shipped.
import { apiUrl } from './api-base';

export type ProspectStatus = 'prospect' | 'booked' | 'assessed' | 'enrolled' | 'declined';

export interface Prospect {
  id: number;
  parent_email: string;
  parent_name: string | null;
  parent_phone: string | null;
  child_first_name: string | null;
  child_dob: string | null;
  year_group: string | null;
  homework_in_plan: string | null;
  tech_comfort_parent: string | null;
  tech_comfort_child: string | null;
  flagged_needs: boolean;
  consent_notes: boolean;
  consent_media: boolean;
  status: ProspectStatus;
  created_at: string;
  updated_at: string;
}

export interface Assessment {
  id: number;
  prospect_id: number;
  scheduled_for: string | null;
  teacher_id: string | null;
  status: 'scheduled' | 'in_progress' | 'done';
  report_draft: string | null;
  report_signed_off_at: string | null;
  sent_to_parent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Observation {
  id: number;
  prospect_id: number | null;
  child_id: string | null;
  teacher_id: string | null;
  kind: 'image' | 'video' | 'voice' | 'text';
  media_url: string | null;
  transcript: string | null;
  comment: string | null;
  captured_at: string;
}

export interface ProspectDetail extends Prospect {
  intake: { answers: Record<string, unknown>; submitted_at: string } | null;
  assessments: Assessment[];
  observations: Observation[];
}

async function asJson<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Something went wrong (${res.status}).`);
  return body as T;
}

const jsonHeaders = { 'Content-Type': 'application/json' };

export const listProspects = (status?: ProspectStatus): Promise<Prospect[]> =>
  fetch(apiUrl(`/api/prospects${status ? `?status=${status}` : ''}`)).then(asJson<Prospect[]>);

export const getProspect = (id: number): Promise<ProspectDetail> =>
  fetch(apiUrl(`/api/prospects/${id}`)).then(asJson<ProspectDetail>);

export const updateProspectStatus = (id: number, status: ProspectStatus): Promise<Prospect> =>
  fetch(apiUrl(`/api/prospects/${id}`), {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify({ status }),
  }).then(asJson<Prospect>);

export const listAssessments = (status?: Assessment['status']): Promise<Assessment[]> =>
  fetch(apiUrl(`/api/assessments${status ? `?status=${status}` : ''}`)).then(asJson<Assessment[]>);

export const bookAssessment = (input: { prospect_id: number; scheduled_for: string; teacher_id?: string }): Promise<Assessment> =>
  fetch(apiUrl('/api/assessments'), {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(input),
  }).then(asJson<Assessment>);

export const updateAssessmentDraft = (id: number, report_draft: string): Promise<Assessment> =>
  fetch(apiUrl(`/api/assessments/${id}`), {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify({ report_draft }),
  }).then(asJson<Assessment>);

export const signOffAssessment = (id: number): Promise<Assessment> =>
  fetch(apiUrl(`/api/assessments/${id}/sign-off`), { method: 'POST' }).then(asJson<Assessment>);

export const sendAssessment = (id: number): Promise<Assessment> =>
  fetch(apiUrl(`/api/assessments/${id}/send`), { method: 'POST' }).then(asJson<Assessment>);

export const createObservation = (input: {
  prospect_id: number;
  kind: Observation['kind'];
  comment?: string;
  media_url?: string;
  transcript?: string;
}): Promise<Observation> =>
  fetch(apiUrl('/api/observations'), {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(input),
  }).then(asJson<Observation>);
