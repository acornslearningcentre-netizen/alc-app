import React, { useState } from 'react';
import { Icon, BrandLogo, SignOutButton } from '../../components/ui';
import { ResponsiveAppShell } from '../../components/layout/ResponsiveAppShell';
import { useAppStore } from '../../store/app-store';
import { TeacherToday } from './TeacherToday';
import { TeacherChildren } from './TeacherChildren';
import { TeacherObserve } from './TeacherObserve';
import { TeacherProfile } from './TeacherProfile';
import { TeacherPlanning } from './TeacherPlanning';
import { TeacherProgress } from './TeacherProgress';
import { TeacherAssistant } from './TeacherAssistant';
import { TeacherMessages } from './TeacherMessages';

type TView = 'dashboard' | 'children' | 'observe' | 'profile' | 'plan' | 'progress' | 'assistant' | 'messages';

export const TeacherLayout: React.FC = () => {
  const { logout } = useAppStore();
  const [view, setView] = useState<TView>('dashboard');
  const [profileId, setProfileId] = useState<string | null>(null);
  const [pendingGuardian, setPendingGuardian] = useState<string | null>(null);

  const openChild = (id: string) => { setProfileId(id); setView('profile'); };
  const messageParent = (guardianName: string) => {
    setPendingGuardian(guardianName);
    setView('messages');
  };
  const sidebarView = view === 'profile' ? 'children' : view;

  const navItems: { key: TView; icon: React.ComponentProps<typeof Icon>['name']; label: string; dot?: string }[] = [
    { key: 'dashboard', icon: 'home', label: 'Today' },
    { key: 'children', icon: 'users', label: 'Children', dot: '12' },
    { key: 'observe', icon: 'mic', label: 'Observe' },
    { key: 'plan', icon: 'book', label: 'Planning' },
    { key: 'progress', icon: 'chart', label: 'Progress' },
  ];
  const supportItems: { key: TView; icon: React.ComponentProps<typeof Icon>['name']; label: string; dot?: string }[] = [
    { key: 'assistant', icon: 'sparkle', label: 'AI Assistant' },
    { key: 'messages', icon: 'message', label: 'Messages', dot: '3' },
  ];

  const sidebarContent = (
    <>
      <div className="brand"><BrandLogo size="md"/></div>
      <div className="nav-group">
        <div className="nav-label">Classroom</div>
        {navItems.map(item => (
          <button key={item.key} className={`nav-item ${sidebarView === item.key ? 'active' : ''}`}
            onClick={() => { setView(item.key); if (item.key !== 'profile') setProfileId(null); }}
            aria-current={sidebarView === item.key ? 'page' : undefined}>
            <Icon name={item.icon} size={16}/> {item.label}
            {item.dot && <span className="dot">{item.dot}</span>}
          </button>
        ))}
      </div>
      <div className="nav-group">
        <div className="nav-label">Support</div>
        {supportItems.map(item => (
          <button key={item.key} className={`nav-item ${sidebarView === item.key ? 'active' : ''}`}
            onClick={() => { setView(item.key); if (item.key === 'messages') setPendingGuardian(null); }}
            aria-current={sidebarView === item.key ? 'page' : undefined}>
            <Icon name={item.icon} size={16}/> {item.label}
            {item.dot && <span className="dot">{item.dot}</span>}
          </button>
        ))}
      </div>
      <div className="role-pill">
        <div className="avatar">MP</div>
        <div>
          <div style={{ fontWeight: 700 }}>Ms. Pereira</div>
          <div style={{ color: 'var(--ink-3)', fontSize: 11.5 }}>Primary — Teacher</div>
        </div>
      </div>
      <SignOutButton onClick={logout} style={{ marginTop: 10 }}/>
    </>
  );

  return (
    <ResponsiveAppShell sidebar={sidebarContent} userBadge="MP">
      {view === 'dashboard' && <TeacherToday onChild={openChild} onObserve={() => setView('observe')}/>}
      {view === 'children' && <TeacherChildren onChild={openChild}/>}
      {view === 'observe' && <TeacherObserve preselectId={profileId} onSaved={() => setView('dashboard')}/>}
      {view === 'profile' && profileId && <TeacherProfile childId={profileId} onBack={() => { setView('children'); setProfileId(null); }} onMessageParent={messageParent}/>}
      {view === 'plan' && <TeacherPlanning/>}
      {view === 'progress' && <TeacherProgress/>}
      {view === 'assistant' && <TeacherAssistant/>}
      {view === 'messages' && <TeacherMessages initialGuardianName={pendingGuardian}/>}
    </ResponsiveAppShell>
  );
};

export default TeacherLayout;
