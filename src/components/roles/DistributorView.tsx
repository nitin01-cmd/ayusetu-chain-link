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
import { Truck, Map, UserCircle, AlertTriangle } from 'lucide-react';

interface DistributorViewProps {
  userId: string;
}

const DistributorView = ({ userId }: DistributorViewProps) => {
  const [activeForm, setActiveForm] = useState<string | null>(null);
  const { batches, loading, updateBatch } = useBatches('distributor', userId);
  const [shipments, setShipments] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    productQR: '',
    shipmentId: '',
    vehicleNumber: '',
    driverName: '',
    driverId: '',
    destination: ''
  });

  const { toast } = useToast();

  // Filter batches for final products ready for dispatch
  const finalProducts = batches.filter(batch => 
    batch.type === 'final_product' && batch.status === 'finalized'
  );

  const handleDispatchProduct = async () => {
    if (!formData.productQR || !formData.shipmentId || !formData.vehicleNumber || !formData.destination) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required dispatch details",
        variant: "destructive"
      });
      return;
    }

    // Find the product to dispatch
    const productToDispatch = finalProducts.find(p => p.id === formData.productQR);
    if (!productToDispatch) {
      toast({
        title: "Product Not Found",
        description: "Could not find product with the specified ID",
        variant: "destructive"
      });
      return;
    }

    // Create new shipment
    const newShipment = {
      id: `SHIP${String(shipments.length + 1).padStart(3, '0')}`,
      batchId: productToDispatch.batch_id,
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

    // Update batch status to dispatched
    try {
      await updateBatch(productToDispatch.id, { 
        status: 'dispatched',
        destination_location: formData.destination 
      });

      setFormData({
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
        description: `Shipment ${newShipment.shipmentId} created for ${productToDispatch.batch_id}`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update batch status",
        variant: "destructive"
      });
    }
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

  const availableProducts = finalProducts.filter(product => product.status === 'finalized');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-emerald-950 tracking-tight">Distributor Hub</h2>
          <p className="text-emerald-700/80 font-medium tracking-wide mt-1">Manage global product dispatch and logistics tracking operations</p>
        </div>
        <div className="flex space-x-4">
          <Badge className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-200 px-4 py-1.5 rounded-xl font-bold uppercase tracking-widest shadow-sm">
            Ready for Dispatch: {batches.filter(b => b.type === 'final_product' && b.status === 'finalized').length}
          </Badge>
          <Badge className="bg-teal-100 hover:bg-teal-200 text-teal-800 border-teal-200 px-4 py-1.5 rounded-xl font-bold uppercase tracking-widest shadow-sm">
            Active Shipments: {batches.filter(b => b.status === 'dispatched').length}
          </Badge>
        </div>
      </div>

      {/* Premium Glass Action Buttons */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        
        <div 
          onClick={() => setActiveForm('dispatch')}
          className="bg-white/80 backdrop-blur-xl border border-emerald-200/60 shadow-lg shadow-emerald-500/5 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-emerald-500 hover:border-emerald-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 flex items-center justify-center text-emerald-600 group-hover:bg-white/20 group-hover:text-white transition-colors">
            <Truck className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-emerald-950 text-xs text-center leading-tight group-hover:text-white transition-colors">Dispatch Product</span>
        </div>

        <div 
          onClick={() => setActiveForm('monitor')}
          className="bg-white/80 backdrop-blur-xl border border-emerald-200/60 shadow-lg shadow-emerald-500/5 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-blue-500 hover:border-blue-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-100/80 flex items-center justify-center text-blue-600 group-hover:bg-white/20 group-hover:text-white transition-colors">
            <Map className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-emerald-950 text-xs text-center leading-tight group-hover:text-white transition-colors">Monitor Transport Fleet</span>
        </div>

        <FarmerDetailsDialog>
          <div className="bg-white/80 backdrop-blur-xl border border-emerald-200/60 shadow-lg shadow-emerald-500/5 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 cursor-pointer h-full hover:bg-purple-500 hover:border-purple-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 group-hover:bg-white/20 group-hover:text-white transition-colors">
              <UserCircle className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-emerald-950 text-xs text-center leading-tight group-hover:text-white transition-colors">Farmer Database</span>
          </div>
        </FarmerDetailsDialog>
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
                  <td className="font-mono">{product.batch_id}</td>
                  <td className="font-mono">{product.current_owner_id}</td>
                  <td className="font-mono text-xs">{product.id}</td>
                  <td>
                    <Badge className={getStatusColor(product.status)}>
                      {product.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td>{product.destination_location || '-'}</td>
                  <td>{new Date(product.created_at).toLocaleString()}</td>
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

      {/* Dialog Modals */}
      <Dialog open={activeForm === 'dispatch'} onOpenChange={(open) => !open && setActiveForm(null)}>
        <DialogContent className="sm:max-w-2xl bg-white/95 backdrop-blur-2xl border border-emerald-200/60 rounded-[2rem] p-0 overflow-y-auto max-h-[90vh] shadow-2xl">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 px-8 py-6 border-b border-emerald-100 sticky top-0 z-10">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-emerald-950 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                  <Truck className="text-emerald-600 w-5 h-5" />
                </div>
                Assign Shipment to Logistics
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <Label htmlFor="productQR" className="text-sm font-bold text-emerald-950 ml-1">Target Product *</Label>
                <select
                  id="productQR"
                  value={formData.productQR}
                  onChange={(e) => setFormData({...formData, productQR: e.target.value})}
                  className="mt-2 w-full px-4 py-3 rounded-xl border border-emerald-200/60 shadow-sm bg-white"
                >
                  <option value="">Select warehoused product</option>
                  {availableProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      [{product.batch_id}] - {product.id}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="shipmentId" className="text-sm font-bold text-emerald-950 ml-1">Fleet Shipment ID</Label>
                <Input id="shipmentId" value={formData.shipmentId} onChange={(e) => setFormData({...formData, shipmentId: e.target.value})} placeholder="e.g. TR-9981" className="mt-2 px-4 py-3 h-auto rounded-xl border border-emerald-200/60 shadow-sm" />
              </div>
              <div>
                <Label htmlFor="vehicleNumber" className="text-sm font-bold text-emerald-950 ml-1">Vehicle License</Label>
                <Input id="vehicleNumber" value={formData.vehicleNumber} onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value})} placeholder="e.g. KA-01-XY-1234" className="mt-2 px-4 py-3 h-auto rounded-xl border border-emerald-200/60 shadow-sm" />
              </div>
              <div>
                <Label htmlFor="driverName" className="text-sm font-bold text-emerald-950 ml-1">Pilot/Driver Name</Label>
                <Input id="driverName" value={formData.driverName} onChange={(e) => setFormData({...formData, driverName: e.target.value})} placeholder="Driver fullname" className="mt-2 px-4 py-3 h-auto rounded-xl border border-emerald-200/60 shadow-sm" />
              </div>
              <div>
                <Label htmlFor="driverId" className="text-sm font-bold text-emerald-950 ml-1">Driver License ID</Label>
                <Input id="driverId" value={formData.driverId} onChange={(e) => setFormData({...formData, driverId: e.target.value})} placeholder="DL Number" className="mt-2 px-4 py-3 h-auto rounded-xl border border-emerald-200/60 shadow-sm" />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="destination" className="text-sm font-bold text-emerald-950 ml-1">Global Destination Node</Label>
                <Input id="destination" value={formData.destination} onChange={(e) => setFormData({...formData, destination: e.target.value})} placeholder="Enter delivery hub or retailer address" className="mt-2 px-4 py-3 h-auto rounded-xl border border-emerald-200/60 shadow-sm" />
              </div>
            </div>
            <div className="mt-8">
              <Button onClick={handleDispatchProduct} className="w-full py-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20 text-lg">
                Authorize Gateway & Dispatch
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeForm === 'monitor'} onOpenChange={(open) => !open && setActiveForm(null)}>
        <DialogContent className="sm:max-w-4xl bg-white/95 backdrop-blur-2xl border border-emerald-200/60 rounded-[2rem] p-0 overflow-hidden shadow-2xl max-h-[85vh] flex flex-col">
          <div className="bg-slate-950 px-8 py-6 sticky top-0 z-10 flex-shrink-0">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 shadow-inner flex items-center justify-center shrink-0 border border-slate-700">
                  <Map className="text-sky-400 w-5 h-5" />
                </div>
                Live Orbital Fleet Tracker
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-8 overflow-y-auto bg-slate-50 flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shipments.filter(s => s.status === 'in_transit').map((shipment) => (
                <div key={shipment.id} className="p-6 border border-slate-200 rounded-3xl bg-white shadow-sm hover:shadow-xl hover:border-sky-200 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-bl-full -z-10 group-hover:bg-sky-100 transition-colors"></div>
                  <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Shipment Manifest</span>
                      <h4 className="font-black text-slate-800 text-lg">{shipment.shipmentId}</h4>
                    </div>
                    <Badge className="bg-sky-100 text-sky-800 border-sky-200 px-3 py-1 shadow-inner animate-pulse">
                      In Transit
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-medium">Vehicle / Pilot</span>
                      <span className="font-bold text-slate-900">{shipment.vehicleNumber} | {shipment.driverName}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm bg-slate-50 p-2 rounded-lg">
                      <span className="text-slate-500 font-medium">Vector</span>
                      <span className="font-bold text-sky-700 max-w-[150px] truncate">{shipment.destination}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs mt-4 pt-2 border-t border-slate-100">
                      <span className="text-slate-400 flex items-center gap-1"><Map className="w-3 h-3" /> GPS Lock</span>
                      <span className="font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded">{shipment.gpsLocation}</span>
                    </div>
                  </div>
                </div>
              ))}
              {shipments.filter(s => s.status === 'in_transit').length === 0 && (
                <div className="col-span-full h-48 flex flex-col items-center justify-center text-slate-400 gap-4 bg-white rounded-3xl border border-slate-200 border-dashed">
                  <Map className="w-12 h-12 text-slate-300 opacity-50" />
                  <span className="font-semibold tracking-wide">ZERO ACTIVE VECTORS</span>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DistributorView;