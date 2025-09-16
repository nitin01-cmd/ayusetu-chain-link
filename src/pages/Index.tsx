import { useState } from 'react';
import AuthComponent from '@/components/AuthComponent';
import Dashboard from '@/components/Dashboard';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState('');

  const handleLogin = (role: string, id: string) => {
    setUserRole(role);
    setUserId(id);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
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
