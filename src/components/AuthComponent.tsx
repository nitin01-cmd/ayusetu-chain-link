import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import ayusetuEmblem from '@/assets/ayusetu-emblem.png';

interface AuthComponentProps {
  onLogin: (role: string, userId: string) => void;
}

const AuthComponent = ({ onLogin }: AuthComponentProps) => {
  const [authToken, setAuthToken] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Demo OTPs for different roles
  const demoCredentials = {
    'aggregator': { otp: '123456', userId: 'AGG001', name: 'Maharashtra Aggregation Center' },
    'processor': { otp: '234567', userId: 'PROC001', name: 'Kerala Processing Unit' },
    'manufacturer': { otp: '345678', userId: 'MFG001', name: 'Gujarat Formulation Facility' },
    'distributor': { otp: '456789', userId: 'DIST001', name: 'Delhi Distribution Hub' }
  };

  const handleLogin = async () => {
    if (!selectedRole || !authToken) {
      toast({
        title: "Missing Information",
        description: "Please select a role and enter the OTP",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    // Simulate authentication delay
    setTimeout(() => {
      const credentials = demoCredentials[selectedRole as keyof typeof demoCredentials];
      
      if (authToken === credentials?.otp || authToken === '__initial_auth_token') {
        toast({
          title: "Authentication Successful",
          description: `Welcome to ${credentials?.name}`,
          variant: "default"
        });
        onLogin(selectedRole, credentials?.userId || 'DEMO_USER');
      } else {
        toast({
          title: "Authentication Failed",
          description: "Invalid OTP. Please check demo credentials below.",
          variant: "destructive"
        });
      }
      setIsLoading(false);
    }, 1500);
  };

  const simulateDocuments = [
    { name: 'Ayurveda_Traceability_Guidelines_2024.pdf', size: '2.4 MB' },
    { name: 'Ministry_AYUSH_Compliance_Manual.pdf', size: '1.8 MB' },
    { name: 'Supply_Chain_Standards.pdf', size: '3.1 MB' },
    { name: 'Quality_Assurance_Protocols.pdf', size: '2.7 MB' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <Card className="w-full max-w-md gov-card">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4">
            <img 
              src={ayusetuEmblem} 
              alt="AyuSetu Government Emblem" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold gov-heading text-primary">AyuSetu</h1>
          <p className="text-muted-foreground gov-subheading">The Link Between Nature and Nurture</p>
          <p className="text-sm text-muted-foreground mt-2">Ministry of AYUSH - Government of India</p>
        </div>

        <div className="space-y-6">
          <div>
            <Label htmlFor="role" className="text-sm font-medium">Select Your Role</Label>
            <select 
              id="role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="gov-select mt-2"
            >
              <option value="">Choose your stakeholder role</option>
              <option value="aggregator">Aggregator/Collection Centre</option>
              <option value="processor">Processor/Processing Unit</option>
              <option value="manufacturer">Manufacturer/Formulation Unit</option>
              <option value="distributor">Distributor/Logistics Provider</option>
            </select>
          </div>

          <div>
            <Label htmlFor="otp" className="text-sm font-medium">Authentication Token/OTP</Label>
            <Input
              id="otp"
              type="text"
              placeholder="Enter your OTP or __initial_auth_token"
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              className="gov-input mt-2"
            />
          </div>

          <Button 
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full btn-government"
          >
            {isLoading ? 'Authenticating...' : 'Secure Login'}
          </Button>
        </div>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-medium text-sm mb-3">Demo Credentials</h3>
          <div className="space-y-2 text-xs">
            <div><strong>Aggregator:</strong> OTP: 123456</div>
            <div><strong>Processor:</strong> OTP: 234567</div>
            <div><strong>Manufacturer:</strong> OTP: 345678</div>
            <div><strong>Distributor:</strong> OTP: 456789</div>
            <div className="pt-2 border-t"><strong>Universal:</strong> __initial_auth_token</div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-card border rounded-lg">
          <h4 className="font-medium text-sm mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Government Documents
          </h4>
          <div className="space-y-2">
            {simulateDocuments.map((doc, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span className="flex-1 truncate">{doc.name}</span>
                <span className="text-muted-foreground ml-2">{doc.size}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AuthComponent;