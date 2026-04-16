import { useState } from 'react';
import AuthComponent from '@/components/AuthComponent';
import Dashboard from '@/components/Dashboard';


const Index = () => {
  console.log("Index.tsx rendered");
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
    console.log("Rendering AuthComponent");
    return <AuthComponent onLogin={handleLogin} />;
  }

  console.log("Rendering Dashboard");
  return <Dashboard userRole={userRole} userId={userId} onLogout={handleLogout} />;
};

export default Index;
