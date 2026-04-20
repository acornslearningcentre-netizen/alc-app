import React, { useEffect, useMemo, useState } from 'react';
import { CLICKABLE_AREAS, FEATURES } from './inventory';
import {
  reviewApi,
  type AreaFeedback,
  type FeatureFeedback,
  type FeatureRequest,
} from './api';

type Tab = 'areas' | 'features' | 'requests';

const areaKey = (a: { role: string; screen: string; element: string }) =>
  `${a.role}/${a.screen}/${a.element}`;
const featureKey = (f: { role: string; screen: string }) => `${f.role}/${f.screen}`;

/**
 * Floating "Review guide" launcher pinned to the bottom-left of the viewport.
 * Opens a 3-tab modal: clickable areas, features, and free-form requests.
 * Each section has a feedback form and persists to the SQLite-backed API.
 */
export const ReviewGuide: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('areas');

  return (
    <>
      <button
        type="button"
        className="review-guide-fab"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        Review guide
      </button>

      {open && (
        <div
          className="review-guide-scrim"
          role="dialog"
          aria-modal="true"
          aria-label="Reviewer guide"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="review-guide-panel">
            <header className="review-guide-header">
              <div>
                <h2>Reviewer guide</h2>
                <p>What to click, what each screen does, and a place to leave notes.</p>
              </div>
              <button className="btn ghost" onClick={() => setOpen(false)} aria-label="Close">
                Close
              </button>
            </header>

            <nav className="review-guide-tabs" role="tablist">
              <TabButton active={tab === 'areas'} onClick={() => setTab('areas')}>
                Clickable areas
              </TabButton>
              <TabButton active={tab === 'features'} onClick={() => setTab('features')}>
                Features
              </TabButton>
              <TabButton active={tab === 'requests'} onClick={() => setTab('requests')}>
                Requests
              </TabButton>
            </nav>

            <section className="review-guide-body">
              {tab === 'areas' && <AreasTab />}
              {tab === 'features' && <FeaturesTab />}
              {tab === 'requests' && <RequestsTab />}
            </section>
          </div>
        </div>
      )}
    </>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({
  active,
  onClick,
  children,
}) => (
  <button
    type="button"
    role="tab"
    aria-selected={active}
    onClick={onClick}
    className={`review-guide-tab${active ? ' active' : ''}`}
  >
    {children}
  </button>
);

// ── Clickable areas tab ─────────────────────────────────────────────────────
const AreasTab: React.FC = () => {
  const [feedback, setFeedback] = useState<AreaFeedback[]>([]);
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    reviewApi.listAreaFeedback().then(setFeedback).catch((e) => setError(String(e)));
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, AreaFeedback[]>();
    for (const f of feedback) {
      const arr = map.get(f.area_key) ?? [];
      arr.push(f);
      map.set(f.area_key, arr);
    }
    return map;
  }, [feedback]);

  return (
    <>
      <p className="review-guide-blurb">
        Tap any element below in the app to see what it does. Use the comment box on a row to leave
        a note about that interaction.
      </p>
      {error && <div className="review-guide-error">Couldn’t load feedback: {error}</div>}
      <div className="review-guide-table-wrap">
        <table className="review-guide-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Screen</th>
              <th>Element</th>
              <th>What you’ll see</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {CLICKABLE_AREAS.map((a) => {
              const key = areaKey(a);
              const notes = grouped.get(key) ?? [];
              const isOpen = openRow === key;
              return (
                <React.Fragment key={key}>
                  <tr>
                    <td><span className={`pill role-${a.role}`}>{a.role}</span></td>
                    <td>{a.screen}</td>
                    <td className="strong">{a.element}</td>
                    <td>{a.observable}</td>
                    <td>
                      <button
                        type="button"
                        className="btn ghost small"
                        onClick={() => setOpenRow(isOpen ? null : key)}
                      >
                        {isOpen ? 'Hide' : `Comment${notes.length ? ` (${notes.length})` : ''}`}
                      </button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="review-guide-subrow">
                      <td colSpan={5}>
                        <NoteList notes={notes.map((n) => ({ author: n.author, body: n.comment, when: n.created_at }))} />
                        <AreaFeedbackForm
                          area={a}
                          onSaved={(f) => setFeedback((prev) => [f, ...prev])}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

const AreaFeedbackForm: React.FC<{
  area: { role: string; screen: string; element: string };
  onSaved: (f: AreaFeedback) => void;
}> = ({ area, onSaved }) => {
  const [author, setAuthor] = useState('');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const saved = await reviewApi.addAreaFeedback({
        area_key: areaKey(area),
        area_label: `${area.screen} \u00b7 ${area.element}`,
        comment: comment.trim(),
        author: author.trim() || undefined,
        role: area.role,
      });
      onSaved(saved);
      setComment('');
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="review-guide-form">
      <input
        type="text"
        placeholder="Your name (optional)"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
      />
      <textarea
        rows={2}
        placeholder={`What did you notice about "${area.element}"?`}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        required
      />
      <div className="review-guide-form-row">
        <button type="submit" className="btn primary small" disabled={busy || !comment.trim()}>
          {busy ? 'Saving\u2026' : 'Save note'}
        </button>
        {err && <span className="review-guide-error inline">{err}</span>}
      </div>
    </form>
  );
};

// ── Features tab ────────────────────────────────────────────────────────────
const FeaturesTab: React.FC = () => {
  const [feedback, setFeedback] = useState<FeatureFeedback[]>([]);
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    reviewApi.listFeatureFeedback().then(setFeedback).catch((e) => setError(String(e)));
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, FeatureFeedback[]>();
    for (const f of feedback) {
      const arr = map.get(f.feature_key) ?? [];
      arr.push(f);
      map.set(f.feature_key, arr);
    }
    return map;
  }, [feedback]);

  return (
    <>
      <p className="review-guide-blurb">
        One row per screen. Use the comment box to suggest an adjustment to that feature.
      </p>
      {error && <div className="review-guide-error">Couldn’t load feedback: {error}</div>}
      <div className="review-guide-table-wrap">
        <table className="review-guide-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Screen</th>
              <th>What it does</th>
              <th>Adjustments</th>
            </tr>
          </thead>
          <tbody>
            {FEATURES.map((f) => {
              const key = featureKey(f);
              const notes = grouped.get(key) ?? [];
              const isOpen = openRow === key;
              return (
                <React.Fragment key={key}>
                  <tr>
                    <td><span className={`pill role-${f.role}`}>{f.role}</span></td>
                    <td className="strong">{f.screen}</td>
                    <td>{f.purpose}</td>
                    <td>
                      <button
                        type="button"
                        className="btn ghost small"
                        onClick={() => setOpenRow(isOpen ? null : key)}
                      >
                        {isOpen ? 'Hide' : `Suggest${notes.length ? ` (${notes.length})` : ''}`}
                      </button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="review-guide-subrow">
                      <td colSpan={4}>
                        <NoteList notes={notes.map((n) => ({ author: n.author, body: n.comment, when: n.created_at }))} />
                        <FeatureFeedbackForm
                          feature={f}
                          onSaved={(saved) => setFeedback((prev) => [saved, ...prev])}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

const FeatureFeedbackForm: React.FC<{
  feature: { role: string; screen: string };
  onSaved: (f: FeatureFeedback) => void;
}> = ({ feature, onSaved }) => {
  const [author, setAuthor] = useState('');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const saved = await reviewApi.addFeatureFeedback({
        feature_key: featureKey(feature),
        feature_label: `${feature.role} \u00b7 ${feature.screen}`,
        comment: comment.trim(),
        author: author.trim() || undefined,
        role: feature.role,
      });
      onSaved(saved);
      setComment('');
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="review-guide-form">
      <input
        type="text"
        placeholder="Your name (optional)"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
      />
      <textarea
        rows={2}
        placeholder={`What would you adjust about ${feature.screen}?`}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        required
      />
      <div className="review-guide-form-row">
        <button type="submit" className="btn primary small" disabled={busy || !comment.trim()}>
          {busy ? 'Saving\u2026' : 'Save suggestion'}
        </button>
        {err && <span className="review-guide-error inline">{err}</span>}
      </div>
    </form>
  );
};

// ── Requests tab ────────────────────────────────────────────────────────────
const RequestsTab: React.FC = () => {
  const [items, setItems] = useState<FeatureRequest[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    reviewApi.listRequests().then(setItems).catch((e) => setError(String(e)));
  }, []);

  return (
    <>
      <p className="review-guide-blurb">
        Add anything you’d like to see in the app. Saved entries are locked — click <em>Edit</em>{' '}
        on a row to change it.
      </p>
      {error && <div className="review-guide-error">Couldn’t load requests: {error}</div>}

      <NewRequestForm onSaved={(r) => setItems((prev) => [r, ...prev])} />

      <div className="review-guide-table-wrap" style={{ marginTop: 18 }}>
        <table className="review-guide-table">
          <thead>
            <tr>
              <th style={{ width: '24%' }}>Feature</th>
              <th>Request</th>
              <th style={{ width: 110 }}>By</th>
              <th style={{ width: 130 }}>Updated</th>
              <th style={{ width: 110 }}></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="muted" style={{ padding: 18, textAlign: 'center' }}>
                  No requests yet. Add the first one above.
                </td>
              </tr>
            )}
            {items.map((r) =>
              editingId === r.id ? (
                <RequestEditRow
                  key={r.id}
                  request={r}
                  onCancel={() => setEditingId(null)}
                  onSaved={(updated) => {
                    setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
                    setEditingId(null);
                  }}
                />
              ) : (
                <tr key={r.id} className="review-guide-locked">
                  <td className="strong">{r.feature}</td>
                  <td className="multiline">{r.description}</td>
                  <td>{r.author || <span className="muted">—</span>}</td>
                  <td className="muted nowrap">{formatDate(r.updated_at)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn ghost small"
                      onClick={() => setEditingId(r.id)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

const NewRequestForm: React.FC<{ onSaved: (r: FeatureRequest) => void }> = ({ onSaved }) => {
  const [feature, setFeature] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feature.trim() || !description.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const saved = await reviewApi.addRequest({
        feature: feature.trim(),
        description: description.trim(),
        author: author.trim() || undefined,
      });
      onSaved(saved);
      setFeature('');
      setDescription('');
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="review-guide-form review-guide-new-request">
      <div className="review-guide-form-grid">
        <input
          type="text"
          placeholder="Feature (short title)"
          value={feature}
          onChange={(e) => setFeature(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Your name (optional)"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
      </div>
      <textarea
        rows={3}
        placeholder="Describe what you’d like added or changed…"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />
      <div className="review-guide-form-row">
        <button
          type="submit"
          className="btn primary"
          disabled={busy || !feature.trim() || !description.trim()}
        >
          {busy ? 'Saving\u2026' : 'Save request'}
        </button>
        {err && <span className="review-guide-error inline">{err}</span>}
      </div>
    </form>
  );
};

const RequestEditRow: React.FC<{
  request: FeatureRequest;
  onCancel: () => void;
  onSaved: (r: FeatureRequest) => void;
}> = ({ request, onCancel, onSaved }) => {
  const [feature, setFeature] = useState(request.feature);
  const [description, setDescription] = useState(request.description);
  const [author, setAuthor] = useState(request.author ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    if (!feature.trim() || !description.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const updated = await reviewApi.updateRequest(request.id, {
        feature: feature.trim(),
        description: description.trim(),
        author: author.trim() || undefined,
      });
      onSaved(updated);
    } catch (e) {
      setErr(String(e));
      setBusy(false);
    }
  };

  return (
    <tr className="review-guide-editing">
      <td>
        <input
          type="text"
          value={feature}
          onChange={(e) => setFeature(e.target.value)}
          aria-label="Feature"
        />
      </td>
      <td>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-label="Description"
        />
        {err && <div className="review-guide-error inline">{err}</div>}
      </td>
      <td>
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          aria-label="Author"
          placeholder="Name"
        />
      </td>
      <td className="muted nowrap">{formatDate(request.updated_at)}</td>
      <td>
        <div className="review-guide-edit-actions">
          <button type="button" className="btn primary small" onClick={save} disabled={busy}>
            {busy ? 'Saving\u2026' : 'Save'}
          </button>
          <button type="button" className="btn ghost small" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
        </div>
      </td>
    </tr>
  );
};

// ── Helpers ─────────────────────────────────────────────────────────────────
const NoteList: React.FC<{ notes: { author: string | null; body: string; when: string }[] }> = ({
  notes,
}) => {
  if (notes.length === 0) return null;
  return (
    <ul className="review-guide-notes">
      {notes.map((n, i) => (
        <li key={i}>
          <div className="review-guide-note-meta">
            <strong>{n.author || 'Anonymous'}</strong>
            <span className="muted"> \u00b7 {formatDate(n.when)}</span>
          </div>
          <div>{n.body}</div>
        </li>
      ))}
    </ul>
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
