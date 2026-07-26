import React, { useState } from 'react';
import { Icon, BrandLogo, SignOutButton } from '../../components/ui';
import { ResponsiveAppShell } from '../../components/layout/ResponsiveAppShell';
import { useAppStore } from '../../store/app-store';
import { ALC_DATA } from '../../data/seed';
import { StudentMe } from './StudentMe';
import { StudentHowILearn } from './StudentHowILearn';
import { StudentGrowing } from './StudentGrowing';
import { StudentTryToday } from './StudentTryToday';
import { StudentGarden } from './StudentGarden';

type SView = 'me' | 'how' | 'growing' | 'try' | 'garden';

export const StudentLayout: React.FC = () => {
  const { parentChildId, logout } = useAppStore();
  const [view, setView] = useState<SView>('me');

  const child = ALC_DATA.children.find(c => c.id === parentChildId) ?? ALC_DATA.children[4];
  const firstName = child.name.split(' ')[0];

  const navItems: { key: SView; icon: React.ComponentProps<typeof Icon>['name']; label: string }[] = [
    { key: 'me', icon: 'star', label: 'Me' },
    { key: 'how', icon: 'book', label: 'How I learn' },
    { key: 'growing', icon: 'leaf', label: 'Growing' },
    { key: 'try', icon: 'play', label: 'Try today' },
    { key: 'garden', icon: 'heart', label: 'My garden' },
  ];

  const sidebarContent = (
    <>
      <div className="brand"><BrandLogo size="md"/></div>

      <div className={`tone-${child.tone}`} style={{ padding: '14px 16px', borderRadius: 14, margin: '0 0 16px', background: 'var(--tone-soft)', textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--tone)', color: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, margin: '0 auto 8px', border: '2px solid var(--tone-ink)' }}>
          {child.initials}
        </div>
        <div style={{ fontWeight: 800, fontSize: 14 }}>{firstName}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Age {child.age} · {child.teacher}'s class</div>
      </div>

      <div className="nav-group">
        <div className="nav-label">My space</div>
        {navItems.map(item => (
          <button key={item.key} className={`nav-item ${view === item.key ? 'active' : ''}`}
            onClick={() => setView(item.key)}
            aria-current={view === item.key ? 'page' : undefined}>
            <Icon name={item.icon} size={16}/> {item.label}
          </button>
        ))}
      </div>

      <div className="role-pill">
        <div className="avatar" style={{ background: 'var(--sage-soft)', color: 'var(--sage-ink)' }}>{child.initials}</div>
        <div>
          <div style={{ fontWeight: 700 }}>{firstName}</div>
          <div style={{ color: 'var(--ink-3)', fontSize: 11.5 }}>Student · Acorns</div>
        </div>
      </div>
      <SignOutButton onClick={logout} label="Bye for now" style={{ marginTop: 10 }}/>
    </>
  );

  return (
    <ResponsiveAppShell sidebar={sidebarContent} userBadge={child.initials}>
      {view === 'me' && <StudentMe/>}
      {view === 'how' && <StudentHowILearn/>}
      {view === 'growing' && <StudentGrowing/>}
      {view === 'try' && <StudentTryToday/>}
      {view === 'garden' && <StudentGarden/>}
    </ResponsiveAppShell>
  );
};

export default StudentLayout;
