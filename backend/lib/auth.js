// Pure auth primitives — hashing, tokens, response shaping. No DB, no
// Express. The pepper is passed in explicitly rather than read from
// process.env here, so these are testable without touching real env state.
import crypto from 'node:crypto';

export const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
};

export const verifyPassword = (password, stored) => {
  if (!stored) return false;
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
};

export const hashPasscode = (passcode, pepper) =>
  crypto.createHmac('sha256', pepper).update(passcode).digest('hex');

export const genToken = () => crypto.randomBytes(32).toString('hex');

/** Strips password_hash/passcode_hash off a user row before it ever reaches a response. */
export const publicUser = (u) => u && ({
  id: u.id,
  role: u.role,
  name: u.name,
  email: u.email ?? null,
  childId: u.child_id ?? null,
  teacherId: u.teacher_id ?? null,
});
