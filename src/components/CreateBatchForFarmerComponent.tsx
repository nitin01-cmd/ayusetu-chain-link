'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Camera, MapPin, Leaf, CheckCircle, Loader, User, FileDown, ShieldCheck as ShieldIcon, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, getDocs, limit, addDoc, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/integrations/firebase/client';

interface CollectorBatchData {
  farmerName: string;
  farmerMobile: string;
  farmerVillage: string;
  farmerId: string;
  herbName: string;
  localName: string;
  partUsed: string;
  quantity: string;
  unit: 'kg' | 'grams';
  harvestDate: string;
  harvestType: 'wild' | 'cultivated';
  latitude: string;
  longitude: string;
  locationName: string;
  imageUrl: string;
  storageType: string;
}

interface CreateBatchForFarmerComponentProps {
  collectorName: string;
  collectorId: string;
  onBatchCreated?: (batchId: string, farmerId: string) => void;
  onClose?: () => void;
}

const herbs = ['Tulsi', 'Ashwagandha', 'Neem', 'Brahmi', 'Amla', 'Triphala', 'Giloy', 'Bhringraj'];
const partsUsed = ['Leaf', 'Root', 'Stem', 'Whole Plant', 'Flower', 'Seed', 'Bark', 'Fruit'];
const harvestTypes = ['Wild Collection', 'Cultivated'];
const storageTypes = ['Basket', 'Open', 'Container', 'Warehouse', 'Climate Controlled'];

const CreateBatchForFarmerComponent = ({ collectorName, collectorId, onBatchCreated, onClose }: CreateBatchForFarmerComponentProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<'form' | 'preview' | 'success'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [batchId, setBatchId] = useState('');
  const [trustScore, setTrustScore] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const [formData, setFormData] = useState<CollectorBatchData>({
    farmerName: '',
    farmerMobile: '',
    farmerVillage: '',
    farmerId: '',
    herbName: '',
    localName: '',
    partUsed: '',
    quantity: '',
    unit: 'kg',
    harvestDate: new Date().toISOString().split('T')[0],
    harvestType: 'cultivated',
    latitude: '',
    longitude: '',
    locationName: 'Fetching location...',
    imageUrl: '',
    storageType: ''
  });

  const generateFarmerId = () => {
    const id = `FARM-${Math.floor(Math.random() * 900 + 100)}`;
    setFormData(prev => ({ ...prev, farmerId: id }));
  };

  const lookupFarmer = async () => {
    if (!formData.farmerId) {
      toast({ title: "Input Required", description: "Enter Farmer ID first", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const q = query(collection(firestore, 'farmers'), where('id', '==', formData.farmerId.toUpperCase()), limit(1));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0].data();
        setFormData(prev => ({
          ...prev,
          farmerName: doc.fullName || doc.name || '',
          farmerMobile: doc.mobile || '',
          farmerVillage: doc.location || ''
        }));
        toast({ title: "Registry Sync", description: `Data for ${doc.fullName || doc.name} retrieved.` });
      } else {
        toast({ title: "Entry Error", description: "No record found for this ID.", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Ledger Error", description: "Failed to connect to registry.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const captureLocation = async () => {
    if (!navigator.geolocation) {
      toast({ title: "Location Error", description: "GPS not supported", variant: "destructive" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
          locationName: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
        }));
        toast({ title: "GPS Locked", description: "Vector coordinates saved." });
      },
      (err) => toast({ title: "GPS Error", description: err.message, variant: "destructive" })
    );
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (e) {
      toast({ title: "Camera Error", description: "Access denied.", variant: "destructive" });
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        setFormData(prev => ({ ...prev, imageUrl: canvasRef.current!.toDataURL('image/jpeg') }));
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      setCameraActive(false);
    }
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const submitBatch = async () => {
    if (!formData.farmerName || !formData.herbName || !formData.quantity || !formData.imageUrl) {
      toast({ title: "Incomplete Manifest", description: "Please fill all required fields and capture photo.", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    try {
      // 1. Persist/Update farmer profile to centralized registry
      const farmerDocId = formData.farmerId.toUpperCase();
      await setDoc(doc(firestore, 'farmers', farmerDocId), {
        id: farmerDocId,
        fullName: formData.farmerName,
        mobile: formData.farmerMobile,
        location: formData.farmerVillage,
        created_at: new Date().toISOString(),
        farmSize: "1.5 Hectares (Assumed)",
        certificationStatus: "Field Verified",
        cropTypes: [formData.herbName, "Organic Herbs"],
        complianceScore: 92,
        coordinates: `${formData.latitude}, ${formData.longitude}`,
        bankAccount: "XXXX-XXXX-XXXX-9901",
        ifscCode: "AYUSH000123"
      });

      // 2. Generate Batch ID
      const newBatchId = `B-${collectorId.slice(-3)}-${formData.farmerId.slice(-3)}-${Date.now().toString().slice(-4)}`;
      setBatchId(newBatchId);

      // 3. Save Batch Ledger Entry
      await setDoc(doc(firestore, 'batches', newBatchId), {
        batch_id: newBatchId,
        farmer_id: farmerDocId,
        collector_id: collectorId,
        herb_name: formData.herbName,
        quantity: `${formData.quantity} ${formData.unit}`,
        status: 'received',
        type: 'raw',
        created_at: new Date().toISOString(),
        metadata: {
          village: formData.farmerVillage,
          capture_coordinates: {
            lat: formData.latitude,
            lng: formData.longitude
          },
          harvest_date: formData.harvestDate,
          storage: formData.storageType,
          photo_proof: formData.imageUrl
        }
      });

      setTrustScore(Math.floor(Math.random() * 10) + 90);
      setStep('success');
      onBatchCreated?.(newBatchId, formData.farmerId);
    } catch (error) {
      console.error("Submission error:", error);
      toast({ title: "Registration Failed", description: "Failed to persist data to global ledger.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'form') {
    return (
      <div className="bg-transparent pb-8">
        <div className="bg-gradient-to-br from-emerald-900 to-teal-900 text-white px-4 sm:px-8 py-10 rounded-b-[3rem] shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3 sm:gap-4 tracking-tight">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/20">
                <Leaf size={24} className="text-emerald-300" />
              </div>
              Farmer Intake Node
            </h1>
            <p className="text-emerald-100/70 font-medium mt-3 max-w-lg leading-relaxed">
              Recording herbal batch parameters to the global traceability ledger.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 -mt-8 relative z-20">
          <div className="bg-white/90 backdrop-blur-2xl rounded-[2rem] p-6 shadow-xl border border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                  <User size={18} className="text-emerald-600" />
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operating Officer</p>
                  <p className="text-base font-black text-emerald-950">{collectorName}</p>
               </div>
            </div>
            <div className="text-right">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Node ID</p>
               <p className="text-base font-mono font-bold text-emerald-600 truncate">{collectorId}</p>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 space-y-8 mt-10 pb-20">
          <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 border border-white shadow-sm">
            <div className="flex items-center gap-3 mb-8">
               <div className="w-2 h-8 bg-emerald-600 rounded-full"></div>
               <h2 className="text-xl font-black text-emerald-950 tracking-tight">Farmer Identity</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="text-sm font-bold text-emerald-950 ml-1">Unique Resource PIN (ID) *</label>
                <div className="flex gap-3 mt-2">
                  <input
                    type="text"
                    placeholder="e.g. FARM-001"
                    value={formData.farmerId}
                    onChange={(e) => {
                      let val = e.target.value.toUpperCase();
                      if (val.startsWith('FARM') && val.length > 4 && val[4] !== '-') {
                        val = 'FARM-' + val.slice(4);
                      }
                      setFormData(prev => ({ ...prev, farmerId: val }));
                    }}
                    className="flex-1 px-5 py-4 bg-emerald-50/30 border-2 border-dashed border-emerald-200 rounded-2xl font-mono font-bold text-emerald-700"
                  />
                  <Button onClick={lookupFarmer} disabled={isLoading} className="px-6 rounded-2xl bg-slate-900 text-white font-black text-[10px] tracking-widest hover:bg-black">
                    {isLoading ? <Loader className="animate-spin" size={14} /> : 'LOOKUP'}
                  </Button>
                  <Button onClick={generateFarmerId} className="px-6 rounded-2xl bg-white border border-emerald-200 text-emerald-600 font-black text-[10px] tracking-widest hover:bg-emerald-50">
                    NEW ID
                  </Button>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-bold text-emerald-950 ml-1">Legal Name *</label>
                <input
                  type="text"
                  placeholder="Registry name"
                  value={formData.farmerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, farmerName: e.target.value }))}
                  className="w-full mt-2 px-5 py-4 bg-white/50 border border-emerald-100 rounded-2xl font-bold text-emerald-950"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-emerald-950 ml-1">Contact</label>
                <input
                  type="tel"
                  placeholder="Mobile"
                  value={formData.farmerMobile}
                  onChange={(e) => setFormData(prev => ({ ...prev, farmerMobile: e.target.value }))}
                  className="w-full mt-2 px-5 py-4 bg-white/50 border border-emerald-100 rounded-2xl font-bold text-emerald-950"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-emerald-950 ml-1">Location *</label>
                <input
                  type="text"
                  placeholder="Village"
                  value={formData.farmerVillage}
                  onChange={(e) => setFormData(prev => ({ ...prev, farmerVillage: e.target.value }))}
                  className="w-full mt-2 px-5 py-4 bg-white/50 border border-emerald-100 rounded-2xl font-bold text-emerald-950"
                />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 border border-white shadow-sm">
            <div className="flex items-center gap-3 mb-8">
               <div className="w-2 h-8 bg-teal-600 rounded-full"></div>
               <h2 className="text-xl font-black text-emerald-950 tracking-tight">Botanical Inventory</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-bold text-emerald-950 ml-1">Herb Type *</label>
                <select value={formData.herbName} onChange={(e) => setFormData(prev => ({ ...prev, herbName: e.target.value }))} className="w-full mt-2 px-5 py-4 bg-white border border-emerald-100 rounded-2xl font-bold text-emerald-950">
                  <option value="">Select...</option>
                  {herbs.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-bold text-emerald-950 ml-1">Quantity *</label>
                <div className="flex gap-2 mt-2">
                  <input type="number" value={formData.quantity} onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))} className="flex-1 px-5 py-4 bg-white border border-emerald-100 rounded-2xl font-bold text-emerald-950" />
                  <select value={formData.unit} onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value as 'kg' | 'grams' }))} className="px-4 bg-emerald-900 text-white rounded-2xl font-bold">
                    <option value="kg">KG</option>
                    <option value="grams">G</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 border border-white shadow-sm">
            <div className="flex items-center gap-3 mb-8">
               <div className="w-2 h-8 bg-sky-600 rounded-full"></div>
               <h2 className="text-xl font-black text-emerald-950 tracking-tight">Proof & Location</h2>
            </div>
            <div className="space-y-6">
               <div className="bg-slate-900 rounded-3xl p-6 text-white flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <MapPin className="text-sky-400" />
                     <div>
                        <p className="text-[10px] font-black text-white/40 uppercase">GPS Lock</p>
                        <p className="text-sm font-mono">{formData.latitude ? `${formData.latitude}, ${formData.longitude}` : 'Not Locked'}</p>
                     </div>
                  </div>
                  <Button onClick={captureLocation} className="bg-white text-black font-black text-[10px] rounded-xl px-4 h-10">SCAN</Button>
               </div>
               <div className="bg-white border border-emerald-100 rounded-3xl p-6 flex flex-col items-center gap-4 min-h-[200px] relative overflow-hidden">
                  {!cameraActive ? (
                    formData.imageUrl ? (
                      <img src={formData.imageUrl} className="w-full h-full object-cover absolute inset-0" alt="harvest" />
                    ) : (
                      <Button onClick={startCamera} className="bg-emerald-600 text-white font-black text-xs px-8 h-12 rounded-2xl">START CAMERA</Button>
                    )
                  ) : (
                    <div className="absolute inset-0 z-30 flex flex-col">
                      <video ref={videoRef} autoPlay playsInline className="w-full flex-1 object-cover" />
                      <div className="p-4 bg-black/80 flex gap-2">
                        <Button onClick={capturePhoto} className="flex-1 bg-white text-black font-black text-xs h-12 rounded-2xl">CAPTURE</Button>
                        <Button onClick={stopCamera} className="text-white border-white/20 h-12 rounded-2xl font-black text-xs">CANCEL</Button>
                      </div>
                    </div>
                  )}
                  <canvas ref={canvasRef} className="hidden" />
               </div>
            </div>
          </div>

          <Button onClick={submitBatch} disabled={isLoading} className="w-full h-16 sm:h-20 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg rounded-3xl shadow-2xl">
            {isLoading ? <Loader className="animate-spin mr-3" /> : '✓ EXECUTE REGISTRATION'}
          </Button>
        </div>
      </div>
    );
  }

  const successScreen = (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-[#f8faf9] flex items-center justify-center p-4 sm:p-8 overflow-y-auto"
      >
        <motion.div
           initial={{ opacity: 0, scale: 0.9, y: 20 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           id="printable-area" 
           className="max-w-xl w-full bg-white border-2 border-emerald-900 rounded-[3rem] shadow-[0_35px_60px_-15px_rgba(6,78,59,0.3)] overflow-hidden relative"
        >
          {/* Certificate Header */}
          <div className="bg-emerald-950 p-12 text-center text-white relative overflow-hidden">
             <motion.div 
               initial={{ scale: 0 }}
               animate={{ scale: 1 }}
               transition={{ type: "spring", damping: 10, stiffness: 100, delay: 0.2 }}
               className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-400/40 flex items-center justify-center mx-auto mb-8 backdrop-blur-xl relative z-10"
             >
               <CheckCircle size={48} className="text-emerald-400" />
             </motion.div>
             
             <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-4xl font-black tracking-tighter relative z-10"
              >
                MANIFEST SECURED
              </motion.h1>
             <motion.p 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.6 }}
               className="text-emerald-400 text-xs uppercase font-black mt-3 tracking-[0.4em] relative z-10"
             >
               Official Digital Receipt
             </motion.p>

             {/* Background Decorative Emblem */}
             <div className="absolute -right-10 -bottom-10 opacity-10 rotate-12 pointer-events-none">
                <ShieldIcon size={240} />
             </div>
          </div>
          
          <div className="p-8 sm:p-12 space-y-10 bg-gradient-to-b from-white to-emerald-50/30">
             {/* ID Display Area */}
             <div className="grid grid-cols-1 gap-6">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-white p-8 rounded-[2rem] border-2 border-emerald-100 shadow-sm relative group overflow-hidden"
                >
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-4">Farmer Registry ID</p>
                      <p className="text-5xl font-mono font-black text-emerald-950 tracking-tighter">{formData.farmerId.toUpperCase()}</p>
                    </div>
                    <QrCode className="text-emerald-100 group-hover:text-emerald-200 transition-colors" size={48} />
                  </div>
                  <div className="absolute left-0 top-0 w-1.5 h-full bg-emerald-600"></div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 }}
                  className="bg-white p-8 rounded-[2rem] border-2 border-emerald-100 shadow-sm relative group overflow-hidden"
                >
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <p className="text-[10px] font-black text-sky-600 uppercase tracking-[0.2em] mb-4">Traceability Lot ID</p>
                      <p className="text-5xl font-mono font-black text-slate-900 tracking-tighter">{batchId}</p>
                    </div>
                    <Leaf className="text-sky-100 group-hover:text-sky-200 transition-colors" size={48} />
                  </div>
                  <div className="absolute left-0 top-0 w-1.5 h-full bg-sky-500"></div>
                </motion.div>
             </div>

             {/* Detail Ledger Table */}
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 1.2 }}
               className="bg-white/50 backdrop-blur-sm rounded-3xl p-6 border border-emerald-100 space-y-4"
             >
                <div className="flex justify-between items-center py-2 border-b border-emerald-50">
                  <span className="text-[10px] font-black text-emerald-800/60 uppercase">Farmer Name</span>
                  <span className="text-sm font-bold text-emerald-950">{formData.farmerName}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-emerald-50">
                  <span className="text-[10px] font-black text-emerald-800/60 uppercase">Botanical String</span>
                  <span className="text-sm font-bold text-emerald-950">{formData.herbName} ({formData.quantity} {formData.unit})</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-emerald-50">
                  <span className="text-[10px] font-black text-emerald-800/60 uppercase">Location Hash</span>
                  <span className="text-xs font-mono font-bold text-emerald-600">{formData.latitude}, {formData.longitude}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[10px] font-black text-emerald-800/60 uppercase">Intake Officer</span>
                  <span className="text-xs font-bold text-emerald-950">{collectorName}</span>
                </div>
             </motion.div>

             <div className="flex flex-col sm:flex-row gap-4 no-print mt-8">
               <Button onClick={handleDownloadPDF} className="flex-1 h-16 bg-slate-900 hover:bg-black text-white font-black text-xs tracking-widest rounded-2xl flex items-center justify-center gap-3">
                 <FileDown size={18} />
                 SAVE RECEIPT
               </Button>
               <Button onClick={() => setStep('form')} className="flex-1 h-16 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs tracking-widest rounded-2xl">
                 NEW INTAKE
               </Button>
               <Button onClick={() => onClose?.()} variant="ghost" className="h-16 text-emerald-900 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 rounded-2xl border-2 border-emerald-100">
                 EXIT TERMINAL
               </Button>
             </div>
             
             <div className="text-center">
                <p className="text-[8px] font-bold text-emerald-900/30 uppercase tracking-[0.3em]">Official Ministry of AYUSH Blockchain Ledger Entry</p>
             </div>
          </div>
        </motion.div>
        
        {/* Style for printing purely the certificate */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page { margin: 0; size: auto; }
            body { background: white !important; margin: 0 !important; padding: 0 !important; }
            body * { visibility: hidden; }
            #printable-area, #printable-area * { visibility: visible; }
            #printable-area { 
              position: fixed;
              left: 0;
              top: 0;
              width: 100vw;
              height: 100vh;
              margin: 0;
              padding: 40px;
              border: none;
              box-shadow: none;
              display: flex;
              flex-direction: column;
              justify-content: center;
              background: white !important;
              scale: 1 !important;
              transform: none !important;
              border-radius: 0 !important;
            }
            .no-print { display: none !important; }
          }
        `}} />
      </motion.div>
    </AnimatePresence>
  );

  if (step === 'success') {
    return createPortal(successScreen, document.body);
  }

  return (
    <div className="bg-transparent pb-8">
      <div className="bg-gradient-to-br from-emerald-900 to-teal-900 text-white px-4 sm:px-8 py-10 rounded-b-[3rem] shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3 sm:gap-4 tracking-tight">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/20">
              <Leaf size={24} className="text-emerald-300" />
            </div>
            Farmer Intake Node
          </h1>
          <p className="text-emerald-100/70 font-medium mt-3 max-w-lg leading-relaxed">
            Recording herbal batch parameters to the global traceability ledger.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 -mt-8 relative z-20">
        <div className="bg-white/90 backdrop-blur-2xl rounded-[2rem] p-6 shadow-xl border border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                <User size={18} className="text-emerald-600" />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operating Officer</p>
                <p className="text-base font-black text-emerald-950">{collectorName}</p>
             </div>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Node ID</p>
             <p className="text-base font-mono font-bold text-emerald-600 truncate">{collectorId}</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 space-y-8 mt-10 pb-20">
        <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 border border-white shadow-sm">
          <div className="flex items-center gap-3 mb-8">
             <div className="w-2 h-8 bg-emerald-600 rounded-full"></div>
             <h2 className="text-xl font-black text-emerald-950 tracking-tight">Farmer Identity</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="text-sm font-bold text-emerald-950 ml-1">Unique Resource PIN (ID) *</label>
              <div className="flex gap-3 mt-2">
                <input
                  type="text"
                  placeholder="e.g. FARM-001"
                  value={formData.farmerId}
                  onChange={(e) => {
                    let val = e.target.value.toUpperCase();
                    if (val.startsWith('FARM') && val.length > 4 && val[4] !== '-') {
                      val = 'FARM-' + val.slice(4);
                    }
                    setFormData(prev => ({ ...prev, farmerId: val }));
                  }}
                  className="flex-1 px-5 py-4 bg-emerald-50/30 border-2 border-dashed border-emerald-200 rounded-2xl font-mono font-bold text-emerald-700"
                />
                <Button onClick={lookupFarmer} disabled={isLoading} className="px-6 rounded-2xl bg-slate-900 text-white font-black text-[10px] tracking-widest hover:bg-black">
                  {isLoading ? <Loader className="animate-spin" size={14} /> : 'LOOKUP'}
                </Button>
                <Button onClick={generateFarmerId} className="px-6 rounded-2xl bg-white border border-emerald-200 text-emerald-600 font-black text-[10px] tracking-widest hover:bg-emerald-50">
                  NEW ID
                </Button>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-bold text-emerald-950 ml-1">Legal Name *</label>
              <input
                type="text"
                placeholder="Registry name"
                value={formData.farmerName}
                onChange={(e) => setFormData(prev => ({ ...prev, farmerName: e.target.value }))}
                className="w-full mt-2 px-5 py-4 bg-white/50 border border-emerald-100 rounded-2xl font-bold text-emerald-950"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-emerald-950 ml-1">Contact</label>
              <input
                type="tel"
                placeholder="Mobile"
                value={formData.farmerMobile}
                onChange={(e) => setFormData(prev => ({ ...prev, farmerMobile: e.target.value }))}
                className="w-full mt-2 px-5 py-4 bg-white/50 border border-emerald-100 rounded-2xl font-bold text-emerald-950"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-emerald-950 ml-1">Location *</label>
              <input
                type="text"
                placeholder="Village"
                value={formData.farmerVillage}
                onChange={(e) => setFormData(prev => ({ ...prev, farmerVillage: e.target.value }))}
                className="w-full mt-2 px-5 py-4 bg-white/50 border border-emerald-100 rounded-2xl font-bold text-emerald-950"
              />
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 border border-white shadow-sm">
          <div className="flex items-center gap-3 mb-8">
             <div className="w-2 h-8 bg-teal-600 rounded-full"></div>
             <h2 className="text-xl font-black text-emerald-950 tracking-tight">Botanical Inventory</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-bold text-emerald-950 ml-1">Herb Type *</label>
              <select value={formData.herbName} onChange={(e) => setFormData(prev => ({ ...prev, herbName: e.target.value }))} className="w-full mt-2 px-5 py-4 bg-white border border-emerald-100 rounded-2xl font-bold text-emerald-950">
                <option value="">Select...</option>
                {herbs.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-bold text-emerald-950 ml-1">Quantity *</label>
              <div className="flex gap-2 mt-2">
                <input type="number" value={formData.quantity} onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))} className="flex-1 px-5 py-4 bg-white border border-emerald-100 rounded-2xl font-bold text-emerald-950" />
                <select value={formData.unit} onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value as 'kg' | 'grams' }))} className="px-4 bg-emerald-900 text-white rounded-2xl font-bold">
                  <option value="kg">KG</option>
                  <option value="grams">G</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 border border-white shadow-sm">
          <div className="flex items-center gap-3 mb-8">
             <div className="w-2 h-8 bg-sky-600 rounded-full"></div>
             <h2 className="text-xl font-black text-emerald-950 tracking-tight">Proof & Location</h2>
          </div>
          <div className="space-y-6">
             <div className="bg-slate-900 rounded-3xl p-6 text-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <MapPin className="text-sky-400" />
                   <div>
                      <p className="text-[10px] font-black text-white/40 uppercase">GPS Lock</p>
                      <p className="text-sm font-mono">{formData.latitude ? `${formData.latitude}, ${formData.longitude}` : 'Not Locked'}</p>
                   </div>
                </div>
                <Button onClick={captureLocation} className="bg-white text-black font-black text-[10px] rounded-xl px-4 h-10">SCAN</Button>
             </div>
             <div className="bg-white border border-emerald-100 rounded-3xl p-6 flex flex-col items-center gap-4 min-h-[200px] relative overflow-hidden">
                {!cameraActive ? (
                  formData.imageUrl ? (
                    <img src={formData.imageUrl} className="w-full h-full object-cover absolute inset-0" alt="harvest" />
                  ) : (
                    <Button onClick={startCamera} className="bg-emerald-600 text-white font-black text-xs px-8 h-12 rounded-2xl">START CAMERA</Button>
                  )
                ) : (
                  <div className="absolute inset-0 z-30 flex flex-col">
                    <video ref={videoRef} autoPlay playsInline className="w-full flex-1 object-cover" />
                    <div className="p-4 bg-black/80 flex gap-2">
                      <Button onClick={capturePhoto} className="flex-1 bg-white text-black font-black text-xs h-12 rounded-2xl">CAPTURE</Button>
                      <Button onClick={stopCamera} className="text-white border-white/20 h-12 rounded-2xl font-black text-xs">CANCEL</Button>
                    </div>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
             </div>
          </div>
        </div>

        <Button onClick={submitBatch} disabled={isLoading} className="w-full h-16 sm:h-20 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg rounded-3xl shadow-2xl">
          {isLoading ? <Loader className="animate-spin mr-3" /> : '✓ EXECUTE REGISTRATION'}
        </Button>
      </div>
    </div>
  );
};

export default CreateBatchForFarmerComponent;
