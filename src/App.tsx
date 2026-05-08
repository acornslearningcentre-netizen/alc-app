import { useEffect, useState } from 'react';
import { useAppStore } from './store/app-store';
import { LoginScreen } from './screens/login/LoginScreen';
import { TeacherLayout } from './screens/teacher/TeacherLayout';
import { ParentLayout } from './screens/parent/ParentLayout';
import { StudentLayout } from './screens/student/StudentLayout';
import { LeaderLayout } from './screens/leader/LeaderLayout';
import { LoginV2 } from './screens/v2/login/LoginV2';
import { TeacherLayoutV2 } from './screens/v2/teacher/TeacherLayoutV2';
import { ParentLayoutV2 } from './screens/v2/parent/ParentLayoutV2';
import { StudentLayoutV2 } from './screens/v2/student/StudentLayoutV2';
import { LeaderLayoutV2 } from './screens/v2/leader/LeaderLayoutV2';
import { ReviewGuide } from './components/review/ReviewGuide';
import { VariantSwitch } from './components/v2/VariantSwitch';
import { IntakeFlow } from './screens/intake/IntakeFlow';
import type { Role } from './data/types';

function useV2Path() {
  const [isV2, setIsV2] = useState(() => window.location.pathname.startsWith('/v2'));
  useEffect(() => {
    const sync = () => setIsV2(window.location.pathname.startsWith('/v2'));
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);
  return [isV2, (next: boolean) => {
    const target = next ? '/v2' : '/';
    if (window.location.pathname !== target) {
      window.history.pushState({}, '', target);
      setIsV2(next);
    }
  }] as const;
}

function useWelcomePath() {
  const [isWelcome, setIsWelcome] = useState(() => window.location.pathname.startsWith('/welcome'));
  useEffect(() => {
    const sync = () => setIsWelcome(window.location.pathname.startsWith('/welcome'));
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);
  return isWelcome;
}

function App() {
  const { authed, role, variant, login } = useAppStore();
  const [isV2, setIsV2] = useV2Path();
  const isWelcome = useWelcomePath();

  // Apply variant class to body (v1 calm/playful)
  useEffect(() => {
    document.body.classList.remove('variant-calm', 'variant-playful');
    document.body.classList.add(`variant-${variant}`);
  }, [variant]);

  // Apply v2 class to body — scopes all v2 styles. The intake form is v2-only.
  useEffect(() => {
    document.body.classList.toggle('v2', isV2 || isWelcome);
  }, [isV2, isWelcome]);

  const handleLogin = (r: Role, opts?: { childId?: string }) => {
    login(r, opts);
  };

  const renderRoleV1 = () => {
    switch (role) {
      case 'teacher': return <TeacherLayout/>;
      case 'parent': return <ParentLayout/>;
      case 'student': return <StudentLayout/>;
      case 'leader': return <LeaderLayout/>;
      default: return <TeacherLayout/>;
    }
  };

  const renderRoleV2 = () => {
    switch (role) {
      case 'teacher': return <TeacherLayoutV2/>;
      case 'parent':  return <ParentLayoutV2/>;
      case 'student': return <StudentLayoutV2/>;
      case 'leader':  return <LeaderLayoutV2/>;
      default: return <TeacherLayoutV2/>;
    }
  };

  // Public, parent-facing intake flow — no auth, no chrome.
  if (isWelcome) {
    return <IntakeFlow/>;
  }

  return (
    <>
      {isV2
        ? (authed ? renderRoleV2() : <LoginV2 onLogin={handleLogin}/>)
        : (authed ? renderRoleV1() : <LoginScreen onLogin={handleLogin}/>)}
      <ReviewGuide/>
      <VariantSwitch isV2={isV2} onToggle={setIsV2}/>
    </>
  );
}

export default App;
