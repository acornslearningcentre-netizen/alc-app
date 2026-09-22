// Composes a next-step suggestion from a child's real recent observations —
// SCRUM-44. Template-based, not a live model call (same reasoning as
// lib/report-draft.js: no LLM API key is provisioned for this deployment).
// Weaves the real note/tags/mood into a suggestion instead of inventing one.

/**
 * @param {{ name: string }} child
 * @param {{ kind: string, comment?: string|null, transcript?: string|null, tags?: string[], mood?: string|null, captured_at: string }[]} recentObservations
 *   Most-recent-first. Empty array means "not enough data" — this returns null rather than fabricating a suggestion.
 * @returns {{ type: string, title: string, rationale: string } | null}
 */
export function composeNextStepSuggestion(child, recentObservations) {
  if (!recentObservations || recentObservations.length === 0) return null;

  const latest = recentObservations[0];
  const note = (latest.comment || latest.transcript || '').trim();
  const tags = Array.isArray(latest.tags) ? latest.tags.filter(Boolean) : [];
  const focus = tags.length ? tags.join(' and ') : (latest.mood || null);

  const title = focus
    ? `Build on ${child.name} being ${focus}`
    : `Check in on ${child.name}'s recent ${latest.kind} observation`;

  const rationale = note
    ? `Based on a recent note: "${note}"`
    : `Based on a recent ${latest.kind} observation captured on ${String(latest.captured_at).slice(0, 10)}.`;

  return { type: 'activity', title, rationale };
}
