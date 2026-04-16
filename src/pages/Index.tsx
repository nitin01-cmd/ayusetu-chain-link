import { useState } from 'react';
import AuthComponent from '@/components/AuthComponent';
import Dashboard from '@/components/Dashboard';


const Index = () => {

  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('auth') === 'true');
  const [userRole, setUserRole] = useState(() => localStorage.getItem('role') || '');
  const [userId, setUserId] = useState(() => localStorage.getItem('userId') || '');

  const handleLogin = (role: string, id: string) => {
    localStorage.setItem('auth', 'true');
    localStorage.setItem('role', role);
    localStorage.setItem('userId', id);
    setUserRole(role);
    setUserId(id);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    setIsAuthenticated(false);
    setUserRole('');
    setUserId('');
  };

  if (!isAuthenticated) {

    return <AuthComponent onLogin={handleLogin} />;
  }


  return <Dashboard userRole={userRole} userId={userId} onLogout={handleLogout} />;
};

export default Index;
