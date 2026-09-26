import { describe, it, expect } from 'vitest';
import { mondayOf, isoDate } from './dates';

describe('isoDate', () => {
  it('formats a local date as YYYY-MM-DD', () => {
    expect(isoDate(new Date(2026, 8, 5))).toBe('2026-09-05');
  });

  it('pads single-digit month and day', () => {
    expect(isoDate(new Date(2026, 0, 3))).toBe('2026-01-03');
  });
});

describe('mondayOf', () => {
  it('returns the same date when given a Monday', () => {
    expect(mondayOf(new Date(2026, 8, 21))).toBe('2026-09-21'); // 21 Sep 2026 is a Monday
  });

  it('walks back to Monday for a midweek date', () => {
    expect(mondayOf(new Date(2026, 8, 24))).toBe('2026-09-21'); // Thursday
  });

  it('walks back to Monday for a Sunday', () => {
    expect(mondayOf(new Date(2026, 8, 27))).toBe('2026-09-21'); // Sunday
  });

  it('handles a month boundary', () => {
    expect(mondayOf(new Date(2026, 9, 1))).toBe('2026-09-28'); // 1 Oct 2026 is a Thursday
  });
});
