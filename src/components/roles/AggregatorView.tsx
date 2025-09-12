import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

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
    receivedWeight: '',
    conditionPhoto: '',
    lotWeight: '',
    grade: '',
    moistureEstimate: '',
    waybillId: '',
    sealId: '',
    driverId: '',
    vehicleNumber: ''
  });

  const { toast } = useToast();

  const handleReceiveMaterial = () => {
    if (!formData.farmerQR || !formData.receivedWeight) {
      toast({
        title: "Missing Information",
        description: "Please fill in farmer QR code and weight",
        variant: "destructive"
      });
      return;
    }

    const newEvent = {
      id: `CE${String(collectionEvents.length + 1).padStart(3, '0')}`,
      farmerCode: formData.farmerQR,
      weight: formData.receivedWeight,
      status: 'received',
      timestamp: new Date().toLocaleString('en-IN'),
      condition: 'Good'
    };

    setCollectionEvents([...collectionEvents, newEvent]);
    setFormData({ ...formData, farmerQR: '', receivedWeight: '', conditionPhoto: '' });
    setActiveForm(null);

    toast({
      title: "Material Received",
      description: `Successfully logged collection event ${newEvent.id}`,
      variant: "default"
    });
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

    setFormData({ ...formData, lotWeight: '', grade: '', moistureEstimate: '' });
    setActiveForm(null);
  };

  const handleStartTransport = () => {
    if (!formData.waybillId || !formData.vehicleNumber) {
      toast({
        title: "Missing Information",
        description: "Please fill in waybill ID and vehicle number",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Transport Started",
      description: `Transport initiated with waybill ${formData.waybillId}`,
      variant: "default"
    });

    setFormData({ ...formData, waybillId: '', sealId: '', driverId: '', vehicleNumber: '' });
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="farmerQR">Farmer QR Code</Label>
              <Input
                id="farmerQR"
                value={formData.farmerQR}
                onChange={(e) => setFormData({...formData, farmerQR: e.target.value})}
                placeholder="Scan or enter farmer QR code"
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
                placeholder="Enter weight in kg"
                className="gov-input"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="conditionPhoto">Condition Photo URL</Label>
              <Input
                id="conditionPhoto"
                value={formData.conditionPhoto}
                onChange={(e) => setFormData({...formData, conditionPhoto: e.target.value})}
                placeholder="Upload or enter photo URL"
                className="gov-input"
              />
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lotWeight">Total Lot Weight (kg)</Label>
              <Input
                id="lotWeight"
                type="number"
                value={formData.lotWeight}
                onChange={(e) => setFormData({...formData, lotWeight: e.target.value})}
                placeholder="Enter total weight"
                className="gov-input"
              />
            </div>
            <div>
              <Label htmlFor="grade">Grade</Label>
              <select
                id="grade"
                value={formData.grade}
                onChange={(e) => setFormData({...formData, grade: e.target.value})}
                className="gov-select"
              >
                <option value="">Select grade</option>
                <option value="A">Grade A - Premium</option>
                <option value="B">Grade B - Standard</option>
                <option value="C">Grade C - Basic</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="moistureEstimate">Moisture Estimate (%)</Label>
              <Input
                id="moistureEstimate"
                type="number"
                value={formData.moistureEstimate}
                onChange={(e) => setFormData({...formData, moistureEstimate: e.target.value})}
                placeholder="Enter moisture percentage"
                className="gov-input"
              />
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
              <Label htmlFor="waybillId">Waybill/Manifest ID</Label>
              <Input
                id="waybillId"
                value={formData.waybillId}
                onChange={(e) => setFormData({...formData, waybillId: e.target.value})}
                placeholder="Enter waybill ID"
                className="gov-input"
              />
            </div>
            <div>
              <Label htmlFor="sealId">Seal ID</Label>
              <Input
                id="sealId"
                value={formData.sealId}
                onChange={(e) => setFormData({...formData, sealId: e.target.value})}
                placeholder="Enter seal ID"
                className="gov-input"
              />
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
              <Label htmlFor="vehicleNumber">Vehicle Number</Label>
              <Input
                id="vehicleNumber"
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value})}
                placeholder="Enter vehicle number"
                className="gov-input"
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
    </div>
  );
};

export default AggregatorView;