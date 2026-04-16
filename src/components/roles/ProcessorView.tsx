import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import FarmerDetailsDialog from '@/components/FarmerDetailsDialog';
import { useBatches } from '@/hooks/useBatches';
import { PackageCheck, Activity, FileCheck, UserCircle, AlertTriangle } from 'lucide-react';

interface ProcessorViewProps {
  userId: string;
}

const ProcessorView = ({ userId }: ProcessorViewProps) => {
  const [activeForm, setActiveForm] = useState<string | null>(null);
  const { batches, loading, createBatch, updateBatch } = useBatches('processor', userId);

  const [formData, setFormData] = useState({
    lotQR: '',
    receivedWeight: '',
    conditionPhotos: [] as string[],
    discrepancies: '',
    parentLotId: '',
    operationType: '',
    equipmentId: '',
    operatorId: '',
    temperature: '',
    duration: '',
    processPhotos: [] as string[],
    // Quality Test fields
    testBatchId: '',
    testType: '',
    testResults: '',
    certificatePDF: '',
    authorizingAuthority: '',
    // Recall fields
    recallBatchId: '',
    recallReason: ''
  });

  const { toast } = useToast();

  const handleReceiveLot = async () => {
    if (!formData.lotQR || !formData.receivedWeight) {
      toast({
        title: "Missing Information",
        description: "Please fill in lot QR code and weight",
        variant: "destructive"
      });
      return;
    }

    try {
      // Find the lot to receive and update its status
      const lotToReceive = batches.find(b => b.batch_id === formData.lotQR && b.type === 'lot');
      if (lotToReceive) {
        await updateBatch(lotToReceive.id, {
          status: 'received',
          current_owner_id: userId,
          metadata: {
            ...lotToReceive.metadata,
            receivedWeight: formData.receivedWeight,
            discrepancies: formData.discrepancies,
            conditionPhotos: formData.conditionPhotos
          }
        });
      }

      setFormData({ 
        ...formData, 
        lotQR: '', 
        receivedWeight: '', 
        conditionPhotos: [], 
        discrepancies: '' 
      });
      setActiveForm(null);
    } catch (error) {
      console.error('Error receiving lot:', error);
    }
  };

  const handleLogProcessing = async () => {
    if (!formData.parentLotId || !formData.operationType || !formData.temperature || !formData.duration) {
      toast({
        title: "Missing Information",
        description: "Please fill in parent lot ID, operation type, temperature, and duration",
        variant: "destructive"
      });
      return;
    }

    try {
      await createBatch({
        batch_id: `PROC${Date.now().toString().slice(-6)}`,
        type: 'processed',
        status: 'processing',
        quantity: 0, // Will be updated based on processing
        product_name: `Processed ${formData.operationType}`,
        metadata: {
          parentLotId: formData.parentLotId,
          operation: formData.operationType,
          equipmentId: formData.equipmentId || 'N/A',
          operatorId: formData.operatorId || 'N/A',
          temperature: formData.temperature,
          duration: formData.duration,
          processPhotos: formData.processPhotos
        }
      });

      setFormData({ 
        ...formData, 
        parentLotId: '', 
        operationType: '', 
        equipmentId: '', 
        operatorId: '', 
        temperature: '', 
        duration: '', 
        processPhotos: [] 
      });
      setActiveForm(null);
    } catch (error) {
      console.error('Error logging processing step:', error);
    }
  };

  const handleQualityTest = async () => {
    if (!formData.testBatchId || !formData.testType || !formData.testResults) {
      toast({
        title: "Missing Information",
        description: "Please fill in batch ID, test type, and results",
        variant: "destructive"
      });
      return;
    }

    try {
      // Find the batch to update with quality test results
      const batchToTest = batches.find(b => b.batch_id === formData.testBatchId);
      if (batchToTest) {
        await updateBatch(batchToTest.id, {
          metadata: {
            ...batchToTest.metadata,
            qualityTest: {
              testType: formData.testType,
              results: formData.testResults,
              certificate: formData.certificatePDF || 'N/A',
              authority: formData.authorizingAuthority || 'Internal Lab',
              timestamp: new Date().toISOString()
            }
          }
        });
      }

      setFormData({
        ...formData,
        testBatchId: '',
        testType: '',
        testResults: '',
        certificatePDF: '',
        authorizingAuthority: ''
      });
      setActiveForm(null);
    } catch (error) {
      console.error('Error recording quality test:', error);
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

  const simulateQRScan = () => {
    const mockQR = `LOT${Date.now().toString().slice(-6)}`;
    setFormData({ ...formData, lotQR: mockQR });
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
    } else if (field === 'process') {
      setFormData({ ...formData, processPhotos: [...formData.processPhotos, ...photoUrls] });
    }
  };

  const handlePDFUpload = (files: FileList | null) => {
    if (!files) return;
    
    const file = files[0];
    if (file && file.type === 'application/pdf') {
      setFormData({ ...formData, certificatePDF: file.name });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'badge-pending';
      case 'processing': return 'badge-verified';
      case 'completed': return 'badge-verified';
      default: return 'badge-pending';
    }
  };

  const operationTypes = [
    'drying',
    'grinding', 
    'extraction',
    'distillation',
    'purification',
    'concentration'
  ];

  const testTypes = [
    'AYUSH Premium Certification',
    'Heavy Metal Analysis',
    'Microbial Testing',
    'Pesticide Residue Analysis',
    'Moisture Content Test',
    'Active Compound Analysis',
    'Ash Value Test',
    'Foreign Matter Test'
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-emerald-950 tracking-tight">Processor Hub</h2>
          <p className="text-emerald-700/80 font-medium tracking-wide mt-1">Manage lot processing, quality testing, and create processed batches</p>
        </div>
        <div className="flex space-x-4">
          <Badge className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-200 px-4 py-1.5 rounded-xl font-bold uppercase tracking-widest shadow-sm">
            Available Lots: {batches.filter(b => b.type === 'lot').length}
          </Badge>
          <Badge className="bg-teal-100 hover:bg-teal-200 text-teal-800 border-teal-200 px-4 py-1.5 rounded-xl font-bold uppercase tracking-widest shadow-sm">
            Processing Steps: {batches.filter(b => b.type === 'processed').length}
          </Badge>
        </div>
      </div>

      {/* Premium Glass Action Buttons */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        
        <div 
          onClick={() => setActiveForm('receiveLot')}
          className="bg-white/80 backdrop-blur-xl border border-emerald-200/60 shadow-lg shadow-emerald-500/5 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-emerald-500 hover:border-emerald-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 flex items-center justify-center text-emerald-600 group-hover:bg-white/20 group-hover:text-white transition-colors">
            <PackageCheck className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-emerald-950 text-xs text-center leading-tight group-hover:text-white transition-colors">Receive Lot</span>
        </div>

        <div 
          onClick={() => setActiveForm('logProcessing')}
          className="bg-white/80 backdrop-blur-xl border border-emerald-200/60 shadow-lg shadow-emerald-500/5 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-teal-500 hover:border-teal-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-500/20 transition-all duration-300 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-teal-100/80 flex items-center justify-center text-teal-600 group-hover:bg-white/20 group-hover:text-white transition-colors">
            <Activity className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-emerald-950 text-xs text-center leading-tight group-hover:text-white transition-colors">Log Processing Step</span>
        </div>

        <div 
          onClick={() => setActiveForm('qualityTest')}
          className="bg-white/80 backdrop-blur-xl border border-emerald-200/60 shadow-lg shadow-emerald-500/5 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-blue-500 hover:border-blue-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-100/80 flex items-center justify-center text-blue-600 group-hover:bg-white/20 group-hover:text-white transition-colors">
            <FileCheck className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-emerald-950 text-xs text-center leading-tight group-hover:text-white transition-colors">Quality Test</span>
        </div>

        <FarmerDetailsDialog>
          <div className="bg-white/80 backdrop-blur-xl border border-emerald-200/60 shadow-lg shadow-emerald-500/5 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 cursor-pointer h-full hover:bg-purple-500 hover:border-purple-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 group-hover:bg-white/20 group-hover:text-white transition-colors">
              <UserCircle className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-emerald-950 text-xs text-center leading-tight group-hover:text-white transition-colors">Farmer Details</span>
          </div>
        </FarmerDetailsDialog>

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

      {/* Received Lots Table */}
      <Card className="gov-card">
        <div className="gov-card-header">
          <h3 className="text-lg font-semibold">Received Lots</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Lot ID</th>
                <th>Aggregator ID</th>
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
              ) : batches.filter(b => b.type === 'lot').length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4">No lots received yet</td>
                </tr>
              ) : (
                batches.filter(b => b.type === 'lot').map((batch) => (
                  <tr key={batch.id} className="animate-fade-in">
                    <td className="font-mono">{batch.batch_id}</td>
                    <td className="font-mono">{batch.current_owner_id}</td>
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

      {/* Processing Steps Table */}
      <Card className="gov-card">
        <div className="gov-card-header">
          <h3 className="text-lg font-semibold">Processing Steps</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Step ID</th>
                <th>Parent Lot</th>
                <th>Child Batch</th>
                <th>Operation</th>
                <th>Equipment</th>
                <th>Parameters</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-4">Loading...</td>
                </tr>
              ) : batches.filter(b => b.type === 'processed').length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4">No processing steps yet</td>
                </tr>
              ) : (
                batches.filter(b => b.type === 'processed').map((batch) => (
                  <tr key={batch.id} className="animate-fade-in">
                    <td className="font-mono">{batch.batch_id}</td>
                    <td className="font-mono">{batch.metadata?.parentLotId || '-'}</td>
                    <td className="font-mono">{batch.batch_id}</td>
                    <td className="capitalize">{batch.metadata?.operation || '-'}</td>
                    <td className="font-mono">{batch.metadata?.equipmentId || '-'}</td>
                    <td className="text-sm">{batch.metadata?.temperature ? `Temp: ${batch.metadata.temperature}°C, Duration: ${batch.metadata.duration}hrs` : '-'}</td>
                    <td>{new Date(batch.created_at).toLocaleString('en-IN')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quality Tests Table */}
      <Card className="gov-card">
        <div className="gov-card-header">
          <h3 className="text-lg font-semibold">Quality Test Records</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Test ID</th>
                <th>Batch ID</th>
                <th>Test Type</th>
                <th>Results</th>
                <th>Certificate</th>
                <th>Authority</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-4">Loading...</td>
                </tr>
              ) : batches.filter(b => b.metadata?.qualityTest).length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4">No quality tests yet</td>
                </tr>
              ) : (
                batches.filter(b => b.metadata?.qualityTest).map((batch) => (
                  <tr key={batch.id} className="animate-fade-in">
                    <td className="font-mono">{batch.batch_id}</td>
                    <td className="font-mono">{batch.batch_id}</td>
                    <td>{batch.metadata?.qualityTest?.testType}</td>
                    <td>{batch.metadata?.qualityTest?.results}</td>
                    <td className="font-mono text-sm">{batch.metadata?.qualityTest?.certificate}</td>
                    <td>{batch.metadata?.qualityTest?.authority}</td>
                    <td>{batch.metadata?.qualityTest?.timestamp ? new Date(batch.metadata.qualityTest.timestamp).toLocaleString('en-IN') : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Form Dialogs */}
      <Dialog open={activeForm === 'receiveLot'} onOpenChange={(open) => !open && setActiveForm(null)}>
        <DialogContent className="sm:max-w-xl bg-white/95 backdrop-blur-2xl border border-emerald-200/60 rounded-[2rem] p-0 overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 px-8 py-6 border-b border-emerald-100">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-emerald-950 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                  <PackageCheck className="text-emerald-600 w-5 h-5" />
                </div>
                Receive Lot
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-8">
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
              <div>
                <Button onClick={handleReceiveLot} className="w-full py-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20 mt-4">
                  Log Received Event
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeForm === 'logProcessing'} onOpenChange={(open) => !open && setActiveForm(null)}>
        <DialogContent className="sm:max-w-xl bg-white/95 backdrop-blur-2xl border border-emerald-200/60 rounded-[2rem] p-0 overflow-y-auto shadow-2xl max-h-[90vh]">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 px-8 py-6 border-b border-emerald-100 sticky top-0 z-10">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-emerald-950 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                  <Activity className="text-emerald-600 w-5 h-5" />
                </div>
                Log Processing Step
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 gap-5">
              <div>
                <Label htmlFor="parentLotId" className="text-emerald-950 font-bold ml-1">Parent Lot ID *</Label>
                <select
                  id="parentLotId"
                  value={formData.parentLotId}
                  onChange={(e) => setFormData({...formData, parentLotId: e.target.value})}
                  className="mt-1.5 w-full px-4 py-3 h-auto rounded-xl border border-emerald-200/60 shadow-sm bg-white"
                  required
                >
                   <option value="">Select parent lot</option>
                   {batches.filter(b => b.type === 'lot').map((batch) => (
                     <option key={batch.id} value={batch.batch_id}>{batch.batch_id}</option>
                   ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="temperature" className="text-emerald-950 font-bold ml-1">Temp (°C) *</Label>
                  <Input id="temperature" type="number" step="0.1" value={formData.temperature} onChange={(e) => setFormData({...formData, temperature: e.target.value})} className="mt-1.5 px-4 py-3 h-auto rounded-xl border border-emerald-200/60 shadow-sm" required />
                </div>
                <div>
                  <Label htmlFor="duration" className="text-emerald-950 font-bold ml-1">Duration (hr) *</Label>
                  <Input id="duration" type="number" step="0.1" value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})} className="mt-1.5 px-4 py-3 h-auto rounded-xl border border-emerald-200/60 shadow-sm" required />
                </div>
              </div>
              <Button onClick={handleLogProcessing} className="w-full py-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20 mt-4">
                Submit Processing Record
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeForm === 'qualityTest'} onOpenChange={(open) => !open && setActiveForm(null)}>
        <DialogContent className="sm:max-w-xl bg-white/95 backdrop-blur-2xl border border-emerald-200/60 rounded-[2rem] p-0 overflow-y-auto shadow-2xl">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 px-8 py-6 border-b border-emerald-100 sticky top-0 z-10">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-emerald-950 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                  <FileCheck className="text-emerald-600 w-5 h-5" />
                </div>
                Quality Assessment
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 gap-5">
              <div>
                <Label htmlFor="testBatchId" className="text-emerald-950 font-bold ml-1">Batch ID *</Label>
                <select id="testBatchId" value={formData.testBatchId} onChange={(e) => setFormData({...formData, testBatchId: e.target.value})} className="mt-1.5 w-full px-4 py-3 rounded-xl border border-emerald-200/60 shadow-sm bg-white" required>
                   <option value="">Select batch</option>
                   {batches.filter(b => b.type === 'processed').map((batch) => <option key={batch.id} value={batch.batch_id}>{batch.batch_id}</option>)}
                </select>
              </div>
              <Button onClick={handleQualityTest} className="w-full py-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20 mt-4">
                Affix Quality Certificate
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeForm === 'recall'} onOpenChange={(open) => !open && setActiveForm(null)}>
        <DialogContent className="sm:max-w-xl bg-white/95 backdrop-blur-2xl border border-red-200/60 rounded-[2rem] p-0 overflow-y-auto shadow-2xl">
          <div className="bg-gradient-to-br from-red-50 to-orange-50 px-8 py-6 border-b border-red-100 sticky top-0 z-10">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-red-950 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                  <AlertTriangle className="text-red-600 w-5 h-5" />
                </div>
                Initiate Product Recall
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 gap-5">
              <div>
                <Label htmlFor="recallBatchId" className="text-red-950 font-bold ml-1">Target Batch ID *</Label>
                <select id="recallBatchId" value={formData.recallBatchId} onChange={(e) => setFormData({...formData, recallBatchId: e.target.value})} className="mt-1.5 w-full px-4 py-3 rounded-xl border border-red-200/60 shadow-sm bg-white focus:ring-red-500" required>
                   <option value="">Select compromised batch...</option>
                   {batches.filter(b => b.type === 'processed').map((batch) => <option key={batch.id} value={batch.batch_id}>{batch.batch_id}</option>)}
                </select>
              </div>
              <Button onClick={handleInitiateRecall} className="w-full py-6 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-600/20 mt-4">
                Broadcast Recall Alert
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProcessorView;