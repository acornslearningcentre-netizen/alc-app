import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CLICKABLE_AREAS, FEATURES } from './inventory';
import {
  reviewApi,
  type AreaFeedback,
  type FeatureFeedback,
  type FeatureRequest,
} from './api';

type Tab = 'areas' | 'features' | 'requests';

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

  return (
    <>
      {!open && (
        <button
          type="button"
          className="review-guide-fab"
          onClick={() => setOpen(true)}
          aria-label="Open the reviewer guide"
        >
          Review guide
        </button>
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
            <Tab active={tab === 'areas'} onClick={() => setTab('areas')} label="What to click" hint="Areas you can tap on" />
            <Tab active={tab === 'features'} onClick={() => setTab('features')} label="What it does" hint="Each screen explained" />
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
// Section: Clickable areas
// ────────────────────────────────────────────────────────────────────────────
const AreasSection: React.FC = () => {
  const [notes, setNotes] = useState<AreaFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    reviewApi.listAreaFeedback()
      .then(setNotes)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    const m = new Map<string, AreaFeedback[]>();
    for (const n of notes) {
      const arr = m.get(n.area_key) ?? [];
      arr.push(n);
      m.set(n.area_key, arr);
    }
    return m;
  }, [notes]);

  if (loading) return <div className="review-loading">Loading…</div>;

  return (
    <>
      <p className="review-blurb">
        Each row tells you what to click in the app and what should happen. Use
        <strong> Write a note</strong> to leave feedback on that interaction.
      </p>
      {error && <div className="review-error">Couldn’t load notes: {error}</div>}
      <ul className="review-cards">
        {CLICKABLE_AREAS.map((a) => {
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
  notes: AreaFeedback[];
  onCreate: (n: AreaFeedback) => void;
  onUpdate: (n: AreaFeedback) => void;
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
                const updated = await reviewApi.updateAreaFeedback(n.id, b);
                onUpdate(updated);
              }}
              onDelete={async () => {
                await reviewApi.deleteAreaFeedback(n.id);
                onDelete(n.id);
              }}
            />
          ))}
        </ul>
      )}

      {showForm ? (
        <NoteForm
          placeholder={`What did you notice about “${area.element}”?`}
          submitLabel="Save my note"
          onCancel={() => setShowForm(false)}
          onSubmit={async (b) => {
            const saved = await reviewApi.addAreaFeedback({
              area_key: areaKey(area),
              area_label: `${area.screen} · ${area.element}`,
              comment: b.comment,
              author: b.author,
              role: area.role,
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
          ✏️ Write a note{notes.length ? ` (${notes.length} saved)` : ''}
        </button>
      )}
    </li>
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

  if (loading) return <div className="review-loading">Loading…</div>;

  return (
    <>
      <p className="review-blurb">
        One row per screen. Use <strong>Suggest a change</strong> to share what you’d like adjusted.
      </p>
      {error && <div className="review-error">Couldn’t load suggestions: {error}</div>}
      <ul className="review-cards">
        {FEATURES.map((f) => {
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
  note: { id: number; comment: string; author: string | null; created_at: string };
  onSave: (b: { comment: string; author?: string }) => Promise<void>;
  onDelete: () => Promise<void>;
}> = ({ note, onSave, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const confirm = useConfirm();

  if (editing) {
    return (
      <li className="review-note editing">
        <NoteForm
          initial={{ comment: note.comment, author: note.author ?? '' }}
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
  initial?: { comment: string; author: string };
  placeholder: string;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (b: { comment: string; author?: string }) => Promise<void>;
}> = ({ initial, placeholder, submitLabel, onCancel, onSubmit }) => {
  const [author, setAuthor] = useState(initial?.author ?? '');
  const [comment, setComment] = useState(initial?.comment ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await onSubmit({ comment: comment.trim(), author: author.trim() || undefined });
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

const RequestForm: React.FC<{
  initial?: FeatureRequest;
  submitLabel?: string;
  onCancel: () => void;
  onSubmit: (b: { feature: string; description: string; author?: string }) => Promise<void>;
}> = ({ initial, submitLabel = 'Save my idea', onCancel, onSubmit }) => {
  const [feature, setFeature] = useState(initial?.feature ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [author, setAuthor] = useState(initial?.author ?? '');
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
