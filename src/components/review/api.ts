// Tiny fetch helpers for the Review Guide. Endpoints live on the same origin
// (Express in production, Vite proxy in dev).
export interface AreaFeedback {
  id: number;
  area_key: string;
  area_label: string;
  comment: string;
  author: string | null;
  role: string | null;
  created_at: string;
}

export type Priority = 'important' | 'nice' | 'v2';

export interface FeatureFeedback {
  id: number;
  feature_key: string;
  feature_label: string;
  comment: string;
  author: string | null;
  role: string | null;
  priority: Priority | null;
  created_at: string;
}

export interface FeatureRequest {
  id: number;
  feature: string;
  description: string;
  author: string | null;
  priority: Priority | null;
  created_at: string;
  updated_at: string;
}

export const PRIORITY_OPTIONS: { value: Priority; label: string; emoji: string }[] = [
  { value: 'important', label: 'Important', emoji: '🔴' },
  { value: 'nice', label: 'Nice to have', emoji: '🟡' },
  { value: 'v2', label: 'Save for v2', emoji: '🔵' },
];

export const PRIORITY_META: Record<Priority, { label: string; emoji: string }> = {
  important: { label: 'Important', emoji: '🔴' },
  nice: { label: 'Nice to have', emoji: '🟡' },
  v2: { label: 'Save for v2', emoji: '🔵' },
};

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText}${text ? ` \u2014 ${text}` : ''}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

export const reviewApi = {
  // Area feedback
  listAreaFeedback: () => http<AreaFeedback[]>('/api/review/area-feedback'),
  addAreaFeedback: (b: { area_key: string; area_label: string; comment: string; author?: string; role?: string }) =>
    http<AreaFeedback>('/api/review/area-feedback', { method: 'POST', body: JSON.stringify(b) }),
  updateAreaFeedback: (id: number, b: { comment: string; author?: string }) =>
    http<AreaFeedback>(`/api/review/area-feedback/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
  deleteAreaFeedback: (id: number) =>
    http<void>(`/api/review/area-feedback/${id}`, { method: 'DELETE' }),

  // Feature feedback
  listFeatureFeedback: () => http<FeatureFeedback[]>('/api/review/feature-feedback'),
  addFeatureFeedback: (b: { feature_key: string; feature_label: string; comment: string; author?: string; role?: string; priority?: Priority | null }) =>
    http<FeatureFeedback>('/api/review/feature-feedback', { method: 'POST', body: JSON.stringify(b) }),
  updateFeatureFeedback: (id: number, b: { comment: string; author?: string; priority?: Priority | null }) =>
    http<FeatureFeedback>(`/api/review/feature-feedback/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
  deleteFeatureFeedback: (id: number) =>
    http<void>(`/api/review/feature-feedback/${id}`, { method: 'DELETE' }),

  // Requests
  listRequests: () => http<FeatureRequest[]>('/api/review/requests'),
  addRequest: (b: { feature: string; description: string; author?: string; priority?: Priority | null }) =>
    http<FeatureRequest>('/api/review/requests', { method: 'POST', body: JSON.stringify(b) }),
  updateRequest: (id: number, b: { feature: string; description: string; author?: string; priority?: Priority | null }) =>
    http<FeatureRequest>(`/api/review/requests/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
  deleteRequest: (id: number) =>
    http<void>(`/api/review/requests/${id}`, { method: 'DELETE' }),
};
