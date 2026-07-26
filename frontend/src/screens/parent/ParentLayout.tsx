import React, { useState } from 'react';
import { Icon, BrandLogo, SignOutButton } from '../../components/ui';
import { ResponsiveAppShell } from '../../components/layout/ResponsiveAppShell';
import { useAppStore } from '../../store/app-store';
import { ALC_DATA } from '../../data/seed';
import { ParentHome } from './ParentHome';
import { ParentMessages } from './ParentMessages';
import { ParentAssistant } from './ParentAssistant';

type PView = 'home' | 'messages' | 'assistant';

export const ParentLayout: React.FC = () => {
  const { parentChildId, logout } = useAppStore();
  const [view, setView] = useState<PView>('home');

  const child = ALC_DATA.children.find(c => c.id === parentChildId) ?? ALC_DATA.children[0];
  const guardianInitials = child.guardian.split(' ').map((w: string) => w[0]).join('');

  const navItems: { key: PView; icon: React.ComponentProps<typeof Icon>['name']; label: string; dot?: string }[] = [
    { key: 'home', icon: 'home', label: `${child.name.split(' ')[0]}'s day` },
    { key: 'messages', icon: 'message', label: 'Messages', dot: '1' },
    { key: 'assistant', icon: 'sparkle', label: 'Ask anything' },
  ];

  const sidebarContent = (
    <>
      <div className="brand"><BrandLogo size="md"/></div>

      <div className={`tone-${child.tone}`} style={{ padding: '14px 16px', borderRadius: 14, margin: '0 0 16px', background: 'var(--tone-soft)' }}>
        <div className="row" style={{ gap: 10, marginBottom: 10 }}>
          <div className="avatar-lg" style={{ width: 34, height: 34, fontSize: 12 }}>{child.initials}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13.5 }}>{child.name}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Age {child.age} · {child.teacher}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="row between">
            <span className="muted" style={{ fontSize: 12 }}>Mastery</span>
            <span style={{ fontWeight: 700, fontSize: 13 }}>{child.mastery}%</span>
          </div>
          <div className="bar" style={{ height: 6 }}><span style={{ width: child.mastery + '%' }}/></div>
        </div>
      </div>

      <div className="nav-group">
        <div className="nav-label">Family view</div>
        {navItems.map(item => (
          <button key={item.key} className={`nav-item ${view === item.key ? 'active' : ''}`}
            onClick={() => setView(item.key)}
            aria-current={view === item.key ? 'page' : undefined}>
            <Icon name={item.icon} size={16}/> {item.label}
            {item.dot && <span className="dot">{item.dot}</span>}
          </button>
        ))}
      </div>

      <div className="role-pill">
        <div className="avatar">{guardianInitials}</div>
        <div>
          <div style={{ fontWeight: 700 }}>{child.guardian}</div>
          <div style={{ color: 'var(--ink-3)', fontSize: 11.5 }}>Parent · Acorns</div>
        </div>
      </div>
      <SignOutButton onClick={logout} style={{ marginTop: 10 }}/>
    </>
  );

  return (
    <ResponsiveAppShell sidebar={sidebarContent} userBadge={guardianInitials}>
      {view === 'home' && <ParentHome/>}
      {view === 'messages' && <ParentMessages/>}
      {view === 'assistant' && <ParentAssistant/>}
    </ResponsiveAppShell>
  );
};

export default ParentLayout;
