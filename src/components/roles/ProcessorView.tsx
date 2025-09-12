import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface ProcessorViewProps {
  userId: string;
}

const ProcessorView = ({ userId }: ProcessorViewProps) => {
  const [activeForm, setActiveForm] = useState<string | null>(null);
  const [receivedLots, setReceivedLots] = useState([
    {
      id: 'LOT001',
      aggregatorId: 'AGG001',
      weight: '125.7',
      status: 'received',
      timestamp: '2024-01-15 14:30:00',
      condition: 'Good'
    },
    {
      id: 'LOT002',
      aggregatorId: 'AGG001', 
      weight: '98.3',
      status: 'processing',
      timestamp: '2024-01-15 15:15:00',
      condition: 'Excellent'
    }
  ]);

  const [processingSteps, setProcessingSteps] = useState([
    {
      id: 'PS001',
      parentLotId: 'LOT001',
      childBatchId: 'BATCH001',
      operation: 'drying',
      equipmentId: 'DRY001',
      operatorId: 'OP001',
      parameters: 'Temp: 60°C, Duration: 8hrs',
      timestamp: '2024-01-15 16:00:00'
    }
  ]);

  const [formData, setFormData] = useState({
    lotQR: '',
    receivedWeight: '',
    conditionPhoto: '',
    discrepancies: '',
    parentLotId: '',
    operationType: '',
    equipmentId: '',
    operatorId: '',
    temperature: '',
    duration: '',
    processPhoto: ''
  });

  const { toast } = useToast();

  const handleReceiveLot = () => {
    if (!formData.lotQR || !formData.receivedWeight) {
      toast({
        title: "Missing Information",
        description: "Please fill in lot QR code and weight",
        variant: "destructive"
      });
      return;
    }

    const newLot = {
      id: formData.lotQR,
      aggregatorId: 'AGG001',
      weight: formData.receivedWeight,
      status: 'received',
      timestamp: new Date().toLocaleString('en-IN'),
      condition: 'Good'
    };

    setReceivedLots([...receivedLots, newLot]);
    setFormData({ ...formData, lotQR: '', receivedWeight: '', conditionPhoto: '', discrepancies: '' });
    setActiveForm(null);

    toast({
      title: "Lot Received",
      description: `Successfully logged lot ${newLot.id}`,
      variant: "default"
    });
  };

  const handleLogProcessing = () => {
    if (!formData.parentLotId || !formData.operationType) {
      toast({
        title: "Missing Information",
        description: "Please fill in parent lot ID and operation type",
        variant: "destructive"
      });
      return;
    }

    const newStep = {
      id: `PS${String(processingSteps.length + 1).padStart(3, '0')}`,
      parentLotId: formData.parentLotId,
      childBatchId: `BATCH${String(processingSteps.length + 1).padStart(3, '0')}`,
      operation: formData.operationType,
      equipmentId: formData.equipmentId,
      operatorId: formData.operatorId,
      parameters: `Temp: ${formData.temperature}°C, Duration: ${formData.duration}hrs`,
      timestamp: new Date().toLocaleString('en-IN')
    };

    setProcessingSteps([...processingSteps, newStep]);
    setFormData({ 
      ...formData, 
      parentLotId: '', 
      operationType: '', 
      equipmentId: '', 
      operatorId: '', 
      temperature: '', 
      duration: '', 
      processPhoto: '' 
    });
    setActiveForm(null);

    toast({
      title: "Processing Step Logged",
      description: `Created batch ${newStep.childBatchId} from ${formData.operationType} operation`,
      variant: "default"
    });
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gov-heading">Processor Dashboard</h2>
          <p className="text-muted-foreground">Manage lot processing and create processed batches</p>
        </div>
        <div className="flex space-x-4">
          <Badge className="badge-pending">
            Received Lots: {receivedLots.length}
          </Badge>
          <Badge className="badge-verified">
            Processing Steps: {processingSteps.length}
          </Badge>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              {receivedLots.map((lot) => (
                <tr key={lot.id} className="animate-fade-in">
                  <td className="font-mono">{lot.id}</td>
                  <td className="font-mono">{lot.aggregatorId}</td>
                  <td>{lot.weight}</td>
                  <td>
                    <Badge className={getStatusColor(lot.status)}>
                      {lot.status}
                    </Badge>
                  </td>
                  <td>{lot.timestamp}</td>
                  <td>{lot.condition}</td>
                </tr>
              ))}
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
              {processingSteps.map((step) => (
                <tr key={step.id} className="animate-fade-in">
                  <td className="font-mono">{step.id}</td>
                  <td className="font-mono">{step.parentLotId}</td>
                  <td className="font-mono">{step.childBatchId}</td>
                  <td className="capitalize">{step.operation}</td>
                  <td className="font-mono">{step.equipmentId}</td>
                  <td className="text-sm">{step.parameters}</td>
                  <td>{step.timestamp}</td>
                </tr>
              ))}
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
              <Label htmlFor="lotQR">Lot QR Code</Label>
              <Input
                id="lotQR"
                value={formData.lotQR}
                onChange={(e) => setFormData({...formData, lotQR: e.target.value})}
                placeholder="Scan or enter lot QR code"
                className="gov-input"
              />
            </div>
            <div>
              <Label htmlFor="receivedWeight">Received Weight (kg)</Label>
              <Input
                id="receivedWeight"
                type="number"
                value={formData.receivedWeight}
                onChange={(e) => setFormData({...formData, receivedWeight: e.target.value})}
                placeholder="Enter received weight"
                className="gov-input"
              />
            </div>
            <div>
              <Label htmlFor="conditionPhoto">Condition Photo URL</Label>
              <Input
                id="conditionPhoto"
                value={formData.conditionPhoto}
                onChange={(e) => setFormData({...formData, conditionPhoto: e.target.value})}
                placeholder="Upload or enter photo URL"
                className="gov-input"
              />
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
              <Label htmlFor="parentLotId">Parent Lot ID</Label>
              <select
                id="parentLotId"
                value={formData.parentLotId}
                onChange={(e) => setFormData({...formData, parentLotId: e.target.value})}
                className="gov-select"
              >
                <option value="">Select parent lot</option>
                {receivedLots.map((lot) => (
                  <option key={lot.id} value={lot.id}>{lot.id}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="operationType">Operation Type</Label>
              <select
                id="operationType"
                value={formData.operationType}
                onChange={(e) => setFormData({...formData, operationType: e.target.value})}
                className="gov-select"
              >
                <option value="">Select operation</option>
                {operationTypes.map((op) => (
                  <option key={op} value={op} className="capitalize">{op}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="equipmentId">Equipment ID</Label>
              <Input
                id="equipmentId"
                value={formData.equipmentId}
                onChange={(e) => setFormData({...formData, equipmentId: e.target.value})}
                placeholder="Enter equipment ID"
                className="gov-input"
              />
            </div>
            <div>
              <Label htmlFor="operatorId">Operator ID</Label>
              <Input
                id="operatorId"
                value={formData.operatorId}
                onChange={(e) => setFormData({...formData, operatorId: e.target.value})}
                placeholder="Enter operator ID"
                className="gov-input"
              />
            </div>
            <div>
              <Label htmlFor="temperature">Temperature (°C)</Label>
              <Input
                id="temperature"
                type="number"
                value={formData.temperature}
                onChange={(e) => setFormData({...formData, temperature: e.target.value})}
                placeholder="Enter temperature"
                className="gov-input"
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration (hours)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                placeholder="Enter duration"
                className="gov-input"
              />
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
    </div>
  );
};

export default ProcessorView;