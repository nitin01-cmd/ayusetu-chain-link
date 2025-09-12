import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AggregatorView from './roles/AggregatorView';
import ProcessorView from './roles/ProcessorView';
import ManufacturerView from './roles/ManufacturerView';
import DistributorView from './roles/DistributorView';

interface DashboardProps {
  userRole: string;
  userId: string;
  onLogout: () => void;
}

const Dashboard = ({ userRole, userId, onLogout }: DashboardProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const roleDisplayNames = {
    aggregator: 'Aggregator/Collection Centre',
    processor: 'Processor/Processing Unit',
    manufacturer: 'Manufacturer/Formulation Unit',
    distributor: 'Distributor/Logistics Provider'
  };

  const roleColors = {
    aggregator: 'badge-pending',
    processor: 'badge-verified',
    manufacturer: 'badge-verified',
    distributor: 'badge-pending'
  };

  const renderRoleView = () => {
    switch (userRole) {
      case 'aggregator':
        return <AggregatorView userId={userId} />;
      case 'processor':
        return <ProcessorView userId={userId} />;
      case 'manufacturer':
        return <ManufacturerView userId={userId} />;
      case 'distributor':
        return <DistributorView userId={userId} />;
      default:
        return <div>Invalid role</div>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Government Header */}
      <header className="gov-header">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold">AyuSetu Traceability System</h1>
                <p className="text-sm opacity-90">Ministry of AYUSH - Government of India</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium">
                  {currentTime.toLocaleTimeString('en-IN', { 
                    timeZone: 'Asia/Kolkata',
                    hour12: true 
                  })}
                </div>
                <div className="text-xs opacity-75">
                  {currentTime.toLocaleDateString('en-IN')}
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onLogout}
                className="text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/10"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* User Info Bar */}
      <div className="bg-muted border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Badge className={roleColors[userRole as keyof typeof roleColors]}>
                {roleDisplayNames[userRole as keyof typeof roleDisplayNames]}
              </Badge>
              <span className="text-sm text-muted-foreground">
                User ID: <span className="font-mono">{userId}</span>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <span className="text-sm text-success font-medium">System Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <main className="container mx-auto px-4 py-8">
        {renderRoleView()}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              © 2024 AyuSetu - Ministry of AYUSH, Government of India
            </div>
            <div className="flex items-center space-x-4">
              <span>Version 1.0.0</span>
              <span>•</span>
              <span>Secure Traceability Platform</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;