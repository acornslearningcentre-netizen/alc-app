import React from 'react';
import { Icon, Sparkline, Trend } from '../../components/ui';
import { ALC_DATA } from '../../data/seed';
import { useAppStore } from '../../store/app-store';

export const ParentHome: React.FC = () => {
  const { parentChildId } = useAppStore();
  const child = ALC_DATA.children.find(c => c.id === parentChildId) ?? ALC_DATA.children[0];
  const observations = ALC_DATA.observations.filter(o => o.childId === child.id);
  const nextSteps = ALC_DATA.nextSteps[child.id as keyof typeof ALC_DATA.nextSteps] ?? [];

  return (
    <div className="page-fade">
      <div className="topbar">
        <div>
          <h1>Good morning, {child.guardian.split(' ')[0]}.</h1>
          <div className="sub">{child.name} · {child.age} years old · {child.teacher}'s class</div>
        </div>
        <div className="topbar-actions">
          <span className={`chip tone-${child.tone}`}><Icon name="leaf" size={11}/> Week {child.streak} streak</span>
        </div>
      </div>

      <div className="grid grid-3" style={{ gap: 16, marginBottom: 16 }}>
        <div className={`card tone-${child.tone}`} style={{ padding: 20 }}>
          <div className="tiny">Mastery this term</div>
          <div className="stat-number">{child.mastery}%</div>
          <div className="row" style={{ gap: 6, marginTop: 8 }}>
            <Sparkline values={[child.mastery-16, child.mastery-12, child.mastery-8, child.mastery-5, child.mastery-3, child.mastery]} color="var(--tone)"/>
            <Trend dir={child.trend}/>
          </div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div className="tiny">Attendance</div>
          <div className="stat-number">{child.attendance}%</div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>This term</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div className="tiny">Observations this week</div>
          <div className="stat-number">{observations.length}</div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>From {child.teacher}</div>
        </div>
      </div>

      <div className="grid cols-sidebar" style={{ gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ marginBottom: 14 }}>Latest from school</h3>
            {observations.length > 0 ? observations.map((o, i) => (
              <div key={o.id} style={{ padding: '14px 0', borderBottom: i < observations.length - 1 ? '1px dashed var(--line)' : 'none' }}>
                <div className="row between" style={{ marginBottom: 6 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <div className="avatar-lg" style={{ width: 26, height: 26, fontSize: 10 }}>MP</div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{o.author}</div>
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>{o.time}</div>
                </div>
                <div style={{ fontSize: 13.5, lineHeight: 1.6, marginBottom: 8 }}>{o.text}</div>
                <div className="row wrap" style={{ gap: 4 }}>
                  {o.tags.map(t => <span key={t} className="chip" style={{ fontSize: 11 }}>{t}</span>)}
                </div>
              </div>
            )) : (
              <div className="muted" style={{ fontSize: 13 }}>No observations shared yet this week.</div>
            )}
          </div>

          {observations.filter(o => o.role === 'parent').length > 0 && (
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ marginBottom: 14 }}>Your shared moments</h3>
              {observations.filter(o => o.role === 'parent').map((o, i) => (
                <div key={o.id} style={{ padding: '12px 0', borderBottom: i < observations.filter(x => x.role === 'parent').length - 1 ? '1px dashed var(--line)' : 'none' }}>
                  <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>{o.time}</div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>{o.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className={`card tone-${child.tone}`} style={{ padding: 16 }}>
            <div className="tiny" style={{ marginBottom: 10 }}>Learning profile</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Learning style</div>
                <div style={{ fontWeight: 700 }}>{child.style}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Current focus areas</div>
                <div className="row wrap" style={{ gap: 4 }}>
                  {child.focus.map(f => <span key={f} className="chip">{f}</span>)}
                </div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Strengths</div>
                <div style={{ fontSize: 13, lineHeight: 1.6 }}>{child.strengths.join(' · ')}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Growing edges</div>
                <div style={{ fontSize: 13, lineHeight: 1.6 }}>{child.gaps.join(' · ')}</div>
              </div>
            </div>
          </div>

          {nextSteps.length > 0 && (
            <div className="card" style={{ padding: 16 }}>
              <div className="tiny" style={{ marginBottom: 10 }}>Ways to support at home</div>
              {nextSteps.filter(ns => ns.type === 'Home').map((ns, i) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: i < nextSteps.filter(x => x.type === 'Home').length - 1 ? '1px dashed var(--line)' : 'none' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{ns.title}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{ns.rationale}</div>
                </div>
              ))}
              {nextSteps.filter(ns => ns.type === 'Home').length === 0 && (
                <div className="muted" style={{ fontSize: 12.5 }}>Check back — teacher notes for home activities appear here.</div>
              )}
            </div>
          )}

          <div className="card" style={{ padding: 16, background: 'var(--cream-2)' }}>
            <div className="tiny" style={{ marginBottom: 6 }}>Share a moment</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.6, marginBottom: 10 }}>
              What did {child.name.split(' ')[0]} do at home that surprised or delighted you? Teachers love these notes.
            </div>
            <button className="btn primary" style={{ width: '100%' }}>
              <Icon name="plus" size={13}/> Add home observation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentHome;
