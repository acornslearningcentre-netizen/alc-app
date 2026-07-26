import React, { useState } from 'react';
import { Icon, BrandLogo } from '../../../components/ui';
import { useAppStore } from '../../../store/app-store';
import { TeacherTodayV2 } from './TeacherTodayV2';
import { TeacherChildren } from '../../teacher/TeacherChildren';
import { TeacherObserve } from '../../teacher/TeacherObserve';
import { TeacherProfile } from '../../teacher/TeacherProfile';
import { TeacherPlanningV2 } from './TeacherPlanningV2';
import { TeacherProgress } from '../../teacher/TeacherProgress';
import { TeacherAssistant } from '../../teacher/TeacherAssistant';
import { TeacherMessages } from '../../teacher/TeacherMessages';
import '../../../styles/v2/teacher-today.css';

type TView = 'dashboard' | 'children' | 'observe' | 'profile' | 'plan' | 'progress' | 'assistant' | 'messages';

export const TeacherLayoutV2: React.FC = () => {
  const { logout } = useAppStore();
  const [view, setView] = useState<TView>('dashboard');
  const [profileId, setProfileId] = useState<string | null>(null);
  const [pendingGuardian, setPendingGuardian] = useState<string | null>(null);

  const openChild = (id: string) => { setProfileId(id); setView('profile'); };
  const sidebarView = view === 'profile' ? 'children' : view;

  const nav: { key: TView; icon: React.ComponentProps<typeof Icon>['name']; label: string; dot?: string }[] = [
    { key: 'dashboard', icon: 'home',    label: 'Today' },
    { key: 'children',  icon: 'users',   label: 'Children', dot: '12' },
    { key: 'observe',   icon: 'mic',     label: 'Observe' },
    { key: 'plan',      icon: 'book',    label: 'Plan' },
    { key: 'progress',  icon: 'chart',   label: 'Progress' },
  ];
  const support: { key: TView; icon: React.ComponentProps<typeof Icon>['name']; label: string; dot?: string }[] = [
    { key: 'assistant', icon: 'sparkle', label: 'AI' },
    { key: 'messages',  icon: 'message', label: 'Messages', dot: '3' },
  ];

  return (
    <div className="v2-teacher-shell">
      <aside className="v2-side">
        <div className="v2-side-mark">
          <BrandLogo size="sm" tone="dark"/>
        </div>

        <div className="v2-side-group">
          <div className="v2-side-label">Class</div>
          {nav.map(item => (
            <button key={item.key}
              className={`v2-side-item ${sidebarView === item.key ? 'active' : ''}`}
              onClick={() => { setView(item.key); if (item.key !== 'profile') setProfileId(null); }}
              aria-current={sidebarView === item.key ? 'page' : undefined}>
              <Icon name={item.icon} size={18}/>
              <span>{item.label}</span>
              {item.dot && <span className="v2-side-dot">{item.dot}</span>}
            </button>
          ))}
        </div>

        <div className="v2-side-group">
          <div className="v2-side-label">Support</div>
          {support.map(item => (
            <button key={item.key}
              className={`v2-side-item ${sidebarView === item.key ? 'active' : ''}`}
              onClick={() => { setView(item.key); if (item.key === 'messages') setPendingGuardian(null); }}
              aria-current={sidebarView === item.key ? 'page' : undefined}>
              <Icon name={item.icon} size={18}/>
              <span>{item.label}</span>
              {item.dot && <span className="v2-side-dot">{item.dot}</span>}
            </button>
          ))}
        </div>

        <div className="v2-side-foot">
          <div className="v2-side-pill">
            <span className="v2-side-avatar">MP</span>
          </div>
          <button className="v2-btn" onClick={logout} title="Sign out">
            <Icon name="arrow-right" size={14} stroke="currentColor"/>
            <span>Out</span>
          </button>
        </div>
      </aside>

      <main>
        {view === 'dashboard' && <TeacherTodayV2 onChild={openChild} onObserve={() => setView('observe')}/>}
        {view === 'children' && (
          <div className="v2-content"><TeacherChildren onChild={openChild}/></div>
        )}
        {view === 'observe' && (
          <div className="v2-content"><TeacherObserve preselectId={profileId} onSaved={() => setView('dashboard')}/></div>
        )}
        {view === 'profile' && profileId && (
          <div className="v2-content"><TeacherProfile childId={profileId} onBack={() => { setView('children'); setProfileId(null); }} onMessageParent={(g) => { setPendingGuardian(g); setView('messages'); }}/></div>
        )}
        {view === 'plan' && <TeacherPlanningV2 onChild={openChild}/>}
        {view === 'progress' && <div className="v2-content"><TeacherProgress/></div>}
        {view === 'assistant' && <div className="v2-content"><TeacherAssistant/></div>}
        {view === 'messages' && <div className="v2-content"><TeacherMessages initialGuardianName={pendingGuardian}/></div>}
      </main>
    </div>
  );
};

export default TeacherLayoutV2;
