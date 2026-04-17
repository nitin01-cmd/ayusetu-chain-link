'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import FarmerDetailsDialog from '@/components/FarmerDetailsDialog';
import { useBatches } from '@/hooks/useBatches';
import { 
  PackageCheck, 
  Activity, 
  FileCheck, 
  AlertTriangle,
  ShieldCheck,
  UserCircle
} from 'lucide-react';

interface ProcessorViewProps {
  userId: string;
}

const ProcessorView = ({ userId }: ProcessorViewProps) => {
  const { toast } = useToast();
  const { batches, loading } = useBatches('processor', userId);
  const [activeForm, setActiveForm] = useState<'receiveLot' | 'logProcessing' | 'qualityTest' | 'recall' | null>(null);
  
  const [formData, setFormData] = useState({
    lotQR: '',
    receivedWeight: '',
    temperature: '',
    duration: '',
    parentLotId: '',
    testBatchId: '',
    recallBatchId: ''
  });

  const handleReceiveLot = () => {
    toast({ title: "Lot Received", description: "Incoming material recorded in processing ledger." });
    setActiveForm(null);
  };

  const handleLogProcessing = () => {
    toast({ title: "Processing Logged", description: "Thermodynamic parameters updated for batch string." });
    setActiveForm(null);
  };

  const handleQualityTest = () => {
    toast({ title: "Quality Affixed", description: "AYUSH premium certification linked to batch." });
    setActiveForm(null);
  };

  const handleInitiateRecall = () => {
    toast({ title: "Recall Initialized", description: "System-wide alert broadcasted.", variant: "destructive" });
    setActiveForm(null);
  };

  const simulateQRScan = () => {
    setFormData({ ...formData, lotQR: 'LOT-' + Math.floor(Math.random() * 1000000) });
    toast({ title: "QR Scan Successful", description: "Lot ID retrieved." });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'received': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'verified': return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'recalled': return 'bg-red-100 text-red-800 border-red-200 animate-pulse';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Processing Hub Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-sm gap-6">
        <div>
          <h2 className="text-3xl font-black text-emerald-950 tracking-tight flex items-center gap-3">
             Refinement Intelligence
             <Badge className="bg-emerald-600 text-white font-black px-3 py-1 rounded-lg">LIVE</Badge>
          </h2>
          <p className="text-emerald-700/60 font-bold text-sm mt-1 uppercase tracking-widest">Post-Harvest Industrial Processing Protocol</p>
        </div>
        <div className="flex items-center gap-4 bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">Protocol Integrity</p>
            <p className="text-sm font-black text-emerald-950 mt-1">L4 SECURE</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg">
            <ShieldCheck size={20} />
          </div>
        </div>
      </div>

      {/* Industrial Action Grid - FIXED EXPLICIT CLASSES FOR HOVER VISIBILITY */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* Receive Lot */}
        <div 
          onClick={() => setActiveForm('receiveLot')}
          className="bg-white hover:bg-blue-600 border border-blue-100 hover:border-blue-500 shadow-xl shadow-blue-500/5 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 group"
        >
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-white/20 group-hover:text-white transition-colors">
            <PackageCheck className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <span className="font-black text-emerald-950 text-xs sm:text-sm text-center leading-tight group-hover:text-white transition-colors">Receive Lot</span>
        </div>

        {/* Log Process */}
        <div 
          onClick={() => setActiveForm('logProcessing')}
          className="bg-white hover:bg-emerald-600 border border-emerald-100 hover:border-emerald-500 shadow-xl shadow-emerald-500/5 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 group"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-white/20 group-hover:text-white transition-colors">
            <Activity className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <span className="font-black text-emerald-950 text-xs sm:text-sm text-center leading-tight group-hover:text-white transition-colors">Log Process</span>
        </div>

        {/* Quality Hub */}
        <div 
          onClick={() => setActiveForm('qualityTest')}
          className="bg-white hover:bg-teal-600 border border-teal-100 hover:border-teal-500 shadow-xl shadow-teal-500/5 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:-translate-y-1 hover:shadow-2xl hover:shadow-teal-500/20 transition-all duration-300 group"
        >
          <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 group-hover:bg-white/20 group-hover:text-white transition-colors">
            <FileCheck className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <span className="font-black text-emerald-950 text-xs sm:text-sm text-center leading-tight group-hover:text-white transition-colors">Quality Hub</span>
        </div>

        {/* Recall */}
        <div 
          onClick={() => setActiveForm('recall')}
          className="bg-white hover:bg-red-600 border border-red-100 hover:border-red-500 shadow-xl shadow-red-500/5 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-300 group"
        >
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 group-hover:bg-white/20 group-hover:text-white transition-colors">
            <AlertTriangle className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <span className="font-black text-emerald-950 text-xs sm:text-sm text-center leading-tight group-hover:text-white transition-colors">Recall Protocol</span>
        </div>

        {/* Partner Sync */}
        <FarmerDetailsDialog>
          <div className="bg-white hover:bg-slate-800 border border-slate-100 hover:border-slate-800 shadow-xl shadow-slate-500/5 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-500/20 transition-all duration-300 group h-full">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-white/20 group-hover:text-white transition-colors">
              <UserCircle className="w-7 h-7" strokeWidth={2.5} />
            </div>
            <span className="font-black text-emerald-950 text-xs sm:text-sm text-center leading-tight group-hover:text-white transition-colors">Partner Sync</span>
          </div>
        </FarmerDetailsDialog>
      </div>

      {/* Refinery Ledger */}
      <Card className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white overflow-hidden shadow-sm">
        <div className="p-8 border-b border-emerald-50">
          <h3 className="text-xl font-black text-emerald-950 flex items-center gap-3">
             <div className="w-2 h-6 bg-emerald-600 rounded-full"></div>
             Active Industrial Inventory
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trace ID</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Botanical String</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantity</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Condition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50">
              {loading ? (
                <tr><td colSpan={6} className="px-8 py-10 text-center font-bold text-slate-400">Syncing with industrial ledger...</td></tr>
              ) : batches.length === 0 ? (
                <tr><td colSpan={6} className="px-8 py-10 text-center font-bold text-slate-400">No active refinery strings found.</td></tr>
              ) : (
                batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-emerald-50/30 transition-colors group">
                    <td className="px-8 py-6 font-mono font-bold text-sm text-emerald-900">{batch.batch_id}</td>
                    <td className="px-8 py-6">
                       <span className="font-black text-emerald-950 block">{batch.product_name || 'Herbal Blend'}</span>
                       <span className="text-[10px] font-bold text-slate-400 uppercase">{batch.type}</span>
                    </td>
                    <td className="px-8 py-6 font-black text-emerald-950">{batch.quantity}</td>
                    <td className="px-8 py-6">
                      <Badge className={`px-3 py-1 rounded-lg font-black text-[10px] ${getStatusColor(batch.status)} shadow-sm`}>
                        {batch.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-8 py-6 text-sm font-bold text-slate-500">{new Date(batch.created_at).toLocaleDateString()}</td>
                    <td className="px-8 py-6 font-bold text-emerald-600">{batch.metadata?.condition || 'Optimal'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Form Dialogs */}
      <Dialog open={activeForm === 'receiveLot'} onOpenChange={(open) => !open && setActiveForm(null)}>
        <DialogContent className="sm:max-w-xl bg-white/95 backdrop-blur-2xl border border-emerald-200/60 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 px-8 py-6 border-b border-emerald-100">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-emerald-950 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                  <PackageCheck className="text-emerald-600 w-5 h-5" />
                </div>
                Receive Lot
              </DialogTitle>
              <DialogDescription className="text-emerald-600/70 font-bold text-[10px] uppercase tracking-widest pl-13 -mt-1">
                Verifying incoming consignment weight and QR integrity
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-8 flex-1 overflow-y-auto min-h-0 overscroll-contain">
            <div className="grid grid-cols-1 gap-5">
              <div>
                <Label htmlFor="lotQR" className="text-emerald-950 font-bold ml-1">Lot QR Code *</Label>
                <div className="flex space-x-2 mt-1.5">
                  <Input
                    id="lotQR"
                    value={formData.lotQR}
                    onChange={(e) => setFormData({...formData, lotQR: e.target.value})}
                    placeholder="Scan or enter lot QR code"
                    className="px-4 py-3 h-auto rounded-xl border border-emerald-200/60 shadow-sm flex-1"
                    required
                  />
                  <Button type="button" onClick={simulateQRScan} className="h-auto px-6 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold shadow-sm">
                    Scan
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="receivedWeight" className="text-emerald-950 font-bold ml-1">Received Weight (kg) *</Label>
                <Input
                  id="receivedWeight"
                  type="number"
                  step="0.1"
                  value={formData.receivedWeight}
                  onChange={(e) => setFormData({...formData, receivedWeight: e.target.value})}
                  className="mt-1.5 px-4 py-3 h-auto rounded-xl border border-emerald-200/60 shadow-sm"
                  required
                />
              </div>
              <Button onClick={handleReceiveLot} className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg shadow-emerald-600/20 mt-4">
                LOG RECEIVED EVENT
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeForm === 'logProcessing'} onOpenChange={(open) => !open && setActiveForm(null)}>
        <DialogContent className="sm:max-w-xl bg-white/95 backdrop-blur-2xl border border-emerald-200/60 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 px-8 py-6 border-b border-emerald-100">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-emerald-950 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                  <Activity className="text-emerald-600 w-5 h-5" />
                </div>
                Log Processing Step
              </DialogTitle>
              <DialogDescription className="text-emerald-600/70 font-bold text-[10px] uppercase tracking-widest pl-13 -mt-1">
                Recording thermodynamic and temporal parameters of refinement
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-8 flex-1 overflow-y-auto min-h-0 overscroll-contain">
            <div className="grid grid-cols-1 gap-5">
              <div>
                <Label htmlFor="parentLotId" className="text-emerald-950 font-bold ml-1">Parent Lot ID *</Label>
                <select
                  id="parentLotId"
                  value={formData.parentLotId}
                  onChange={(e) => setFormData({...formData, parentLotId: e.target.value})}
                  className="mt-1.5 w-full px-4 py-4 h-auto rounded-xl border border-emerald-200/60 shadow-sm bg-white font-bold text-emerald-900"
                  required
                >
                   <option value="">Select parent lot</option>
                   {batches.map((batch) => (
                     <option key={batch.id} value={batch.batch_id}>{batch.batch_id} - {batch.product_name}</option>
                   ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="temperature" className="text-emerald-950 font-bold ml-1">Temp (°C) *</Label>
                  <Input id="temperature" type="number" step="0.1" value={formData.temperature} onChange={(e) => setFormData({...formData, temperature: e.target.value})} className="mt-1.5 px-4 h-12 rounded-xl border border-emerald-200/60 shadow-sm" required />
                </div>
                <div>
                  <Label htmlFor="duration" className="text-emerald-950 font-bold ml-1">Duration (hr) *</Label>
                  <Input id="duration" type="number" step="0.1" value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})} className="mt-1.5 px-4 h-12 rounded-xl border border-emerald-200/60 shadow-sm" required />
                </div>
              </div>
              <Button onClick={handleLogProcessing} className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg shadow-emerald-600/20 mt-4">
                SUBMIT PROCESSING RECORD
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProcessorView;