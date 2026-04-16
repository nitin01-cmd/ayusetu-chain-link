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
import { PackagePlus, QrCode, UserCircle, AlertTriangle } from 'lucide-react';

interface ManufacturerViewProps {
  userId: string;
}

const ManufacturerView = ({ userId }: ManufacturerViewProps) => {
  const [activeForm, setActiveForm] = useState<string | null>(null);
  const { batches, loading, createBatch, updateBatch } = useBatches('manufacturer', userId);

  const [formData, setFormData] = useState({
    selectedBatches: [] as string[],
    batchPercentages: {} as Record<string, string>,
    qcResults: '',
    recallBatchId: '',
    recallReason: ''
  });

  const { toast } = useToast();

  const handleCreateFinalProduct = async () => {
    if (formData.selectedBatches.length === 0 || !formData.qcResults) {
      toast({
        title: "Missing Information",
        description: "Please select input batches and enter QC results",
        variant: "destructive"
      });
      return;
    }

    try {
      await createBatch({
        batch_id: `FP${Date.now().toString().slice(-6)}`,
        type: 'final_product',
        status: 'finalized',
        quantity: formData.selectedBatches.reduce((total, batchId) => {
          const batch = batches.find(b => b.batch_id === batchId);
          return total + (batch?.quantity || 0);
        }, 0),
        product_name: 'Final Product',
        metadata: {
          inputBatches: [...formData.selectedBatches],
          qcResults: formData.qcResults,
          qrCode: `QR_FP${Date.now().toString().slice(-6)}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          batchPercentages: formData.batchPercentages
        }
      });

      // Mark used batches
      for (const batchId of formData.selectedBatches) {
        const batch = batches.find(b => b.batch_id === batchId);
        if (batch) {
          await updateBatch(batch.id, { status: 'finalized' });
        }
      }

      setFormData({ 
        ...formData, 
        selectedBatches: [], 
        batchPercentages: {}, 
        qcResults: '' 
      });
      setActiveForm(null);
    } catch (error) {
      console.error('Error creating final product:', error);
    }
  };

  const handleInitiateRecall = async () => {
    if (!formData.recallBatchId || !formData.recallReason) {
      toast({
        title: "Missing Information",
        description: "Please select batch ID and provide recall reason",
        variant: "destructive"
      });
      return;
    }

    try {
      const batchToRecall = batches.find(b => b.batch_id === formData.recallBatchId);
      if (batchToRecall) {
        await updateBatch(batchToRecall.id, { 
          status: 'recalled',
          metadata: {
            ...batchToRecall.metadata,
            recallReason: formData.recallReason,
            recallTimestamp: new Date().toISOString()
          }
        });
      }

      setFormData({ ...formData, recallBatchId: '', recallReason: '' });
      setActiveForm(null);
    } catch (error) {
      console.error('Error initiating recall:', error);
    }
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

  const availableBatches = batches.filter(b => b.type === 'processed' && b.status !== 'finalized');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-emerald-950 tracking-tight">Manufacturer Hub</h2>
          <p className="text-emerald-700/80 font-medium tracking-wide mt-1">Create final products, generate QRs, and manage quality control</p>
        </div>
        <div className="flex space-x-4">
          <Badge className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-200 px-4 py-1.5 rounded-xl font-bold uppercase tracking-widest shadow-sm">
            Available: {batches.filter(b => b.type === 'processed' && b.status !== 'finalized').length}
          </Badge>
          <Badge className="bg-teal-100 hover:bg-teal-200 text-teal-800 border-teal-200 px-4 py-1.5 rounded-xl font-bold uppercase tracking-widest shadow-sm">
            Final Products: {batches.filter(b => b.type === 'final_product').length}
          </Badge>
        </div>
      </div>

      {/* Premium Glass Action Buttons */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        
        <div 
          onClick={() => setActiveForm('createProduct')}
          className="bg-white/80 backdrop-blur-xl border border-emerald-200/60 shadow-lg shadow-emerald-500/5 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-emerald-500 hover:border-emerald-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 flex items-center justify-center text-emerald-600 group-hover:bg-white/20 group-hover:text-white transition-colors">
            <PackagePlus className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-emerald-950 text-xs text-center leading-tight group-hover:text-white transition-colors">Create Final Product</span>
        </div>

        <div 
          onClick={() => setActiveForm('generateQR')}
          className="bg-white/80 backdrop-blur-xl border border-emerald-200/60 shadow-lg shadow-emerald-500/5 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-slate-800 hover:border-slate-800 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-800/20 transition-all duration-300 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-white/20 group-hover:text-white transition-colors">
            <QrCode className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-emerald-950 text-xs text-center leading-tight group-hover:text-white transition-colors">View QR Codes</span>
        </div>

        <FarmerDetailsDialog>
          <div className="bg-white/80 backdrop-blur-xl border border-emerald-200/60 shadow-lg shadow-emerald-500/5 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 cursor-pointer h-full hover:bg-blue-500 hover:border-blue-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-white/20 group-hover:text-white transition-colors">
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
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-4">Loading...</td>
                </tr>
              ) : batches.filter(b => b.type === 'processed').length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4">No processed batches available</td>
                </tr>
              ) : (
                batches.filter(b => b.type === 'processed').map((batch) => (
                  <tr key={batch.id} className="animate-fade-in">
                    <td className="font-mono">{batch.batch_id}</td>
                    <td className="font-mono">{batch.current_owner_id}</td>
                    <td>{batch.quantity}</td>
                    <td className="capitalize">{batch.metadata?.operation || '-'}</td>
                    <td>
                      <Badge className={getStatusColor(batch.status)}>
                        {batch.status}
                      </Badge>
                    </td>
                    <td>{new Date(batch.created_at).toLocaleString('en-IN')}</td>
                  </tr>
                ))
              )}
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
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-4">Loading...</td>
                </tr>
              ) : batches.filter(b => b.type === 'final_product').length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4">No final products yet</td>
                </tr>
              ) : (
                batches.filter(b => b.type === 'final_product').map((batch) => (
                  <tr key={batch.id} className="animate-fade-in">
                    <td className="font-mono">{batch.batch_id}</td>
                    <td className="font-mono">{batch.batch_id}</td>
                    <td className="font-mono text-xs">{batch.metadata?.inputBatches?.join(', ') || '-'}</td>
                    <td>{batch.metadata?.qcResults || '-'}</td>
                    <td className="font-mono text-xs">{batch.metadata?.qrCode || '-'}</td>
                    <td>
                      <Badge className={getStatusColor(batch.status)}>
                        {batch.status === 'recalled' ? 'RECALLED' : batch.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Dialog Modals */}
      <Dialog open={activeForm === 'createProduct'} onOpenChange={(open) => !open && setActiveForm(null)}>
        <DialogContent className="sm:max-w-xl bg-white/95 backdrop-blur-2xl border border-emerald-200/60 rounded-[2rem] p-0 overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 px-8 py-6 border-b border-emerald-100">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-emerald-950 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                  <PackagePlus className="text-emerald-600 w-5 h-5" />
                </div>
                Create Final Product
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-8">
            <div className="space-y-6">
              <div>
                <Label className="text-sm font-bold text-emerald-950">Select Input Processing Batches</Label>
                <div className="mt-3 space-y-2 max-h-40 overflow-y-auto p-2 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  {batches.filter(b => b.type === 'processed' && b.status !== 'finalized').map((batch) => (
                    <div key={batch.id} className="flex items-center space-x-3 p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-emerald-200/60">
                      <input
                        type="checkbox"
                        id={batch.batch_id}
                        checked={formData.selectedBatches.includes(batch.batch_id)}
                        onChange={() => handleBatchSelection(batch.batch_id)}
                        className="rounded border-gray-300 accent-emerald-600 w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor={batch.batch_id} className="flex-1 text-sm font-medium cursor-pointer text-emerald-900">
                        {batch.batch_id} - {batch.quantity}kg ({batch.metadata?.operation})
                      </label>
                    </div>
                  ))}
                  {batches.filter(b => b.type === 'processed' && b.status !== 'finalized').length === 0 && (
                    <p className="text-sm text-center text-emerald-600/60 py-4 font-medium">No active processing batches found</p>
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="qcResults" className="text-sm font-bold text-emerald-950">Confirm QC Results</Label>
                <select
                  id="qcResults"
                  value={formData.qcResults}
                  onChange={(e) => setFormData({...formData, qcResults: e.target.value})}
                  className="mt-2 w-full px-4 py-3 h-auto rounded-xl border border-emerald-200/60 shadow-sm bg-white font-medium"
                >
                  <option value="">Select an outcome</option>
                  <option value="Pass">Pass - Ready for Distribution</option>
                  <option value="Pass with conditions">Pass with conditions</option>
                  <option value="Fail">Fail Quality Check</option>
                </select>
              </div>

              <Button onClick={handleCreateFinalProduct} className="w-full py-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20 mt-4">
                Finalize Product Chain & Generate Master QR
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeForm === 'generateQR'} onOpenChange={(open) => !open && setActiveForm(null)}>
        <DialogContent className="sm:max-w-2xl bg-white/95 backdrop-blur-2xl border border-emerald-200/60 rounded-[2rem] p-0 overflow-hidden shadow-2xl max-h-[85vh] overflow-y-auto">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 px-8 py-6 border-b border-indigo-100 sticky top-0 z-10">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-indigo-950 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                  <QrCode className="text-indigo-600 w-5 h-5" />
                </div>
                Master Product QR Database
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {batches.filter(b => b.type === 'final_product').map((batch) => (
                <div key={batch.id} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-indigo-300 transition-colors group">
                  <div className="font-bold text-slate-800 text-sm mb-3">Product: {batch.batch_id}</div>
                  <div className="bg-slate-50 p-4 rounded-xl text-center font-mono text-xs border border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 group-hover:bg-indigo-50 transition-colors">
                    <QrCode className="w-12 h-12 text-slate-400 group-hover:text-indigo-500" />
                    <span className="text-slate-600 font-bold break-all">{batch.metadata?.qrCode || 'GENERATING_QR...'}</span>
                  </div>
                  <Badge className={`mt-4 w-full justify-center ${getStatusColor(batch.status)}`}>
                    {batch.status === 'recalled' ? 'RECALLED' : batch.status}
                  </Badge>
                </div>
              ))}
              {batches.filter(b => b.type === 'final_product').length === 0 && (
                <p className="col-span-full h-32 flex items-center justify-center text-sm font-medium text-slate-400">No Final Products Generated</p>
              )}
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
                <Label htmlFor="recallBatchId" className="text-red-950 font-bold ml-1">Final Product Batch *</Label>
                <select id="recallBatchId" value={formData.recallBatchId} onChange={(e) => setFormData({...formData, recallBatchId: e.target.value})} className="mt-1.5 w-full px-4 py-3 rounded-xl border border-red-200/60 shadow-sm bg-white focus:ring-red-500" required>
                   <option value="">Select compromised product batch...</option>
                   {batches.filter(b => b.type === 'final_product' && b.status !== 'recalled').map((batch) => (
                     <option key={batch.id} value={batch.batch_id}>{batch.batch_id} - {batch.metadata?.qrCode}</option>
                   ))}
                </select>
              </div>
              <div>
                <Label htmlFor="recallReason" className="text-red-950 font-bold ml-1">Recall Reason *</Label>
                <textarea
                  id="recallReason"
                  value={formData.recallReason}
                  onChange={(e) => setFormData({...formData, recallReason: e.target.value})}
                  placeholder="Describe the reason for public recall..."
                  className="mt-1.5 w-full px-4 py-3 rounded-xl border border-red-200/60 shadow-sm bg-white min-h-[120px] resize-none focus:ring-red-500"
                  required
                />
              </div>
              <Button onClick={handleInitiateRecall} className="w-full py-6 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-600/20 mt-4">
                Execute Irreversible Recall
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManufacturerView;