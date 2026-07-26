import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, hashPasscode, genToken, publicUser } from './auth.js';

describe('hashPassword / verifyPassword', () => {
  it('verifies the correct password', () => {
    const stored = hashPassword('correct-horse-battery-staple');
    expect(verifyPassword('correct-horse-battery-staple', stored)).toBe(true);
  });

  it('rejects a wrong password', () => {
    const stored = hashPassword('correct-horse-battery-staple');
    expect(verifyPassword('wrong-password', stored)).toBe(false);
  });

  it('never stores the password in plain text', () => {
    const stored = hashPassword('secret123');
    expect(stored).not.toContain('secret123');
  });

  it('produces a different hash each time (random salt)', () => {
    const a = hashPassword('same-password');
    const b = hashPassword('same-password');
    expect(a).not.toBe(b);
    expect(verifyPassword('same-password', a)).toBe(true);
    expect(verifyPassword('same-password', b)).toBe(true);
  });

  it('rejects when stored hash is missing/malformed', () => {
    expect(verifyPassword('anything', null)).toBe(false);
    expect(verifyPassword('anything', undefined)).toBe(false);
    expect(verifyPassword('anything', 'not-a-valid-hash')).toBe(false);
  });
});

describe('hashPasscode', () => {
  it('is deterministic for the same passcode + pepper', () => {
    expect(hashPasscode('0000', 'pepper-a')).toBe(hashPasscode('0000', 'pepper-a'));
  });

  it('produces a different hash for a different pepper', () => {
    expect(hashPasscode('0000', 'pepper-a')).not.toBe(hashPasscode('0000', 'pepper-b'));
  });

  it('produces a different hash for a different passcode', () => {
    expect(hashPasscode('0000', 'pepper-a')).not.toBe(hashPasscode('1111', 'pepper-a'));
  });

  it('never stores the passcode in plain text', () => {
    expect(hashPasscode('0000', 'pepper-a')).not.toContain('0000');
  });
});

describe('genToken', () => {
  it('produces a long, hex-looking token', () => {
    const token = genToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('never produces the same token twice', () => {
    const tokens = new Set(Array.from({ length: 50 }, () => genToken()));
    expect(tokens.size).toBe(50);
  });
});

describe('publicUser', () => {
  it('strips password_hash and passcode_hash', () => {
    const row = {
      id: 1, role: 'teacher', name: 'Ana', email: 'ana@example.com',
      password_hash: 'salt:hash', passcode_hash: null,
      child_id: null, teacher_id: null,
    };
    const result = publicUser(row);
    expect(result).not.toHaveProperty('password_hash');
    expect(result).not.toHaveProperty('passcode_hash');
    expect(result).toEqual({
      id: 1, role: 'teacher', name: 'Ana', email: 'ana@example.com',
      childId: null, teacherId: null,
    });
  });

  it('maps child_id/teacher_id to camelCase', () => {
    const row = { id: 2, role: 'parent', name: 'Ravi Shah', email: null, child_id: 'c5', teacher_id: null };
    expect(publicUser(row)).toEqual({
      id: 2, role: 'parent', name: 'Ravi Shah', email: null, childId: 'c5', teacherId: null,
    });
  });

  it('returns a falsy value unchanged (no user found)', () => {
    expect(publicUser(null)).toBe(null);
    expect(publicUser(undefined)).toBe(undefined);
  });
});
