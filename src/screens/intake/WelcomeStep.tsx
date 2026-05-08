import { intakeWelcome } from '../../data/intake-questions';

interface Props {
  /** True when there's a saved draft from a prior session. */
  hasDraft: boolean;
  onBegin: () => void;
  onResume: () => void;
  onStartOver: () => void;
}

export const WelcomeStep = ({ hasDraft, onBegin, onResume, onStartOver }: Props) => (
  <div className="intake-stage intake-stage--center">
    <div className="intake-card intake-card--lift">
      <p className="intake-eyebrow">Acorns Learning Centre</p>
      <h1 className="intake-headline">Your child at ALC: <em>learning and goals</em></h1>
      <p className="intake-lede">{intakeWelcome}</p>

      {hasDraft ? (
        <div className="intake-actions">
          <button type="button" className="intake-btn intake-btn--primary" onClick={onResume}>
            Continue where you left off
          </button>
          <button type="button" className="intake-btn intake-btn--ghost" onClick={onStartOver}>
            Start over
          </button>
        </div>
      ) : (
        <div className="intake-actions">
          <button type="button" className="intake-btn intake-btn--primary" onClick={onBegin}>
            Begin
          </button>
          <p className="intake-fineprint">
            Takes around 10 minutes. Your answers save automatically — you can close this tab and come back.
          </p>
        </div>
      )}
    </div>
  </div>
);
