import { useEffect } from 'react';
import { useAppStore } from './store/app-store';
import { LoginScreen } from './screens/login/LoginScreen';
import { TeacherLayout } from './screens/teacher/TeacherLayout';
import { ParentLayout } from './screens/parent/ParentLayout';
import { StudentLayout } from './screens/student/StudentLayout';
import { LeaderLayout } from './screens/leader/LeaderLayout';
import type { Role } from './data/types';

function App() {
  const { authed, role, variant, login } = useAppStore();

  // Apply variant class to body
  useEffect(() => {
    document.body.classList.remove('variant-calm', 'variant-playful');
    document.body.classList.add(`variant-${variant}`);
  }, [variant]);

  const handleLogin = (r: Role, opts?: { childId?: string }) => {
    login(r, opts);
  };

  const renderRole = () => {
    switch (role) {
      case 'teacher': return <TeacherLayout/>;
      case 'parent': return <ParentLayout/>;
      case 'student': return <StudentLayout/>;
      case 'leader': return <LeaderLayout/>;
      default: return <TeacherLayout/>;
    }
  };

  return authed ? renderRole() : <LoginScreen onLogin={handleLogin}/>;
}

export default App;
