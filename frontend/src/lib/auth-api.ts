// Client for the real backend auth endpoints (SCRUM-16/17). Replaces the
// hardcoded ALC_DATA.parentPasscodes/studentPasscodes checks and the fake
// "Continue with Google/Microsoft" buttons that never called anything real.
import { apiUrl } from './api-base';

export interface AuthUser {
  id: number;
  role: 'teacher' | 'parent' | 'student' | 'leader';
  name: string;
  email: string | null;
  childId: string | null;
  teacherId: string | null;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

async function parseJsonOrThrow(res: Response): Promise<AuthSession> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Something went wrong (${res.status}). Try again.`);
  return body as AuthSession;
}

/** Staff (teacher/leader) sign-in — POST /api/auth/login. */
export async function loginWithPassword(email: string, password: string): Promise<AuthSession> {
  const res = await fetch(apiUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return parseJsonOrThrow(res);
}

/** Parent/student sign-in — POST /api/auth/passcode. */
export async function loginWithPasscode(passcode: string, role: 'parent' | 'student'): Promise<AuthSession> {
  const res = await fetch(apiUrl('/api/auth/passcode'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passcode, role }),
  });
  return parseJsonOrThrow(res);
}

/** GET /api/auth/me — used to validate a stored session on app load. */
export async function fetchMe(token: string): Promise<AuthUser> {
  const res = await fetch(apiUrl('/api/auth/me'), {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || 'Session expired');
  return body as AuthUser;
}

/** POST /api/auth/logout — best-effort; the client signs out regardless. */
export async function logoutSession(token: string): Promise<void> {
  try {
    await fetch(apiUrl('/api/auth/logout'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // Network hiccup on logout shouldn't block the client from clearing its own state.
  }
}
