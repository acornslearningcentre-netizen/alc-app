import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildChildContext, askAssistant } from './assistant.js';

describe('buildChildContext', () => {
  it('includes the real child name and real observation notes', () => {
    const ctx = buildChildContext({
      childName: 'Verifina',
      observations: [{ kind: 'text', comment: 'Loved the golden beads today.', captured_at: '2026-09-20' }],
      progress: null,
    });
    expect(ctx).toContain('Child: Verifina');
    expect(ctx).toContain('Loved the golden beads today.');
  });

  it('carries tags and mood into the context when present', () => {
    const ctx = buildChildContext({
      childName: 'Verifina',
      observations: [{ kind: 'text', comment: 'Quiet morning.', tags: ['calm', 'focused'], mood: 'content', captured_at: '2026-09-20' }],
      progress: null,
    });
    expect(ctx).toContain('tags: calm, focused');
    expect(ctx).toContain('mood: content');
  });

  it('never fabricates observation data — says so honestly when there is none', () => {
    const ctx = buildChildContext({ childName: 'Kofi', observations: [], progress: null });
    expect(ctx).toContain('No observations recorded yet.');
  });

  it('handles a media-only observation with no written note', () => {
    const ctx = buildChildContext({
      childName: 'Verifina',
      observations: [{ kind: 'image', comment: null, transcript: null, captured_at: '2026-09-20' }],
      progress: null,
    });
    expect(ctx).toContain('[image observation, no written note]');
  });

  it('reports "not enough data yet" for null mastery rather than a fake number', () => {
    const ctx = buildChildContext({
      childName: 'Kofi',
      observations: [],
      progress: { mastery: null, attendance: 0, streak: 0, trend: 'steady' },
    });
    expect(ctx).toContain('not enough data yet');
    expect(ctx).not.toContain('null%');
  });

  it('includes real progress numbers when present', () => {
    const ctx = buildChildContext({
      childName: 'Verifina',
      observations: [],
      progress: { mastery: 66.7, attendance: 3.3, streak: 0, trend: 'steady' },
    });
    expect(ctx).toContain('Mastery: 66.7%');
    expect(ctx).toContain('Attendance: 3.3%');
  });

  it('says so when there is no progress data at all', () => {
    const ctx = buildChildContext({ childName: 'Kofi', observations: [], progress: null });
    expect(ctx).toContain('No progress data recorded yet.');
  });
});

describe('askAssistant', () => {
  const OLD_ENV = process.env;
  beforeEach(() => { process.env = { ...OLD_ENV }; });
  afterEach(() => { process.env = OLD_ENV; vi.restoreAllMocks(); });

  it('throws a clear error when ANTHROPIC_API_KEY is not configured', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    await expect(askAssistant({
      childName: 'Verifina', observations: [], progress: null, history: [], question: 'How is she doing?',
    })).rejects.toThrow(/ANTHROPIC_API_KEY/);
  });
});
