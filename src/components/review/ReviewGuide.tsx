import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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

// Order roles deliberately: entry point first, then most-used to least-used.
const ROLE_ORDER = ['login', 'teacher', 'parent', 'student', 'leader'] as const;
const ROLE_LABEL: Record<string, string> = {
  login: 'Login',
  teacher: 'Teacher',
  parent: 'Parent',
  student: 'Student',
  leader: 'Leader',
};
const DEFAULT_ROLE = 'teacher';

const RoleFilter: React.FC<{
  counts: Record<string, number>;
  active: string;
  onChange: (role: string) => void;
}> = ({ counts, active, onChange }) => {
  const visible = ROLE_ORDER.filter((r) => (counts[r] ?? 0) > 0);
  return (
    <div className="review-role-filter" role="tablist" aria-label="Filter by role">
      {visible.map((r) => (
        <button
          key={r}
          type="button"
          role="tab"
          aria-selected={r === active}
          className={`review-role-chip pill role-${r}${r === active ? ' active' : ''}`}
          onClick={() => onChange(r)}
        >
          {ROLE_LABEL[r] ?? r}
          <span className="review-role-count">{counts[r]}</span>
        </button>
      ))}
    </div>
  );
};

// ── In-app confirm dialog ─────────────────────────────────────────────────
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

  const close = (value: boolean) => {
    state?.resolve(value);
    setState(null);
  };

  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
      if (e.key === 'Enter') close(true);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {state && (
        <div
          className="review-confirm-scrim"
          role="presentation"
          onClick={(e) => { if (e.target === e.currentTarget) close(false); }}
        >
          <div
            className="review-confirm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="review-confirm-title"
            aria-describedby="review-confirm-message"
          >
            <h3 id="review-confirm-title" className="review-confirm-title">{state.title}</h3>
            <p id="review-confirm-message" className="review-confirm-message">{state.message}</p>
            <div className="review-confirm-actions">
              <button
                type="button"
                className="btn ghost"
                onClick={() => close(false)}
                autoFocus
              >
                {state.cancelLabel ?? 'Cancel'}
              </button>
              <button
                type="button"
                className={`btn ${state.danger ? 'danger' : 'primary'}`}
                onClick={() => close(true)}
              >
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
 * Review Guide — a full-screen page (not a modal) with three tabs.
 * Forms are hidden by default; click the "Add" / "Write a note" button on any
 * row to reveal it, click again to close. Saved notes can be edited or deleted.
 */
export const ReviewGuide: React.FC = () => {
  const [open, setOpen] = useHashRoute();
  const [tab, setTab] = useState<Tab>('areas');

  useEffect(() => {
    document.body.classList.toggle('review-page-open', open);
    return () => document.body.classList.remove('review-page-open');
  }, [open]);

  // Open the review page in a new browser tab so reviewers can keep the demo
  // visible on one screen while leaving notes on another. Falls back to the
  // current tab if the popup is blocked.
  const openInNewTab = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = `${window.location.pathname}${window.location.search}#review`;
    const win = window.open(url, '_blank', 'noopener');
    if (!win) setOpen(true);
  };

  return (
    <>
      {!open && (
        <a
          href="#review"
          target="_blank"
          rel="noopener"
          className="review-guide-fab"
          onClick={openInNewTab}
          aria-label="Open the reviewer guide in a new tab"
          title="Opens in a new tab so you can use it on a second screen"
        >
          Review guide ↗
        </a>
      )}

      {open && (
        <div className="review-page" role="region" aria-label="Reviewer guide">
          <header className="review-page-header">
            <button
              type="button"
              className="btn ghost review-page-back"
              onClick={() => setOpen(false)}
            >
              ← Back to app
            </button>
            <div className="review-page-title">
              <h1>Reviewer guide</h1>
              <p>Pick what you want to look at, then leave a note.</p>
            </div>
          </header>

          <nav className="review-tabs" role="tablist" aria-label="Sections">
            <Tab active={tab === 'areas'} onClick={() => setTab('areas')} label="Try these clicks" hint="Interactions that work in this prototype" />
            <Tab active={tab === 'features'} onClick={() => setTab('features')} label="What's in this prototype" hint="Each screen, with feedback" />
            <Tab active={tab === 'requests'} onClick={() => setTab('requests')} label="Your ideas" hint="Suggest something new" />
          </nav>

          <ConfirmProvider>
            <main className="review-page-body">
              {tab === 'areas' && <AreasSection />}
              {tab === 'features' && <FeaturesSection />}
              {tab === 'requests' && <RequestsSection />}
            </main>
          </ConfirmProvider>
        </div>
      )}
    </>
  );
};

const Tab: React.FC<{ active: boolean; onClick: () => void; label: string; hint: string }> = ({
  active,
  onClick,
  label,
  hint,
}) => (
  <button
    type="button"
    role="tab"
    aria-selected={active}
    onClick={onClick}
    className={`review-tab${active ? ' active' : ''}`}
  >
    <span className="review-tab-label">{label}</span>
    <span className="review-tab-hint">{hint}</span>
  </button>
);

// ────────────────────────────────────────────────────────────────────────────
// Section: Clickable areas (read-only — feedback lives in "What's in this prototype")
// ────────────────────────────────────────────────────────────────────────────
const AreasSection: React.FC = () => {
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const a of CLICKABLE_AREAS) c[a.role] = (c[a.role] ?? 0) + 1;
    return c;
  }, []);
  const [role, setRole] = useState<string>(
    () => (counts[DEFAULT_ROLE] ? DEFAULT_ROLE : ROLE_ORDER.find((r) => counts[r]) ?? DEFAULT_ROLE)
  );
  const items = CLICKABLE_AREAS.filter((a) => a.role === role);

  return (
    <>
      <p className="review-blurb">
        Pick a role to see only its clickable areas. To leave feedback, switch
        to <strong>What's in this prototype</strong>.
      </p>
      <RoleFilter counts={counts} active={role} onChange={setRole} />
      <ul className="review-cards">
        {items.map((a) => (
          <li key={areaKey(a)} className="review-card">
            <div className="review-card-head">
              <div className="review-card-tags">
                <span className={`pill role-${a.role}`}>{a.role}</span>
                <span className="pill screen">{a.screen}</span>
              </div>
              <h3 className="review-card-title">{a.element}</h3>
              <p className="review-card-sub">{a.observable}</p>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// Section: Features
// ────────────────────────────────────────────────────────────────────────────
const FeaturesSection: React.FC = () => {
  const [notes, setNotes] = useState<FeatureFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    reviewApi.listFeatureFeedback()
      .then(setNotes)
      .catch((e) => setError(String(e)))
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

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const f of FEATURES) c[f.role] = (c[f.role] ?? 0) + 1;
    return c;
  }, []);
  const [role, setRole] = useState<string>(
    () => (counts[DEFAULT_ROLE] ? DEFAULT_ROLE : ROLE_ORDER.find((r) => counts[r]) ?? DEFAULT_ROLE)
  );

  if (loading) return <div className="review-loading">Loading…</div>;

  const items = FEATURES.filter((f) => f.role === role);

  return (
    <>
      <p className="review-blurb">
        Pick a role, then use <strong>Suggest a change</strong> on any screen
        to share what you’d like adjusted.
      </p>
      {error && <div className="review-error">Couldn’t load suggestions: {error}</div>}
      <RoleFilter counts={counts} active={role} onChange={setRole} />
      <ul className="review-cards">
        {items.map((f) => {
          const key = featureKey(f);
          const list = grouped.get(key) ?? [];
          return (
            <FeatureCard
              key={key}
              feature={f}
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

const FeatureCard: React.FC<{
  feature: { role: string; screen: string; purpose: string };
  notes: FeatureFeedback[];
  onCreate: (n: FeatureFeedback) => void;
  onUpdate: (n: FeatureFeedback) => void;
  onDelete: (id: number) => void;
}> = ({ feature, notes, onCreate, onUpdate, onDelete }) => {
  const [showForm, setShowForm] = useState(false);

  return (
    <li className="review-card">
      <div className="review-card-head">
        <div className="review-card-tags">
          <span className={`pill role-${feature.role}`}>{feature.role}</span>
          <span className="pill screen">{feature.screen}</span>
        </div>
        <h3 className="review-card-title">{feature.screen}</h3>
        <p className="review-card-sub">{feature.purpose}</p>
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
          placeholder={`What would you change about ${feature.screen}?`}
          submitLabel="Save my suggestion"
          onCancel={() => setShowForm(false)}
          onSubmit={async (b) => {
            const saved = await reviewApi.addFeatureFeedback({
              feature_key: featureKey(feature),
              feature_label: `${feature.role} · ${feature.screen}`,
              comment: b.comment,
              author: b.author,
              role: feature.role,
            });
            onCreate(saved);
            setShowForm(false);
          }}
        />
      ) : (
        <button
          type="button"
          className="btn primary review-add-btn"
          onClick={() => setShowForm(true)}
        >
          💡 Suggest a change{notes.length ? ` (${notes.length} saved)` : ''}
        </button>
      )}
    </li>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// Section: Requests (free-form)
// ────────────────────────────────────────────────────────────────────────────
const RequestsSection: React.FC = () => {
  const [items, setItems] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    reviewApi.listRequests()
      .then(setItems)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="review-loading">Loading…</div>;

  return (
    <>
      <p className="review-blurb">
        Add anything you’d like to see in the app. You can edit or delete your idea later.
      </p>
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
        <button
          type="button"
          className="btn primary review-add-big"
          onClick={() => setShowForm(true)}
        >
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
        <button type="button" className="btn ghost" onClick={() => setEditing(true)}>
          ✏️ Edit
        </button>
        <button type="button" className="btn danger" onClick={remove} disabled={busy}>
          🗑 Delete
        </button>
      </div>
    </li>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// Reusable bits
// ────────────────────────────────────────────────────────────────────────────
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
          onSubmit={async (b) => {
            await onSave(b);
            setEditing(false);
          }}
        />
      </li>
    );
  }

  const remove = async () => {
    const ok = await confirm({
      title: 'Delete this note?',
      message: 'It will be removed for everyone. This cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Keep it',
      danger: true,
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
          <button type="button" className="btn ghost small" onClick={() => setEditing(true)}>
            Edit
          </button>
          <button type="button" className="btn danger small" onClick={remove} disabled={busy}>
            Delete
          </button>
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
    setBusy(true);
    setErr(null);
    try {
      await onSubmit({
        comment: comment.trim(),
        author: author.trim() || undefined,
        priority: priority || null,
      });
    } catch (e) {
      setErr(String(e));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="review-form">
      <label className="review-form-row">
        <span>Your name (optional)</span>
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="e.g. Sam"
        />
      </label>
      <label className="review-form-row">
        <span>How important is this?</span>
        <PrioritySelect value={priority} onChange={setPriority} />
      </label>
      <label className="review-form-row">
        <span>Your note</span>
        <textarea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={placeholder}
          required
          autoFocus
        />
      </label>
      {err && <div className="review-error inline">{err}</div>}
      <div className="review-form-actions">
        <button type="button" className="btn ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="btn primary" disabled={busy || !comment.trim()}>
          {busy ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
};

const PrioritySelect: React.FC<{
  value: Priority | '';
  onChange: (v: Priority | '') => void;
}> = ({ value, onChange }) => (
  <select
    className="review-priority-select"
    value={value}
    onChange={(e) => onChange(e.target.value as Priority | '')}
  >
    <option value="">No priority — just sharing a thought</option>
    {PRIORITY_OPTIONS.map((o) => (
      <option key={o.value} value={o.value}>
        {o.emoji}  {o.label}
      </option>
    ))}
  </select>
);

const PriorityBadge: React.FC<{ priority: Priority | null }> = ({ priority }) => {
  if (!priority) return null;
  const meta = PRIORITY_META[priority];
  return (
    <span className={`review-priority-badge prio-${priority}`}>
      {meta.emoji} {meta.label}
    </span>
  );
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
    setBusy(true);
    setErr(null);
    try {
      await onSubmit({
        feature: feature.trim(),
        description: description.trim(),
        author: author.trim() || undefined,
        priority: priority || null,
      });
    } catch (e) {
      setErr(String(e));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="review-form review-form-card">
      <label className="review-form-row">
        <span>What do you want to call it?</span>
        <input
          type="text"
          value={feature}
          onChange={(e) => setFeature(e.target.value)}
          placeholder="e.g. Dark mode"
          required
          autoFocus
        />
      </label>
      <label className="review-form-row">
        <span>How important is this?</span>
        <PrioritySelect value={priority} onChange={setPriority} />
      </label>
      <label className="review-form-row">
        <span>Tell us more</span>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what you’d like added or changed…"
          required
        />
      </label>
      <label className="review-form-row">
        <span>Your name (optional)</span>
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="e.g. Sam"
        />
      </label>
      {err && <div className="review-error inline">{err}</div>}
      <div className="review-form-actions">
        <button type="button" className="btn ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button
          type="submit"
          className="btn primary"
          disabled={busy || !feature.trim() || !description.trim()}
        >
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default ReviewGuide;
