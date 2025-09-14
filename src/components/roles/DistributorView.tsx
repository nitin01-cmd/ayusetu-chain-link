import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import FarmerDetailsDialog from '@/components/FarmerDetailsDialog';

interface DistributorViewProps {
  userId: string;
}

const DistributorView = ({ userId }: DistributorViewProps) => {
  const [activeForm, setActiveForm] = useState<string | null>(null);
  const [finalProducts, setFinalProducts] = useState([
    {
      id: 'FP001',
      batchId: 'FP_BATCH_001',
      manufacturerId: 'MFG001',
      qrCode: 'QR_FP001_ABC123',
      status: 'ready_for_dispatch',
      timestamp: '2024-01-15 20:00:00',
      destination: ''
    },
    {
      id: 'FP002',
      batchId: 'FP_BATCH_002', 
      manufacturerId: 'MFG001',
      qrCode: 'QR_FP002_DEF456',
      status: 'dispatched',
      timestamp: '2024-01-15 21:30:00',
      destination: 'Mumbai Retail Hub'
    }
  ]);

  const [shipments, setShipments] = useState([
    {
      id: 'SHIP001',
      batchId: 'FP_BATCH_002',
      shipmentId: 'SH_2024_001',
      vehicleNumber: 'MH-01-AB-1234',
      driverName: 'Raj Kumar',
      driverId: 'DR001',
      destination: 'Mumbai Retail Hub',
      dispatchTime: '2024-01-15 21:30:00',
      status: 'in_transit',
      gpsLocation: '19.0760, 72.8777'
    }
  ]);

  const [formData, setFormData] = useState({
    productQR: '',
    shipmentId: '',
    vehicleNumber: '',
    driverName: '',
    driverId: '',
    destination: ''
  });

  const { toast } = useToast();

  const handleDispatchProduct = () => {
    if (!formData.productQR || !formData.shipmentId || !formData.vehicleNumber || !formData.destination) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required dispatch details",
        variant: "destructive"
      });
      return;
    }

    // Find the product to dispatch
    const productToDispatch = finalProducts.find(p => p.qrCode === formData.productQR);
    if (!productToDispatch) {
      toast({
        title: "Product Not Found",
        description: "Could not find product with the specified QR code",
        variant: "destructive"
      });
      return;
    }

    // Create new shipment
    const newShipment = {
      id: `SHIP${String(shipments.length + 1).padStart(3, '0')}`,
      batchId: productToDispatch.batchId,
      shipmentId: formData.shipmentId,
      vehicleNumber: formData.vehicleNumber,
      driverName: formData.driverName,
      driverId: formData.driverId,
      destination: formData.destination,
      dispatchTime: new Date().toLocaleString('en-IN'),
      status: 'in_transit',
      gpsLocation: '28.6139, 77.2090' // Delhi coordinates as default
    };

    setShipments([...shipments, newShipment]);

    // Update product status
    const updatedProducts = finalProducts.map(product =>
      product.qrCode === formData.productQR
        ? { ...product, status: 'dispatched', destination: formData.destination }
        : product
    );
    setFinalProducts(updatedProducts);

    setFormData({
      ...formData,
      productQR: '',
      shipmentId: '',
      vehicleNumber: '',
      driverName: '',
      driverId: '',
      destination: ''
    });
    setActiveForm(null);

    toast({
      title: "Product Dispatched",
      description: `Shipment ${newShipment.shipmentId} created for ${productToDispatch.batchId}`,
      variant: "default"
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready_for_dispatch': return 'badge-pending';
      case 'dispatched': return 'badge-verified';
      case 'in_transit': return 'badge-verified';
      case 'delivered': return 'badge-verified';
      default: return 'badge-pending';
    }
  };

  const availableProducts = finalProducts.filter(product => product.status === 'ready_for_dispatch');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gov-heading">Distributor Dashboard</h2>
          <p className="text-muted-foreground">Manage product dispatch and logistics operations</p>
        </div>
        <div className="flex space-x-4">
          <Badge className="badge-pending">
            Ready for Dispatch: {availableProducts.length}
          </Badge>
          <Badge className="badge-verified">
            Active Shipments: {shipments.filter(s => s.status === 'in_transit').length}
          </Badge>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Button 
          onClick={() => setActiveForm('dispatch')}
          className="btn-government h-auto p-6 flex flex-col items-center space-y-2"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <span>Dispatch Product</span>
        </Button>

        <Button 
          onClick={() => setActiveForm('monitor')}
          className="btn-secondary h-auto p-6 flex flex-col items-center space-y-2"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Monitor Transport</span>
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

      {/* Final Products Table */}
      <Card className="gov-card">
        <div className="gov-card-header">
          <h3 className="text-lg font-semibold">Final Product Batches</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Product ID</th>
                <th>Batch ID</th>
                <th>Manufacturer</th>
                <th>QR Code</th>
                <th>Status</th>
                <th>Destination</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {finalProducts.map((product) => (
                <tr key={product.id} className="animate-fade-in">
                  <td className="font-mono">{product.id}</td>
                  <td className="font-mono">{product.batchId}</td>
                  <td className="font-mono">{product.manufacturerId}</td>
                  <td className="font-mono text-xs">{product.qrCode}</td>
                  <td>
                    <Badge className={getStatusColor(product.status)}>
                      {product.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td>{product.destination || '-'}</td>
                  <td>{product.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Shipments Tracking Table */}
      <Card className="gov-card">
        <div className="gov-card-header">
          <h3 className="text-lg font-semibold">Active Shipments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Shipment ID</th>
                <th>Batch ID</th>
                <th>Vehicle</th>
                <th>Driver</th>
                <th>Destination</th>
                <th>Status</th>
                <th>GPS Location</th>
                <th>Dispatch Time</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((shipment) => (
                <tr key={shipment.id} className="animate-fade-in">
                  <td className="font-mono">{shipment.shipmentId}</td>
                  <td className="font-mono">{shipment.batchId}</td>
                  <td>{shipment.vehicleNumber}</td>
                  <td>{shipment.driverName}</td>
                  <td>{shipment.destination}</td>
                  <td>
                    <Badge className={getStatusColor(shipment.status)}>
                      {shipment.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="font-mono text-xs">{shipment.gpsLocation}</td>
                  <td>{shipment.dispatchTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Forms */}
      {activeForm === 'dispatch' && (
        <Card className="gov-card animate-fade-in">
          <div className="gov-card-header">
            <h3 className="text-lg font-semibold">Dispatch Product</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="productQR">Product QR Code</Label>
              <select
                id="productQR"
                value={formData.productQR}
                onChange={(e) => setFormData({...formData, productQR: e.target.value})}
                className="gov-select mt-2"
              >
                <option value="">Select product to dispatch</option>
                {availableProducts.map((product) => (
                  <option key={product.qrCode} value={product.qrCode}>
                    {product.batchId} - {product.qrCode}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="shipmentId">Shipment ID</Label>
              <Input
                id="shipmentId"
                value={formData.shipmentId}
                onChange={(e) => setFormData({...formData, shipmentId: e.target.value})}
                placeholder="Enter shipment ID"
                className="gov-input mt-2"
              />
            </div>
            <div>
              <Label htmlFor="vehicleNumber">Vehicle Number</Label>
              <Input
                id="vehicleNumber"
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value})}
                placeholder="Enter vehicle number"
                className="gov-input mt-2"
              />
            </div>
            <div>
              <Label htmlFor="driverName">Driver Name</Label>
              <Input
                id="driverName"
                value={formData.driverName}
                onChange={(e) => setFormData({...formData, driverName: e.target.value})}
                placeholder="Enter driver name"
                className="gov-input mt-2"
              />
            </div>
            <div>
              <Label htmlFor="driverId">Driver ID</Label>
              <Input
                id="driverId"
                value={formData.driverId}
                onChange={(e) => setFormData({...formData, driverId: e.target.value})}
                placeholder="Enter driver ID"
                className="gov-input mt-2"
              />
            </div>
            <div>
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                value={formData.destination}
                onChange={(e) => setFormData({...formData, destination: e.target.value})}
                placeholder="Enter destination"
                className="gov-input mt-2"
              />
            </div>
          </div>
          <div className="flex space-x-4 mt-6">
            <Button onClick={handleDispatchProduct} className="btn-government">
              Log Distribution Event
            </Button>
            <Button onClick={() => setActiveForm(null)} variant="outline">
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {activeForm === 'monitor' && (
        <Card className="gov-card animate-fade-in">
          <div className="gov-card-header">
            <h3 className="text-lg font-semibold">Transport Monitoring</h3>
          </div>
          <div className="space-y-4">
            {shipments.filter(s => s.status === 'in_transit').map((shipment) => (
              <div key={shipment.id} className="p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{shipment.shipmentId}</h4>
                  <Badge className={getStatusColor(shipment.status)}>
                    {shipment.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Vehicle:</span>
                    <div className="font-mono">{shipment.vehicleNumber}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Driver:</span>
                    <div>{shipment.driverName}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Destination:</span>
                    <div>{shipment.destination}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">GPS:</span>
                    <div className="font-mono text-xs">{shipment.gpsLocation}</div>
                  </div>
                </div>
              </div>
            ))}
            {shipments.filter(s => s.status === 'in_transit').length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No active shipments to monitor
              </div>
            )}
          </div>
          <div className="flex space-x-4 mt-6">
            <Button onClick={() => setActiveForm(null)} variant="outline">
              Close
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DistributorView;