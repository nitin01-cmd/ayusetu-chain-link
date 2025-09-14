import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface FarmerDetailsDialogProps {
  children: React.ReactNode;
}

interface FarmerData {
  id: string;
  name: string;
  contactNumber: string;
  email: string;
  farmLocation: string;
  farmSize: string;
  certificationStatus: string;
  cropTypes: string[];
  joinDate: string;
  totalBatches: number;
  lastDelivery: string;
  complianceScore: number;
  farmCoordinates: string;
  bankAccount: string;
  ifscCode: string;
}

// Sample farmer database
const farmerDatabase: Record<string, FarmerData> = {
  'F001': {
    id: 'F001',
    name: 'Rajesh Kumar Sharma',
    contactNumber: '+91-9876543210',
    email: 'rajesh.sharma@farmer.in',
    farmLocation: 'Village Kishanganj, Uttar Pradesh',
    farmSize: '2.5 acres',
    certificationStatus: 'Organic Certified',
    cropTypes: ['Ashwagandha', 'Brahmi', 'Tulsi'],
    joinDate: '2023-03-15',
    totalBatches: 15,
    lastDelivery: '2024-01-12',
    complianceScore: 95,
    farmCoordinates: '26.8467° N, 80.9462° E',
    bankAccount: 'XXXX-XXXX-4521',
    ifscCode: 'SBIN0001234'
  },
  'F002': {
    id: 'F002',
    name: 'Priya Devi Patel',
    contactNumber: '+91-9123456789',
    email: 'priya.patel@farmer.in',
    farmLocation: 'Village Madhubani, Bihar',
    farmSize: '1.8 acres',
    certificationStatus: 'GAP Certified',
    cropTypes: ['Turmeric', 'Neem', 'Guduchi'],
    joinDate: '2023-07-22',
    totalBatches: 8,
    lastDelivery: '2024-01-10',
    complianceScore: 88,
    farmCoordinates: '26.3577° N, 86.0838° E',
    bankAccount: 'XXXX-XXXX-7890',
    ifscCode: 'HDFC0002567'
  },
  'F003': {
    id: 'F003',
    name: 'Suresh Chandra Singh',
    contactNumber: '+91-9555123456',
    email: 'suresh.singh@farmer.in',
    farmLocation: 'Village Haridwar, Uttarakhand',
    farmSize: '3.2 acres',
    certificationStatus: 'Organic + Fair Trade',
    cropTypes: ['Shatavari', 'Arjuna', 'Bala'],
    joinDate: '2022-11-08',
    totalBatches: 22,
    lastDelivery: '2024-01-14',
    complianceScore: 92,
    farmCoordinates: '29.9457° N, 78.1642° E',
    bankAccount: 'XXXX-XXXX-2468',
    ifscCode: 'ICIC0003456'
  }
};

// Batch to farmer mapping
const batchToFarmerMap: Record<string, string> = {
  'BATCH001': 'F001',
  'BATCH002': 'F002',
  'CE001': 'F001',
  'CE002': 'F002',
  'FP_BATCH_001': 'F001',
  'FP_BATCH_002': 'F002',
  'REC001': 'F003',
  'PROC_BATCH_001': 'F001'
};

const FarmerDetailsDialog = ({ children }: FarmerDetailsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [searchType, setSearchType] = useState<'farmer' | 'batch'>('farmer');
  const [searchValue, setSearchValue] = useState('');
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerData | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const { toast } = useToast();

  const handleSearch = () => {
    setSearchAttempted(true);
    let farmerId = '';

    if (searchType === 'farmer') {
      farmerId = searchValue.toUpperCase();
    } else {
      // Search by batch ID
      farmerId = batchToFarmerMap[searchValue.toUpperCase()] || '';
    }

    const farmer = farmerDatabase[farmerId];

    if (farmer) {
      setSelectedFarmer(farmer);
      toast({
        title: "Farmer Found",
        description: `Retrieved details for ${farmer.name}`,
        variant: "default"
      });
    } else {
      setSelectedFarmer(null);
      toast({
        title: "Not Found",
        description: searchType === 'farmer' 
          ? "No farmer found with this ID" 
          : "No farmer linked to this batch ID",
        variant: "destructive"
      });
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'badge-verified';
    if (score >= 75) return 'badge-pending';
    return 'badge-rejected';
  };

  const getCertificationColor = (status: string) => {
    if (status.includes('Organic')) return 'badge-verified';
    if (status.includes('GAP')) return 'badge-pending';
    return 'badge-rejected';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold gov-heading">Farmer Details Lookup</DialogTitle>
        </DialogHeader>

        {/* Search Section */}
        <Card className="gov-card">
          <div className="gov-card-header">
            <h3 className="text-lg font-semibold">Search Farmer Information</h3>
          </div>
          <div className="space-y-4">
            {/* Search Type Selection */}
            <div>
              <Label className="text-base font-medium">Search By</Label>
              <div className="flex space-x-6 mt-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="searchType"
                    value="farmer"
                    checked={searchType === 'farmer'}
                    onChange={(e) => setSearchType(e.target.value as 'farmer')}
                    className="text-primary"
                  />
                  <span>Farmer ID</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="searchType"
                    value="batch"
                    checked={searchType === 'batch'}
                    onChange={(e) => setSearchType(e.target.value as 'batch')}
                    className="text-primary"
                  />
                  <span>Batch ID</span>
                </label>
              </div>
            </div>

            {/* Search Input */}
            <div className="flex space-x-4">
              <div className="flex-1">
                <Label htmlFor="searchValue">
                  {searchType === 'farmer' ? 'Enter Farmer ID (e.g., F001, F002, F003)' : 'Enter Batch ID (e.g., BATCH001, CE001, FP_BATCH_001)'}
                </Label>
                <Input
                  id="searchValue"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={searchType === 'farmer' ? 'F001' : 'BATCH001'}
                  className="gov-input mt-2"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleSearch} className="btn-government">
                  Search Farmer
                </Button>
              </div>
            </div>

            {/* Sample IDs Helper */}
            <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
              <div className="font-medium mb-2">Sample Data Available:</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <strong>Farmer IDs:</strong> F001, F002, F003
                </div>
                <div>
                  <strong>Batch IDs:</strong> BATCH001, CE001, FP_BATCH_001, REC001
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Farmer Details Display */}
        {searchAttempted && (
          <Card className="gov-card animate-fade-in">
            {selectedFarmer ? (
              <>
                <div className="gov-card-header">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Farmer Profile: {selectedFarmer.name}</h3>
                    <Badge className={getCertificationColor(selectedFarmer.certificationStatus)}>
                      {selectedFarmer.certificationStatus}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h4 className="font-semibold text-base mb-3 text-primary">Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Farmer ID</Label>
                          <div className="font-mono text-sm mt-1">{selectedFarmer.id}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                          <div className="text-sm mt-1">{selectedFarmer.name}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Contact Number</Label>
                          <div className="text-sm mt-1">{selectedFarmer.contactNumber}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                          <div className="text-sm mt-1">{selectedFarmer.email}</div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Farm Location</Label>
                          <div className="text-sm mt-1">{selectedFarmer.farmLocation}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Farm Size</Label>
                          <div className="text-sm mt-1">{selectedFarmer.farmSize}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">GPS Coordinates</Label>
                          <div className="text-sm mt-1 font-mono">{selectedFarmer.farmCoordinates}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Member Since</Label>
                          <div className="text-sm mt-1">{selectedFarmer.joinDate}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Crop Information */}
                  <div>
                    <h4 className="font-semibold text-base mb-3 text-primary">Crop Information</h4>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Cultivated Medicinal Plants</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedFarmer.cropTypes.map((crop, index) => (
                          <Badge key={index} className="badge-pending">
                            {crop}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div>
                    <h4 className="font-semibold text-base mb-3 text-primary">Performance & Compliance</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-muted/30 rounded-lg">
                        <div className="text-2xl font-bold text-primary">{selectedFarmer.totalBatches}</div>
                        <div className="text-sm text-muted-foreground">Total Batches</div>
                      </div>
                      <div className="text-center p-4 bg-muted/30 rounded-lg">
                        <div className="text-2xl font-bold text-primary">{selectedFarmer.complianceScore}%</div>
                        <div className="text-sm text-muted-foreground">Compliance Score</div>
                        <Badge className={getComplianceColor(selectedFarmer.complianceScore)}>
                          {selectedFarmer.complianceScore >= 90 ? 'Excellent' : 
                           selectedFarmer.complianceScore >= 75 ? 'Good' : 'Needs Improvement'}
                        </Badge>
                      </div>
                      <div className="text-center p-4 bg-muted/30 rounded-lg">
                        <div className="text-sm font-medium text-primary">Last Delivery</div>
                        <div className="text-sm text-muted-foreground mt-1">{selectedFarmer.lastDelivery}</div>
                      </div>
                    </div>
                  </div>

                  {/* Financial Information */}
                  <div>
                    <h4 className="font-semibold text-base mb-3 text-primary">Financial Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Bank Account</Label>
                        <div className="text-sm mt-1 font-mono">{selectedFarmer.bankAccount}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">IFSC Code</Label>
                        <div className="text-sm mt-1 font-mono">{selectedFarmer.ifscCode}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-muted-foreground mb-4">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 9l3 3L9 9zm0 0l3 3 3-3M9 9l3 3m0 0l3-3" style={{transform: "translate(2px, 2px)"}} />
                  </svg>
                  <p className="text-lg font-medium">No farmer found</p>
                  <p className="text-sm">
                    {searchType === 'farmer' 
                      ? `No farmer registered with ID "${searchValue}"`
                      : `No farmer linked to batch "${searchValue}"`
                    }
                  </p>
                </div>
              </div>
            )}
          </Card>
        )}

        <div className="flex justify-end space-x-4 mt-6">
          <Button onClick={() => setOpen(false)} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FarmerDetailsDialog;