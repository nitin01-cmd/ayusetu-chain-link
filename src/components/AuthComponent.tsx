
'use client';

// Extend window type for Firebase Recaptcha and ConfirmationResult
declare global {
  interface Window {
    recaptchaVerifier?: import('firebase/auth').RecaptchaVerifier;
    confirmationResult?: import('firebase/auth').ConfirmationResult;
  }
}

import { useRef, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signInWithPhoneNumber, RecaptchaVerifier, signOut } from 'firebase/auth';
import { app as firebaseApp } from '@/integrations/firebase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ayusetuEmblem from '@/assets/ayusetu-emblem.png';
import ayuestufrontpage from '@/assets/ayuestufrontpage.png';
import { ChevronRight, Lock, Check, Heart, Loader2, ChevronDown, Eye, EyeOff } from 'lucide-react';

interface AuthComponentProps {
  onLogin: (role: string, userId: string) => void;
}

type AuthStep = 'role-selection' | 'credentials-entry' | 'otp-verification';

interface RoleCard {
  id: string;
  label: string;
  icon: string;
  description: string;
  loginLabel: string;
  color: string;
  fields: string[]; // 'mobile', 'id', 'password', 'otp'
}

interface CredentialsState {
  fullName?: string;
  location?: string;
  pincode?: string;
  aadharId?: string;
  farmerType?: string;
  mobile: string;
  aggregatorId: string;
  organizationId: string;
  companyId: string;
  distributorId: string;
  password: string;
  requiresOtp: boolean;
}

const AyuLoader = () => {
  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-emerald-950/95 via-emerald-900/92 to-amber-900/92 backdrop-blur-sm flex items-center justify-center">
      <div className="text-center text-white px-6">
        <div className="relative mx-auto w-28 h-28 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-white/20 animate-pulse" />
          <div className="absolute inset-2 rounded-full border border-emerald-200/30 animate-pulse" style={{ animationDelay: '200ms' }} />
          <div className="w-20 h-20 rounded-2xl border border-white/30 bg-white/10 shadow-2xl flex items-center justify-center backdrop-blur-sm">
            <img
              src={ayusetuEmblem}
              alt="AyuSetu"
              className="w-14 h-14 object-contain"
            />
          </div>
        </div>
        <h3 className="mt-6 text-xl font-semibold tracking-tight">AyuSetu</h3>
        <p className="mt-1 text-sm text-emerald-100/90">Security handshake in progress...</p>

        <div className="mt-5 flex items-center justify-center gap-2" aria-hidden="true">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-200 animate-bounce" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-200 animate-bounce" style={{ animationDelay: '120ms' }} />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-200 animate-bounce" style={{ animationDelay: '240ms' }} />
        </div>

        {/* Animated progress bar */}
        <div className="mt-5 w-56 h-1.5 rounded-full bg-white/15 overflow-hidden mx-auto relative">
          <div
            className="absolute left-0 top-0 h-full w-1/3 bg-emerald-300/90 rounded-full animate-ayuprogress"
            style={{ minWidth: '30%', animationDuration: '1.6s' }}
          />
        </div>
        {/* Progress bar animation style */}
        <style>{`
          @keyframes ayuprogress {
            0% { left: -40%; }
            60% { left: 60%; }
            100% { left: 100%; }
          }
          .animate-ayuprogress {
            animation: ayuprogress 1.6s cubic-bezier(.4,0,.2,1) infinite;
          }
        `}</style>
      </div>
    </div>
  );
};

const AuthComponent = ({ onLogin }: AuthComponentProps) => {
  console.log("AuthComponent mounted");
  const roleSelectionRef = useRef<HTMLDivElement | null>(null);
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [step, setStep] = useState<AuthStep>('role-selection');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [credentials, setCredentials] = useState<CredentialsState>({
    fullName: '',
    location: '',
    pincode: '',
    aadharId: '',
    farmerType: 'farmer',
    mobile: '',
    aggregatorId: '',
    organizationId: '',
    companyId: '',
    distributorId: '',
    password: '',
    requiresOtp: false
  });
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true); // Loader on mount
  const { toast } = useToast();
  // Firebase Auth check on mount
  useEffect(() => {
    setIsAuthLoading(true);
    try {
      const auth = getAuth(firebaseApp);
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        console.log("onAuthStateChanged called", user);
        if (user) {
          // User is signed in, restore session
          onLogin('firebase', user.uid);
        }
        setIsAuthLoading(false);
      });
      return () => unsubscribe();
    } catch (err) {
      console.error("Error in Firebase Auth useEffect", err);
      setIsAuthLoading(false);
    }
  }, []);

  // Autofocus first OTP input when entering OTP step
  useEffect(() => {
    if (step === 'otp-verification' && hasStarted) {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step, hasStarted]);

  // Demo: Listen for window event to autofill OTP (simulate SMS/Push)
  useEffect(() => {
    function handleOtpEvent(e: any) {
      if (e.detail && Array.isArray(e.detail) && e.detail.length === 6) {
        setOtpDigits(e.detail);
        // Focus last input if all filled
        otpInputRefs.current[5]?.focus();
      }
    }
    window.addEventListener('ayusetu:otp', handleOtpEvent);
    return () => window.removeEventListener('ayusetu:otp', handleOtpEvent);
  }, []);

  // Role definitions with dynamic login methods
  const roles: RoleCard[] = [
    {
      id: 'farmer',
      label: 'Farmer / Collector',
      icon: '🌿',
      description: 'Register as Herbal resource provider',
      loginLabel: 'Farmer Registration',
      color: 'bg-emerald-50/70',
      fields: ['fullName', 'mobile', 'aadharId', 'pincode', 'location', 'farmerType', 'otp']
    },
    {
      id: 'aggregator',
      label: 'Aggregator',
      icon: '📦',
      description: 'Collection & consolidation',
      loginLabel: 'Login as Aggregator',
      color: 'bg-amber-50/70',
      fields: ['aggregatorId', 'password', 'otp']
    },
    {
      id: 'processor',
      label: 'Processor',
      icon: '⚙️',
      description: 'Processing & refinement',
      loginLabel: 'Login as Processor',
      color: 'bg-sky-50/70',
      fields: ['organizationId', 'password', 'otp']
    },
    {
      id: 'manufacturer',
      label: 'Manufacturer',
      icon: '🏭',
      description: 'Product formulation',
      loginLabel: 'Login as Manufacturer',
      color: 'bg-rose-50/70',
      fields: ['companyId', 'password', 'otp'] // Always requires 2FA
    },
    {
      id: 'distributor',
      label: 'Distributor',
      icon: '🚚',
      description: 'Logistics & delivery',
      loginLabel: 'Login as Distributor',
      color: 'bg-violet-50/70',
      fields: ['distributorId', 'password', 'otp']
    }
  ];

  const mockDatabase: Record<string, { id: string; password?: string }[]> = {
    'aggregator': [
      { id: 'AGG-1001', password: 'password123' },
      { id: 'AGG-1002', password: 'password123' },
      { id: 'AGG-1003', password: 'password123' },
      { id: 'AGG-1004', password: 'password123' },
      { id: 'AGG-1005', password: 'password123' }
    ],
    'processor': [
      { id: 'PROC-2001', password: 'password123' },
      { id: 'PROC-2002', password: 'password123' },
      { id: 'PROC-2003', password: 'password123' },
      { id: 'PROC-2004', password: 'password123' },
      { id: 'PROC-2005', password: 'password123' }
    ],
    'manufacturer': [
      { id: 'MFG-3001', password: 'password123' },
      { id: 'MFG-3002', password: 'password123' },
      { id: 'MFG-3003', password: 'password123' },
      { id: 'MFG-3004', password: 'password123' },
      { id: 'MFG-3005', password: 'password123' }
    ],
    'distributor': [
      { id: 'DIST-4001', password: 'password123' },
      { id: 'DIST-4002', password: 'password123' },
      { id: 'DIST-4003', password: 'password123' },
      { id: 'DIST-4004', password: 'password123' },
      { id: 'DIST-4005', password: 'password123' }
    ]
  };

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    setStep('credentials-entry');
  };

  const getRoleConfig = (roleId: string) => roles.find(r => r.id === roleId);

  const getFieldLabel = (field: string): string => {
    const labels: { [key: string]: string } = {
      'fullName': 'Full Name',
      'pincode': 'Pincode',
      'location': 'Location / Village',
      'aadharId': 'Aadhar ID',
      'farmerType': 'Type (Farmer or Collector)',
      'mobile': 'Mobile Number',
      'aggregatorId': 'Aggregator ID',
      'organizationId': 'Organization ID',
      'companyId': 'Company ID / License ID',
      'distributorId': 'Distributor ID',
      'password': 'Password',
      'otp': 'OTP-based Verification'
    };
    return labels[field] || field;
  };

  const handleCredentialChange = (field: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePincodeUpdate = (val: string) => {
    handleCredentialChange('pincode', val);
    if (val.length === 6) {
      checkPincodeAPI(val);
    }
  };

  const checkPincodeAPI = async (val: string) => {
    if (val.length !== 6) return;
    try {
      const response = await fetch(`https://india-pincode-api.p.rapidapi.com/v1/in/places/pincode?pincode=${val}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-rapidapi-host': 'india-pincode-api.p.rapidapi.com',
          'x-rapidapi-key': '7ee0fb3b65msha7f685e114d12b2p10014ejsn697474e1f7cd'
        }
      });
      const data = await response.json();
      console.log('API Response:', data);
      
      let item = null;
      if (data.status === 200 && data.result && Array.isArray(data.result)) {
          item = data.result[0];
      } else if (Array.isArray(data)) {
          item = data[0];
      } else if (data.results && Array.isArray(data.results)) {
          item = data.results[0];
      } else {
          item = data;
      }
      
      if (item && (item.placename || item.placeName || item.Name || item.name || item.office || item.officeName)) {
         const placename = item.placename || item.placeName || item.Name || item.name || item.office || item.officeName;
         const district = item.district || item.District || item.taluk || item.Taluk || '';
         const state = item.state || item.State || item.circle || item.Circle || '';
         const autoLoc = `${placename}${district ? ', ' + district : ''}${state ? ', ' + state : ''}`;
         handleCredentialChange('location', autoLoc);
         toast({ title: "Location Found", description: autoLoc });
      } else {
         const errorMsg = data.message || data.Message || "Could not map this pincode.";
         toast({ title: "Pincode Failed", description: errorMsg, variant: "destructive" });
      }
    } catch (err) {
      console.error("Pincode API error", err);
      toast({ title: "API Error", description: (err as Error).message, variant: "destructive" });
    }
  };

  const validateCredentials = (): boolean => {
    const roleConfig = getRoleConfig(selectedRole);
    if (!roleConfig) return false;

    for (const field of roleConfig.fields) {
      if (field === 'mobile' && (!credentials.mobile || credentials.mobile.length < 10)) {
        toast({
          title: "Invalid Mobile Number",
          description: "Please enter a valid 10-digit mobile number",
          variant: "destructive"
        });
        return false;
      }
      if (field === 'aadharId' && (!credentials.aadharId || credentials.aadharId.replace(/\s/g, '').length < 12)) {
        toast({
          title: "Invalid Aadhar ID",
          description: "Please enter a valid 12-digit Aadhar number",
          variant: "destructive"
        });
        return false;
      }
    }
    
    if (selectedRole !== 'farmer') {
      const inputId = credentials.aggregatorId || credentials.organizationId || credentials.companyId || credentials.distributorId;
      const expectedUsers = mockDatabase[selectedRole] || [];
      const matchedUser = expectedUsers.find(u => u.id === inputId);
      
      if (!matchedUser) {
        toast({ title: "Account Not Found", description: `The ID '${inputId || ''}' does not exist in our database.`, variant: "destructive" });
        return false;
      }
      if (credentials.password !== matchedUser.password) {
        toast({ title: "Incorrect Password", description: "The password you entered is incorrect.", variant: "destructive" });
        return false;
      }
    }

    return true;
  };

  const handleContinue = () => {
    if (validateCredentials()) {
      setIsLoading(true);
      const roleConfig = getRoleConfig(selectedRole);
      const needsOtp = roleConfig?.fields.includes('otp');
      
      setTimeout(() => {
        setIsLoading(false);
        if (needsOtp) {
          setStep('otp-verification');
        } else {
          // Mock direct login for non-OTP flows
          onLogin(selectedRole, credentials.aggregatorId || credentials.organizationId || credentials.distributorId || 'MOCK_ID');
        }
      }, 800);
    }
  };

  // Handlers for OTP and Login
  const handleVerifyOtp = () => {
    const otp = otpDigits.join('');
    if (otp === '111111') {
      setIsFinalizing(true);
      setTimeout(() => {
        setIsFinalizing(false);
        onLogin(selectedRole, credentials.aggregatorId || credentials.organizationId || credentials.distributorId || 'MOCK_ID');
      }, 1000);
    } else {
      toast({ title: "Invalid OTP", description: "Hint: Use demo OTP 111111", variant: "destructive" });
    }
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);
    
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <>
      {isAuthLoading && <AyuLoader />}
      <div className="h-dvh flex flex-col lg:flex-row bg-gradient-to-br from-amber-50 via-green-50 to-green-100 overflow-hidden">
        
        {/* Left Panel (40%) */}
        <div className="hidden lg:flex lg:w-[40%] relative flex-col justify-between p-8 overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <img src={ayuestufrontpage} alt="AyuSetu Background" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/70" />
          </div>
          
          {/* Top Logo Section - Moved Up & Smaller */}
          <div className="relative z-10 flex items-center gap-3 top-2">
            <div className="w-12 h-12 rounded-full bg-[#3c4a3e]/70 backdrop-blur-md border border-white/10 flex items-center justify-center p-2">
              <img src={ayusetuEmblem} alt="AyuSetu Emblem" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">AyuSetu</h1>
              <p className="text-white/90 text-sm mt-0 font-medium">
                Trusted Herbal Supply Chain for Bharat
              </p>
            </div>
          </div>

          {/* Bottom Features Box - Smaller & Simpler */}
          <div className="relative z-10 mb-4 bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-4 max-w-[18rem] shadow-2xl">
            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <div className="w-6 h-6 rounded-full bg-emerald-600/90 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              </div>
              <span className="text-white/95 font-medium text-[13px]">Government Verified System</span>
            </div>
            <div className="flex items-center gap-3 pt-3">
              <div className="w-6 h-6 rounded-full bg-emerald-600/90 flex items-center justify-center shrink-0">
                <Heart className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-white/95 font-medium text-[13px]">End-to-End Secure Traceability</span>
            </div>
          </div>
        </div>

        {/* Right Panel (60%) */}
        <div className="w-full lg:w-[60%] flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-24 overflow-y-auto">
          
          {!hasStarted ? (
            <div className="w-full max-w-2xl mx-auto flex flex-col justify-center min-h-[60vh] animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="space-y-6">
                <h2 className="text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-emerald-950 via-emerald-800 to-emerald-500 pb-4">
                  Welcome to<br />AyuSetu.
                </h2>
                <div className="w-24 h-2 rounded-full bg-emerald-500/30" />
                <p className="text-2xl lg:text-3xl font-medium text-emerald-800/80 leading-snug max-w-lg pt-4">
                  Your trusted herbal supply chain ecosystem.
                </p>
              </div>
              
              <div className="pt-16">
                {/* Uiverse-style Get Started Button */}
                <button
                  onClick={() => setHasStarted(true)}
                  className="group relative inline-flex h-16 w-64 items-center justify-center overflow-hidden rounded-full bg-emerald-600 font-medium text-neutral-50 shadow-[0_8px_30px_rgb(5,150,105,0.4)] transition-all duration-300 hover:bg-emerald-700 hover:shadow-[0_8px_30px_rgba(5,150,105,0.6)] hover:scale-[1.03] active:scale-[0.97]"
                >
                  <span className="mr-3 text-xl font-bold tracking-wider">Get Started</span>
                  <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" strokeWidth={3} />
                  <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">
                    <div className="relative h-full w-12 bg-white/20" />
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-md mx-auto space-y-8">
              {step === 'role-selection' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="text-center lg:text-left mb-8">
                      <h2 className="text-3xl font-bold text-emerald-950 tracking-tight">Select your role</h2>
                      <p className="text-emerald-700/80 mt-2 font-medium">Choose how you participate in the network</p>
                    </div>
                    
                    <div className="grid gap-4">
                      {roles.map((role) => (
                        <button
                          key={role.id}
                          onClick={() => handleRoleSelect(role.id)}
                          className={`flex items-center p-4 rounded-2xl border-2 border-transparent hover:border-emerald-500/30 transition-all duration-300 ${role.color} hover:shadow-lg group text-left w-full`}
                        >
                          <div className="w-12 h-12 flex items-center justify-center bg-white/50 rounded-xl text-2xl shadow-sm group-hover:scale-110 transition-transform">
                            {role.icon}
                          </div>
                          <div className="ml-4 flex-1">
                            <h3 className="text-emerald-950 font-semibold">{role.label}</h3>
                            <p className="text-emerald-800/70 text-sm">{role.description}</p>
                          </div>
                          <ChevronRight className="text-emerald-400 group-hover:text-emerald-600 transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 'credentials-entry' && selectedRole && (
                  <div className="animate-in slide-in-from-right-8 duration-500">
                    <button
                      onClick={() => setStep('role-selection')}
                      className="text-emerald-600 hover:text-emerald-700 text-sm font-medium mb-6 flex items-center transition-colors"
                    >
                      ← Back to roles
                    </button>

                    <div className="mb-8">
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-3xl mb-4 border border-emerald-100">
                        {getRoleConfig(selectedRole)?.icon}
                      </div>
                      <h2 className="text-2xl font-bold text-emerald-950">
                        {getRoleConfig(selectedRole)?.loginLabel}
                      </h2>
                    </div>

                    <div className="space-y-6">
                      <div className={selectedRole === 'farmer' ? "grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5" : "space-y-5"}>
                        {getRoleConfig(selectedRole)?.fields.map(field => field !== 'otp' && (
                          <div key={field} className={selectedRole === 'farmer' && ['fullName', 'location'].includes(field) ? 'sm:col-span-2' : ''}>
                          <label className="block text-sm font-medium text-emerald-900 mb-1.5 ml-1">
                            {getFieldLabel(field)}
                          </label>
                          {field === 'farmerType' ? (
                            <div className="relative">
                              <select
                                className="w-full px-4 py-3 rounded-xl border border-emerald-200/60 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm appearance-none outline-none text-emerald-950 font-medium"
                                value={credentials[field as keyof CredentialsState] as string}
                                onChange={(e) => handleCredentialChange(field, e.target.value)}
                              >
                                <option value="farmer">Farmer</option>
                                <option value="collector">Collector</option>
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-emerald-600">
                                <ChevronDown className="w-5 h-5" />
                              </div>
                            </div>
                          ) : field === 'aadharId' ? (
                            <input
                              type="text"
                              maxLength={14}
                              className="w-full px-4 py-3 rounded-xl border border-emerald-200/60 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm tracking-widest text-emerald-950 font-medium"
                              placeholder="XXXX XXXX XXXX"
                              value={credentials[field as keyof CredentialsState] as string}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                let formatted = val;
                                if (val.length > 0) {
                                  formatted = val.match(/.{1,4}/g)?.join(' ') || val;
                                }
                                if (formatted.length <= 14) handleCredentialChange(field, formatted);
                              }}
                            />
                          ) : field === 'pincode' ? (
                            <div className="relative">
                              <input
                                type="text"
                                maxLength={6}
                                className="w-full px-4 py-3 rounded-xl border border-emerald-200/60 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm tracking-widest text-emerald-950 font-medium pr-20"
                                placeholder="6-digit Pincode"
                                value={credentials[field as keyof CredentialsState] as string}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '');
                                  if (val.length <= 6) handlePincodeUpdate(val);
                                }}
                              />
                              <button 
                                onClick={() => checkPincodeAPI(credentials.pincode as string)}
                                disabled={(credentials.pincode || '').length !== 6}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Check
                              </button>
                            </div>
                          ) : field === 'mobile' ? (
                            <div className="flex rounded-xl border border-emerald-200/60 bg-white focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all shadow-sm overflow-hidden">
                              <span className="flex items-center px-4 bg-emerald-50 border-r border-emerald-100 text-emerald-800 font-medium select-none">
                                +91
                              </span>
                              <input
                                type="tel"
                                maxLength={10}
                                className="w-full px-4 py-3 bg-transparent outline-none"
                                placeholder="Enter 10-digit number"
                                value={credentials[field as keyof CredentialsState] as string}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '');
                                  if (val.length <= 10) handleCredentialChange(field, val);
                                }}
                              />
                            </div>
                          ) : (
                            <div className="relative">
                              <input
                                type={field === 'password' ? (showPassword ? 'text' : 'password') : 'text'}
                                className={`w-full px-4 py-3 ${field === 'password' ? 'pr-10' : ''} rounded-xl border border-emerald-200/60 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm`}
                                placeholder={`Enter ${getFieldLabel(field)}`}
                                value={credentials[field as keyof CredentialsState] as string || ''}
                                onChange={(e) => {
                                  let val = e.target.value;
                                  const isIdField = ['aggregatorId', 'organizationId', 'companyId', 'distributorId'].includes(field);
                                  if (isIdField) {
                                    val = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
                                    val = val.replace(/([A-Z]+)(\d+)/, '$1-$2');
                                  }
                                  handleCredentialChange(field, val);
                                }}
                              />
                              {field === 'password' && (
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500/60 hover:text-emerald-700 transition-colors"
                                >
                                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                              )}
                            </div>
                          )}
                          </div>
                        ))}
                      </div>

                      <Button 
                        className="w-full py-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-base shadow-lg shadow-emerald-600/20 mt-4 group"
                        onClick={handleContinue}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <span>{selectedRole === 'farmer' ? 'Register & Continue' : 'Secure Login'}</span>
                            <Lock className="w-4 h-4 ml-2 opacity-70 group-hover:opacity-100 transition-opacity" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {step === 'otp-verification' && (
                  <div className="animate-in slide-in-from-right-8 duration-500">
                    <button
                      onClick={() => setStep('credentials-entry')}
                      className="text-emerald-600 hover:text-emerald-700 text-sm font-medium mb-6 flex items-center"
                    >
                      ← Back
                    </button>

                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-emerald-950 mb-2">Two-Factor Auth</h2>
                      <p className="text-emerald-700/80">
                        Enter the 6-digit code sent to your registered device.
                      </p>
                    </div>

                    <div className="flex justify-between gap-2 mb-8">
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={el => otpInputRefs.current[idx] = el}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          className="w-12 h-14 text-center text-xl font-semibold bg-white border border-emerald-200/60 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                          value={digit}
                          onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                        />
                      ))}
                    </div>

                    <Button 
                      className="w-full py-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-base shadow-lg shadow-emerald-600/20"
                      onClick={handleVerifyOtp}
                      disabled={isFinalizing}
                    >
                      {isFinalizing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        "Verify & Access"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
    </>
  );
};

export default AuthComponent;