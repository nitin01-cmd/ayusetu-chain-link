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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-amber-50 to-blue-50 pb-8">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-gradient-to-r from-blue-700 to-teal-700 text-white p-4 sm:p-6 shadow-lg">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Leaf size={28} className="text-amber-300" />
              Add New Batch (For Farmer)
            </h1>
            <p className="text-blue-100 text-sm sm:text-base mt-1">Record herb details on behalf of farmer</p>
          </div>
        </div>

        {/* Collector Info */}
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 font-semibold uppercase">Collector Name</p>
                <p className="text-lg font-bold text-gray-900">{collectorName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-semibold uppercase">Collector ID</p>
                <p className="text-lg font-bold text-blue-700">{collectorId}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Sections */}
        <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-5">
          
          {/* Section 1: Farmer Details */}
          <div className="bg-white rounded-xl p-5 sm:p-6 shadow-md border-l-4 border-blue-600">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
              <User size={20} className="text-blue-600" />
              Farmer Details
            </h2>

            <div className="space-y-4">
              {/* Farmer Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Farmer Name *</label>
                <input
                  type="text"
                  placeholder="Enter farmer's full name"
                  value={formData.farmerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, farmerName: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-semibold text-gray-900 placeholder-gray-400"
                />
              </div>

              {/* Farmer Mobile */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number (Optional)</label>
                <div className="flex gap-2">
                  <div className="flex items-center px-4 py-3 bg-white border-2 border-gray-200 rounded-xl font-semibold text-gray-700 flex-shrink-0">
                    +91
                  </div>
                  <input
                    type="tel"
                    placeholder="10-digit number"
                    value={formData.farmerMobile}
                    onChange={(e) => setFormData(prev => ({ ...prev, farmerMobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    maxLength={10}
                    className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-semibold text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Farmer Village */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Village / Location *</label>
                <input
                  type="text"
                  placeholder="Enter village or location name"
                  value={formData.farmerVillage}
                  onChange={(e) => setFormData(prev => ({ ...prev, farmerVillage: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-semibold text-gray-900 placeholder-gray-400"
                />
              </div>

              {/* Farmer ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Farmer ID (Optional)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Auto-generate or enter existing"
                    value={formData.farmerId}
                    onChange={(e) => setFormData(prev => ({ ...prev, farmerId: e.target.value }))}
                    className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-semibold text-gray-900 placeholder-gray-400"
                  />
                  <Button
                    onClick={generateFarmerId}
                    variant="outline"
                    className="px-4 border-2 border-blue-600 text-blue-700 hover:bg-blue-50 font-semibold"
                  >
                    Generate
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Herb Details */}
          <div className="bg-white rounded-xl p-5 sm:p-6 shadow-md border-l-4 border-green-600">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Leaf size={20} className="text-green-600" />
              Herb Details
            </h2>

            <div className="space-y-4">
              {/* Herb Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Herb Name *</label>
                <select
                  value={formData.herbName}
                  onChange={(e) => setFormData(prev => ({ ...prev, herbName: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-semibold text-gray-900"
                >
                  <option value="">Choose an herb...</option>
                  {herbs.map(herb => (
                    <option key={herb} value={herb}>{herb}</option>
                  ))}
                </select>
              </div>

              {/* Local Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Local Name (Optional)</label>
                <input
                  type="text"
                  placeholder="Regional or local name"
                  value={formData.localName}
                  onChange={(e) => setFormData(prev => ({ ...prev, localName: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-semibold text-gray-900 placeholder-gray-400"
                />
              </div>

              {/* Part Used */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Part Used *</label>
                <select
                  value={formData.partUsed}
                  onChange={(e) => setFormData(prev => ({ ...prev, partUsed: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-semibold text-gray-900"
                >
                  <option value="">Choose part...</option>
                  {partsUsed.map(part => (
                    <option key={part} value={part}>{part}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Quantity */}
          <div className="bg-white rounded-xl p-5 sm:p-6 shadow-md border-l-4 border-amber-600">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Box size={20} className="text-amber-600" />
              Quantity
            </h2>

            <div className="flex gap-3">
              <input
                type="number"
                placeholder="Enter quantity"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-semibold text-gray-900 placeholder-gray-400"
              />
              <select
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value as 'kg' | 'grams' }))}
                className="px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-semibold text-gray-900"
              >
                <option value="kg">kg</option>
                <option value="grams">grams</option>
              </select>
            </div>
          </div>

          {/* Section 4: Harvest Details */}
          <div className="bg-white rounded-xl p-5 sm:p-6 shadow-md border-l-4 border-purple-600">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Calendar size={20} className="text-purple-600" />
              Harvest Details
            </h2>

            <div className="space-y-4">
              {/* Harvest Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Harvest Date *</label>
                <input
                  type="date"
                  value={formData.harvestDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, harvestDate: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-semibold text-gray-900"
                />
              </div>

              {/* Harvest Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Harvest Type *</label>
                <div className="flex gap-3">
                  {harvestTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => setFormData(prev => ({ ...prev, harvestType: type.toLowerCase().includes('wild') ? 'wild' : 'cultivated' }))}
                      className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                        (type.toLowerCase().includes('wild') && formData.harvestType === 'wild') ||
                        (type.toLowerCase().includes('cultivated') && formData.harvestType === 'cultivated')
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 border-2 border-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Location */}
          <div className="bg-white rounded-xl p-5 sm:p-6 shadow-md border-l-4 border-red-600">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
              <MapPin size={20} className="text-red-600" />
              Location
            </h2>

            {formData.latitude && formData.longitude ? (
              <div className="space-y-3">
                <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
                  <p className="text-sm text-gray-600 font-semibold uppercase">GPS Coordinates</p>
                  <p className="text-lg font-bold text-blue-700">{formData.latitude}, {formData.longitude}</p>
                </div>
                <Button
                  onClick={captureLocation}
                  variant="outline"
                  className="w-full h-11 border-2 border-red-600 text-red-700 hover:bg-red-50 font-semibold"
                >
                  📍 Recapture Location
                </Button>
              </div>
            ) : (
              <Button
                onClick={captureLocation}
                className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                📍 Capture Location
              </Button>
            )}
          </div>

          {/* Section 6: Image Proof */}
          <div className="bg-white rounded-xl p-5 sm:p-6 shadow-md border-l-4 border-orange-600">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Camera size={20} className="text-orange-600" />
              Image Proof (CRITICAL)
            </h2>

            {!cameraActive ? (
              <>
                {formData.imageUrl ? (
                  <div className="space-y-3">
                    <div className="relative w-full rounded-lg overflow-hidden shadow-md">
                      <img src={formData.imageUrl} alt="Captured" className="w-full h-64 object-cover" />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => { setFormData(prev => ({ ...prev, imageUrl: '' })); startCamera(); }}
                        variant="outline"
                        className="flex-1 border-2 border-orange-600 text-orange-700 hover:bg-orange-50 font-semibold"
                      >
                        Retake Photo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={startCamera}
                    className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-base"
                  >
                    📷 Capture Live Photo
                  </Button>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg bg-black"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={capturePhoto}
                    className="flex-1 h-11 bg-green-600 hover:bg-green-700 text-white font-semibold"
                  >
                    ✓ Take Photo
                  </Button>
                  <Button
                    onClick={stopCamera}
                    variant="outline"
                    className="flex-1 h-11 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Section 7: Storage Info */}
          <div className="bg-white rounded-xl p-5 sm:p-6 shadow-md border-l-4 border-teal-600">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
              <FileText size={20} className="text-teal-600" />
              Storage Info
            </h2>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Storage Type *</label>
              <select
                value={formData.storageType}
                onChange={(e) => setFormData(prev => ({ ...prev, storageType: e.target.value }))}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-semibold text-gray-900"
              >
                <option value="">Select storage type...</option>
                {storageTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 sticky bottom-0 bg-gradient-to-t from-blue-50 to-transparent pt-4 pb-4">
            <Button
              onClick={submitBatch}
              disabled={isLoading}
              className="flex-1 h-13 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base rounded-xl shadow-lg"
            >
              {isLoading ? 'Processing...' : '✓ Create Batch'}
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-13 border-2 border-blue-700 text-blue-700 hover:bg-blue-50 font-bold text-base rounded-xl"
            >
              💾 Save Draft
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Success Step
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-amber-50 to-blue-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Success Animation */}
        {isLoading ? (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 bg-blue-100 rounded-full animate-pulse" />
                <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                  <Loader size={40} className="text-blue-600 animate-spin" />
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">AI Verification in Progress...</h2>
              <p className="text-gray-600 text-sm mt-2">Analyzing herb quality and authenticity</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl border-2 border-blue-200 space-y-6 text-center">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 bg-blue-100 rounded-full animate-pulse" />
                <div className="absolute inset-0 bg-blue-200 rounded-full flex items-center justify-center">
                  <CheckCircle size={48} className="text-blue-700" />
                </div>
              </div>
            </div>

            {/* Success Message */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Batch Created Successfully!</h1>
              <p className="text-blue-700 text-sm mt-2">Herb batch registered and linked to farmer profile</p>
            </div>

            {/* Batch ID */}
            <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
              <p className="text-xs text-gray-600 font-semibold uppercase">Batch ID</p>
              <p className="text-2xl font-bold text-blue-700 font-mono break-all">{batchId}</p>
            </div>

            {/* Farmer Info */}
            <div className="bg-amber-50 p-4 rounded-xl border-2 border-amber-200">
              <p className="text-xs text-gray-600 font-semibold uppercase mb-2">Farmer Details</p>
              <div className="space-y-1 text-left">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-bold text-gray-900">{formData.farmerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Village:</span>
                  <span className="font-bold text-gray-900">{formData.farmerVillage}</span>
                </div>
              </div>
            </div>

            {/* Trust Score */}
            <div className="bg-gradient-to-r from-green-50 to-teal-50 p-4 rounded-xl border-2 border-green-200">
              <p className="text-xs text-gray-600 font-semibold uppercase mb-2">Verification Score</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-200 h-3 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 to-teal-500 transition-all duration-1000"
                    style={{ width: `${trustScore}%` }}
                  />
                </div>
                <span className="text-2xl font-bold text-green-600">{trustScore}%</span>
              </div>
              <p className="text-xs text-gray-600 mt-2">AI Verified Authenticity</p>
            </div>

            {/* Submission Details */}
            <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-left text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Herb:</span>
                <span className="font-bold text-gray-900">{formData.herbName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Quantity:</span>
                <span className="font-bold text-gray-900">{formData.quantity} {formData.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Collected by:</span>
                <span className="font-bold text-gray-900">{collectorName}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setStep('form');
                  setFormData({
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
                }}
                className="flex-1 h-12 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl"
              >
                + Create Another
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-12 border-2 border-blue-700 text-blue-700 hover:bg-blue-50 font-bold rounded-xl"
              >
                View Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateBatchForFarmerComponent;
