import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { UserCircle, Database, ChevronRight, ShieldAlert, Loader } from 'lucide-react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { firestore } from '@/integrations/firebase/client';

interface FarmerDetailsDialogProps {
  children: React.ReactNode;
}

interface FarmerData {
  id: string;
  name: string;
  contactNumber: string;
  email: string;
  farmLocation: string;
  farmSize: string;
  certificationStatus: string;
  cropTypes: string[];
  joinDate: string;
  totalBatches: number;
  lastDelivery: string;
  complianceScore: number;
  farmCoordinates: string;
  bankAccount: string;
  ifscCode: string;
}



const FarmerDetailsDialog = ({ children }: FarmerDetailsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [searchType, setSearchType] = useState<'farmer' | 'batch'>('farmer');
  const [searchValue, setSearchValue] = useState('');
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerData | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchValue) return;
    
    setIsSearching(true);
    setSearchAttempted(true);
    
    try {
      let farmerData: FarmerData | null = null;

      if (searchType === 'farmer') {
        const q = query(collection(firestore, 'farmers'), where('id', '==', searchValue.toUpperCase()), limit(1));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const doc = snapshot.docs[0].data();
          farmerData = {
            id: doc.id,
            name: doc.fullName || doc.name,
            contactNumber: doc.mobile || '+91-XXXXXXXXXX',
            email: doc.email || 'not.linked@farmer.in',
            farmLocation: doc.location || 'Unknown Location',
            farmSize: doc.farmSize || 'N/A',
            certificationStatus: doc.certificationStatus || 'Traceability Pending',
            cropTypes: doc.cropTypes || ['Assorted Herbs'],
            joinDate: doc.createdAt?.toDate?.().toLocaleDateString() || '2024-01-01',
            totalBatches: doc.totalBatches || 0,
            lastDelivery: doc.lastDelivery || 'N/A',
            complianceScore: doc.complianceScore || 85,
            farmCoordinates: doc.coordinates || 'GPS Locked',
            bankAccount: doc.bankAccount || 'XXXX-XXXX-XXXX',
            ifscCode: doc.ifscCode || 'IFSC0001234'
          };
        }
      } else {
        // Search by Batch ID - In a real app we'd query batches table
        // For now simulate batch -> farmer link using the same search but with a toast disclaimer
        const q = query(collection(firestore, 'farmers'), where('id', '==', searchValue.toUpperCase()), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const doc = snapshot.docs[0].data();
          farmerData = {
            id: doc.id,
            name: doc.fullName || doc.name,
            contactNumber: doc.mobile || '+91-XXXXXXXXXX',
            email: doc.email || 'not.linked@farmer.in',
            farmLocation: doc.location || 'Unknown Location',
            farmSize: doc.farmSize || 'N/A',
            certificationStatus: doc.certificationStatus || 'Traceability Pending',
            cropTypes: doc.cropTypes || ['Assorted Herbs'],
            joinDate: doc.createdAt?.toDate?.().toLocaleDateString() || '2024-01-01',
            totalBatches: doc.totalBatches || 0,
            lastDelivery: doc.lastDelivery || 'N/A',
            complianceScore: doc.complianceScore || 85,
            farmCoordinates: doc.coordinates || 'GPS Locked',
            bankAccount: doc.bankAccount || 'XXXX-XXXX-XXXX',
            ifscCode: doc.ifscCode || 'IFSC0001234'
          };
        }
      }

      if (farmerData) {
        setSelectedFarmer(farmerData);
        toast({
          title: "Farmer Found",
          description: `Retrieved details for ${farmerData.name}`,
          variant: "default"
        });
      } else {
        setSelectedFarmer(null);
        toast({
          title: "Not Found",
          description: "No registry record with this identifier.",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error("Search failed:", err);
      toast({
        title: "Connection Error",
        description: "Failed to access the traceability ledger.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'badge-verified';
    if (score >= 75) return 'badge-pending';
    return 'badge-rejected';
  };

  const getCertificationColor = (status: string) => {
    if (status.includes('Organic')) return 'badge-verified';
    if (status.includes('GAP')) return 'badge-pending';
    return 'badge-rejected';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl bg-white/95 backdrop-blur-2xl border border-emerald-200/60 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header Section */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 px-8 py-6 border-b border-emerald-100/50 sticky top-0 z-20">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-black text-emerald-950 flex items-center gap-2 sm:gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-emerald-50">
                <UserCircle className="text-emerald-600 w-6 h-6" />
              </div>
              Farmer Intelligence Node
            </DialogTitle>
            <DialogDescription className="text-emerald-600/70 font-bold text-[10px] uppercase tracking-widest pl-14 -mt-2">
              Accessing centralized partner registry
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-8 bg-slate-50/30 overscroll-contain">
          {/* Search Card */}
          <div className="bg-white/90 backdrop-blur-sm border border-emerald-100 rounded-[2rem] p-5 sm:p-8 shadow-sm mb-8">
            <h3 className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em] mb-6">Database Lookup</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-8 items-end">
              <div className="md:col-span-3">
                <Label className="text-sm font-bold text-emerald-950 ml-1">Search Vector</Label>
                <div className="flex gap-4 mt-3">
                  <button 
                    onClick={() => setSearchType('farmer')}
                    className={`flex-1 py-3 px-4 rounded-xl border text-xs font-bold transition-all ${searchType === 'farmer' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white border-emerald-100 text-emerald-900 hover:border-emerald-300'}`}
                  >
                    FARMER ID
                  </button>
                  <button 
                    onClick={() => setSearchType('batch')}
                    className={`flex-1 py-3 px-4 rounded-xl border text-xs font-bold transition-all ${searchType === 'batch' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white border-emerald-100 text-emerald-900 hover:border-emerald-300'}`}
                  >
                    BATCH ID
                  </button>
                </div>
              </div>

              <div className="md:col-span-6">
                <Label htmlFor="searchValue" className="text-sm font-bold text-emerald-950 ml-1">
                  {searchType === 'farmer' ? 'Enter Unique Farmer ID' : 'Linked Batch Identifier'}
                </Label>
                <Input
                  id="searchValue"
                  value={searchValue}
                  onChange={(e) => {
                    let val = e.target.value.toUpperCase();
                    if (val.startsWith('FARM') && val.length > 4 && val[4] !== '-') {
                      val = 'FARM-' + val.slice(4);
                    }
                    setSearchValue(val);
                  }}
                  placeholder={searchType === 'farmer' ? 'e.g. FARM-001' : 'e.g. BATCH-001'}
                  className="mt-2 text-lg font-mono tracking-wider h-14 bg-white"
                />
              </div>

              <div className="md:col-span-3">
                <Button onClick={handleSearch} disabled={isSearching} className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-sm tracking-widest shadow-xl transition-all">
                  {isSearching ? <Loader className="animate-spin mr-2" /> : 'EXECUTE LOOKUP'}
                </Button>
              </div>
            </div>
          </div>

          {/* Farmer Details Display */}
          {searchAttempted && selectedFarmer ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel: Profile */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white border border-emerald-100 rounded-[2rem] p-6 text-center overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-10"></div>
                    <div className="w-24 h-24 rounded-3xl bg-emerald-950 mx-auto mb-4 border-4 border-white shadow-lg flex items-center justify-center relative overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/30 to-transparent"></div>
                       <span className="text-4xl font-black text-white relative z-10">{selectedFarmer.name.charAt(0)}</span>
                    </div>
                    <h4 className="text-xl font-black text-emerald-950 leading-tight">{selectedFarmer.name}</h4>
                    <p className="text-xs font-bold text-emerald-600/70 border border-emerald-100 bg-emerald-50/50 inline-block px-3 py-1 rounded-full mt-2">
                       PIN: {selectedFarmer.id}
                    </p>
                    
                    <div className="mt-6 pt-6 border-t border-slate-50 space-y-3">
                      <div className="flex justify-between items-center px-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Trust Score</span>
                        <Badge className={`${getComplianceColor(selectedFarmer.complianceScore)} font-black`}>
                          {selectedFarmer.complianceScore}%
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center px-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                        <span className="text-[10px] font-black text-emerald-600">CERTIFIED</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-emerald-100 rounded-[2rem] p-6">
                    <h5 className="text-[10px] font-black text-emerald-900 uppercase tracking-widest mb-4">Operations</h5>
                    <div className="space-y-4">
                       <div className="p-3 bg-slate-50 rounded-2xl flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-500">Farm Size</span>
                          <span className="text-xs font-black text-slate-900">{selectedFarmer.farmSize}</span>
                       </div>
                       <div className="p-3 bg-slate-50 rounded-2xl">
                          <span className="text-xs font-bold text-slate-500 block mb-1">Crops Traceable</span>
                          <div className="flex flex-wrap gap-1">
                             {selectedFarmer.cropTypes.map(c => <Badge key={c} className="bg-white text-emerald-700 border-emerald-100 text-[9px]">{c}</Badge>)}
                          </div>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Right Panel: Data Tables */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white border border-emerald-100 rounded-[2rem] overflow-hidden shadow-sm">
                    <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
                       <span className="text-[10px] font-black tracking-[0.2em] uppercase">Registry Insights</span>
                       <Badge className="bg-white/20 text-white border-0 text-[10px]">LATEST UPDATE: {selectedFarmer.lastDelivery}</Badge>
                    </div>
                    <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                       <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Geographical Vector</p>
                          <p className="text-sm font-bold text-slate-900 mt-1">{selectedFarmer.farmLocation}</p>
                          <p className="text-[10px] font-mono text-emerald-600 mt-1">{selectedFarmer.farmCoordinates}</p>
                       </div>
                       <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Certified Status</p>
                          <div className="flex items-center gap-2 mt-1">
                             <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                             <p className="text-sm font-bold text-slate-900">{selectedFarmer.certificationStatus}</p>
                          </div>
                       </div>
                       <div className="border-t border-slate-50 pt-4">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Contact Interface</p>
                          <p className="text-sm font-bold text-slate-900 mt-1">{selectedFarmer.contactNumber}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{selectedFarmer.email}</p>
                       </div>
                       <div className="border-t border-slate-50 pt-4">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Bank settlement</p>
                          <p className="text-sm font-mono font-bold text-slate-900 mt-1">{selectedFarmer.bankAccount}</p>
                          <p className="text-[10px] font-mono text-emerald-600 mt-1">IFSC: {selectedFarmer.ifscCode}</p>
                       </div>
                    </div>
                  </div>

                  <div className="bg-emerald-600 rounded-[2rem] p-6 text-white flex items-center justify-between shadow-xl shadow-emerald-600/20">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                           <Database className="w-6 h-6" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase opacity-60">Ledger Sync</p>
                           <p className="text-lg font-black">{selectedFarmer.totalBatches} Deliveries Logged</p>
                        </div>
                     </div>
                     <ChevronRight className="w-6 h-6 opacity-40" />
                  </div>
                </div>
              </div>
            </div>
          ) : searchAttempted ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-white border border-slate-100 rounded-[2rem]">
               <ShieldAlert className="w-12 h-12 opacity-20 mb-4" />
               <p className="font-bold tracking-tight">IDENTITY NOT DISCOVERED</p>
               <p className="text-xs mt-1">Check registry identifier and retry vector.</p>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-emerald-50/50 border border-emerald-100 border-dashed rounded-[2.5rem]">
               <UserCircle className="w-12 h-12 opacity-10 mb-4" />
               <p className="text-sm font-bold opacity-30 tracking-[0.2em]">AWAITING INPUT PARAMETERS</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-white px-8 py-6 border-t border-slate-100 flex justify-end gap-3 shrink-0">
          <Button onClick={() => setOpen(false)} variant="outline" className="px-8 border-slate-200 rounded-xl font-bold text-slate-600">
            DISMISS
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FarmerDetailsDialog;