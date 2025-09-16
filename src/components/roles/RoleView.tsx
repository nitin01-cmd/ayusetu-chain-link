import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useBatches, Batch } from '@/hooks/useBatches';
import FarmerDetailsDialog from '../FarmerDetailsDialog';

interface RoleViewProps {
  userRole: string;
  userId: string;
}

const RoleView: React.FC<RoleViewProps> = ({ userRole, userId }) => {
  const { batches, loading, error, updateBatchStatus, transferBatch, createLot, processLot, formulateProduct, recallBatch } = useBatches(userRole, userId);
  const { toast } = useToast();
  
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [actionDialogOpen, setActionDialogOpen] = useState<string | null>(null);
  const [actionForm, setActionForm] = useState<any>({});

  const handleBatchAction = async (action: string) => {
    try {
      switch (action) {
        case 'createLot':
          await createLot(
            actionForm.lotId,
            selectedBatches,
            actionForm.productName,
            parseFloat(actionForm.quantity),
            actionForm.unit
          );
          break;
        case 'processLot':
          await processLot(
            actionForm.processedBatchId,
            actionForm.parentLotId,
            actionForm.processType,
            parseFloat(actionForm.outputQuantity),
            actionForm.outputUnit
          );
          break;
        case 'formulateProduct':
          await formulateProduct(
            actionForm.finalProductId,
            selectedBatches,
            actionForm.productName,
            parseFloat(actionForm.finalQuantity),
            actionForm.finalUnit
          );
          break;
        case 'transfer':
          await transferBatch(actionForm.batchId, actionForm.newOwnerId, actionForm.destination);
          break;
        case 'recall':
          await recallBatch(actionForm.batchId, actionForm.reason);
          break;
      }

      toast({
        title: "Success",
        description: `${action} completed successfully`,
      });
      
      setActionDialogOpen(null);
      setActionForm({});
      setSelectedBatches([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created': return 'default';
      case 'in_transit': return 'secondary';
      case 'received': return 'outline';
      case 'processing': return 'secondary';
      case 'processed': return 'outline';
      case 'consolidated': return 'secondary';
      case 'finalized': return 'default';
      case 'dispatched': return 'secondary';
      case 'recalled': return 'destructive';
      default: return 'default';
    }
  };

  const getRoleTitle = (role: string) => {
    switch (role) {
      case 'aggregator': return 'Aggregator Dashboard';
      case 'processor': return 'Processor Dashboard';
      case 'manufacturer': return 'Manufacturer Dashboard';
      case 'distributor': return 'Distributor Dashboard';
      default: return 'Dashboard';
    }
  };

  const renderActionButtons = () => {
    const actions = [];
    
    switch (userRole) {
      case 'aggregator':
        actions.push(
          <Button 
            key="createLot"
            onClick={() => setActionDialogOpen('createLot')}
            disabled={selectedBatches.length < 2}
            className="mb-2"
          >
            Create Lot ({selectedBatches.length} selected)
          </Button>
        );
        break;
      case 'processor':
        actions.push(
          <Button 
            key="processLot"
            onClick={() => setActionDialogOpen('processLot')}
            className="mb-2"
          >
            Process Lot
          </Button>
        );
        break;
      case 'manufacturer':
        actions.push(
          <Button 
            key="formulateProduct"
            onClick={() => setActionDialogOpen('formulateProduct')}
            disabled={selectedBatches.length === 0}
            className="mb-2"
          >
            Formulate Product ({selectedBatches.length} selected)
          </Button>
        );
        break;
    }

    actions.push(
      <Button 
        key="transfer"
        onClick={() => setActionDialogOpen('transfer')}
        variant="outline"
        className="mb-2 ml-2"
      >
        Transfer Batch
      </Button>,
      <Button 
        key="recall"
        onClick={() => setActionDialogOpen('recall')}
        variant="destructive"
        className="mb-2 ml-2"
      >
        Recall Batch
      </Button>
    );

    return actions;
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Loading batches...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        <p>Error: {error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{getRoleTitle(userRole)}</h2>
          <p className="text-muted-foreground">Real-time traceability dashboard</p>
        </div>
        <Badge variant="outline">{batches.length} batches</Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        {renderActionButtons()}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {batches.map((batch: Batch) => (
          <Card 
            key={batch.id} 
            className={`cursor-pointer transition-all ${
              selectedBatches.includes(batch.batch_id) ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => {
              if (selectedBatches.includes(batch.batch_id)) {
                setSelectedBatches(prev => prev.filter(id => id !== batch.batch_id));
              } else {
                setSelectedBatches(prev => [...prev, batch.batch_id]);
              }
            }}
          >
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">{batch.batch_id}</CardTitle>
                <Badge variant={getStatusColor(batch.status)}>{batch.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Product:</strong> {batch.product_name}</p>
                <p><strong>Type:</strong> {batch.type.replace('_', ' ')}</p>
                {batch.quantity && <p><strong>Quantity:</strong> {batch.quantity} {batch.unit}</p>}
                {batch.farmer_name && <p><strong>Farmer:</strong> {batch.farmer_name}</p>}
                {batch.source_location && <p><strong>Location:</strong> {batch.source_location}</p>}
                
                <div className="flex gap-2 mt-4">
                  <FarmerDetailsDialog farmerId={batch.farmer_id} batchId={batch.batch_id} />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateBatchStatus(batch.batch_id, 'received');
                    }}
                  >
                    Mark Received
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Lot Dialog */}
      <Dialog open={actionDialogOpen === 'createLot'} onOpenChange={() => setActionDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Lot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="lotId">Lot ID</Label>
              <Input
                id="lotId"
                value={actionForm.lotId || ''}
                onChange={(e) => setActionForm({...actionForm, lotId: e.target.value})}
                placeholder="LOT001"
              />
            </div>
            <div>
              <Label htmlFor="productName">Product Name</Label>
              <Input
                id="productName"
                value={actionForm.productName || ''}
                onChange={(e) => setActionForm({...actionForm, productName: e.target.value})}
                placeholder="Mixed Grain Lot"
              />
            </div>
            <div>
              <Label htmlFor="quantity">Total Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={actionForm.quantity || ''}
                onChange={(e) => setActionForm({...actionForm, quantity: e.target.value})}
                placeholder="1000"
              />
            </div>
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Select value={actionForm.unit || ''} onValueChange={(value) => setActionForm({...actionForm, unit: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="tons">tons</SelectItem>
                  <SelectItem value="bags">bags</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              Selected batches: {selectedBatches.join(', ')}
            </div>
            <Button onClick={() => handleBatchAction('createLot')} className="w-full">
              Create Lot
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Process Lot Dialog */}
      <Dialog open={actionDialogOpen === 'processLot'} onOpenChange={() => setActionDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Lot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="processedBatchId">New Processed Batch ID</Label>
              <Input
                id="processedBatchId"
                value={actionForm.processedBatchId || ''}
                onChange={(e) => setActionForm({...actionForm, processedBatchId: e.target.value})}
                placeholder="PROC001"
              />
            </div>
            <div>
              <Label htmlFor="parentLotId">Parent Lot ID</Label>
              <Input
                id="parentLotId"
                value={actionForm.parentLotId || ''}
                onChange={(e) => setActionForm({...actionForm, parentLotId: e.target.value})}
                placeholder="LOT001"
              />
            </div>
            <div>
              <Label htmlFor="processType">Process Type</Label>
              <Input
                id="processType"
                value={actionForm.processType || ''}
                onChange={(e) => setActionForm({...actionForm, processType: e.target.value})}
                placeholder="Cleaning, Sorting, etc."
              />
            </div>
            <div>
              <Label htmlFor="outputQuantity">Output Quantity</Label>
              <Input
                id="outputQuantity"
                type="number"
                value={actionForm.outputQuantity || ''}
                onChange={(e) => setActionForm({...actionForm, outputQuantity: e.target.value})}
                placeholder="800"
              />
            </div>
            <div>
              <Label htmlFor="outputUnit">Output Unit</Label>
              <Select value={actionForm.outputUnit || ''} onValueChange={(value) => setActionForm({...actionForm, outputUnit: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="tons">tons</SelectItem>
                  <SelectItem value="bags">bags</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => handleBatchAction('processLot')} className="w-full">
              Process Lot
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={actionDialogOpen === 'transfer'} onOpenChange={() => setActionDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Batch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="transferBatchId">Batch ID</Label>
              <Input
                id="transferBatchId"
                value={actionForm.batchId || ''}
                onChange={(e) => setActionForm({...actionForm, batchId: e.target.value})}
                placeholder="Enter batch ID to transfer"
              />
            </div>
            <div>
              <Label htmlFor="newOwnerId">New Owner ID</Label>
              <Input
                id="newOwnerId"
                value={actionForm.newOwnerId || ''}
                onChange={(e) => setActionForm({...actionForm, newOwnerId: e.target.value})}
                placeholder="UUID of new owner"
              />
            </div>
            <div>
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                value={actionForm.destination || ''}
                onChange={(e) => setActionForm({...actionForm, destination: e.target.value})}
                placeholder="Destination location"
              />
            </div>
            <Button onClick={() => handleBatchAction('transfer')} className="w-full">
              Transfer Batch
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recall Dialog */}
      <Dialog open={actionDialogOpen === 'recall'} onOpenChange={() => setActionDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recall Batch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="recallBatchId">Batch ID</Label>
              <Input
                id="recallBatchId"
                value={actionForm.batchId || ''}
                onChange={(e) => setActionForm({...actionForm, batchId: e.target.value})}
                placeholder="Enter batch ID to recall"
              />
            </div>
            <div>
              <Label htmlFor="reason">Recall Reason</Label>
              <Textarea
                id="reason"
                value={actionForm.reason || ''}
                onChange={(e) => setActionForm({...actionForm, reason: e.target.value})}
                placeholder="Describe the reason for recall"
              />
            </div>
            <Button 
              onClick={() => handleBatchAction('recall')} 
              className="w-full"
              variant="destructive"
            >
              Initiate Recall
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoleView;