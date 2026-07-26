// Pure request-shape helpers — no DB, no Express, no side effects.
// Extracted so they're unit-testable without a live Postgres connection.

export const trim = (v) => (typeof v === 'string' ? v.trim() : '');
export const optional = (v) => (trim(v) || null);

export const PRIORITIES = new Set(['important', 'nice', 'v2']);
export const cleanPriority = (v) => (PRIORITIES.has(trim(v)) ? trim(v) : null);

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isEmail = (s) => EMAIL_RE.test(trim(s));

export const toBool = (v) => {
  if (v === true || v === 1) return true;
  if (typeof v === 'string' && /^(yes|true|1)$/i.test(v.trim())) return true;
  return false;
};

export const PROSPECT_STATUSES = new Set(['prospect', 'booked', 'assessed', 'enrolled', 'declined']);
export const ASSESSMENT_STATUSES = new Set(['scheduled', 'in_progress', 'done']);
export const OBSERVATION_KINDS = new Set(['image', 'video', 'voice', 'text']);

export const cleanProspectStatus = (v) => (PROSPECT_STATUSES.has(trim(v)) ? trim(v) : null);
export const cleanAssessmentStatus = (v) => (ASSESSMENT_STATUSES.has(trim(v)) ? trim(v) : null);
export const cleanObservationKind = (v) => (OBSERVATION_KINDS.has(trim(v)) ? trim(v) : null);

/** Parses a route param / query value as a positive integer id, or null if invalid. */
export const parsePositiveIntId = (raw) => {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

/** Splits a comma-separated CORS_ORIGIN env value into a clean list of origins. */
export const parseCorsOrigins = (raw) =>
  (raw || '').split(',').map((s) => s.trim()).filter(Boolean);
