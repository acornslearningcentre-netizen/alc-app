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

export interface FeatureFeedback {
  id: number;
  feature_key: string;
  feature_label: string;
  comment: string;
  author: string | null;
  role: string | null;
  created_at: string;
}

export interface FeatureRequest {
  id: number;
  feature: string;
  description: string;
  author: string | null;
  created_at: string;
  updated_at: string;
}

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText}${text ? ` \u2014 ${text}` : ''}`);
  }
  return res.json() as Promise<T>;
}

export const reviewApi = {
  listAreaFeedback: () => http<AreaFeedback[]>('/api/review/area-feedback'),
  addAreaFeedback: (b: { area_key: string; area_label: string; comment: string; author?: string; role?: string }) =>
    http<AreaFeedback>('/api/review/area-feedback', { method: 'POST', body: JSON.stringify(b) }),

  listFeatureFeedback: () => http<FeatureFeedback[]>('/api/review/feature-feedback'),
  addFeatureFeedback: (b: { feature_key: string; feature_label: string; comment: string; author?: string; role?: string }) =>
    http<FeatureFeedback>('/api/review/feature-feedback', { method: 'POST', body: JSON.stringify(b) }),

  listRequests: () => http<FeatureRequest[]>('/api/review/requests'),
  addRequest: (b: { feature: string; description: string; author?: string }) =>
    http<FeatureRequest>('/api/review/requests', { method: 'POST', body: JSON.stringify(b) }),
  updateRequest: (id: number, b: { feature: string; description: string; author?: string }) =>
    http<FeatureRequest>(`/api/review/requests/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
};
