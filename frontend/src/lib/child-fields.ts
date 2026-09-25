// Pure helpers for turning real backend child fields into display values.
// No fetch, no React — safe to unit test directly.

/** Age in whole years as of today, from an ISO (YYYY-MM-DD) date of birth. Null when there's no dob on record yet. */
export function ageFromDob(dob: string | null | undefined, today: Date = new Date()): number | null {
  if (!dob) return null;
  const parsed = new Date(dob);
  if (Number.isNaN(parsed.getTime())) return null;
  let age = today.getFullYear() - parsed.getFullYear();
  const monthDiff = today.getMonth() - parsed.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsed.getDate())) age--;
  return age;
}

/** Up to 2 uppercase initials from a full name — used when a real child record has none set. */
export function initialsFromName(name: string): string {
  return name.split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}
