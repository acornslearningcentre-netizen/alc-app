// Client for the real AI Assistant Chat backend (SCRUM-59-62) — a genuine
// LLM call grounded in a child's real observations and latest progress
// snapshot (lib/assistant.js server-side), not a canned/regex response.
import { apiUrl } from './api-base';

export interface AssistantMessage {
  id: number;
  conversation_id: number;
  sender: 'user' | 'assistant';
  text: string;
  created_at: string;
}

export interface AssistantHistory {
  conversation_id: number | null;
  child_id: number | null;
  messages: AssistantMessage[];
}

export interface AssistantAskResult {
  conversation_id: number;
  messages: AssistantMessage[];
}

async function asJson<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Something went wrong (${res.status}).`);
  return body as T;
}

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

/** GET /api/assistant/history?child_id=X — this user's most recent conversation about a child. */
export const fetchAssistantHistory = (token: string, childId?: number | string): Promise<AssistantHistory> =>
  fetch(apiUrl(`/api/assistant/history${childId ? `?child_id=${childId}` : ''}`), { headers: authHeaders(token) }).then(asJson<AssistantHistory>);

/** POST /api/assistant/ask — a real, grounded answer from the assistant. Can take a few seconds (live LLM call). */
export const askAssistant = (token: string, childId: number | string, question: string): Promise<AssistantAskResult> =>
  fetch(apiUrl('/api/assistant/ask'), {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ child_id: childId, question }),
  }).then(asJson<AssistantAskResult>);
