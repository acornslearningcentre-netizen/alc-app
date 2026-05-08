import { intakeSectionTitles } from '../../data/intake-questions';

interface Props {
  /** 0..1 fraction filled. */
  fraction: number;
  /** 1, 2, or 3 — used for the section label. Pass undefined to hide it. */
  section?: 1 | 2 | 3;
}

export const ProgressBar = ({ fraction, section }: Props) => {
  const pct = Math.round(Math.max(0, Math.min(1, fraction)) * 100);
  return (
    <div className="intake-progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="intake-progress-bar">
        <div className="intake-progress-fill" style={{ width: `${pct}%` }}/>
      </div>
      {section && (
        <div className="intake-progress-meta">
          <span className="intake-progress-section">Page {section} of 3</span>
          <span className="intake-progress-dot">·</span>
          <span className="intake-progress-title">{intakeSectionTitles[section]}</span>
        </div>
      )}
    </div>
  );
};
