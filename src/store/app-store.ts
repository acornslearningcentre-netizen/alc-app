import { create } from 'zustand';
import type { Role, Variant } from '../data/types';

interface AppState {
  authed: boolean;
  role: Role;
  variant: Variant;
  parentChildId: string;
  login: (role: Role, opts?: { childId?: string }) => void;
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

export const useAppStore = create<AppState>((set) => ({
  authed: ls('alc.authed', '') === '1',
  role: (ls('alc.role', 'teacher') as Role),
  variant: (ls('alc.variant', 'calm') as Variant),
  parentChildId: ls('alc.parentChildId', 'c1'),

  login(role, opts = {}) {
    const childId = opts.childId ?? ls('alc.parentChildId', 'c1');
    localStorage.setItem('alc.authed', '1');
    localStorage.setItem('alc.role', role);
    if (opts.childId) localStorage.setItem('alc.parentChildId', opts.childId);
    set({ authed: true, role, parentChildId: childId });
  },

  logout() {
    localStorage.removeItem('alc.authed');
    set({ authed: false });
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
