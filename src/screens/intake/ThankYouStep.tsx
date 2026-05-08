interface Props {
  parentName?: string;
  childFirstName?: string;
}

export const ThankYouStep = ({ parentName, childFirstName }: Props) => {
  const greet = parentName ? `Thanks, ${parentName.split(/\s+/)[0]}.` : 'Thanks for sharing.';
  const child = childFirstName || 'your child';

  return (
    <div className="intake-stage intake-stage--center">
      <div className="intake-card intake-card--lift intake-card--wide">
        <p className="intake-eyebrow">We've got you</p>
        <h1 className="intake-headline">{greet}</h1>
        <p className="intake-lede">
          We'll read through {child}'s answers carefully and get back to you within
          one working day to confirm a 2-hour assessment session. The session is
          calm, observation-led, and the only thing your child needs to do is
          turn up curious.
        </p>

        <div className="intake-next">
          <h3>What happens next</h3>
          <ol className="intake-next-list">
            <li>
              <strong>Today.</strong> We read through your answers — especially what
              {' '}{child} loves and avoids — and start tailoring the session to fit.
            </li>
            <li>
              <strong>Within a working day.</strong> You'll get an email from Aishat
              with two or three suggested times. Pick whichever fits best.
            </li>
            <li>
              <strong>Assessment day.</strong> We meet your child for a relaxed
              2-hour session. No tests, just play and observation.
            </li>
            <li>
              <strong>A few days later.</strong> You'll receive a written report and
              a personalised plan, signed off by Aishat.
            </li>
          </ol>
        </div>

        <p className="intake-fineprint">
          Need to add something? Reply to the email we'll send you — we'll fold it
          into the assessment notes.
        </p>
      </div>
    </div>
  );
};
