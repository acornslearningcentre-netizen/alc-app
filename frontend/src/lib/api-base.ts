// Build-time API origin. The frontend and backend are separate Railway
// services now, so API calls can no longer assume same-origin `/api/...`.
// VITE_API_BASE_URL should be the backend service's URL with no trailing
// slash (e.g. "https://alc-app-production.up.railway.app"). Left unset,
// API calls stay relative to whatever origin served the page — that's
// only correct when frontend and backend share an origin (not the case
// once deployed as separate Railway services).
const rawBase = (import.meta.env.VITE_API_BASE_URL ?? '').trim();
export const API_BASE = rawBase.replace(/\/+$/, '');

/** Prefixes a `/api/...` path with the configured backend origin. */
export const apiUrl = (path: string): string => `${API_BASE}${path}`;
