import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import FarmerDetailsDialog from '@/components/FarmerDetailsDialog';

interface AggregatorViewProps {
  userId: string;
}

const AggregatorView = ({ userId }: AggregatorViewProps) => {
  const [activeForm, setActiveForm] = useState<string | null>(null);
  const [collectionEvents, setCollectionEvents] = useState([
    {
      id: 'CE001',
      farmerCode: 'F001',
      weight: '50.5',
      status: 'received',
      timestamp: '2024-01-15 09:30:00',
      condition: 'Good'
    },
    {
      id: 'CE002', 
      farmerCode: 'F002',
      weight: '75.2',
      status: 'processed',
      timestamp: '2024-01-15 10:15:00',
      condition: 'Excellent'
    }
  ]);

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

  const handleReceiveMaterial = () => {
    const farmerCode = formData.scanMethod === 'scan' ? formData.farmerQR : formData.farmerCode;
    if (!farmerCode || !formData.receivedWeight) {
      toast({
        title: "Missing Information",
        description: "Please fill in farmer code/QR and weight",
        variant: "destructive"
      });
      return;
    }

    const newEvent = {
      id: `CE${String(collectionEvents.length + 1).padStart(3, '0')}`,
      farmerCode: farmerCode,
      weight: formData.receivedWeight,
      status: 'received',
      timestamp: new Date().toLocaleString('en-IN'),
      condition: 'Good'
    };

    setCollectionEvents([...collectionEvents, newEvent]);
    setFormData({ 
      ...formData, 
      farmerQR: '', 
      farmerCode: '', 
      receivedWeight: '', 
      conditionPhotos: [] 
    });
    setActiveForm(null);

    toast({
      title: "Material Received",
      description: `Successfully logged collection event ${newEvent.id}`,
      variant: "default"
    });
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

  const handleCreateLot = () => {
    if (!formData.lotWeight || !formData.grade) {
      toast({
        title: "Missing Information", 
        description: "Please fill in lot weight and grade",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Lot Created",
      description: `New lot created with weight ${formData.lotWeight}kg, Grade: ${formData.grade}`,
      variant: "default"
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
          <h2 className="text-2xl font-bold gov-heading">Aggregator Dashboard</h2>
          <p className="text-muted-foreground">Manage raw material collection and preparation for transport</p>
        </div>
        <Badge className="badge-verified">
          Active Collections: {collectionEvents.length}
        </Badge>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Button 
          onClick={() => setActiveForm('receive')}
          className="btn-government h-auto p-6 flex flex-col items-center space-y-2"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Receive Material</span>
        </Button>

        <Button 
          onClick={() => setActiveForm('createLot')}
          className="btn-secondary h-auto p-6 flex flex-col items-center space-y-2"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>Create Lot</span>
        </Button>

        <Button 
          onClick={() => setActiveForm('transport')}
          className="btn-accent h-auto p-6 flex flex-col items-center space-y-2"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Start Transport</span>
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
              {collectionEvents.map((event) => (
                <tr key={event.id} className="animate-fade-in">
                  <td className="font-mono">{event.id}</td>
                  <td className="font-mono">{event.farmerCode}</td>
                  <td>{event.weight}</td>
                  <td>
                    <Badge className={getStatusColor(event.status)}>
                      {event.status}
                    </Badge>
                  </td>
                  <td>{event.timestamp}</td>
                  <td>{event.condition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Forms */}
      {activeForm === 'receive' && (
        <Card className="gov-card animate-fade-in">
          <div className="gov-card-header">
            <h3 className="text-lg font-semibold">Receive Material from Farmer</h3>
          </div>
          
          {/* Farmer Input Method Selection */}
          <div className="mb-6">
            <Label className="text-base font-medium">Input Method</Label>
            <div className="flex space-x-4 mt-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="scanMethod"
                  value="manual"
                  checked={formData.scanMethod === 'manual'}
                  onChange={(e) => setFormData({...formData, scanMethod: e.target.value, farmerQR: ''})}
                />
                <span>Manual Entry</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="scanMethod"
                  value="scan"
                  checked={formData.scanMethod === 'scan'}
                  onChange={(e) => setFormData({...formData, scanMethod: e.target.value, farmerCode: ''})}
                />
                <span>QR Code Scan</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.scanMethod === 'manual' ? (
              <div>
                <Label htmlFor="farmerCode">Farmer Code</Label>
                <Input
                  id="farmerCode"
                  value={formData.farmerCode}
                  onChange={(e) => setFormData({...formData, farmerCode: e.target.value})}
                  placeholder="Enter farmer code manually"
                  className="gov-input"
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="farmerQR">Farmer QR Code</Label>
                <div className="flex space-x-2">
                  <Input
                    id="farmerQR"
                    value={formData.farmerQR}
                    onChange={(e) => setFormData({...formData, farmerQR: e.target.value})}
                    placeholder="QR code result will appear here"
                    className="gov-input"
                    readOnly
                  />
                  <Button 
                    type="button" 
                    onClick={() => simulateQRScan('farmer')} 
                    className="btn-secondary"
                  >
                    Scan QR
                  </Button>
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="receivedWeight">Received Weight (kg) *</Label>
              <Input
                id="receivedWeight"
                type="number"
                step="0.1"
                value={formData.receivedWeight}
                onChange={(e) => setFormData({...formData, receivedWeight: e.target.value})}
                placeholder="Enter weight in kg"
                className="gov-input"
                required
              />
            </div>

            <div className="md:col-span-2">
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
          </div>
          
          <div className="flex space-x-4 mt-6">
            <Button onClick={handleReceiveMaterial} className="btn-government">
              Log Custody Transfer
            </Button>
            <Button onClick={() => setActiveForm(null)} variant="outline">
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {activeForm === 'createLot' && (
        <Card className="gov-card animate-fade-in">
          <div className="gov-card-header">
            <h3 className="text-lg font-semibold">Create Lot (Aggregation & Grading)</h3>
          </div>

          {/* Batch Input Method Selection */}
          <div className="mb-6">
            <Label className="text-base font-medium">Batch ID Input Method</Label>
            <div className="flex space-x-4 mt-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="batchScanMethod"
                  value="manual"
                  checked={formData.batchScanMethod === 'manual'}
                  onChange={(e) => setFormData({...formData, batchScanMethod: e.target.value, batchQR: ''})}
                />
                <span>Manual Entry</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="batchScanMethod"
                  value="scan"
                  checked={formData.batchScanMethod === 'scan'}
                  onChange={(e) => setFormData({...formData, batchScanMethod: e.target.value, batchId: ''})}
                />
                <span>QR Code Scan</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.batchScanMethod === 'manual' ? (
              <div>
                <Label htmlFor="batchId">Batch ID</Label>
                <Input
                  id="batchId"
                  value={formData.batchId}
                  onChange={(e) => setFormData({...formData, batchId: e.target.value})}
                  placeholder="Enter batch ID manually"
                  className="gov-input"
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="batchQR">Batch QR Code</Label>
                <div className="flex space-x-2">
                  <Input
                    id="batchQR"
                    value={formData.batchQR}
                    onChange={(e) => setFormData({...formData, batchQR: e.target.value})}
                    placeholder="QR code result will appear here"
                    className="gov-input"
                    readOnly
                  />
                  <Button 
                    type="button" 
                    onClick={() => simulateQRScan('batch')} 
                    className="btn-secondary"
                  >
                    Scan QR
                  </Button>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="lotWeight">Total Lot Weight (kg) *</Label>
              <Input
                id="lotWeight"
                type="number"
                step="0.1"
                value={formData.lotWeight}
                onChange={(e) => setFormData({...formData, lotWeight: e.target.value})}
                placeholder="Enter total weight"
                className="gov-input"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="grade">Grade *</Label>
              <select
                id="grade"
                value={formData.grade}
                onChange={(e) => setFormData({...formData, grade: e.target.value})}
                className="gov-select"
                required
              >
                <option value="">Select grade</option>
                <option value="A">Grade A - Premium</option>
                <option value="B">Grade B - Standard</option>
                <option value="C">Grade C - Basic</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="moistureEstimate">Moisture Estimate (%)</Label>
              <Input
                id="moistureEstimate"
                type="number"
                step="0.1"
                value={formData.moistureEstimate}
                onChange={(e) => setFormData({...formData, moistureEstimate: e.target.value})}
                placeholder="Enter moisture percentage"
                className="gov-input"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="batchConditionPhotos">Batch Condition Photos (JPG/PNG)</Label>
              <input
                type="file"
                id="batchConditionPhotos"
                multiple
                accept=".jpg,.jpeg,.png"
                onChange={(e) => handlePhotoUpload('batch', e.target.files)}
                className="gov-input"
              />
              {formData.batchConditionPhotos.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">
                    Uploaded: {formData.batchConditionPhotos.join(', ')}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex space-x-4 mt-6">
            <Button onClick={handleCreateLot} className="btn-government">
              Create Lot
            </Button>
            <Button onClick={() => setActiveForm(null)} variant="outline">
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {activeForm === 'transport' && (
        <Card className="gov-card animate-fade-in">
          <div className="gov-card-header">
            <h3 className="text-lg font-semibold">Start Transport</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="waybillId">Waybill/Manifest ID *</Label>
              <Input
                id="waybillId"
                value={formData.waybillId}
                onChange={(e) => setFormData({...formData, waybillId: e.target.value})}
                placeholder="Enter waybill ID"
                className="gov-input"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="sealId">Seal ID *</Label>
              <Input
                id="sealId"
                value={formData.sealId}
                onChange={(e) => setFormData({...formData, sealId: e.target.value})}
                placeholder="Enter seal ID"
                className="gov-input"
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="sealPhoto">Seal Photo (JPG/PNG)</Label>
              <input
                type="file"
                id="sealPhoto"
                accept=".jpg,.jpeg,.png"
                onChange={(e) => handlePhotoUpload('seal', e.target.files)}
                className="gov-input"
              />
              {formData.sealPhoto && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">
                    Uploaded: {formData.sealPhoto}
                  </p>
                </div>
              )}
            </div>
            
            <div>
              <Label htmlFor="driverId">Driver ID</Label>
              <Input
                id="driverId"
                value={formData.driverId}
                onChange={(e) => setFormData({...formData, driverId: e.target.value})}
                placeholder="Enter driver ID"
                className="gov-input"
              />
            </div>
            <div>
              <Label htmlFor="vehicleNumber">Vehicle Number *</Label>
              <Input
                id="vehicleNumber"
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value})}
                placeholder="Enter vehicle number"
                className="gov-input"
                required
              />
            </div>
          </div>
          <div className="flex space-x-4 mt-6">
            <Button onClick={handleStartTransport} className="btn-government">
              Start Transport
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
              <Input
                id="recallBatchId"
                value={formData.recallBatchId}
                onChange={(e) => setFormData({...formData, recallBatchId: e.target.value})}
                placeholder="Enter batch ID for recall"
                className="gov-input"
                required
              />
            </div>
            <div>
              <Label htmlFor="recallReason">Recall Reason *</Label>
              <textarea
                id="recallReason"
                value={formData.recallReason}
                onChange={(e) => setFormData({...formData, recallReason: e.target.value})}
                placeholder="Describe the reason for recall"
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

export default AggregatorView;