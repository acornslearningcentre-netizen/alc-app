import { describe, it, expect } from 'vitest';
import {
  trim, optional, cleanPriority, isEmail, toBool,
  cleanProspectStatus, cleanAssessmentStatus, cleanObservationKind,
  cleanTone, cleanPronoun, cleanFlowState, isIsoDate, isTimeHHMM,
  cleanNextStepStatus, cleanDay, cleanPlanStatus,
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
  it('cleanTone accepts only known tones', () => {
    expect(cleanTone('sage')).toBe('sage');
    expect(cleanTone('bogus')).toBe(null);
  });
  it('cleanPronoun accepts only known pronouns', () => {
    expect(cleanPronoun('they')).toBe('they');
    expect(cleanPronoun('bogus')).toBe(null);
  });
  it('cleanFlowState accepts only known states', () => {
    expect(cleanFlowState('now')).toBe('now');
    expect(cleanFlowState('bogus')).toBe(null);
  });
  it('cleanNextStepStatus accepts only known statuses', () => {
    expect(cleanNextStepStatus('accepted')).toBe('accepted');
    expect(cleanNextStepStatus('bogus')).toBe(null);
  });
  it('cleanDay accepts only known weekday abbreviations', () => {
    expect(cleanDay('Wed')).toBe('Wed');
    expect(cleanDay('Wednesday')).toBe(null);
    expect(cleanDay('bogus')).toBe(null);
  });
  it('cleanPlanStatus accepts only known statuses', () => {
    expect(cleanPlanStatus('edited')).toBe('edited');
    expect(cleanPlanStatus('bogus')).toBe(null);
  });
});

describe('isIsoDate', () => {
  it('accepts YYYY-MM-DD', () => {
    expect(isIsoDate('2026-09-22')).toBe(true);
  });
  it('rejects other formats and garbage', () => {
    expect(isIsoDate('22-09-2026')).toBe(false);
    expect(isIsoDate('2026/09/22')).toBe(false);
    expect(isIsoDate('not a date')).toBe(false);
    expect(isIsoDate('')).toBe(false);
    expect(isIsoDate(undefined)).toBe(false);
  });
});

describe('isTimeHHMM', () => {
  it('accepts zero-padded 24hr HH:MM', () => {
    expect(isTimeHHMM('08:30')).toBe(true);
    expect(isTimeHHMM('23:59')).toBe(true);
    expect(isTimeHHMM('00:00')).toBe(true);
  });
  it('rejects out-of-range or malformed values', () => {
    expect(isTimeHHMM('24:00')).toBe(false);
    expect(isTimeHHMM('9:30')).toBe(false);
    expect(isTimeHHMM('08:60')).toBe(false);
    expect(isTimeHHMM('8:30am')).toBe(false);
    expect(isTimeHHMM('')).toBe(false);
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
