import { describe, it, expect } from 'vitest';
import { ageFromDob, initialsFromName } from './child-fields';

describe('ageFromDob', () => {
  const today = new Date('2026-09-25T00:00:00Z');

  it('computes a whole-years age', () => {
    expect(ageFromDob('2021-01-15', today)).toBe(5);
  });

  it('has not had this year\'s birthday yet', () => {
    expect(ageFromDob('2021-12-01', today)).toBe(4);
  });

  it('turns the birthday today', () => {
    expect(ageFromDob('2021-09-25', today)).toBe(5);
  });

  it('returns null for no dob on record', () => {
    expect(ageFromDob(null, today)).toBeNull();
    expect(ageFromDob(undefined, today)).toBeNull();
    expect(ageFromDob('', today)).toBeNull();
  });

  it('returns null for an unparseable dob rather than throwing', () => {
    expect(ageFromDob('not a date', today)).toBeNull();
  });
});

describe('initialsFromName', () => {
  it('takes the first letter of up to two words', () => {
    expect(initialsFromName('Amara Osei')).toBe('AO');
  });

  it('handles a single-word name', () => {
    expect(initialsFromName('Kofi')).toBe('K');
  });

  it('caps at two initials for longer names', () => {
    expect(initialsFromName('Jean Claude Van Damme')).toBe('JC');
  });

  it('collapses extra whitespace', () => {
    expect(initialsFromName('  Amara   Osei  ')).toBe('AO');
  });
});
