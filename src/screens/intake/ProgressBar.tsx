// Progress system for the intake form (Watercolor Glass redesign).
//
// Three sectioned marks — done / current / future. The current mark fills
// smoothly under hand; past marks rest in muted Moss; future sit as
// hairlines. The label below names the section in the brand's voice
// (e.g. "About you", "About your child", "A few quieter things") — never
// "Section 2 of 3". The parent's real question is "what kind of question
// am I in?", not "what number am I on?".

interface Props {
  /** Section currently being answered (1, 2 or 3). */
  section: 1 | 2 | 3;
  /** 0..1 fraction filled within the current section. */
  fraction: number;
  /** Section label — "About you · so we can stay in touch" etc. */
  label?: string;
}

export const ProgressBar = ({ section, fraction, label }: Props) => {
  const pct = Math.round(Math.max(0, Math.min(1, fraction)) * 100);
  const valueNow = section + Math.max(0, Math.min(1, fraction));
  return (
    <div className="intake-progress-wrap">
      <div
        className="intake-progress"
        role="progressbar"
        aria-valuenow={Math.round(valueNow * 33.33)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ? `${label} — section ${section} of 3` : `Section ${section} of 3`}
      >
        {[1, 2, 3].map((i) => {
          const cls = i < section ? 'mark done' : i === section ? 'mark current' : 'mark';
          const style = i === section ? ({ ['--p' as string]: `${pct}%` } as React.CSSProperties) : undefined;
          return <div key={i} className={cls} style={style} />;
        })}
      </div>
      {label && <div className="intake-progress-label">{label}</div>}
    </div>
  );
};
