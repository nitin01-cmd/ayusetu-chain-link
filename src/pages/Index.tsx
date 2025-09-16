import { useState, useEffect } from 'react';
import AuthPage from '@/components/AuthPage';
import Dashboard from '@/components/Dashboard';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user, loading, signOut, getUserRole } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadUserRole();
    }
  }, [user]);

  const loadUserRole = async () => {
    if (user) {
      const { role } = await getUserRole(user.id);
      setUserRole(role || null);
    }
  };

  const handleAuthSuccess = (userId: string, role: string) => {
    setUserRole(role);
  };

  const handleLogout = async () => {
    await signOut();
    setUserRole(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !userRole) {
    return <AuthPage onSuccess={handleAuthSuccess} />;
  }

  return <Dashboard userRole={userRole} userId={user.id} onLogout={handleLogout} />;
};

export default Index;
