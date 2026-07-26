import { describe, it, expect } from 'vitest';
import {
  trim, optional, cleanPriority, isEmail, toBool,
  cleanProspectStatus, cleanAssessmentStatus, cleanObservationKind,
  parsePositiveIntId, parseCorsOrigins,
} from './validators.js';

describe('trim', () => {
  it('trims whitespace off a string', () => {
    expect(trim('  hello  ')).toBe('hello');
  });
  it('returns empty string for non-strings', () => {
    expect(trim(undefined)).toBe('');
    expect(trim(null)).toBe('');
    expect(trim(42)).toBe('');
  });
});

describe('optional', () => {
  it('returns the trimmed value when present', () => {
    expect(optional('  hi  ')).toBe('hi');
  });
  it('returns null for empty/whitespace-only input', () => {
    expect(optional('')).toBe(null);
    expect(optional('   ')).toBe(null);
    expect(optional(undefined)).toBe(null);
  });
});

describe('cleanPriority', () => {
  it('accepts known priorities', () => {
    expect(cleanPriority('important')).toBe('important');
    expect(cleanPriority('nice')).toBe('nice');
    expect(cleanPriority('v2')).toBe('v2');
  });
  it('rejects unknown values', () => {
    expect(cleanPriority('urgent')).toBe(null);
    expect(cleanPriority('')).toBe(null);
    expect(cleanPriority(undefined)).toBe(null);
  });
});

describe('isEmail', () => {
  it('accepts a plausible email', () => {
    expect(isEmail('ana@acornslearningcentre.com')).toBe(true);
  });
  it('rejects things that are not emails', () => {
    expect(isEmail('not-an-email')).toBe(false);
    expect(isEmail('missing-at.com')).toBe(false);
    expect(isEmail('')).toBe(false);
    expect(isEmail(undefined)).toBe(false);
  });
});

describe('toBool', () => {
  it('treats true/1 as true', () => {
    expect(toBool(true)).toBe(true);
    expect(toBool(1)).toBe(true);
  });
  it('treats yes/true/1 strings (case-insensitive) as true', () => {
    expect(toBool('yes')).toBe(true);
    expect(toBool('YES')).toBe(true);
    expect(toBool('true')).toBe(true);
    expect(toBool('1')).toBe(true);
  });
  it('treats everything else as false', () => {
    expect(toBool(false)).toBe(false);
    expect(toBool(0)).toBe(false);
    expect(toBool('no')).toBe(false);
    expect(toBool('')).toBe(false);
    expect(toBool(undefined)).toBe(false);
    expect(toBool(null)).toBe(false);
  });
});

describe('status cleaners', () => {
  it('cleanProspectStatus accepts only known statuses', () => {
    expect(cleanProspectStatus('enrolled')).toBe('enrolled');
    expect(cleanProspectStatus('bogus')).toBe(null);
  });
  it('cleanAssessmentStatus accepts only known statuses', () => {
    expect(cleanAssessmentStatus('in_progress')).toBe('in_progress');
    expect(cleanAssessmentStatus('bogus')).toBe(null);
  });
  it('cleanObservationKind accepts only known kinds', () => {
    expect(cleanObservationKind('voice')).toBe('voice');
    expect(cleanObservationKind('bogus')).toBe(null);
  });
});

describe('parsePositiveIntId', () => {
  it('accepts positive integers (including numeric strings)', () => {
    expect(parsePositiveIntId('42')).toBe(42);
    expect(parsePositiveIntId(42)).toBe(42);
  });
  it('rejects zero, negatives, decimals, and garbage', () => {
    expect(parsePositiveIntId('0')).toBe(null);
    expect(parsePositiveIntId('-5')).toBe(null);
    expect(parsePositiveIntId('1.5')).toBe(null);
    expect(parsePositiveIntId('abc')).toBe(null);
    expect(parsePositiveIntId(undefined)).toBe(null);
  });
});

describe('parseCorsOrigins', () => {
  it('splits a comma-separated list and trims whitespace', () => {
    expect(parseCorsOrigins('https://a.com, https://b.com')).toEqual([
      'https://a.com', 'https://b.com',
    ]);
  });
  it('returns an empty array for unset/empty input', () => {
    expect(parseCorsOrigins(undefined)).toEqual([]);
    expect(parseCorsOrigins('')).toEqual([]);
  });
  it('drops empty entries from trailing/double commas', () => {
    expect(parseCorsOrigins('https://a.com,,https://b.com,')).toEqual([
      'https://a.com', 'https://b.com',
    ]);
  });
});
