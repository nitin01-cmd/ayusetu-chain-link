import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface ManufacturerViewProps {
  userId: string;
}

const ManufacturerView = ({ userId }: ManufacturerViewProps) => {
  const [activeForm, setActiveForm] = useState<string | null>(null);
  const [processedBatches, setProcessedBatches] = useState([
    {
      id: 'BATCH001',
      processorId: 'PROC001',
      weight: '45.2',
      status: 'available',
      timestamp: '2024-01-15 18:30:00',
      operation: 'drying'
    },
    {
      id: 'BATCH002',
      processorId: 'PROC001',
      weight: '38.7',
      status: 'used',
      timestamp: '2024-01-15 19:15:00',
      operation: 'extraction'
    }
  ]);

  const [finalProducts, setFinalProducts] = useState([
    {
      id: 'FP001',
      batchId: 'FP_BATCH_001',
      inputBatches: ['BATCH001', 'BATCH002'],
      qcResults: 'Pass',
      qrCode: 'QR_FP001_ABC123',
      status: 'ready',
      timestamp: '2024-01-15 20:00:00',
      isRecalled: false
    }
  ]);

  const [formData, setFormData] = useState({
    selectedBatches: [] as string[],
    batchPercentages: {} as Record<string, string>,
    qcResults: '',
    recallBatchId: '',
    recallReason: ''
  });

  const { toast } = useToast();

  const handleCreateFinalProduct = () => {
    if (formData.selectedBatches.length === 0 || !formData.qcResults) {
      toast({
        title: "Missing Information",
        description: "Please select input batches and enter QC results",
        variant: "destructive"
      });
      return;
    }

    const newProduct = {
      id: `FP${String(finalProducts.length + 1).padStart(3, '0')}`,
      batchId: `FP_BATCH_${String(finalProducts.length + 1).padStart(3, '0')}`,
      inputBatches: [...formData.selectedBatches],
      qcResults: formData.qcResults,
      qrCode: `QR_FP${String(finalProducts.length + 1).padStart(3, '0')}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      status: 'ready',
      timestamp: new Date().toLocaleString('en-IN'),
      isRecalled: false
    };

    setFinalProducts([...finalProducts, newProduct]);
    
    // Mark used batches
    const updatedBatches = processedBatches.map(batch => 
      formData.selectedBatches.includes(batch.id) 
        ? { ...batch, status: 'used' }
        : batch
    );
    setProcessedBatches(updatedBatches);

    setFormData({ 
      ...formData, 
      selectedBatches: [], 
      batchPercentages: {}, 
      qcResults: '' 
    });
    setActiveForm(null);

    toast({
      title: "Final Product Created",
      description: `Created ${newProduct.batchId} with QR code ${newProduct.qrCode}`,
      variant: "default"
    });
  };

  const handleInitiateRecall = () => {
    if (!formData.recallBatchId || !formData.recallReason) {
      toast({
        title: "Missing Information",
        description: "Please select batch ID and provide recall reason",
        variant: "destructive"
      });
      return;
    }

    const updatedProducts = finalProducts.map(product =>
      product.batchId === formData.recallBatchId
        ? { ...product, isRecalled: true, status: 'recalled' }
        : product
    );
    setFinalProducts(updatedProducts);

    setFormData({ ...formData, recallBatchId: '', recallReason: '' });
    setActiveForm(null);

    toast({
      title: "Recall Initiated",
      description: `Batch ${formData.recallBatchId} has been marked for recall`,
      variant: "destructive"
    });
  };

  const handleBatchSelection = (batchId: string) => {
    if (formData.selectedBatches.includes(batchId)) {
      setFormData({
        ...formData,
        selectedBatches: formData.selectedBatches.filter(id => id !== batchId)
      });
    } else {
      setFormData({
        ...formData,
        selectedBatches: [...formData.selectedBatches, batchId]
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'badge-verified';
      case 'used': return 'badge-pending';
      case 'ready': return 'badge-verified';
      case 'recalled': return 'badge-rejected';
      default: return 'badge-pending';
    }
  };

  const availableBatches = processedBatches.filter(batch => batch.status === 'available');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gov-heading">Manufacturer Dashboard</h2>
          <p className="text-muted-foreground">Create final products and manage quality control</p>
        </div>
        <div className="flex space-x-4">
          <Badge className="badge-verified">
            Available Batches: {availableBatches.length}
          </Badge>
          <Badge className="badge-pending">
            Final Products: {finalProducts.length}
          </Badge>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button 
          onClick={() => setActiveForm('createProduct')}
          className="btn-government h-auto p-6 flex flex-col items-center space-y-2"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
          <span>Create Final Product</span>
        </Button>

        <Button 
          onClick={() => setActiveForm('generateQR')}
          className="btn-secondary h-auto p-6 flex flex-col items-center space-y-2"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 01-3 0m3 0H8.25m11.25 0H16.5m3.75 0v11.25a2.25 2.25 0 01-2.25 2.25H6.75a2.25 2.25 0 01-2.25-2.25V8.25" />
          </svg>
          <span>View QR Codes</span>
        </Button>

        <Button 
          onClick={() => setActiveForm('recall')}
          className="btn-accent h-auto p-6 flex flex-col items-center space-y-2"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.118 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span>Initiate Recall</span>
        </Button>
      </div>

      {/* Processed Batches Table */}
      <Card className="gov-card">
        <div className="gov-card-header">
          <h3 className="text-lg font-semibold">Processed Batches</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Batch ID</th>
                <th>Processor ID</th>
                <th>Weight (kg)</th>
                <th>Operation</th>
                <th>Status</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {processedBatches.map((batch) => (
                <tr key={batch.id} className="animate-fade-in">
                  <td className="font-mono">{batch.id}</td>
                  <td className="font-mono">{batch.processorId}</td>
                  <td>{batch.weight}</td>
                  <td className="capitalize">{batch.operation}</td>
                  <td>
                    <Badge className={getStatusColor(batch.status)}>
                      {batch.status}
                    </Badge>
                  </td>
                  <td>{batch.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

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
                <th>Input Batches</th>
                <th>QC Results</th>
                <th>QR Code</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {finalProducts.map((product) => (
                <tr key={product.id} className="animate-fade-in">
                  <td className="font-mono">{product.id}</td>
                  <td className="font-mono">{product.batchId}</td>
                  <td className="font-mono text-xs">{product.inputBatches.join(', ')}</td>
                  <td>{product.qcResults}</td>
                  <td className="font-mono text-xs">{product.qrCode}</td>
                  <td>
                    <Badge className={getStatusColor(product.status)}>
                      {product.isRecalled ? 'RECALLED' : product.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Forms */}
      {activeForm === 'createProduct' && (
        <Card className="gov-card animate-fade-in">
          <div className="gov-card-header">
            <h3 className="text-lg font-semibold">Create Final Product Batch</h3>
          </div>
          <div className="space-y-6">
            <div>
              <Label>Select Input Batches</Label>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                {availableBatches.map((batch) => (
                  <div key={batch.id} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id={batch.id}
                      checked={formData.selectedBatches.includes(batch.id)}
                      onChange={() => handleBatchSelection(batch.id)}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor={batch.id} className="flex-1 text-sm">
                      {batch.id} - {batch.weight}kg ({batch.operation})
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <Label htmlFor="qcResults">QC Results</Label>
              <select
                id="qcResults"
                value={formData.qcResults}
                onChange={(e) => setFormData({...formData, qcResults: e.target.value})}
                className="gov-select mt-2"
              >
                <option value="">Select QC result</option>
                <option value="Pass">Pass</option>
                <option value="Pass with conditions">Pass with conditions</option>
                <option value="Fail">Fail</option>
              </select>
            </div>
          </div>
          <div className="flex space-x-4 mt-6">
            <Button onClick={handleCreateFinalProduct} className="btn-government">
              Create Final Product
            </Button>
            <Button onClick={() => setActiveForm(null)} variant="outline">
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {activeForm === 'generateQR' && (
        <Card className="gov-card animate-fade-in">
          <div className="gov-card-header">
            <h3 className="text-lg font-semibold">Generated QR Codes</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {finalProducts.map((product) => (
              <div key={product.id} className="p-4 border rounded-lg">
                <div className="font-mono text-sm mb-2">{product.batchId}</div>
                <div className="bg-gray-100 p-4 rounded text-center font-mono text-xs">
                  {product.qrCode}
                </div>
                <Badge className={`mt-2 ${getStatusColor(product.status)}`}>
                  {product.isRecalled ? 'RECALLED' : product.status}
                </Badge>
              </div>
            ))}
          </div>
          <div className="flex space-x-4 mt-6">
            <Button onClick={() => setActiveForm(null)} variant="outline">
              Close
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
              <Label htmlFor="recallBatchId">Final Product Batch ID</Label>
              <select
                id="recallBatchId"
                value={formData.recallBatchId}
                onChange={(e) => setFormData({...formData, recallBatchId: e.target.value})}
                className="gov-select mt-2"
              >
                <option value="">Select batch to recall</option>
                {finalProducts.filter(p => !p.isRecalled).map((product) => (
                  <option key={product.batchId} value={product.batchId}>
                    {product.batchId} - {product.qrCode}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="recallReason">Recall Reason</Label>
              <Input
                id="recallReason"
                value={formData.recallReason}
                onChange={(e) => setFormData({...formData, recallReason: e.target.value})}
                placeholder="Enter reason for recall"
                className="gov-input mt-2"
              />
            </div>
          </div>
          <div className="flex space-x-4 mt-6">
            <Button onClick={handleInitiateRecall} className="btn-accent">
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

export default ManufacturerView;