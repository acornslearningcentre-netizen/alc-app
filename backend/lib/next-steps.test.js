import { describe, it, expect } from 'vitest';
import { composeNextStepSuggestion } from './next-steps.js';

const child = { name: 'Amara' };

describe('composeNextStepSuggestion', () => {
  it('returns null when there is no recent observation data — never invents a suggestion', () => {
    expect(composeNextStepSuggestion(child, [])).toBe(null);
    expect(composeNextStepSuggestion(child, null)).toBe(null);
  });

  it('references the real child name and the real note text', () => {
    const s = composeNextStepSuggestion(child, [
      { kind: 'text', comment: 'Counted to 20 unprompted while sorting bead chains.', tags: [], mood: null, captured_at: '2026-09-20' },
    ]);
    expect(s.title).toContain('Amara');
    expect(s.rationale).toContain('Counted to 20 unprompted while sorting bead chains.');
  });

  it('weaves in real tags when present', () => {
    const s = composeNextStepSuggestion(child, [
      { kind: 'text', comment: 'Loved the water table today.', tags: ['curious', 'focused'], mood: null, captured_at: '2026-09-20' },
    ]);
    expect(s.title).toContain('curious and focused');
  });

  it('falls back to mood when there are no tags', () => {
    const s = composeNextStepSuggestion(child, [
      { kind: 'text', comment: 'Quiet morning.', tags: [], mood: 'calm', captured_at: '2026-09-20' },
    ]);
    expect(s.title).toContain('calm');
  });

  it('handles a media-only observation with no text gracefully', () => {
    const s = composeNextStepSuggestion(child, [
      { kind: 'image', comment: null, transcript: null, tags: [], mood: null, captured_at: '2026-09-20' },
    ]);
    expect(s).not.toBe(null);
    expect(s.rationale).toContain('image');
    expect(s.rationale).toContain('2026-09-20');
  });

  it('only looks at the most recent observation, not older ones', () => {
    const s = composeNextStepSuggestion(child, [
      { kind: 'text', comment: 'Newest note.', tags: [], mood: null, captured_at: '2026-09-21' },
      { kind: 'text', comment: 'Older note that should be ignored.', tags: [], mood: null, captured_at: '2026-09-01' },
    ]);
    expect(s.rationale).toContain('Newest note.');
    expect(s.rationale).not.toContain('Older note');
  });
});
