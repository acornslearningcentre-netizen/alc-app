import React, { useState } from 'react';
import { Icon, BrandLogo, SignOutButton } from '../../components/ui';
import { ResponsiveAppShell } from '../../components/layout/ResponsiveAppShell';
import { useAppStore } from '../../store/app-store';
import { LeaderToday } from './LeaderToday';
import { LeaderCohorts } from './LeaderCohorts';
import { LeaderTeachers } from './LeaderTeachers';
import { LeaderPatterns } from './LeaderPatterns';
import { LeaderOutcomes } from './LeaderOutcomes';

type LView = 'dashboard' | 'cohorts' | 'teachers' | 'patterns' | 'outcomes';

export const LeaderLayout: React.FC = () => {
  const { logout } = useAppStore();
  const [view, setView] = useState<LView>('dashboard');

  const navItems: { key: LView; icon: React.ComponentProps<typeof Icon>['name']; label: string; dot?: string }[] = [
    { key: 'dashboard', icon: 'home', label: 'Today' },
    { key: 'cohorts', icon: 'users', label: 'Cohorts' },
    { key: 'teachers', icon: 'star', label: 'Teachers' },
    { key: 'patterns', icon: 'flag', label: 'Patterns', dot: '4' },
    { key: 'outcomes', icon: 'chart', label: 'Outcomes' },
  ];

  const sidebarContent = (
    <>
      <div className="brand"><BrandLogo size="md"/></div>
      <div className="nav-group">
        <div className="nav-label">School view</div>
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
        <div className="avatar">DO</div>
        <div>
          <div style={{ fontWeight: 700 }}>Dr. Okafor</div>
          <div style={{ color: 'var(--ink-3)', fontSize: 11.5 }}>Head Teacher · Leader</div>
        </div>
      </div>
      <SignOutButton onClick={logout} style={{ marginTop: 10 }}/>
    </>
  );

  return (
    <ResponsiveAppShell sidebar={sidebarContent} userBadge="DO">
      {view === 'dashboard' && <LeaderToday/>}
      {view === 'cohorts' && <LeaderCohorts/>}
      {view === 'teachers' && <LeaderTeachers/>}
      {view === 'patterns' && <LeaderPatterns/>}
      {view === 'outcomes' && <LeaderOutcomes/>}
    </ResponsiveAppShell>
  );
};

export default LeaderLayout;
