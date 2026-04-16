'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Camera, MapPin, FileText, Leaf, Box, Calendar, CheckCircle, Loader, User } from 'lucide-react';

interface CollectorBatchData {
  // Farmer Details
  farmerName: string;
  farmerMobile: string;
  farmerVillage: string;
  farmerId: string;
  // Herb Details
  herbName: string;
  localName: string;
  partUsed: string;
  // Quantity
  quantity: string;
  unit: 'kg' | 'grams';
  // Harvest Details
  harvestDate: string;
  harvestType: 'wild' | 'cultivated';
  // Location
  latitude: string;
  longitude: string;
  locationName: string;
  // Image
  imageUrl: string;
  // Storage
  storageType: string;
}

interface CreateBatchForFarmerComponentProps {
  collectorName: string;
  collectorId: string;
  onBatchCreated?: (batchId: string, farmerId: string) => void;
}

const herbs = ['Tulsi', 'Ashwagandha', 'Neem', 'Brahmi', 'Amla', 'Triphala', 'Giloy', 'Bhringraj'];
const partsUsed = ['Leaf', 'Root', 'Stem', 'Whole Plant', 'Flower', 'Seed', 'Bark', 'Fruit'];
const harvestTypes = ['Wild Collection', 'Cultivated'];
const storageTypes = ['Basket', 'Open', 'Container', 'Warehouse', 'Climate Controlled'];

const CreateBatchForFarmerComponent = ({ collectorName, collectorId, onBatchCreated }: CreateBatchForFarmerComponentProps) => {
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

  // Generate auto Farmer ID
  const generateFarmerId = () => {
    const id = `FARM-${Date.now().toString().slice(-6)}`;
    setFormData(prev => ({ ...prev, farmerId: id }));
  };

  // Capture location
  const captureLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location Not Available",
        description: "Geolocation is not supported by your device",
        variant: "destructive"
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({
          ...prev,
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
          locationName: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        }));
        toast({
          title: "Location Captured",
          description: "GPS coordinates recorded successfully",
          variant: "default"
        });
      },
      (error) => {
        toast({
          title: "Location Error",
          description: error.message,
          variant: "destructive"
        });
      }
    );
  };

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  // Capture photo
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const imageUrl = canvasRef.current.toDataURL('image/jpeg');
        setFormData(prev => ({ ...prev, imageUrl }));
        stopCamera();
        toast({
          title: "Photo Captured",
          description: "Image saved successfully",
          variant: "default"
        });
      }
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.farmerName) {
      toast({ title: "Missing Field", description: "Please enter farmer name", variant: "destructive" });
      return false;
    }
    if (!formData.farmerVillage) {
      toast({ title: "Missing Field", description: "Please enter village/location", variant: "destructive" });
      return false;
    }
    if (!formData.herbName) {
      toast({ title: "Missing Field", description: "Please select an herb", variant: "destructive" });
      return false;
    }
    if (!formData.partUsed) {
      toast({ title: "Missing Field", description: "Please select part used", variant: "destructive" });
      return false;
    }
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      toast({ title: "Invalid Quantity", description: "Please enter a valid quantity", variant: "destructive" });
      return false;
    }
    if (!formData.harvestDate) {
      toast({ title: "Missing Field", description: "Please select harvest date", variant: "destructive" });
      return false;
    }
    if (!formData.latitude || !formData.longitude) {
      toast({ title: "Missing Location", description: "Please capture location", variant: "destructive" });
      return false;
    }
    if (!formData.imageUrl) {
      toast({ title: "Missing Photo", description: "Please capture photo proof", variant: "destructive" });
      return false;
    }
    if (!formData.storageType) {
      toast({ title: "Missing Field", description: "Please select storage type", variant: "destructive" });
      return false;
    }
    return true;
  };

  // Submit batch
  const submitBatch = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    
    // Generate Batch ID and Farmer ID if not set
    const finalFarmerId = formData.farmerId || `FARM-${Date.now().toString().slice(-6)}`;
    const newBatchId = `BATCH-${collectorId}-${finalFarmerId}-${Date.now()}`;
    setBatchId(newBatchId);

    // Simulate AI verification
    setTimeout(() => {
      setTrustScore(Math.floor(Math.random() * 25) + 75); // 75-100
      setStep('success');
      setIsLoading(false);
      
      toast({
        title: "Batch Created Successfully",
        description: `Batch ID: ${newBatchId}`,
        variant: "default"
      });

      onBatchCreated?.(newBatchId, finalFarmerId);
    }, 2500);
  };

  // Form Step
  if (step === 'form') {
    return (
      <div className="bg-transparent pb-8">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-900 to-teal-900 text-white px-8 py-10 rounded-b-[3rem] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
          <div className="relative z-10 max-w-3xl mx-auto">
            <h1 className="text-3xl font-black flex items-center gap-4 tracking-tight">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/20">
                <Leaf size={24} className="text-emerald-300" />
              </div>
              Farmer Intake Node
            </h1>
            <p className="text-emerald-100/70 font-medium mt-3 max-w-lg leading-relaxed">
              Recording herbal batch parameters to the global traceability ledger on behalf of the cultivation partner.
            </p>
          </div>
        </div>

        {/* Collector Info */}
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

        {/* Form Sections */}
        <div className="max-w-3xl mx-auto px-6 space-y-8 mt-10 pb-20">
          
          {/* Section 1: Farmer Details */}
          <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white shadow-sm">
            <div className="flex items-center gap-3 mb-8">
               <div className="w-2 h-8 bg-emerald-600 rounded-full"></div>
               <h2 className="text-xl font-black text-emerald-950 tracking-tight">Farmer Identity</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="text-sm font-bold text-emerald-950 ml-1">Legal Name of Farmer *</label>
                <input
                  type="text"
                  placeholder="Full name as per registry"
                  value={formData.farmerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, farmerName: e.target.value }))}
                  className="w-full mt-2 px-5 py-4 bg-white/50 border border-emerald-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-emerald-950 placeholder-slate-400"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-emerald-950 ml-1">Contact Interface</label>
                <div className="flex gap-3 mt-2">
                  <div className="flex items-center px-4 bg-emerald-50 border border-emerald-100 rounded-2xl font-black text-emerald-700">
                    +91
                  </div>
                  <input
                    type="tel"
                    placeholder="Mobile number"
                    value={formData.farmerMobile}
                    onChange={(e) => setFormData(prev => ({ ...prev, farmerMobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    className="flex-1 px-5 py-4 bg-white/50 border border-emerald-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-emerald-950"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-emerald-950 ml-1">Village/Hectare Location *</label>
                <input
                  type="text"
                  placeholder="Primary location"
                  value={formData.farmerVillage}
                  onChange={(e) => setFormData(prev => ({ ...prev, farmerVillage: e.target.value }))}
                  className="w-full mt-2 px-5 py-4 bg-white/50 border border-emerald-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-emerald-950"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-bold text-emerald-950 ml-1">Unique Resource PIN</label>
                <div className="flex gap-3 mt-2">
                  <input
                    type="text"
                    placeholder="Auto-generate for new partners"
                    value={formData.farmerId}
                    onChange={(e) => setFormData(prev => ({ ...prev, farmerId: e.target.value }))}
                    className="flex-1 px-5 py-4 bg-emerald-50/30 border-2 border-dashed border-emerald-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 transition-all font-mono font-bold text-emerald-700"
                  />
                  <Button
                    onClick={generateFarmerId}
                    className="px-6 h-auto rounded-2xl bg-white border border-emerald-200 text-emerald-600 font-black text-[10px] tracking-widest hover:bg-emerald-50"
                  >
                    GENERATE
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Botanical Details */}
          <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white shadow-sm">
            <div className="flex items-center gap-3 mb-8">
               <div className="w-2 h-8 bg-teal-600 rounded-full"></div>
               <h2 className="text-xl font-black text-emerald-950 tracking-tight">Botanical Inventory</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-bold text-emerald-950 ml-1">Select Botanical Herb *</label>
                <select
                  value={formData.herbName}
                  onChange={(e) => setFormData(prev => ({ ...prev, herbName: e.target.value }))}
                  className="w-full mt-2 px-5 py-4 bg-white border border-emerald-100 rounded-2xl transition-all font-bold text-emerald-950 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_1.25rem_center] bg-[size:1.5em_1.5em] bg-no-repeat"
                >
                  <option value="">Inventory selection...</option>
                  {herbs.map(herb => (
                    <option key={herb} value={herb}>{herb}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-emerald-950 ml-1">Anatomical Part Used *</label>
                <select
                  value={formData.partUsed}
                  onChange={(e) => setFormData(prev => ({ ...prev, partUsed: e.target.value }))}
                  className="w-full mt-2 px-5 py-4 bg-white border border-emerald-100 rounded-2xl transition-all font-bold text-emerald-950 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_1.25rem_center] bg-[size:1.5em_1.5em] bg-no-repeat"
                >
                  <option value="">Choose part...</option>
                  {partsUsed.map(part => (
                    <option key={part} value={part}>{part}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-emerald-950 ml-1">Quantity Manifest *</label>
                <div className="flex gap-3 mt-2">
                  <input
                    type="number"
                    placeholder="0.00"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    className="flex-1 px-5 py-4 bg-white border border-emerald-100 rounded-2xl transition-all font-black text-emerald-950"
                  />
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value as 'kg' | 'grams' }))}
                    className="px-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase"
                  >
                    <option value="kg">KG</option>
                    <option value="grams">G</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-emerald-950 ml-1">Culitivation Protocol *</label>
                <div className="flex gap-3 mt-2">
                  {harvestTypes.map(type => {
                    const isSelected = (type.toLowerCase().includes('wild') && formData.harvestType === 'wild') ||
                                     (type.toLowerCase().includes('cultivated') && formData.harvestType === 'cultivated');
                    return (
                      <button
                        key={type}
                        onClick={() => setFormData(prev => ({ ...prev, harvestType: type.toLowerCase().includes('wild') ? 'wild' : 'cultivated' }))}
                        className={`flex-1 py-4 px-4 rounded-2xl font-black text-[10px] tracking-widest transition-all ${
                          isSelected ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-emerald-900 border border-emerald-100 hover:border-emerald-300'
                        }`}
                      >
                        {type.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Geographic Proof */}
          <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white shadow-sm">
            <div className="flex items-center gap-3 mb-8">
               <div className="w-2 h-8 bg-sky-600 rounded-full"></div>
               <h2 className="text-xl font-black text-emerald-950 tracking-tight">Geographic & Visual Payload</h2>
            </div>

            <div className="space-y-6">
               <div className="bg-slate-900 rounded-[2rem] p-6 text-white relative overflow-hidden group">
                  <div className="flex items-center justify-between relative z-10">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                           <MapPin className="text-sky-400" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">GPS Vector Lock</p>
                           <p className="text-sm font-mono font-bold mt-1">
                              {formData.latitude ? `${formData.latitude}, ${formData.longitude}` : 'NO COORDINATES RECORDED'}
                           </p>
                        </div>
                     </div>
                     <Button 
                        onClick={captureLocation}
                        className="bg-white text-slate-950 hover:bg-sky-400 hover:text-white font-black text-[10px] tracking-widest rounded-xl px-6 h-11"
                     >
                        SCAN VECTOR
                     </Button>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 blur-3xl rounded-full"></div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-emerald-100 rounded-[2rem] p-6 flex flex-col items-center justify-center gap-4 min-h-[200px] relative overflow-hidden group">
                     {!cameraActive ? (
                        <>
                           {formData.imageUrl ? (
                              <div className="absolute inset-0 z-0">
                                 <img src={formData.imageUrl} className="w-full h-full object-cover" alt="harvest" />
                                 <div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button onClick={startCamera} className="bg-white text-black font-black text-xs h-10 px-6 rounded-xl">RETAKE</Button>
                                 </div>
                              </div>
                           ) : (
                              <div className="flex flex-col items-center gap-4">
                                 <Camera className="w-12 h-12 text-emerald-100" />
                                 <Button onClick={startCamera} className="bg-emerald-600 text-white font-black text-[10px] tracking-widest h-12 px-8 rounded-2xl shadow-lg">START OPTICAL FEED</Button>
                              </div>
                           )}
                        </>
                     ) : (
                        <div className="absolute inset-0 z-30 flex flex-col">
                           <video ref={videoRef} autoPlay playsInline className="w-full flex-1 object-cover" />
                           <div className="p-4 bg-slate-950/80 backdrop-blur-md flex gap-2">
                              <Button onClick={capturePhoto} className="flex-1 bg-white text-black font-black text-xs h-12 rounded-2xl">CAPTURE PAYLOAD</Button>
                              <Button onClick={stopCamera} variant="outline" className="text-white border-white/20 h-12 rounded-2xl font-black text-xs">CANCEL</Button>
                           </div>
                        </div>
                     )}
                     <canvas ref={canvasRef} className="hidden" />
                  </div>

                  <div className="bg-white border border-emerald-100 rounded-[2rem] p-8">
                     <label className="text-sm font-bold text-emerald-950 ml-1">Storage Node Protocol</label>
                     <div className="mt-4 grid grid-cols-2 gap-2">
                        {storageTypes.map(type => (
                           <button
                              key={type}
                              onClick={() => setFormData(prev => ({ ...prev, storageType: type }))}
                              className={`p-3 rounded-xl text-[9px] font-black tracking-widest transition-all ${
                                 formData.storageType === type ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                              }`}
                           >
                              {type.toUpperCase()}
                           </button>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-10 flex gap-4">
            <Button
              onClick={submitBatch}
              disabled={isLoading}
              className="flex-1 h-20 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-lg rounded-[2rem] shadow-2xl shadow-emerald-600/20 tracking-tight"
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                   <Loader className="animate-spin" /> VERIFYING LEDGER...
                </div>
              ) : '✓ EXECUTE BATCH REGISTRATION'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Success Step
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-8">
      <div className="max-w-md w-full animate-in zoom-in-95 duration-700">
        {isLoading ? (
          <div className="text-center space-y-8">
             <div className="w-24 h-24 rounded-[2.5rem] bg-white border-4 border-emerald-100 shadow-2xl mx-auto flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-emerald-500/10 animate-pulse"></div>
                <Loader size={40} className="text-emerald-600 animate-spin relative z-10" />
             </div>
             <div>
                <h2 className="text-2xl font-black text-emerald-950 tracking-tight">Traceability Algorithm Active</h2>
                <p className="text-emerald-600/70 font-bold mt-2 uppercase tracking-widest text-[10px]">Verifying botanical signature & GPS lock</p>
             </div>
          </div>
        ) : (
          <div className="bg-white border-4 border-emerald-950 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(20,40,20,0.3)] overflow-hidden relative">
            <div className="bg-emerald-950 p-8 text-center">
               <div className="w-16 h-16 rounded-2xl bg-emerald-500 mx-auto flex items-center justify-center mb-6">
                  <CheckCircle size={32} className="text-white" />
               </div>
               <h1 className="text-2xl font-black text-white tracking-tight">Manifest Verified</h1>
               <p className="text-emerald-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Cryptographic batch id issued</p>
            </div>

            <div className="p-8 space-y-6">
               <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-dashed border-slate-200 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Batch Identifier</p>
                  <p className="text-lg font-mono font-black text-emerald-900 break-all">{batchId}</p>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                     <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Integrity Rank</p>
                     <p className="text-2xl font-black text-emerald-950 mt-1">{trustScore}%</p>
                  </div>
                  <div className="p-4 bg-teal-50 rounded-2xl border border-teal-100">
                     <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest">Quantity</p>
                     <p className="text-2xl font-black text-emerald-950 mt-1">{formData.quantity}{formData.unit}</p>
                  </div>
               </div>

               <Button
                  onClick={() => setStep('form')}
                  className="w-full h-16 bg-slate-900 hover:bg-black text-white font-black text-sm tracking-widest rounded-[1.5rem] mt-4"
               >
                  NEW INTAKE CYCLE
               </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateBatchForFarmerComponent;
