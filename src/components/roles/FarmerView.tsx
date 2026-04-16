'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/integrations/firebase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { User, LandPlot, Sprout, ShieldCheck, MapPin, Phone, Hash } from 'lucide-react';

interface FarmerViewProps {
  userId: string;
}

const FarmerView = ({ userId }: FarmerViewProps) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(firestore, 'farmers', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        }
      } catch (e) {
        console.error("Error fetching farmer profile:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-emerald-900/60 font-bold text-xs uppercase tracking-widest">Accessing Ledger...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-white shadow-sm ring-1 ring-emerald-900/5">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-3xl bg-emerald-950 flex items-center justify-center shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent"></div>
            <User size={32} className="text-white relative z-10" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-emerald-950 tracking-tight">{profile?.fullName}</h1>
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">VERIFIED PRODUCER</Badge>
            </div>
            <p className="text-emerald-600 font-mono font-bold text-sm mt-1 uppercase tracking-widest">{userId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-6 py-3 bg-emerald-950 rounded-2xl border border-emerald-800 shadow-xl">
           <ShieldCheck className="text-emerald-400" size={18} />
           <span className="text-[10px] font-black text-white/90 tracking-[0.2em] uppercase">Identity Locked</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 2. CORE IDENTITY CARD */}
        <Card className="bg-white/80 backdrop-blur-2xl p-8 rounded-[2.5rem] border-emerald-100/50 shadow-xl space-y-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShieldCheck size={120} />
          </div>

          <div className="flex items-center gap-3">
             <div className="w-1.5 h-6 bg-emerald-600 rounded-full"></div>
             <h2 className="text-lg font-black text-emerald-950 tracking-tight">Identity Registry</h2>
          </div>

          <div className="space-y-6 relative z-10">
             <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-emerald-100/50">
                   <div className="flex items-center gap-3 text-emerald-900/40 uppercase font-black text-[9px] tracking-widest">
                     <User size={14} /> Full Legal Name
                   </div>
                   <span className="text-sm font-bold text-emerald-950">{profile?.fullName}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-emerald-100/50">
                   <div className="flex items-center gap-3 text-emerald-900/40 uppercase font-black text-[9px] tracking-widest">
                     <Phone size={14} /> Registered Mobile
                   </div>
                   <span className="text-sm font-bold text-emerald-950">+91 {profile?.mobile}</span>
                </div>
                <div className="flex justify-between items-center">
                   <div className="flex items-center gap-3 text-emerald-900/40 uppercase font-black text-[9px] tracking-widest">
                     <MapPin size={14} /> Village / Node
                   </div>
                   <span className="text-sm font-bold text-emerald-950">{profile?.location} ({profile?.pincode})</span>
                </div>
             </div>
          </div>
        </Card>

        {/* 3. AGRICULTURAL METRICS CARD */}
        <Card className="bg-white/80 backdrop-blur-2xl p-8 rounded-[2.5rem] border-emerald-100/50 shadow-xl space-y-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Sprout size={120} />
          </div>

          <div className="flex items-center gap-3">
             <div className="w-1.5 h-6 bg-teal-600 rounded-full"></div>
             <h2 className="text-lg font-black text-emerald-950 tracking-tight">Farm Capabilities</h2>
          </div>

          <div className="space-y-6 relative z-10">
             <div className="grid grid-cols-1 gap-4">
                <div className="p-6 bg-teal-50/30 rounded-3xl border border-teal-100 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-teal-950 flex items-center justify-center shadow-lg">
                        <LandPlot size={18} className="text-teal-400" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-teal-800/40 uppercase tracking-widest">Cultivation Area</p>
                        <p className="text-lg font-black text-teal-950">{profile?.farmSize || 'Verified on Receipt'} Acres</p>
                      </div>
                   </div>
                </div>

                <div className="p-6 bg-sky-50/30 rounded-3xl border border-sky-100 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-sky-950 flex items-center justify-center shadow-lg">
                        <Sprout size={18} className="text-sky-400" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-sky-800/40 uppercase tracking-widest">Primary Crop Cycles</p>
                        <p className="text-lg font-black text-sky-950">{profile?.cropCycle || 'Assigned per Season'}</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </Card>
      </div>

      <div className="bg-emerald-950 rounded-[2rem] p-8 text-center border-4 border-emerald-900 shadow-2xl relative overflow-hidden group">
         {/* Subtle Background pattern */}
         <div className="absolute inset-0 opacity-10 pointer-events-none">
            <Hash size={300} className="absolute -left-20 -top-20 rotate-12" />
         </div>
         <p className="text-emerald-400/60 font-black text-[10px] uppercase tracking-[0.4em] mb-4 relative z-10">Compliance Advisory</p>
         <h3 className="text-white text-base font-bold sm:px-12 leading-relaxed relative z-10">
           Your profile is synchronized with the Ministry of AYUSH regional node. <br className="hidden sm:block"/> To modify legal identity details, please visit your local field aggregator terminal.
         </h3>
      </div>
    </div>
  );
};

export default FarmerView;
