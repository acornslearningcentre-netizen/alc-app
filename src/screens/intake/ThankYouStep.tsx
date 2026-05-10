// Thank-you step (Watercolor Glass redesign).
//
// First-person voice from Aishat: a personalised greeting, then a four-step
// timeline of what's happening on her side. Closes with the Aishat signature.
// No CTAs — the screen has no actions, only reassurance.

interface Props {
  parentName?: string;
  childFirstName?: string;
  /** Hobbies snippet from the answers — used to make the "Today" line feel read, not received. */
  hobbiesSnippet?: string;
  /** Click handler for the "Back to Acorns" exit button. */
  onHome: () => void;
}

const truncate = (s: string, max: number) =>
  s.length <= max ? s : s.slice(0, max).replace(/[,;:.\s]+$/, '') + '…';

export const ThankYouStep = ({ parentName, childFirstName, hobbiesSnippet, onHome }: Props) => {
  const parentFirst = parentName?.split(/\s+/)[0]?.trim();
  const child = childFirstName?.trim() || 'your child';
  const greet = parentFirst
    ? `Thank you, ${parentFirst}. I've got this.`
    : "Thank you. I've got this.";
  const todayLine = hobbiesSnippet
    ? `I read what you've shared. The ${truncate(hobbiesSnippet, 80)} — that I'll think about overnight.`
    : `I read what you've shared. The interests and the goals — those I'll think about overnight.`;

  return (
    <div className="intake-stage intake-stage--center">
      <div className="intake-card intake-card--lift intake-card--wide">
        <h1 className="intake-headline">{greet}</h1>
        <p className="intake-lede">
          Sit with your tea. Here&rsquo;s what&rsquo;s happening on my side.
        </p>

        <ol className="intake-timeline">
          <li className="intake-timeline-row">
            <div className="intake-timeline-rail" aria-hidden="true"><div className="node"/></div>
            <div>
              <div className="intake-timeline-when">Today</div>
              <div className="intake-timeline-what">{todayLine}</div>
            </div>
          </li>
          <li className="intake-timeline-row">
            <div className="intake-timeline-rail" aria-hidden="true"><div className="node"/></div>
            <div>
              <div className="intake-timeline-when">Within a working day</div>
              <div className="intake-timeline-what">
                I&rsquo;ll send you a short note with two or three things I&rsquo;d like to try in
                {' '}{child}&rsquo;s first 2 hours, and a window to book.
              </div>
            </div>
          </li>
          <li className="intake-timeline-row">
            <div className="intake-timeline-rail" aria-hidden="true"><div className="node future"/></div>
            <div>
              <div className="intake-timeline-when">Assessment day</div>
              <div className="intake-timeline-what">
                Two hours, in person. Unhurried. {child[0].toUpperCase() + child.slice(1)} doesn&rsquo;t need
                to prepare anything.
              </div>
            </div>
          </li>
          <li className="intake-timeline-row">
            <div className="intake-timeline-rail" aria-hidden="true"><div className="node future"/></div>
            <div>
              <div className="intake-timeline-when">A few days later</div>
              <div className="intake-timeline-what">
                A short, written read of what we noticed &mdash; the kind I&rsquo;d want as a parent.
                Then we decide together what&rsquo;s next.
              </div>
            </div>
          </li>
        </ol>

        <div className="intake-card intake-card--solid" style={{ marginTop: 26, padding: 18, boxShadow: 'none' }}>
          <div className="intake-helper" style={{ margin: 0 }}>
            If anything&rsquo;s changed since you sent this &mdash; even something small &mdash; just reply
            to the email I&rsquo;ve sent. We&rsquo;ll fold it in.
          </div>
        </div>

        <div className="intake-signature" style={{ marginTop: 22, textAlign: 'right', fontSize: 16 }}>
          &mdash; Aishat
        </div>

        <div className="intake-thanks-foot">
          <button type="button" className="intake-btn intake-btn--ghost" onClick={onHome}>
            <span aria-hidden="true">←</span>&nbsp;Back to Acorns
          </button>
        </div>
      </div>
    </div>
  );
};
