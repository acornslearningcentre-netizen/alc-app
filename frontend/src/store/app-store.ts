import { create } from 'zustand';
import type { Role, Variant } from '../data/types';
import { logoutSession } from '../lib/auth-api';

interface AppState {
  authed: boolean;
  role: Role;
  variant: Variant;
  parentChildId: string;
  /** Real session token from POST /api/auth/login|passcode — null pre-SCRUM-100 or for stale sessions. */
  token: string | null;
  /** Signed-in person's real name, from the auth API — used for greetings. */
  userName: string | null;
  /** Signed-in teacher's id, from the auth API. No real roster yet (SCRUM-22) — carried
   *  now so "children under this teacher's care" filtering is a small change later, not
   *  a re-plumb of the login flow. */
  teacherId: string | null;
  login: (role: Role, opts?: { childId?: string; token?: string; name?: string; teacherId?: string | null }) => void;
  logout: () => void;
  setRole: (role: Role) => void;
  setVariant: (variant: Variant) => void;
  setParentChildId: (id: string) => void;
}

/** Reads localStorage with a fallback */
function ls(key: string, fallback: string): string {
  try { return localStorage.getItem(key) ?? fallback; }
  catch { return fallback; }
}

function lsOrNull(key: string): string | null {
  try { return localStorage.getItem(key); }
  catch { return null; }
}

export const useAppStore = create<AppState>((set, get) => ({
  authed: ls('alc.authed', '') === '1',
  role: (ls('alc.role', 'teacher') as Role),
  variant: (ls('alc.variant', 'calm') as Variant),
  parentChildId: ls('alc.parentChildId', 'c1'),
  token: lsOrNull('alc.token'),
  userName: lsOrNull('alc.userName'),
  teacherId: lsOrNull('alc.teacherId'),

  login(role, opts = {}) {
    const childId = opts.childId ?? ls('alc.parentChildId', 'c1');
    localStorage.setItem('alc.authed', '1');
    localStorage.setItem('alc.role', role);
    if (opts.childId) localStorage.setItem('alc.parentChildId', opts.childId);

    if (opts.token) localStorage.setItem('alc.token', opts.token);
    else localStorage.removeItem('alc.token');

    if (opts.name) localStorage.setItem('alc.userName', opts.name);
    else localStorage.removeItem('alc.userName');

    if (opts.teacherId) localStorage.setItem('alc.teacherId', opts.teacherId);
    else localStorage.removeItem('alc.teacherId');

    set({
      authed: true,
      role,
      parentChildId: childId,
      token: opts.token ?? null,
      userName: opts.name ?? null,
      teacherId: opts.teacherId ?? null,
    });
  },

  logout() {
    const token = get().token;
    if (token) void logoutSession(token); // best-effort; don't block clearing local state on it
    localStorage.removeItem('alc.authed');
    localStorage.removeItem('alc.token');
    localStorage.removeItem('alc.userName');
    localStorage.removeItem('alc.teacherId');
    set({ authed: false, token: null, userName: null, teacherId: null });
  },

  setRole(role) {
    localStorage.setItem('alc.role', role);
    set({ role });
  },

  setVariant(variant) {
    localStorage.setItem('alc.variant', variant);
    set({ variant });
  },

  setParentChildId(id) {
    localStorage.setItem('alc.parentChildId', id);
    set({ parentChildId: id });
  },
}));
