import React from 'react';
import { Icon, Sparkline, Trend } from '../../components/ui';
import { ALC_DATA } from '../../data/seed';
import { useAppStore } from '../../store/app-store';

export const StudentMe: React.FC = () => {
  const { parentChildId } = useAppStore();
  // For demo, student is always the child linked to the current session
  const child = ALC_DATA.children.find(c => c.id === parentChildId) ?? ALC_DATA.children[4]; // Default to Priya (c5)
  const firstName = child.name.split(' ')[0];

  const badges = [
    { label: 'Explorer', icon: 'leaf', tone: 'sage' },
    { label: 'Builder', icon: 'star', tone: 'ochre' },
    ...(child.streak >= 5 ? [{ label: `${child.streak}-week streak`, icon: 'heart', tone: 'plum' }] : []),
  ];

  return (
    <div className="page-fade student-view">
      <div style={{ textAlign: 'center', padding: '32px 0 24px' }}>
        <div className={`tone-${child.tone}`} style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--tone-soft)', color: 'var(--tone-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, margin: '0 auto 16px', border: '3px solid var(--tone)' }}>
          {child.initials}
        </div>
        <h1 style={{ fontSize: 28, marginBottom: 6 }}>Hi, {firstName}!</h1>
        <div style={{ color: 'var(--ink-3)', fontSize: 15 }}>Welcome back to your learning space</div>
      </div>

      <div className="grid grid-3" style={{ gap: 12, marginBottom: 20 }}>
        <div className={`card tone-${child.tone}`} style={{ padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 900, marginBottom: 4 }}>{child.mastery}%</div>
          <div className="muted" style={{ fontSize: 13 }}>Mastery</div>
          <div style={{ marginTop: 8 }}><Trend dir={child.trend}/></div>
        </div>
        <div className="card" style={{ padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 900, marginBottom: 4 }}>{child.streak}</div>
          <div className="muted" style={{ fontSize: 13 }}>Week streak</div>
          <div style={{ marginTop: 8 }}><Icon name="leaf" size={16}/></div>
        </div>
        <div className="card" style={{ padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 900, marginBottom: 4 }}>{child.attendance}%</div>
          <div className="muted" style={{ fontSize: 13 }}>Attendance</div>
          <div style={{ marginTop: 8 }}><Icon name="check" size={16}/></div>
        </div>
      </div>

      <div className="grid grid-2" style={{ gap: 14, marginBottom: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="tiny" style={{ marginBottom: 10 }}>Things I'm good at</div>
          {child.strengths.map((s, i) => (
            <div key={i} className="row" style={{ gap: 8, padding: '8px 0', borderBottom: i < child.strengths.length - 1 ? '1px dashed var(--line)' : 'none' }}>
              <Icon name="star" size={14}/>
              <span style={{ fontSize: 13.5 }}>{s}</span>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div className="tiny" style={{ marginBottom: 10 }}>Things I'm growing</div>
          {child.gaps.map((g, i) => (
            <div key={i} className="row" style={{ gap: 8, padding: '8px 0', borderBottom: i < child.gaps.length - 1 ? '1px dashed var(--line)' : 'none' }}>
              <Icon name="leaf" size={14}/>
              <span style={{ fontSize: 13.5 }}>{g}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 14 }}>
        <div className="tiny" style={{ marginBottom: 12 }}>My progress this term</div>
        <Sparkline
          values={[child.mastery-16, child.mastery-12, child.mastery-8, child.mastery-5, child.mastery-3, child.mastery]}
          color="var(--sage)" height={60}/>
        <div className="row" style={{ gap: 8, marginTop: 8 }}>
          {['6 weeks ago', '', '', '', '', 'Now'].map((l, i) => (
            <div key={i} style={{ flex: 1, textAlign: i === 0 ? 'left' : i === 5 ? 'right' : 'center', fontSize: 11, color: 'var(--ink-4)' }}>{l}</div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div className="tiny" style={{ marginBottom: 12 }}>My badges</div>
        <div className="row wrap" style={{ gap: 10 }}>
          {badges.map(b => (
            <div key={b.label} className={`tone-${b.tone}`} style={{ padding: '10px 16px', borderRadius: 20, background: 'var(--tone-soft)', color: 'var(--tone-ink)', display: 'flex', gap: 6, alignItems: 'center', fontWeight: 700, fontSize: 13 }}>
              <Icon name={b.icon as any} size={14}/>
              {b.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentMe;
