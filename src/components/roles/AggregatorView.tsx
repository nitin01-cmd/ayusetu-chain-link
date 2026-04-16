import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import FarmerDetailsDialog from '@/components/FarmerDetailsDialog';
import CreateBatchForFarmerComponent from '@/components/CreateBatchForFarmerComponent';
import { useBatches } from '@/hooks/useBatches';
import { Plus, PackageCheck, Layers, Truck, UserCircle, AlertTriangle } from 'lucide-react';

interface AggregatorViewProps {
  userId: string;
}

const AggregatorView = ({ userId }: AggregatorViewProps) => {
  const [activeForm, setActiveForm] = useState<string | null>(null);
  const { batches, loading, createBatch, updateBatch } = useBatches('aggregator', userId);

  const [formData, setFormData] = useState({
    farmerQR: '',
    farmerCode: '',
    scanMethod: 'manual', // 'manual' or 'scan'
    receivedWeight: '',
    conditionPhotos: [] as string[],
    batchQR: '',
    batchId: '',
    batchScanMethod: 'manual',
    batchConditionPhotos: [] as string[],
    lotWeight: '',
    grade: '',
    moistureEstimate: '',
    waybillId: '',
    sealId: '',
    sealPhoto: '',
    driverId: '',
    vehicleNumber: '',
    recallBatchId: '',
    recallReason: ''
  });

  const { toast } = useToast();

  const handleReceiveMaterial = async () => {
    const farmerCode = formData.scanMethod === 'scan' ? formData.farmerQR : formData.farmerCode;
    if (!farmerCode || !formData.receivedWeight) {
      toast({
        title: "Missing Information",
        description: "Please fill in farmer code/QR and weight",
        variant: "destructive"
      });
      return;
    }

    try {
      await createBatch({
        batch_id: `RM${Date.now().toString().slice(-6)}`,
        type: 'raw_material',
        status: 'received',
        quantity: parseFloat(formData.receivedWeight),
        product_name: 'Raw Material',
        farmer_name: farmerCode,
        metadata: {
          condition: 'Good',
          photos: formData.conditionPhotos,
          scanMethod: formData.scanMethod
        }
      });

      setFormData({ 
        ...formData, 
        farmerQR: '', 
        farmerCode: '', 
        receivedWeight: '', 
        conditionPhotos: [] 
      });
      setActiveForm(null);
    } catch (error) {
      console.error('Error receiving material:', error);
    }
  };

  const handleInitiateRecall = () => {
    if (!formData.recallBatchId || !formData.recallReason) {
      toast({
        title: "Missing Information",
        description: "Please fill in batch ID and recall reason",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Recall Initiated",
      description: `Batch ${formData.recallBatchId} has been flagged for recall. Notifications sent.`,
      variant: "destructive"
    });

    setFormData({ ...formData, recallBatchId: '', recallReason: '' });
    setActiveForm(null);
  };

  const simulateQRScan = (field: string) => {
    const mockQR = `QR${Date.now().toString().slice(-6)}`;
    if (field === 'farmer') {
      setFormData({ ...formData, farmerQR: mockQR, scanMethod: 'scan' });
    } else if (field === 'batch') {
      setFormData({ ...formData, batchQR: mockQR, batchScanMethod: 'scan' });
    }
  };

  const handlePhotoUpload = (field: string, files: FileList | null) => {
    if (!files) return;
    
    const photoUrls: string[] = [];
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        photoUrls.push(`uploaded_${file.name}`);
      }
    });

    if (field === 'condition') {
      setFormData({ ...formData, conditionPhotos: [...formData.conditionPhotos, ...photoUrls] });
    } else if (field === 'batch') {
      setFormData({ ...formData, batchConditionPhotos: [...formData.batchConditionPhotos, ...photoUrls] });
    } else if (field === 'seal') {
      setFormData({ ...formData, sealPhoto: photoUrls[0] || '' });
    }
  };

  const handleCreateLot = async () => {
    if (!formData.lotWeight || !formData.grade) {
      toast({
        title: "Missing Information", 
        description: "Please fill in lot weight and grade",
        variant: "destructive"
      });
      return;
    }

    try {
      await createBatch({
        batch_id: `LOT${Date.now().toString().slice(-6)}`,
        type: 'lot',
        status: 'created',
        quantity: parseFloat(formData.lotWeight),
        product_name: 'Consolidated Lot',
        metadata: {
          grade: formData.grade,
          moistureEstimate: formData.moistureEstimate,
          photos: formData.batchConditionPhotos,
          sourceBatchId: formData.batchScanMethod === 'scan' ? formData.batchQR : formData.batchId
        }
      });

      setFormData({ 
        ...formData, 
        batchQR: '',
        batchId: '',
        lotWeight: '', 
        grade: '', 
        moistureEstimate: '',
        batchConditionPhotos: []
      });
      setActiveForm(null);
    } catch (error) {
      console.error('Error creating lot:', error);
    }
  };

  const handleStartTransport = () => {
    if (!formData.waybillId || !formData.sealId || !formData.vehicleNumber) {
      toast({
        title: "Missing Information",
        description: "Please fill in waybill ID, seal ID and vehicle number",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Transport Started",
      description: `Transport initiated with waybill ${formData.waybillId}`,
      variant: "default"
    });

    setFormData({ 
      ...formData, 
      waybillId: '', 
      sealId: '', 
      sealPhoto: '',
      driverId: '', 
      vehicleNumber: '' 
    });
    setActiveForm(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'badge-pending';
      case 'processed': return 'badge-verified';
      default: return 'badge-pending';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-emerald-950 tracking-tight">Aggregator Hub</h2>
          <p className="text-emerald-700/80 font-medium tracking-wide mt-1">Manage raw material collection and logistics</p>
        </div>
        <Badge className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-200 px-4 py-1.5 rounded-xl font-bold uppercase tracking-widest shadow-sm">
          Active Collections: {batches.length}
        </Badge>
      </div>

      {/* Premium Glass Action Buttons */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* Button 1 */}
        <div 
          onClick={() => setActiveForm('createBatchForFarmer')}
          className="bg-white/80 backdrop-blur-xl border border-emerald-200/60 shadow-lg shadow-emerald-500/5 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-emerald-500 hover:border-emerald-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 flex items-center justify-center text-emerald-600 group-hover:bg-white/20 group-hover:text-white transition-colors">
            <Plus className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-emerald-950 text-xs text-center leading-tight group-hover:text-white transition-colors">New Farmer Batch</span>
        </div>

        {/* Button 2 */}
        <div 
          onClick={() => setActiveForm('receive')}
          className="bg-white/80 backdrop-blur-xl border border-emerald-200/60 shadow-lg shadow-emerald-500/5 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-teal-500 hover:border-teal-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-500/20 transition-all duration-300 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-teal-100/80 flex items-center justify-center text-teal-600 group-hover:bg-white/20 group-hover:text-white transition-colors">
            <PackageCheck className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-emerald-950 text-xs text-center leading-tight group-hover:text-white transition-colors">Receive Material</span>
        </div>

        {/* Button 3 */}
        <div 
          onClick={() => setActiveForm('createLot')}
          className="bg-white/80 backdrop-blur-xl border border-emerald-200/60 shadow-lg shadow-emerald-500/5 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-emerald-600 hover:border-emerald-600 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-600/20 transition-all duration-300 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 flex items-center justify-center text-emerald-600 group-hover:bg-white/20 group-hover:text-white transition-colors">
            <Layers className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-emerald-950 text-xs text-center leading-tight group-hover:text-white transition-colors">Create Lot</span>
        </div>

        {/* Button 4 */}
        <div 
          onClick={() => setActiveForm('transport')}
          className="bg-white/80 backdrop-blur-xl border border-emerald-200/60 shadow-lg shadow-emerald-500/5 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-slate-800 hover:border-slate-800 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-800/20 transition-all duration-300 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-white/20 group-hover:text-white transition-colors">
            <Truck className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-emerald-950 text-xs text-center leading-tight group-hover:text-white transition-colors">Start Transport</span>
        </div>

        {/* Button 5 */}
        <FarmerDetailsDialog>
          <div className="bg-white/80 backdrop-blur-xl border border-emerald-200/60 shadow-lg shadow-emerald-500/5 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 cursor-pointer h-full hover:bg-blue-500 hover:border-blue-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-white/20 group-hover:text-white transition-colors">
              <UserCircle className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-emerald-950 text-xs text-center leading-tight group-hover:text-white transition-colors">Farmer Details</span>
          </div>
        </FarmerDetailsDialog>

        {/* Button 6 */}
        <div 
          onClick={() => setActiveForm('recall')}
          className="bg-white/80 backdrop-blur-xl border border-red-200 hover:border-red-500 shadow-lg shadow-red-500/5 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-red-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-red-500/20 transition-all duration-300 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 group-hover:bg-white/20 group-hover:text-white transition-colors">
            <AlertTriangle className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-red-950 text-xs text-center leading-tight group-hover:text-white transition-colors">Initiate Recall</span>
        </div>
      </div>

      {/* Collection Events Table */}
      <Card className="gov-card">
        <div className="gov-card-header">
          <h3 className="text-lg font-semibold">Collection Events</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Farmer Code</th>
                <th>Weight (kg)</th>
                <th>Status</th>
                <th>Timestamp</th>
                <th>Condition</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-4">Loading...</td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4">No collection events yet</td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr key={batch.id} className="animate-fade-in">
                    <td className="font-mono">{batch.batch_id}</td>
                    <td className="font-mono">{batch.farmer_name || '-'}</td>
                    <td>{batch.quantity}</td>
                    <td>
                      <Badge className={getStatusColor(batch.status)}>
                        {batch.status}
                      </Badge>
                    </td>
                    <td>{new Date(batch.created_at).toLocaleString('en-IN')}</td>
                    <td>{batch.metadata?.condition || 'Good'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Dialog Modals */}
      <Dialog open={activeForm === 'receive'} onOpenChange={(open) => !open && setActiveForm(null)}>
        <DialogContent className="sm:max-w-xl bg-white/95 backdrop-blur-2xl border border-emerald-200/60 rounded-[2rem] p-0 overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 px-8 py-6 border-b border-emerald-100">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-emerald-950 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                  <PackageCheck className="text-emerald-600 w-5 h-5" />
                </div>
                Receive Material
              </DialogTitle>
            </DialogHeader>
          </div>
          
          <div className="p-8">
            <div className="mb-6">
              <Label className="text-sm font-bold text-emerald-950">Input Method</Label>
              <div className="flex space-x-4 mt-3">
                <label className="flex items-center space-x-2 text-sm font-medium cursor-pointer">
                  <input
                    type="radio"
                    className="accent-emerald-600 w-4 h-4"
                    name="scanMethod"
                    value="manual"
                    checked={formData.scanMethod === 'manual'}
                    onChange={(e) => setFormData({...formData, scanMethod: e.target.value, farmerQR: ''})}
                  />
                  <span>Manual Entry</span>
                </label>
                <label className="flex items-center space-x-2 text-sm font-medium cursor-pointer">
                  <input
                    type="radio"
                    className="accent-emerald-600 w-4 h-4"
                    name="scanMethod"
                    value="scan"
                    checked={formData.scanMethod === 'scan'}
                    onChange={(e) => setFormData({...formData, scanMethod: e.target.value, farmerCode: ''})}
                  />
                  <span>QR Scan</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5">
              {formData.scanMethod === 'manual' ? (
                <div>
                  <Label htmlFor="farmerCode" className="text-emerald-950 font-bold ml-1">Farmer Code</Label>
                  <Input
                    id="farmerCode"
                    value={formData.farmerCode}
                    onChange={(e) => setFormData({...formData, farmerCode: e.target.value})}
                    placeholder="e.g. FARM-1001"
                    className="mt-1.5 px-4 py-3 h-auto rounded-xl border border-emerald-200/60 shadow-sm"
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="farmerQR" className="text-emerald-950 font-bold ml-1">Farmer QR</Label>
                  <div className="flex space-x-3 mt-1.5">
                    <Input
                      id="farmerQR"
                      value={formData.farmerQR}
                      placeholder="QR Result..."
                      className="px-4 py-3 h-auto rounded-xl border border-emerald-200/60 shadow-sm"
                      readOnly
                    />
                    <Button type="button" onClick={() => simulateQRScan('farmer')} className="h-auto px-6 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold shadow-sm">
                      Scan
                    </Button>
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="receivedWeight" className="text-emerald-950 font-bold ml-1">Weight Intake (kg)</Label>
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

              <div>
                <Button onClick={handleReceiveMaterial} className="w-full py-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20 mt-4">
                  Commit To Blockchain
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeForm === 'createLot'} onOpenChange={(open) => !open && setActiveForm(null)}>
        <DialogContent className="sm:max-w-2xl bg-white/95 backdrop-blur-2xl border border-emerald-200/60 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 px-8 py-6 border-b border-emerald-100">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-emerald-950 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                  <Layers className="text-emerald-600 w-5 h-5" />
                </div>
                Create Consolidated Lot
              </DialogTitle>
            </DialogHeader>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label className="text-sm font-bold text-emerald-950 ml-1">Input Sequence</Label>
                <div className="flex gap-4 mt-2">
                  <button 
                    onClick={() => setFormData({...formData, batchScanMethod: 'manual', batchQR: ''})}
                    className={`flex-1 py-3 px-4 rounded-xl border text-[10px] font-black tracking-widest transition-all ${formData.batchScanMethod === 'manual' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white border-emerald-100 text-emerald-900'}`}
                  >
                    MANUAL ENTRY
                  </button>
                  <button 
                    onClick={() => setFormData({...formData, batchScanMethod: 'scan', batchId: ''})}
                    className={`flex-1 py-3 px-4 rounded-xl border text-[10px] font-black tracking-widest transition-all ${formData.batchScanMethod === 'scan' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white border-emerald-100 text-emerald-900'}`}
                  >
                    QR SCAN
                  </button>
                </div>
              </div>

              {formData.batchScanMethod === 'manual' ? (
                <div>
                  <Label htmlFor="batchId" className="text-emerald-950 font-bold ml-1">Batch ID</Label>
                  <Input
                    id="batchId"
                    value={formData.batchId}
                    onChange={(e) => setFormData({...formData, batchId: e.target.value})}
                    placeholder="e.g. BATCH-1001"
                    className="mt-1.5 h-12 bg-white"
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="batchQR" className="text-emerald-950 font-bold ml-1">Scan Result</Label>
                  <div className="flex space-x-2 mt-1.5">
                    <Input
                      id="batchQR"
                      value={formData.batchQR}
                      className="h-12 bg-white font-mono"
                      readOnly
                    />
                    <Button onClick={() => simulateQRScan('batch')} className="h-12 bg-emerald-100 text-emerald-800 font-bold px-6">
                      Scan
                    </Button>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="lotWeight" className="text-emerald-950 font-bold ml-1">Total Weight (kg)</Label>
                <Input
                  id="lotWeight"
                  type="number"
                  value={formData.lotWeight}
                  onChange={(e) => setFormData({...formData, lotWeight: e.target.value})}
                  className="mt-1.5 h-12 bg-white"
                />
              </div>
              
              <div>
                <Label htmlFor="grade" className="text-emerald-950 font-bold ml-1">Botanical Grade</Label>
                <select
                  id="grade"
                  value={formData.grade}
                  onChange={(e) => setFormData({...formData, grade: e.target.value})}
                  className="w-full mt-1.5 h-12 rounded-xl border border-emerald-200 px-4 bg-white font-bold text-emerald-950"
                >
                  <option value="">Select grading...</option>
                  <option value="A">Premium (A+)</option>
                  <option value="B">Standard (B)</option>
                  <option value="C">Basic (C)</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="moistureEstimate" className="text-emerald-950 font-bold ml-1">Moisture (%)</Label>
                <Input
                  id="moistureEstimate"
                  type="number"
                  value={formData.moistureEstimate}
                  onChange={(e) => setFormData({...formData, moistureEstimate: e.target.value})}
                  className="mt-1.5 h-12 bg-white"
                />
              </div>

              <div className="md:col-span-2">
                <Button onClick={handleCreateLot} className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs tracking-widest shadow-xl shadow-emerald-600/20 mt-4">
                  GENERATE LOT MANIFEST
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeForm === 'transport'} onOpenChange={(open) => !open && setActiveForm(null)}>
        <DialogContent className="sm:max-w-2xl bg-white/95 backdrop-blur-2xl border border-emerald-200/60 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 px-8 py-6 border-b border-emerald-100">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-emerald-950 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                  <Truck className="text-emerald-600 w-5 h-5" />
                </div>
                Logistics Initiation
              </DialogTitle>
            </DialogHeader>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="waybillId" className="text-emerald-950 font-bold ml-1">Waybill Identifier</Label>
                <Input
                  id="waybillId"
                  value={formData.waybillId}
                  onChange={(e) => setFormData({...formData, waybillId: e.target.value})}
                  placeholder="WB-XXXXXX"
                  className="mt-1.5 h-12 bg-white"
                />
              </div>
              
              <div>
                <Label htmlFor="sealId" className="text-emerald-950 font-bold ml-1">Security Seal ID</Label>
                <Input
                  id="sealId"
                  value={formData.sealId}
                  onChange={(e) => setFormData({...formData, sealId: e.target.value})}
                  placeholder="SEAL-XXXXXX"
                  className="mt-1.5 h-12 bg-white"
                />
              </div>

              <div>
                <Label htmlFor="vehicleNumber" className="text-emerald-950 font-bold ml-1">Vehicle Plate Number</Label>
                <Input
                  id="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value})}
                  placeholder="KA-01-XXXX"
                  className="mt-1.5 h-12 bg-white"
                />
              </div>

              <div>
                <Label htmlFor="driverId" className="text-emerald-950 font-bold ml-1">Operator/Driver ID</Label>
                <Input
                  id="driverId"
                  value={formData.driverId}
                  onChange={(e) => setFormData({...formData, driverId: e.target.value})}
                  className="mt-1.5 h-12 bg-white"
                />
              </div>

              <div className="md:col-span-2">
                <Button onClick={handleStartTransport} className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-xs tracking-widest shadow-xl mt-4">
                  INITIATE FLEET DEPLOYMENT
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeForm === 'recall'} onOpenChange={(open) => !open && setActiveForm(null)}>
        <DialogContent className="sm:max-w-xl bg-white/95 backdrop-blur-2xl border border-red-200/60 rounded-[2rem] p-0 overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-br from-red-50 to-orange-50 px-8 py-6 border-b border-red-100">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-red-950 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                  <AlertTriangle className="text-red-600 w-5 h-5" />
                </div>
                Critical Recall Protocol
              </DialogTitle>
            </DialogHeader>
          </div>
          
          <div className="p-8">
            <div className="space-y-6">
              <div>
                <Label htmlFor="recallBatchId" className="text-red-950 font-bold ml-1">Target Batch ID</Label>
                <Input
                  id="recallBatchId"
                  value={formData.recallBatchId}
                  onChange={(e) => setFormData({...formData, recallBatchId: e.target.value})}
                  className="mt-1.5 h-12 bg-white border-red-100"
                />
              </div>
              <div>
                <Label htmlFor="recallReason" className="text-red-950 font-bold ml-1">Root Cause Analysis</Label>
                <textarea
                  id="recallReason"
                  value={formData.recallReason}
                  onChange={(e) => setFormData({...formData, recallReason: e.target.value})}
                  className="w-full mt-1.5 p-4 rounded-xl border border-red-100 bg-white font-medium text-slate-800 min-h-[120px]"
                  placeholder="Detail the discrepancy..."
                />
              </div>
              <Button onClick={handleInitiateRecall} className="w-full h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs tracking-widest shadow-xl shadow-red-600/20">
                EXECUTE SYSTEM-WIDE RECALL
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeForm === 'createBatchForFarmer'} onOpenChange={(open) => !open && setActiveForm(null)}>
        <DialogContent className="sm:max-w-4xl bg-white/95 backdrop-blur-2xl border border-emerald-200/60 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <CreateBatchForFarmerComponent 
              collectorName="Senior Field Aggregator"
              collectorId={userId}
              onBatchCreated={(batchId, farmerId) => {
                setActiveForm(null);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AggregatorView;