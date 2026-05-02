import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../../store/app-store';
import { CLICKABLE_AREAS, FEATURES } from './inventory';
import {
  reviewApi,
  PRIORITY_OPTIONS,
  PRIORITY_META,
  type FeatureFeedback,
  type FeatureRequest,
  type Priority,
} from './api';

type Tab = 'areas' | 'features' | 'requests';

const ROLE_ORDER = ['login', 'teacher', 'parent', 'student', 'leader'] as const;
type RoleKey = (typeof ROLE_ORDER)[number];
const ROLE_LABEL: Record<string, string> = {
  login: 'Login',
  teacher: 'Teacher',
  parent: 'Parent',
  student: 'Student',
  leader: 'Leader',
};
const DEFAULT_ROLE: RoleKey = 'teacher';

const TAB_META: Record<Tab, { label: string; hint: string }> = {
  areas:    { label: 'Try these clicks',        hint: 'Interactions that work in this prototype' },
  features: { label: "What's in this prototype", hint: 'Each screen, with feedback' },
  requests: { label: 'Your ideas',               hint: 'Suggest something new' },
};

// ── Confirm dialog ─────────────────────────────────────────────────────
interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

const ConfirmCtx = createContext<(opts: ConfirmOptions) => Promise<boolean>>(
  () => Promise.resolve(false)
);
const useConfirm = () => useContext(ConfirmCtx);

const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => setState({ ...opts, resolve }));
  }, []);

  const close = (value: boolean) => { state?.resolve(value); setState(null); };

  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
      if (e.key === 'Enter')  close(true);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {state && (
        <div className="review-confirm-scrim" role="presentation"
             onClick={(e) => { if (e.target === e.currentTarget) close(false); }}>
          <div className="review-confirm" role="alertdialog" aria-modal="true"
               aria-labelledby="review-confirm-title" aria-describedby="review-confirm-message">
            <h3 id="review-confirm-title" className="review-confirm-title">{state.title}</h3>
            <p id="review-confirm-message" className="review-confirm-message">{state.message}</p>
            <div className="review-confirm-actions">
              <button type="button" className="btn ghost" onClick={() => close(false)} autoFocus>
                {state.cancelLabel ?? 'Cancel'}
              </button>
              <button type="button" className={`btn ${state.danger ? 'danger' : 'primary'}`} onClick={() => close(true)}>
                {state.confirmLabel ?? 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmCtx.Provider>
  );
};

const areaKey = (a: { role: string; screen: string; element: string }) =>
  `${a.role}/${a.screen}/${a.element}`;
const featureKey = (f: { role: string; screen: string }) => `${f.role}/${f.screen}`;

function useHashRoute(): [boolean, (open: boolean) => void] {
  const isReview = () => window.location.hash === '#review';
  const [open, setOpen] = useState<boolean>(isReview);
  useEffect(() => {
    const onChange = () => setOpen(isReview());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  const set = (next: boolean) => {
    if (next && window.location.hash !== '#review') window.location.hash = '#review';
    if (!next && window.location.hash === '#review') {
      history.replaceState(null, '', window.location.pathname + window.location.search);
      setOpen(false);
    }
  };
  return [open, set];
}

/**
 * Reviewer Guide — two-pane layout. Left sidebar holds every navigation
 * choice (tab + role). Right pane shows only the selected slice's content.
 */
export const ReviewGuide: React.FC = () => {
  const [open, setOpen] = useHashRoute();
  const [tab, setTab]   = useState<Tab>('areas');
  const [role, setRole] = useState<RoleKey>(DEFAULT_ROLE);
  const authed = useAppStore((s) => s.authed);
  const showFab = !authed;

  // Counts per role per tab — drives sidebar pills + auto-fallback when a role is empty
  const areaCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const a of CLICKABLE_AREAS) c[a.role] = (c[a.role] ?? 0) + 1;
    return c;
  }, []);
  const featureCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const f of FEATURES) c[f.role] = (c[f.role] ?? 0) + 1;
    return c;
  }, []);
  const countsForTab = (t: Tab) =>
    t === 'areas' ? areaCounts : t === 'features' ? featureCounts : null;

  // When switching tabs, fall back to a role that actually has rows in that tab
  useEffect(() => {
    const counts = countsForTab(tab);
    if (!counts) return;
    if ((counts[role] ?? 0) === 0) {
      const next = ROLE_ORDER.find((r) => (counts[r] ?? 0) > 0);
      if (next) setRole(next);
    }
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.body.classList.toggle('review-page-open', open);
    return () => document.body.classList.remove('review-page-open');
  }, [open]);

  const openInNewTab = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = `${window.location.pathname}${window.location.search}#review`;
    const win = window.open(url, '_blank', 'noopener');
    if (!win) setOpen(true);
  };

  return (
    <>
      {!open && showFab && (
        <a href="#review" target="_blank" rel="noopener" className="review-guide-fab"
           onClick={openInNewTab}
           aria-label="Open the reviewer guide in a new tab"
           title="Opens in a new tab so you can use it on a second screen">
          Review guide ↗
        </a>
      )}

      {open && (
        <div className="review-page review-page--split" role="region" aria-label="Reviewer guide">
          <ReviewSidebar
            tab={tab} role={role}
            areaCounts={areaCounts} featureCounts={featureCounts}
            onPick={(t, r) => { setTab(t); if (r) setRole(r); }}
            onClose={() => setOpen(false)}
          />

          <ConfirmProvider>
            <main className="review-content" id="review-content">
              <ReviewContentHeader tab={tab} role={role}/>
              {tab === 'areas'    && <AreasSection role={role}/>}
              {tab === 'features' && <FeaturesSection role={role}/>}
              {tab === 'requests' && <RequestsSection/>}
            </main>
          </ConfirmProvider>
        </div>
      )}
    </>
  );
};

// ── Sidebar ────────────────────────────────────────────────────────────
const ReviewSidebar: React.FC<{
  tab: Tab;
  role: RoleKey;
  areaCounts: Record<string, number>;
  featureCounts: Record<string, number>;
  onPick: (tab: Tab, role: RoleKey | null) => void;
  onClose: () => void;
}> = ({ tab, role, areaCounts, featureCounts, onPick, onClose }) => (
  <aside className="review-sidebar" aria-label="Reviewer navigation">
    <div className="review-sidebar-top">
      <button type="button" className="btn ghost review-page-back" onClick={onClose}>
        ← Back to app
      </button>
      <div className="review-sidebar-title">
        <h1>Reviewer guide</h1>
        <p>Pick what you want to look at, then leave a note.</p>
      </div>
    </div>

    <nav className="review-sidebar-nav" role="tablist" aria-label="Reviewer sections">
      <SidebarSection
        tab="areas"
        meta={TAB_META.areas}
        active={tab === 'areas'}
        roleActive={tab === 'areas' ? role : null}
        counts={areaCounts}
        onPickRole={(r) => onPick('areas', r)}
        onPickTab={() => onPick('areas', null)}
      />
      <SidebarSection
        tab="features"
        meta={TAB_META.features}
        active={tab === 'features'}
        roleActive={tab === 'features' ? role : null}
        counts={featureCounts}
        onPickRole={(r) => onPick('features', r)}
        onPickTab={() => onPick('features', null)}
      />
      <SidebarRequestsItem
        active={tab === 'requests'}
        onPick={() => onPick('requests', null)}
      />
    </nav>
  </aside>
);

const SidebarSection: React.FC<{
  tab: Tab;
  meta: { label: string; hint: string };
  active: boolean;
  roleActive: RoleKey | null;
  counts: Record<string, number>;
  onPickRole: (role: RoleKey) => void;
  onPickTab: () => void;
}> = ({ meta, active, roleActive, counts, onPickRole, onPickTab }) => {
  const visibleRoles = ROLE_ORDER.filter((r) => (counts[r] ?? 0) > 0);
  return (
    <div className={`review-sidebar-section${active ? ' active' : ''}`}>
      <button
        type="button"
        className={`review-sidebar-heading${active ? ' active' : ''}`}
        onClick={onPickTab}
        aria-expanded={active}>
        <span className="review-sidebar-heading-label">{meta.label}</span>
        <span className="review-sidebar-heading-hint">{meta.hint}</span>
      </button>
      {active && (
        <ul className="review-sidebar-list" role="tablist" aria-label={`${meta.label} — roles`}>
          {visibleRoles.map((r) => {
            const isActive = roleActive === r;
            return (
              <li key={r}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`review-sidebar-item role-${r}${isActive ? ' active' : ''}`}
                  onClick={() => onPickRole(r)}>
                  <span className="review-sidebar-dot" aria-hidden/>
                  <span className="review-sidebar-name">{ROLE_LABEL[r]}</span>
                  <span className="review-sidebar-count">{counts[r]}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

const SidebarRequestsItem: React.FC<{ active: boolean; onPick: () => void }> = ({ active, onPick }) => (
  <div className={`review-sidebar-section${active ? ' active' : ''}`}>
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={`review-sidebar-heading review-sidebar-heading--leaf${active ? ' active' : ''}`}
      onClick={onPick}>
      <span className="review-sidebar-heading-label">{TAB_META.requests.label}</span>
      <span className="review-sidebar-heading-hint">{TAB_META.requests.hint}</span>
    </button>
  </div>
);

// ── Content header (right pane) ────────────────────────────────────────
const ReviewContentHeader: React.FC<{ tab: Tab; role: RoleKey }> = ({ tab, role }) => {
  if (tab === 'requests') {
    return (
      <header className="review-content-head">
        <h2>Your ideas</h2>
        <p>Add anything you'd like to see in the app. You can edit or delete your idea later.</p>
      </header>
    );
  }
  const meta = TAB_META[tab];
  const roleLabel = ROLE_LABEL[role];
  const blurb = tab === 'areas'
    ? 'These are the interactions that actually work in this prototype. Tap "Suggest a change" on any row to share what you’d like adjusted.'
    : 'Each screen and what it does. Read-only — to leave feedback, switch to "Try these clicks".';
  return (
    <header className="review-content-head">
      <div className="review-content-crumbs">
        <span>{meta.label}</span>
        <span aria-hidden>·</span>
        <span className={`review-crumb-role role-${role}`}>{roleLabel}</span>
      </div>
      <h2>{roleLabel}</h2>
      <p>{blurb}</p>
    </header>
  );
};

// ── Section: Clickable areas (interactive — feedback lives HERE) ─────
const AreasSection: React.FC<{ role: RoleKey }> = ({ role }) => {
  const [notes, setNotes] = useState<FeatureFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    reviewApi.listFeatureFeedback()
      .then(setNotes).catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    const m = new Map<string, FeatureFeedback[]>();
    for (const n of notes) {
      const arr = m.get(n.feature_key) ?? [];
      arr.push(n);
      m.set(n.feature_key, arr);
    }
    return m;
  }, [notes]);

  if (loading) return <div className="review-loading">Loading…</div>;

  const items = CLICKABLE_AREAS.filter((a) => a.role === role);

  return (
    <>
      {error && <div className="review-error">Couldn’t load notes: {error}</div>}
      <ul className="review-cards">
        {items.map((a) => {
          const key = areaKey(a);
          const list = grouped.get(key) ?? [];
          return (
            <AreaCard
              key={key}
              area={a}
              notes={list}
              onCreate={(n) => setNotes((prev) => [n, ...prev])}
              onUpdate={(n) => setNotes((prev) => prev.map((x) => (x.id === n.id ? n : x)))}
              onDelete={(id) => setNotes((prev) => prev.filter((x) => x.id !== id))}
            />
          );
        })}
      </ul>
    </>
  );
};

const AreaCard: React.FC<{
  area: { role: string; screen: string; element: string; observable: string };
  notes: FeatureFeedback[];
  onCreate: (n: FeatureFeedback) => void;
  onUpdate: (n: FeatureFeedback) => void;
  onDelete: (id: number) => void;
}> = ({ area, notes, onCreate, onUpdate, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  return (
    <li className="review-card">
      <div className="review-card-head">
        <div className="review-card-tags">
          <span className={`pill role-${area.role}`}>{area.role}</span>
          <span className="pill screen">{area.screen}</span>
        </div>
        <h3 className="review-card-title">{area.element}</h3>
        <p className="review-card-sub">{area.observable}</p>
      </div>

      {notes.length > 0 && (
        <ul className="review-notes">
          {notes.map((n) => (
            <NoteItem
              key={n.id}
              note={n}
              onSave={async (b) => {
                const updated = await reviewApi.updateFeatureFeedback(n.id, b);
                onUpdate(updated);
              }}
              onDelete={async () => {
                await reviewApi.deleteFeatureFeedback(n.id);
                onDelete(n.id);
              }}
            />
          ))}
        </ul>
      )}

      {showForm ? (
        <NoteForm
          placeholder={`What would you change about "${area.element}"?`}
          submitLabel="Save my suggestion"
          onCancel={() => setShowForm(false)}
          onSubmit={async (b) => {
            const saved = await reviewApi.addFeatureFeedback({
              feature_key: areaKey(area),
              feature_label: `${area.role} · ${area.screen} · ${area.element}`,
              comment: b.comment,
              author: b.author,
              role: area.role,
            });
            onCreate(saved);
            setShowForm(false);
          }}
        />
      ) : (
        <button type="button" className="btn primary review-add-btn" onClick={() => setShowForm(true)}>
          💡 Suggest a change{notes.length ? ` (${notes.length} saved)` : ''}
        </button>
      )}
    </li>
  );
};

// ── Section: Features (read-only — descriptive only) ─────────────────
const FeaturesSection: React.FC<{ role: RoleKey }> = ({ role }) => {
  const items = FEATURES.filter((f) => f.role === role);
  return (
    <ul className="review-cards">
      {items.map((f) => (
        <li key={featureKey(f)} className="review-card">
          <div className="review-card-head">
            <div className="review-card-tags">
              <span className={`pill role-${f.role}`}>{f.role}</span>
              <span className="pill screen">{f.screen}</span>
            </div>
            <h3 className="review-card-title">{f.screen}</h3>
            <p className="review-card-sub">{f.purpose}</p>
          </div>
        </li>
      ))}
    </ul>
  );
};

// ── Section: Requests (free-form) ─────────────────────────────────────
const RequestsSection: React.FC = () => {
  const [items, setItems] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    reviewApi.listRequests()
      .then(setItems).catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="review-loading">Loading…</div>;

  return (
    <>
      {error && <div className="review-error">Couldn’t load ideas: {error}</div>}

      {showForm ? (
        <RequestForm
          onCancel={() => setShowForm(false)}
          onSubmit={async (b) => {
            const saved = await reviewApi.addRequest(b);
            setItems((prev) => [saved, ...prev]);
            setShowForm(false);
          }}
        />
      ) : (
        <button type="button" className="btn primary review-add-big" onClick={() => setShowForm(true)}>
          ＋ Add a new idea
        </button>
      )}

      <ul className="review-cards" style={{ marginTop: 18 }}>
        {items.length === 0 && (
          <li className="review-empty">No ideas yet. Add the first one above.</li>
        )}
        {items.map((r) => (
          <RequestCard
            key={r.id}
            request={r}
            onUpdate={(u) => setItems((prev) => prev.map((x) => (x.id === u.id ? u : x)))}
            onDelete={(id) => setItems((prev) => prev.filter((x) => x.id !== id))}
          />
        ))}
      </ul>
    </>
  );
};

const RequestCard: React.FC<{
  request: FeatureRequest;
  onUpdate: (r: FeatureRequest) => void;
  onDelete: (id: number) => void;
}> = ({ request, onUpdate, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const confirm = useConfirm();

  if (editing) {
    return (
      <li className="review-card editing">
        <RequestForm
          initial={request}
          submitLabel="Save changes"
          onCancel={() => setEditing(false)}
          onSubmit={async (b) => {
            const updated = await reviewApi.updateRequest(request.id, b);
            onUpdate(updated);
            setEditing(false);
          }}
        />
      </li>
    );
  }

  const remove = async () => {
    const ok = await confirm({
      title: 'Delete this idea?',
      message: `“${request.feature}” will be removed for everyone. This cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Keep it',
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await reviewApi.deleteRequest(request.id);
      onDelete(request.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="review-card">
      <div className="review-card-head">
        {request.priority && (
          <div className="review-card-tags"><PriorityBadge priority={request.priority} /></div>
        )}
        <h3 className="review-card-title">{request.feature}</h3>
        <p className="review-card-sub multiline">{request.description}</p>
        <div className="review-card-meta">
          {request.author ? <strong>{request.author}</strong> : <span className="muted">Anonymous</span>}
          <span className="muted"> · {formatDate(request.updated_at)}</span>
        </div>
      </div>
      <div className="review-row-actions">
        <button type="button" className="btn ghost" onClick={() => setEditing(true)}>✏️ Edit</button>
        <button type="button" className="btn danger" onClick={remove} disabled={busy}>🗑 Delete</button>
      </div>
    </li>
  );
};

// ── Reusable bits ─────────────────────────────────────────────────────
const NoteItem: React.FC<{
  note: { id: number; comment: string; author: string | null; created_at: string; priority: Priority | null };
  onSave: (b: { comment: string; author?: string; priority?: Priority | null }) => Promise<void>;
  onDelete: () => Promise<void>;
}> = ({ note, onSave, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const confirm = useConfirm();

  if (editing) {
    return (
      <li className="review-note editing">
        <NoteForm
          initial={{ comment: note.comment, author: note.author ?? '', priority: note.priority }}
          submitLabel="Save changes"
          placeholder=""
          onCancel={() => setEditing(false)}
          onSubmit={async (b) => { await onSave(b); setEditing(false); }}
        />
      </li>
    );
  }

  const remove = async () => {
    const ok = await confirm({
      title: 'Delete this note?',
      message: 'It will be removed for everyone. This cannot be undone.',
      confirmLabel: 'Delete', cancelLabel: 'Keep it', danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try { await onDelete(); } finally { setBusy(false); }
  };

  return (
    <li className="review-note">
      {note.priority && (
        <div className="review-note-priority"><PriorityBadge priority={note.priority} /></div>
      )}
      <div className="review-note-body">{note.comment}</div>
      <div className="review-note-meta">
        <span>
          {note.author ? <strong>{note.author}</strong> : <span className="muted">Anonymous</span>}
          <span className="muted"> · {formatDate(note.created_at)}</span>
        </span>
        <span className="review-note-actions">
          <button type="button" className="btn ghost small" onClick={() => setEditing(true)}>Edit</button>
          <button type="button" className="btn danger small" onClick={remove} disabled={busy}>Delete</button>
        </span>
      </div>
    </li>
  );
};

const NoteForm: React.FC<{
  initial?: { comment: string; author: string; priority: Priority | null };
  placeholder: string;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (b: { comment: string; author?: string; priority?: Priority | null }) => Promise<void>;
}> = ({ initial, placeholder, submitLabel, onCancel, onSubmit }) => {
  const [author, setAuthor] = useState(initial?.author ?? '');
  const [comment, setComment] = useState(initial?.comment ?? '');
  const [priority, setPriority] = useState<Priority | ''>(initial?.priority ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setBusy(true); setErr(null);
    try {
      await onSubmit({
        comment: comment.trim(),
        author: author.trim() || undefined,
        priority: priority || null,
      });
    } catch (e) { setErr(String(e)); setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="review-form">
      <label className="review-form-row">
        <span>Your name (optional)</span>
        <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="e.g. Sam"/>
      </label>
      <label className="review-form-row">
        <span>How important is this?</span>
        <PrioritySelect value={priority} onChange={setPriority}/>
      </label>
      <label className="review-form-row">
        <span>Your note</span>
        <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)}
                  placeholder={placeholder} required autoFocus/>
      </label>
      {err && <div className="review-error inline">{err}</div>}
      <div className="review-form-actions">
        <button type="button" className="btn ghost" onClick={onCancel} disabled={busy}>Cancel</button>
        <button type="submit" className="btn primary" disabled={busy || !comment.trim()}>
          {busy ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
};

const PrioritySelect: React.FC<{ value: Priority | ''; onChange: (v: Priority | '') => void }> = ({ value, onChange }) => (
  <select className="review-priority-select" value={value} onChange={(e) => onChange(e.target.value as Priority | '')}>
    <option value="">No priority — just sharing a thought</option>
    {PRIORITY_OPTIONS.map((o) => (
      <option key={o.value} value={o.value}>{o.emoji}  {o.label}</option>
    ))}
  </select>
);

const PriorityBadge: React.FC<{ priority: Priority | null }> = ({ priority }) => {
  if (!priority) return null;
  const meta = PRIORITY_META[priority];
  return (<span className={`review-priority-badge prio-${priority}`}>{meta.emoji} {meta.label}</span>);
};

const RequestForm: React.FC<{
  initial?: FeatureRequest;
  submitLabel?: string;
  onCancel: () => void;
  onSubmit: (b: { feature: string; description: string; author?: string; priority?: Priority | null }) => Promise<void>;
}> = ({ initial, submitLabel = 'Save my idea', onCancel, onSubmit }) => {
  const [feature, setFeature] = useState(initial?.feature ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [author, setAuthor] = useState(initial?.author ?? '');
  const [priority, setPriority] = useState<Priority | ''>(initial?.priority ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feature.trim() || !description.trim()) return;
    setBusy(true); setErr(null);
    try {
      await onSubmit({
        feature: feature.trim(),
        description: description.trim(),
        author: author.trim() || undefined,
        priority: priority || null,
      });
    } catch (e) { setErr(String(e)); setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="review-form review-form-card">
      <label className="review-form-row">
        <span>What do you want to call it?</span>
        <input type="text" value={feature} onChange={(e) => setFeature(e.target.value)}
               placeholder="e.g. Dark mode" required autoFocus/>
      </label>
      <label className="review-form-row">
        <span>How important is this?</span>
        <PrioritySelect value={priority} onChange={setPriority}/>
      </label>
      <label className="review-form-row">
        <span>Tell us more</span>
        <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you’d like added or changed…" required/>
      </label>
      <label className="review-form-row">
        <span>Your name (optional)</span>
        <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="e.g. Sam"/>
      </label>
      {err && <div className="review-error inline">{err}</div>}
      <div className="review-form-actions">
        <button type="button" className="btn ghost" onClick={onCancel} disabled={busy}>Cancel</button>
        <button type="submit" className="btn primary" disabled={busy || !feature.trim() || !description.trim()}>
          {busy ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
};

function formatDate(iso: string) {
  try {
    const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
    return d.toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

export default ReviewGuide;
