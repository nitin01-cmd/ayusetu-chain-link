import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShieldCheck, 
  LogOut, 
  Clock, 
  User, 
  LayoutDashboard,
  ShieldAlert,
  ChevronRight,
  Database
} from 'lucide-react';

// View imports
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
    aggregator: 'Aggregator / Collection',
    processor: 'Processor / Refinement',
    manufacturer: 'Manufacturer / Formulation',
    distributor: 'Distributor / Logistics'
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      {/* 1. DARK SIDEBAR-STYLE TOP NAV */}
      <header className="bg-[#0F172A] text-white shadow-2xl">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-emerald-500 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              <ShieldCheck className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight leading-none">
                AyuSetu<span className="text-emerald-500">.</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">
                Govt. Traceability Node
              </p>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="hidden lg:block text-right border-r border-slate-700 pr-6">
              <div className="text-lg font-mono font-bold text-emerald-400 leading-none">
                {currentTime.toLocaleTimeString('en-IN', { hour12: true })}
              </div>
              <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
              </div>
            </div>
            
            <Button 
              onClick={onLogout}
              className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 px-6 font-bold transition-all duration-300"
            >
              <LogOut size={18} className="mr-2" />
              LOGOUT
            </Button>
          </div>
        </div>
      </header>

      {/* 2. SUB-NAV / BREADCRUMBS (WHITE) */}
      <div className="bg-white border-b border-slate-200 py-3 shadow-sm">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <LayoutDashboard size={14} className="text-emerald-600" />
            <span>Console</span>
            <ChevronRight size={12} />
            <span className="text-slate-900">{userRole}</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-bold">
            <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              <Database size={12} />
              <span>BLOCKCHAIN SYNCED</span>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-10 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* 3. SIDE PROFILE CARD (DARK) */}
          <div className="lg:col-span-1">
            <div className="bg-[#1E293B] rounded-3xl p-8 shadow-xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full translate-x-10 -translate-y-10"></div>
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4 shadow-2xl">
                  <User size={40} className="text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold truncate w-full">{userId}</h2>
                <Badge className="mt-3 bg-emerald-500 text-white border-none px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {userRole}
                </Badge>
                
                <div className="w-full mt-8 pt-8 border-t border-slate-700/50 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Security Level</span>
                    <span className="text-xs font-mono text-emerald-400 font-bold underline underline-offset-4">L4_HIGH</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Node Status</span>
                    <span className="text-[10px] text-emerald-400 font-black">● ONLINE</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-3">
               <ShieldAlert size={20} className="text-emerald-600 mt-0.5" />
               <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
                 <strong>System Advisory:</strong> Ensure all batch records are cryptographically signed before 18:00 IST.
               </p>
            </div>
          </div>

          {/* 4. MAIN CONTENT AREA (WHITE) */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-8 min-h-[600px] relative overflow-hidden">
              <div className="relative z-10">
                {/* Dynamically Render Views */}
                {userRole === 'aggregator' && <AggregatorView userId={userId} />}
                {userRole === 'processor' && <ProcessorView userId={userId} />}
                {userRole === 'manufacturer' && <ManufacturerView userId={userId} />}
                {userRole === 'distributor' && <DistributorView userId={userId} />}
              </div>
              
              {/* Subtle Branding Watermark */}
              <div className="absolute bottom-10 right-10 opacity-[0.03] select-none pointer-events-none">
                <ShieldCheck size={280} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 5. MINIMALIST FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AyuSetu Traceability Platform</div>
            <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">NIC_CLOUD_DEPLOYED</div>
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase">
            Ministry of AYUSH • © 2026 Government of India
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;