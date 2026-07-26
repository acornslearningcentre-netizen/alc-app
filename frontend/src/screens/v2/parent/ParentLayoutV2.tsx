import React, { useState } from 'react';
import { Icon, BrandLogo } from '../../../components/ui';
import { useAppStore } from '../../../store/app-store';
import { ALC_DATA } from '../../../data/seed';
import { ParentHome } from '../../parent/ParentHome';
import { ParentMessages } from '../../parent/ParentMessages';
import { ParentAssistant } from '../../parent/ParentAssistant';
import '../../../styles/v2/teacher-today.css';

type PView = 'home' | 'messages' | 'assistant';

export const ParentLayoutV2: React.FC = () => {
  const { parentChildId, logout } = useAppStore();
  const [view, setView] = useState<PView>('home');

  const child = ALC_DATA.children.find(c => c.id === parentChildId) ?? ALC_DATA.children[0];
  const guardianInitials = child.guardian.split(' ').map((w: string) => w[0]).join('');
  const firstName = child.name.split(' ')[0];

  const nav: { key: PView; icon: React.ComponentProps<typeof Icon>['name']; label: string; dot?: string }[] = [
    { key: 'home',      icon: 'home',    label: `${firstName}'s day` },
    { key: 'messages',  icon: 'message', label: 'Messages', dot: '1' },
    { key: 'assistant', icon: 'sparkle', label: 'Ask anything' },
  ];

  return (
    <div className="v2-teacher-shell">
      <aside className="v2-side">
        <div className="v2-side-mark"><BrandLogo size="sm" tone="dark"/></div>

        <div className="v2-side-group">
          <div className="v2-side-label">Family</div>
          {nav.map(item => (
            <button key={item.key}
              className={`v2-side-item ${view === item.key ? 'active' : ''}`}
              onClick={() => setView(item.key)}
              aria-current={view === item.key ? 'page' : undefined}>
              <Icon name={item.icon} size={16}/> {item.label}
              {item.dot && <span className="v2-side-dot">{item.dot}</span>}
            </button>
          ))}
        </div>

        <div className="v2-side-foot">
          <div className="v2-side-pill">
            <span className="v2-side-avatar">{guardianInitials}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{child.guardian}</div>
              <div style={{ color: 'var(--v2-mist)', fontSize: 11.5, fontFamily: 'var(--v2-mono)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Parent · {firstName}</div>
            </div>
          </div>
          <button className="v2-btn ghost" onClick={logout} style={{ justifyContent: 'flex-start' }}>
            <Icon name="arrow-right" size={13} stroke="currentColor"/> Sign out
          </button>
        </div>
      </aside>

      <main>
        <div className="v2-content">
          {view === 'home' && <ParentHome/>}
          {view === 'messages' && <ParentMessages/>}
          {view === 'assistant' && <ParentAssistant/>}
        </div>
      </main>
    </div>
  );
};

export default ParentLayoutV2;
