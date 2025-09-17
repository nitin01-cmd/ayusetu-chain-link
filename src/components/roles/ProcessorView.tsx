import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import FarmerDetailsDialog from '@/components/FarmerDetailsDialog';
import { useBatches } from '@/hooks/useBatches';

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
          <h2 className="text-2xl font-bold gov-heading">Processor Dashboard</h2>
          <p className="text-muted-foreground">Manage lot processing, quality testing, and create processed batches</p>
        </div>
        <div className="flex space-x-4">
          <Badge className="badge-pending">
            Available Lots: {batches.filter(b => b.type === 'lot').length}
          </Badge>
          <Badge className="badge-verified">
            Processing Steps: {batches.filter(b => b.type === 'processed').length}
          </Badge>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Button 
          onClick={() => setActiveForm('receiveLot')}
          className="btn-government h-auto p-6 flex flex-col items-center space-y-2"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span>Receive Lot</span>
        </Button>

        <Button 
          onClick={() => setActiveForm('logProcessing')}
          className="btn-secondary h-auto p-6 flex flex-col items-center space-y-2"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Log Processing Step</span>
        </Button>

        <Button 
          onClick={() => setActiveForm('qualityTest')}
          className="btn-accent h-auto p-6 flex flex-col items-center space-y-2"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Quality Test</span>
        </Button>

        <FarmerDetailsDialog>
          <Button className="btn-accent h-auto p-6 flex flex-col items-center space-y-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>View Farmer Details</span>
          </Button>
        </FarmerDetailsDialog>

        <Button 
          onClick={() => setActiveForm('recall')}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 h-auto p-6 flex flex-col items-center space-y-2"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span>Initiate Recall</span>
        </Button>
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

      {/* Forms */}
      {activeForm === 'receiveLot' && (
        <Card className="gov-card animate-fade-in">
          <div className="gov-card-header">
            <h3 className="text-lg font-semibold">Receive Lot from Aggregator</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lotQR">Lot QR Code *</Label>
              <div className="flex space-x-2">
                <Input
                  id="lotQR"
                  value={formData.lotQR}
                  onChange={(e) => setFormData({...formData, lotQR: e.target.value})}
                  placeholder="Scan or enter lot QR code"
                  className="gov-input"
                  required
                />
                <Button 
                  type="button" 
                  onClick={simulateQRScan} 
                  className="btn-secondary"
                >
                  Scan QR
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="receivedWeight">Received Weight (kg) *</Label>
              <Input
                id="receivedWeight"
                type="number"
                step="0.1"
                value={formData.receivedWeight}
                onChange={(e) => setFormData({...formData, receivedWeight: e.target.value})}
                placeholder="Enter received weight"
                className="gov-input"
                required
              />
            </div>
            <div>
              <Label htmlFor="conditionPhotos">Condition Photos (JPG/PNG)</Label>
              <input
                type="file"
                id="conditionPhotos"
                multiple
                accept=".jpg,.jpeg,.png"
                onChange={(e) => handlePhotoUpload('condition', e.target.files)}
                className="gov-input"
              />
              {formData.conditionPhotos.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">
                    Uploaded: {formData.conditionPhotos.join(', ')}
                  </p>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="discrepancies">Discrepancies (if any)</Label>
              <Input
                id="discrepancies"
                value={formData.discrepancies}
                onChange={(e) => setFormData({...formData, discrepancies: e.target.value})}
                placeholder="Note any discrepancies"
                className="gov-input"
              />
            </div>
          </div>
          <div className="flex space-x-4 mt-6">
            <Button onClick={handleReceiveLot} className="btn-government">
              Log Received Event
            </Button>
            <Button onClick={() => setActiveForm(null)} variant="outline">
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {activeForm === 'logProcessing' && (
        <Card className="gov-card animate-fade-in">
          <div className="gov-card-header">
            <h3 className="text-lg font-semibold">Log Processing Step</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="parentLotId">Parent Lot ID *</Label>
              <select
                id="parentLotId"
                value={formData.parentLotId}
                onChange={(e) => setFormData({...formData, parentLotId: e.target.value})}
                className="gov-select"
                required
              >
                 <option value="">Select parent lot</option>
                 {batches.filter(b => b.type === 'lot').map((batch) => (
                   <option key={batch.id} value={batch.batch_id}>{batch.batch_id}</option>
                 ))}
              </select>
            </div>
            <div>
              <Label htmlFor="operationType">Operation Type *</Label>
              <select
                id="operationType"
                value={formData.operationType}
                onChange={(e) => setFormData({...formData, operationType: e.target.value})}
                className="gov-select"
                required
              >
                <option value="">Select operation</option>
                {operationTypes.map((op) => (
                  <option key={op} value={op} className="capitalize">{op}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="temperature">Temperature (°C) *</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                value={formData.temperature}
                onChange={(e) => setFormData({...formData, temperature: e.target.value})}
                placeholder="Enter temperature"
                className="gov-input"
                required
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration (hours) *</Label>
              <Input
                id="duration"
                type="number"
                step="0.1"
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                placeholder="Enter duration"
                className="gov-input"
                required
              />
            </div>
            <div>
              <Label htmlFor="equipmentId">Equipment ID (Optional)</Label>
              <Input
                id="equipmentId"
                value={formData.equipmentId}
                onChange={(e) => setFormData({...formData, equipmentId: e.target.value})}
                placeholder="Enter equipment ID"
                className="gov-input"
              />
            </div>
            <div>
              <Label htmlFor="operatorId">Operator ID (Optional)</Label>
              <Input
                id="operatorId"
                value={formData.operatorId}
                onChange={(e) => setFormData({...formData, operatorId: e.target.value})}
                placeholder="Enter operator ID"
                className="gov-input"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="processPhotos">Process Photos (JPG/PNG)</Label>
              <input
                type="file"
                id="processPhotos"
                multiple
                accept=".jpg,.jpeg,.png"
                onChange={(e) => handlePhotoUpload('process', e.target.files)}
                className="gov-input"
              />
              {formData.processPhotos.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">
                    Uploaded: {formData.processPhotos.join(', ')}
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="flex space-x-4 mt-6">
            <Button onClick={handleLogProcessing} className="btn-government">
              Log Processing Step
            </Button>
            <Button onClick={() => setActiveForm(null)} variant="outline">
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {activeForm === 'qualityTest' && (
        <Card className="gov-card animate-fade-in">
          <div className="gov-card-header">
            <h3 className="text-lg font-semibold">Quality Test Upload Section</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="testBatchId">Batch ID *</Label>
              <select
                id="testBatchId"
                value={formData.testBatchId}
                onChange={(e) => setFormData({...formData, testBatchId: e.target.value})}
                className="gov-select"
                required
              >
                 <option value="">Select batch</option>
                 {batches.filter(b => b.type === 'processed').map((batch) => (
                   <option key={batch.id} value={batch.batch_id}>{batch.batch_id}</option>
                 ))}
              </select>
            </div>
            <div>
              <Label htmlFor="testType">Type of Test *</Label>
              <select
                id="testType"
                value={formData.testType}
                onChange={(e) => setFormData({...formData, testType: e.target.value})}
                className="gov-select"
                required
              >
                <option value="">Select test type</option>
                {testTypes.map((test) => (
                  <option key={test} value={test}>{test}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="testResults">Test Results *</Label>
              <textarea
                id="testResults"
                value={formData.testResults}
                onChange={(e) => setFormData({...formData, testResults: e.target.value})}
                placeholder="Enter detailed test results"
                className="gov-input min-h-[100px] resize-vertical"
                required
              />
            </div>
            <div>
              <Label htmlFor="certificatePDF">Certificate PDF</Label>
              <input
                type="file"
                id="certificatePDF"
                accept=".pdf"
                onChange={(e) => handlePDFUpload(e.target.files)}
                className="gov-input"
              />
              {formData.certificatePDF && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">
                    Uploaded: {formData.certificatePDF}
                  </p>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="authorizingAuthority">Authorizing Authority</Label>
              <Input
                id="authorizingAuthority"
                value={formData.authorizingAuthority}
                onChange={(e) => setFormData({...formData, authorizingAuthority: e.target.value})}
                placeholder="e.g., Ministry of AYUSH, NABL Lab"
                className="gov-input"
              />
            </div>
          </div>
          <div className="flex space-x-4 mt-6">
            <Button onClick={handleQualityTest} className="btn-government">
              Upload Quality Test
            </Button>
            <Button onClick={() => setActiveForm(null)} variant="outline">
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {activeForm === 'recall' && (
        <Card className="gov-card animate-fade-in">
          <div className="gov-card-header">
            <h3 className="text-lg font-semibold">Initiate Product Recall</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="recallBatchId">Batch ID to Recall *</Label>
              <select
                id="recallBatchId"
                value={formData.recallBatchId}
                onChange={(e) => setFormData({...formData, recallBatchId: e.target.value})}
                className="gov-select"
                required
              >
                 <option value="">Select batch to recall</option>
                 {batches.filter(b => b.type === 'processed').map((batch) => (
                   <option key={batch.id} value={batch.batch_id}>{batch.batch_id}</option>
                 ))}
              </select>
            </div>
            <div>
              <Label htmlFor="recallReason">Recall Reason *</Label>
              <textarea
                id="recallReason"
                value={formData.recallReason}
                onChange={(e) => setFormData({...formData, recallReason: e.target.value})}
                placeholder="Describe the reason for recall (safety, quality, contamination, etc.)"
                className="gov-input min-h-[100px] resize-vertical"
                required
              />
            </div>
          </div>
          <div className="flex space-x-4 mt-6">
            <Button onClick={handleInitiateRecall} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Initiate Recall
            </Button>
            <Button onClick={() => setActiveForm(null)} variant="outline">
              Cancel
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ProcessorView;