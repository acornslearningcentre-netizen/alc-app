import React, { useState } from 'react';
import { Icon, BrandLogo } from '../../../components/ui';
import { useAppStore } from '../../../store/app-store';
import { ALC_DATA } from '../../../data/seed';
import { StudentMe } from '../../student/StudentMe';
import { StudentHowILearn } from '../../student/StudentHowILearn';
import { StudentGrowing } from '../../student/StudentGrowing';
import { StudentTryToday } from '../../student/StudentTryToday';
import { StudentGarden } from '../../student/StudentGarden';
import '../../../styles/v2/teacher-today.css';

type SView = 'me' | 'how' | 'growing' | 'try' | 'garden';

export const StudentLayoutV2: React.FC = () => {
  const { parentChildId, logout } = useAppStore();
  const [view, setView] = useState<SView>('me');

  const child = ALC_DATA.children.find(c => c.id === parentChildId) ?? ALC_DATA.children[4];
  const firstName = child.name.split(' ')[0];

  const nav: { key: SView; icon: React.ComponentProps<typeof Icon>['name']; label: string }[] = [
    { key: 'me',      icon: 'star',  label: 'Me' },
    { key: 'how',     icon: 'book',  label: 'How I learn' },
    { key: 'growing', icon: 'leaf',  label: 'Growing' },
    { key: 'try',     icon: 'play',  label: 'Try today' },
    { key: 'garden',  icon: 'heart', label: 'My garden' },
  ];

  return (
    <div className="v2-teacher-shell">
      <aside className="v2-side">
        <div className="v2-side-mark"><BrandLogo size="sm" tone="dark"/></div>

        <div className="v2-side-group">
          <div className="v2-side-label">My space</div>
          {nav.map(item => (
            <button key={item.key}
              className={`v2-side-item ${view === item.key ? 'active' : ''}`}
              onClick={() => setView(item.key)}
              aria-current={view === item.key ? 'page' : undefined}>
              <Icon name={item.icon} size={16}/> {item.label}
            </button>
          ))}
        </div>

        <div className="v2-side-foot">
          <div className="v2-side-pill">
            <span className="v2-side-avatar">{child.initials}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{firstName}</div>
              <div style={{ color: 'var(--v2-mist)', fontSize: 11.5, fontFamily: 'var(--v2-mono)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Student · Age {child.age}</div>
            </div>
          </div>
          <button className="v2-btn ghost" onClick={logout} style={{ justifyContent: 'flex-start' }}>
            <Icon name="arrow-right" size={13} stroke="currentColor"/> Bye for now
          </button>
        </div>
      </aside>

      <main>
        <div className="v2-content">
          {view === 'me' && <StudentMe/>}
          {view === 'how' && <StudentHowILearn/>}
          {view === 'growing' && <StudentGrowing/>}
          {view === 'try' && <StudentTryToday/>}
          {view === 'garden' && <StudentGarden/>}
        </div>
      </main>
    </div>
  );
};

export default StudentLayoutV2;
