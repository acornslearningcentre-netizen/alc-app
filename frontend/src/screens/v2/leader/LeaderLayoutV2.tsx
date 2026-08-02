import React, { useState } from 'react';
import { Icon, BrandLogo } from '../../../components/ui';
import { useAppStore } from '../../../store/app-store';
import { LeaderToday } from '../../leader/LeaderToday';
import { LeaderCohorts } from '../../leader/LeaderCohorts';
import { LeaderTeachers } from '../../leader/LeaderTeachers';
import { LeaderPatterns } from '../../leader/LeaderPatterns';
import { LeaderOutcomes } from '../../leader/LeaderOutcomes';
import { AdmissionsView } from './onboarding/AdmissionsView';
import '../../../styles/v2/teacher-today.css';

type LView = 'dashboard' | 'admissions' | 'cohorts' | 'teachers' | 'patterns' | 'outcomes';

export const LeaderLayoutV2: React.FC = () => {
  const { logout } = useAppStore();
  const [view, setView] = useState<LView>('dashboard');

  const nav: { key: LView; icon: React.ComponentProps<typeof Icon>['name']; label: string; dot?: string }[] = [
    { key: 'dashboard',  icon: 'home',  label: 'Today' },
    { key: 'admissions', icon: 'heart', label: 'Admissions' },
    { key: 'cohorts',   icon: 'users', label: 'Cohorts' },
    { key: 'teachers',  icon: 'star',  label: 'Teachers' },
    { key: 'patterns',  icon: 'flag',  label: 'Patterns', dot: '4' },
    { key: 'outcomes',  icon: 'chart', label: 'Outcomes' },
  ];

  return (
    <div className="v2-teacher-shell">
      <aside className="v2-side">
        <div className="v2-side-mark"><BrandLogo size="sm" tone="dark"/></div>

        <div className="v2-side-group">
          <div className="v2-side-label">School</div>
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
            <span className="v2-side-avatar">DO</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>Dr. Okafor</div>
              <div style={{ color: 'var(--v2-mist)', fontSize: 11.5, fontFamily: 'var(--v2-mono)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Head · Leader</div>
            </div>
          </div>
          <button className="v2-btn ghost" onClick={logout} style={{ justifyContent: 'flex-start' }}>
            <Icon name="arrow-right" size={13} stroke="currentColor"/> Sign out
          </button>
        </div>
      </aside>

      <main>
        <div className="v2-content">
          {view === 'dashboard' && <LeaderToday/>}
          {view === 'admissions' && <AdmissionsView/>}
          {view === 'cohorts' && <LeaderCohorts/>}
          {view === 'teachers' && <LeaderTeachers/>}
          {view === 'patterns' && <LeaderPatterns/>}
          {view === 'outcomes' && <LeaderOutcomes/>}
        </div>
      </main>
    </div>
  );
};

export default LeaderLayoutV2;
