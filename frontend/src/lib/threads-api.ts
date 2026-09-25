// Client for the real Teacher <-> Parent Messaging backend (SCRUM-54-58).
// Replaces the fixed ALC_DATA.threads sample conversations.
import { apiUrl } from './api-base';

export interface RealThread {
  id: number;
  teacher_id: number;
  child_id: number;
  parent_name: string;
  created_at: string;
  child_name: string;
  unread_count: number;
}

export interface RealMessage {
  id: number;
  thread_id: number;
  sender_role: 'teacher' | 'parent';
  sender_name: string;
  body: string;
  sent_at: string;
  read_at: string | null;
}

async function asJson<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Something went wrong (${res.status}).`);
  return body as T;
}

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

/** GET /api/threads — every real thread this user is a participant in (or oversees, for a leader). */
export const fetchThreads = (token: string): Promise<RealThread[]> =>
  fetch(apiUrl('/api/threads'), { headers: authHeaders(token) }).then(asJson<RealThread[]>);

/** GET /api/threads/:id/messages — a conversation in order; marks the other party's messages read as a side effect. */
export const fetchThreadMessages = (token: string, threadId: number): Promise<RealMessage[]> =>
  fetch(apiUrl(`/api/threads/${threadId}/messages`), { headers: authHeaders(token) }).then(asJson<RealMessage[]>);

/** POST /api/threads/:id/messages — sends a message as the signed-in teacher/parent. */
export const sendThreadMessage = (token: string, threadId: number, body: string): Promise<RealMessage> =>
  fetch(apiUrl(`/api/threads/${threadId}/messages`), {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  }).then(asJson<RealMessage>);
