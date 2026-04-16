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
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '@/integrations/firebase/client';
import ayusetuEmblem from '@/assets/ayusetu-emblem.png';

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
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const q = query(collection(firestore, 'business_nodes'), where('id', '==', userId));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setProfileData(snapshot.docs[0].data());
        }
      } catch (err) {
        console.error("Error fetching profile details from Firebase:", err);
      }
    };
    if (userId) fetchProfile();
  }, [userId]);

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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col font-sans relative overflow-hidden">
      {/* Background Decorators */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-emerald-400/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-teal-400/20 rounded-full blur-[100px] pointer-events-none" />
      {/* 1. GLASSMORPHISM TOP NAV */}
      <header className="bg-white/70 backdrop-blur-xl border-b border-emerald-200/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white border border-emerald-100/50 flex items-center justify-center p-1.5 shadow-sm">
              <img src={ayusetuEmblem} alt="AyuSetu Emblem" className="w-full h-full object-contain drop-shadow-sm scale-110" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight leading-none text-emerald-950">
                AyuSetu<span className="text-emerald-500">.</span>
              </h1>
              <p className="text-[10px] font-bold text-emerald-600/80 uppercase tracking-[0.3em] mt-1">
                Govt. Traceability Node
              </p>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="hidden lg:block text-right border-r border-emerald-200 pr-6 relative z-10">
              <div className="text-lg font-mono font-bold text-emerald-900 leading-none">
                {currentTime.toLocaleTimeString('en-IN', { hour12: true })}
              </div>
              <div className="text-[10px] text-emerald-600 font-bold uppercase mt-1">
                {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
              </div>
            </div>

            <Button
              onClick={onLogout}
              className="bg-red-50 hover:bg-red-500 text-red-600 hover:text-white border border-red-200 hover:border-red-500 px-6 font-bold shadow-sm transition-all duration-300 relative z-10"
            >
              <LogOut size={18} className="mr-2" />
              LOGOUT
            </Button>
          </div>
        </div>
      </header>

      {/* 2. SUB-NAV / BREADCRUMBS (TRANSPARENT GLASS) */}
      <div className="bg-white/40 backdrop-blur-md border-b border-emerald-200/40 py-3 shadow-sm relative z-40">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-950 uppercase tracking-widest">
            <LayoutDashboard size={14} className="text-emerald-600" />
            <span className="text-emerald-950">{roleDisplayNames[userRole as keyof typeof roleDisplayNames] || userRole}</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-bold">
            <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              <Database size={12} />
              <span>BLOCKCHAIN SYNCED</span>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-10 flex-grow relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* 3. SIDE PROFILE CARD (GLASS) */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-emerald-200/60 shadow-xl shadow-emerald-900/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 blur-2xl rounded-full translate-x-10 -translate-y-10 transition-transform group-hover:scale-150 duration-700"></div>

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-2xl bg-emerald-950 flex items-center justify-center mb-4 shadow-xl border-4 border-white shrink-0 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-transparent"></div>
                  <span className="text-4xl font-black text-white relative z-10 uppercase">
                    {userId ? userId.charAt(0) : 'U'}
                  </span>
                </div>
                <h2 className="text-xl font-bold truncate w-full text-emerald-950">{userId}</h2>
                <Badge className="mt-3 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors mb-2">
                  {userRole}
                </Badge>

                {profileData && (
                  <div className="flex flex-col items-center gap-0.5 mt-2 animate-in fade-in zoom-in duration-500">
                    <p className="text-sm font-bold text-emerald-950 text-center leading-tight">{profileData.name}</p>
                    <p className="text-[11px] font-semibold text-emerald-600/80 uppercase tracking-wide">
                      📍 {profileData.location}
                    </p>
                  </div>
                )}

                <div className="w-full mt-8 pt-8 border-t border-emerald-100/60 space-y-3 text-emerald-900">
                  <div className="flex justify-between items-center bg-white/50 px-4 py-2 rounded-xl border border-emerald-50">
                    <span className="text-[10px] text-emerald-600/80 font-bold uppercase">Terminal ID</span>
                    <span className="text-xs font-mono text-emerald-700 font-bold">ST-{userId.split('-')[1] || '001'}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/50 px-4 py-2 rounded-xl border border-emerald-50">
                    <span className="text-[10px] text-emerald-600/80 font-bold uppercase">Clearance</span>
                    <span className="text-xs font-mono text-emerald-700 font-bold uppercase">Alpha</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/50 px-4 py-2 rounded-xl border border-emerald-50">
                    <span className="text-[10px] text-emerald-600/80 font-bold uppercase">Joined</span>
                    <span className="text-xs font-mono text-emerald-700 font-bold">Feb 2024</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/50 px-4 py-2 rounded-xl border border-emerald-50">
                    <span className="text-[10px] text-emerald-600/80 font-bold uppercase">Integrity Sync</span>
                    <span className="text-[10px] text-emerald-600 font-bold uppercase">Active</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/50 px-4 py-2 rounded-xl border border-emerald-50">
                    <span className="text-[10px] text-emerald-600/80 font-bold uppercase">Encryption</span>
                    <span className="text-xs font-mono text-emerald-700 font-bold uppercase">AES-256</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/50 px-4 py-2 rounded-xl border border-emerald-50">
                    <span className="text-[10px] text-emerald-600/80 font-bold uppercase">Node Status</span>
                    <span className="text-[10px] text-emerald-600 font-black flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> ONLINE
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-5 bg-white/80 backdrop-blur-xl border border-emerald-200/60 shadow-lg shadow-emerald-900/5 rounded-2xl flex items-start gap-4 transition-all hover:bg-white relative overflow-hidden group">
              <ShieldAlert size={20} className="text-emerald-500 mt-0.5 shrink-0" />
              <p className="text-[11px] text-emerald-800 font-medium leading-relaxed relative z-10">
                <strong>System Advisory:</strong> Ensure all batch records are cryptographically signed before 18:00 IST.
              </p>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-100/30 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            </div>
          </div>

          {/* 4. MAIN CONTENT AREA (GLASS) */}
          <div className="lg:col-span-3 h-full">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-emerald-200/60 shadow-xl shadow-emerald-900/5 p-8 h-full min-h-[600px] relative overflow-hidden transition-all duration-300">
              <div className="relative z-10 h-full">
                {/* Dynamically Render Views */}
                {userRole === 'aggregator' && <AggregatorView userId={userId} />}
                {userRole === 'processor' && <ProcessorView userId={userId} />}
                {userRole === 'manufacturer' && <ManufacturerView userId={userId} />}
                {userRole === 'distributor' && <DistributorView userId={userId} />}
              </div>

              {/* Subtle Branding Watermark */}
              <div className="absolute bottom-10 right-10 opacity-[0.03] select-none pointer-events-none text-emerald-900">
                <ShieldCheck size={280} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 5. MINIMALIST FOOTER */}
      <footer className="bg-white/40 backdrop-blur-md border-t border-emerald-200/40 py-8 relative z-10">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            <div className="text-[10px] font-black text-emerald-900/60 uppercase tracking-widest">AyuSetu Traceability Platform</div>
          </div>
          <div className="text-[10px] font-bold text-emerald-900/40 uppercase">
            Ministry of AYUSH • © 2026 Government of India
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;