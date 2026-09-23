import { describe, it, expect } from 'vitest';
import { computeMastery, computeAttendance, computeStreak, computeTrend } from './progress.js';

describe('computeMastery', () => {
  it('returns null when nothing has been decided yet — never fabricates 0%', () => {
    expect(computeMastery([])).toBe(null);
    expect(computeMastery([{ status: 'pending' }, { status: 'pending' }])).toBe(null);
  });

  it('is the % of decided rows that were accepted, ignoring pending rows', () => {
    expect(computeMastery([
      { status: 'accepted' }, { status: 'accepted' }, { status: 'edited' }, { status: 'pending' },
    ])).toBeCloseTo(66.7, 1);
  });

  it('is 100 when every decided row was accepted', () => {
    expect(computeMastery([{ status: 'accepted' }, { status: 'accepted' }])).toBe(100);
  });
});

describe('computeAttendance', () => {
  it('is 0 when there are no observations at all', () => {
    expect(computeAttendance([], '2026-09-23', 30)).toBe(0);
  });

  it('counts each distinct day with at least one observation once', () => {
    const dates = ['2026-09-23T09:00:00Z', '2026-09-23T15:00:00Z', '2026-09-22T09:00:00Z'];
    expect(computeAttendance(dates, '2026-09-23', 10)).toBe(20); // 2 of 10 days
  });

  it('ignores observations outside the window', () => {
    const dates = ['2026-01-01T09:00:00Z'];
    expect(computeAttendance(dates, '2026-09-23', 30)).toBe(0);
  });
});

describe('computeStreak', () => {
  it('is 0 when there is no observation on asOfDate itself', () => {
    expect(computeStreak(['2026-09-20T09:00:00Z'], '2026-09-23')).toBe(0);
  });

  it('counts consecutive days ending at asOfDate', () => {
    const dates = ['2026-09-23T09:00:00Z', '2026-09-22T09:00:00Z', '2026-09-21T09:00:00Z'];
    expect(computeStreak(dates, '2026-09-23')).toBe(3);
  });

  it('stops at the first gap, even if there is older data beyond it', () => {
    const dates = ['2026-09-23T09:00:00Z', '2026-09-21T09:00:00Z'];
    expect(computeStreak(dates, '2026-09-23')).toBe(1);
  });
});

describe('computeTrend', () => {
  it('is steady when there is no prior snapshot to compare against', () => {
    expect(computeTrend(80, null)).toBe('steady');
    expect(computeTrend(80, undefined)).toBe('steady');
  });

  it('is steady when the current value is null (not enough data to compare)', () => {
    expect(computeTrend(null, 70)).toBe('steady');
  });

  it('is up/down/flat based on a genuine comparison', () => {
    expect(computeTrend(80, 70)).toBe('up');
    expect(computeTrend(60, 70)).toBe('down');
    expect(computeTrend(70, 70)).toBe('flat');
  });
});
