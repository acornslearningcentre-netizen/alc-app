// Welcome step (Watercolor Glass redesign).
//
// Two variants on one card:
//   • fresh visit  → "Tell us about your child." + intro + tone chips + Begin
//   • has draft    → "We kept your place." + saved snippet + Pick up / Start fresh
//
// Both variants are calm. The page-level brand strip already shows the Acorns
// mark in the header, so this card carries the message and the call to begin.

interface Props {
  hasDraft: boolean;
  /** Snippet of saved progress (e.g. last entered child name) for the returning variant. */
  draftSnippet?: string;
  /** Friendly recap of where the parent left off (e.g. "how Iman approaches new things"). */
  draftAt?: string;
  /** ISO date string of the last save, for the returning variant. */
  lastSavedAt?: string;
  onBegin: () => void;
  onResume: () => void;
  onStartOver: () => void;
}

const formatLastSaved = (iso?: string) => {
  if (!iso) return null;
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return null;
  const now = Date.now();
  const days = Math.floor((now - then.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Last edited · today';
  if (days === 1) return 'Last edited · yesterday';
  if (days < 7) return `Last edited · ${days} days ago`;
  return `Last edited · ${then.toLocaleDateString()}`;
};

export const WelcomeStep = ({
  hasDraft,
  draftSnippet,
  draftAt,
  lastSavedAt,
  onBegin,
  onResume,
  onStartOver,
}: Props) => {
  if (hasDraft) {
    return (
      <div className="intake-stage intake-stage--center">
        <div className="intake-card intake-card--lift">
          <p className="intake-progress-label">Welcome back</p>
          <h1 className="intake-headline">We kept <em>your place</em>.</h1>
          <p className="intake-lede">
            {draftAt ? (
              <>You were on <strong>&ldquo;{draftAt}&rdquo;</strong>.</>
            ) : (
              <>You were partway through.</>
            )}
            {' '}Nothing&rsquo;s been sent to us yet &mdash; it&rsquo;s saved on this device.
          </p>

          {(draftSnippet || lastSavedAt) && (
            <div className="intake-saved-snippet">
              {lastSavedAt && (
                <div className="intake-saved-snippet-meta">{formatLastSaved(lastSavedAt)}</div>
              )}
              {draftSnippet && <div className="intake-saved-snippet-text">&ldquo;{draftSnippet}&rdquo;</div>}
            </div>
          )}

          <div className="intake-actions">
            <button type="button" className="intake-btn intake-btn--primary" onClick={onResume}>
              Pick up where I left off
            </button>
            <button type="button" className="intake-btn intake-btn--ghost" onClick={onStartOver}>
              Start fresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="intake-stage intake-stage--center">
      <div className="intake-card intake-card--lift">
        <h1 className="intake-headline">
          Tell us about<br/>your <em>child</em>.
        </h1>
        <p className="intake-lede">
          About ten quiet minutes. We&rsquo;ll ask one thing at a time so we can really
          listen &mdash; and design a first session that fits your child, not a template.
        </p>

        <div className="intake-chip-row">
          <span className="intake-chip is-tone">Pause whenever</span>
          <span className="intake-chip is-tone">Plain-language consent</span>
          <span className="intake-chip is-tone">Read by Aishat</span>
        </div>

        <div className="intake-actions intake-actions--row">
          <button type="button" className="intake-btn intake-btn--primary" onClick={onBegin}>
            Begin
          </button>
          <span className="intake-fineprint">~10 min &middot; saves as you go</span>
        </div>
      </div>
    </div>
  );
};
