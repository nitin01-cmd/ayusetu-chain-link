
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
import { ChevronRight, Lock } from 'lucide-react';

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
  const roleSelectionRef = useRef<HTMLDivElement | null>(null);
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [step, setStep] = useState<AuthStep>('role-selection');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [credentials, setCredentials] = useState<CredentialsState>({
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
    const auth = getAuth(firebaseApp);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, restore session
        onLogin('firebase', user.uid);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
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
      description: 'Herbal resource providers',
      loginLabel: 'Login as Farmer',
      color: 'bg-emerald-50/70',
      fields: ['mobile', 'otp']
    },
    {
      id: 'aggregator',
      label: 'Aggregator',
      icon: '📦',
      description: 'Collection & consolidation',
      loginLabel: 'Login as Aggregator',
      color: 'bg-amber-50/70',
      fields: ['aggregatorId', 'password']
    },
    {
      id: 'processor',
      label: 'Processor',
      icon: '⚙️',
      description: 'Processing & refinement',
      loginLabel: 'Login as Processor',
      color: 'bg-sky-50/70',
      fields: ['organizationId', 'password']
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
      fields: ['distributorId', 'password']
    }
  ];

  const demoCredentials = {
    'farmer': { otp: '111111', userId: 'FARM001', credential: 'any' },
    'aggregator': { username: 'AGG001', password: 'password', userId: 'AGG001' },
    'processor': { username: 'PROC001', password: 'password', userId: 'PROC001' },
    'manufacturer': { username: 'MFG001', password: 'password', otp: '111111', userId: 'MFG001' },
    'distributor': { username: 'DIST001', password: 'password', userId: 'DIST001' }
  };

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    setStep('credentials-entry');
  };

  const getRoleConfig = (roleId: string) => roles.find(r => r.id === roleId);

  const getFieldLabel = (field: string): string => {
    const labels: { [key: string]: string } = {
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

  const validateCredentials = (): boolean => {
    const roleConfig = getRoleConfig(selectedRole);
    if (!roleConfig) return false;

    for (const field of roleConfig.fields) {
      if (field === 'otp') {
        setCredentials(prev => ({ ...prev, requiresOtp: true }));
        return true; // Will proceed to OTP verification
      }
      if (field === 'mobile' && (!credentials.mobile || credentials.mobile.length < 10)) {
        toast({
          title: "Invalid Mobile Number",
          description: "Please enter a valid 10-digit mobile number",
          variant: "destructive"
        });
        return false;
      }
      if (['aggregatorId', 'organizationId', 'companyId', 'distributorId'].includes(field)) {
        const value = credentials[field as keyof CredentialsState];
        if (!value) {
          toast({
            title: "Required Field",
            description: `Please enter ${getFieldLabel(field)}`,
            variant: "destructive"
          });
          return false;
        }
      }
      if (field === 'password' && !credentials.password) {
        toast({
          title: "Required Field",
          description: "Please enter your password",
          variant: "destructive"
        });
        return false;
      }
    }
    return true;
  };

  // Firebase phone login (for Farmer, demo only)
  const handleSubmitCredentials = async () => {
    if (!validateCredentials()) return;
    setIsLoading(true);
    const roleConfig = getRoleConfig(selectedRole);
    const requiresOtp = roleConfig?.fields.includes('otp');
    if (selectedRole === 'farmer' && requiresOtp) {
      try {
        const auth = getAuth(firebaseApp);
        if (!window.recaptchaVerifier) {
          window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
        }
        const appVerifier = window.recaptchaVerifier;
        const phoneNumber = `+91${credentials.mobile}`;
        const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        window.confirmationResult = confirmationResult;
        toast({ title: 'OTP Required', description: 'Verification code sent!', variant: 'default' });
        setStep('otp-verification');
      } catch (err) {
        toast({ title: 'OTP Error', description: 'Failed to send OTP', variant: 'destructive' });
      }
      setIsLoading(false);
      return;
    }
    // For other roles, fallback to demo login
    setTimeout(() => {
      toast({
        title: "Login Successful",
        description: `Welcome to ${roleConfig?.label}`,
        variant: "default"
      });
      onLogin(selectedRole, demoCredentials[selectedRole as keyof typeof demoCredentials]?.userId || 'DEMO_USER');
      setIsLoading(false);
    }, 1200);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = value.slice(-1);
    setOtpDigits(newOtpDigits);
    // Auto-move to next field
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleBackToRole = () => {
    setStep('role-selection');
    setSelectedRole('');
    setCredentials({
      mobile: '',
      aggregatorId: '',
      organizationId: '',
      companyId: '',
      distributorId: '',
      password: '',
      requiresOtp: false
    });
    setOtpDigits(['', '', '', '', '', '']);
    setShowPassword(false);
  };

  const handleBackToCredentials = () => {
    setStep('credentials-entry');
    setOtpDigits(['', '', '', '', '', '']);
  };

  const handleVerifyOtp = async () => {
    if (otpDigits.some(d => !d)) {
      toast({
        title: "Incomplete OTP",
        description: "Please enter all 6 digits of your OTP",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    const enteredOtp = otpDigits.join('');
    if (selectedRole === 'farmer') {
      try {
        const confirmationResult = window.confirmationResult;
        await confirmationResult.confirm(enteredOtp);
        setIsFinalizing(true);
        toast({
          title: "Authentication Successful",
          description: `Welcome, Farmer!`,
          variant: "default"
        });
        setTimeout(() => {
          const auth = getAuth(firebaseApp);
          onLogin('farmer', auth.currentUser?.uid || 'FARMER');
        }, 2500);
        return;
      } catch (err) {
        toast({ title: 'Authentication Failed', description: 'Invalid OTP', variant: 'destructive' });
        setIsLoading(false);
        return;
      }
    }
    // Demo fallback for other roles
    const roleConfig = getRoleConfig(selectedRole);
    if (enteredOtp === '111111' || enteredOtp === '999999') {
      setIsFinalizing(true);
      toast({
        title: "Authentication Successful",
        description: `Welcome to ${roleConfig?.label}`,
        variant: "default"
      });
      setTimeout(() => {
        onLogin(selectedRole, demoCredentials[selectedRole as keyof typeof demoCredentials]?.userId || 'DEMO_USER');
      }, 2500);
      return;
    }
    toast({
      title: "Authentication Failed",
      description: "Invalid OTP. Demo OTP: 111111",
      variant: "destructive"
    });
    setIsLoading(false);
  };

  const handleBackToRoles = () => {
    setStep('role-selection');
    setOtpDigits(['', '', '', '', '', '']);
  };

  return (
    <>
      {(isFinalizing || isAuthLoading) && <AyuLoader />}
      <div className="h-dvh flex flex-col lg:flex-row bg-gradient-to-br from-amber-50 via-green-50 to-green-100 overflow-hidden">
      {/* Mobile Header - Removed for login screen on mobile */}

      {/* Left Side - Image Section with Cinematic Overlay (40% on desktop) */}
      <div className="hidden lg:flex lg:w-2/5 relative overflow-hidden">
        {/* Background Image - High Quality Farmer Portrait */}
        <img 
          src={ayuestufrontpage} 
          alt="Indian Farmer Harvesting Medicinal Plants"
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Cinematic Gradient Overlay - Darker at edges for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />

        {/* Content Overlay - Professional Branding Section */}
        <div className="relative z-10 w-full h-full flex flex-col justify-between p-6 md:p-8">
          
          {/* TOP SECTION - Logo and Title (Left-Aligned) */}
          <div className="space-y-4">
            {/* Logo + Title Row */}
            <div className="flex items-start gap-4">
              {/* Small Circular Logo */}
              <div className="w-14 h-14 rounded-full overflow-hidden backdrop-blur-md shadow-lg border-2 border-white/35 bg-white/15 p-0.5 flex items-center justify-center flex-shrink-0 hover:bg-white/25 transition-all duration-300">
                <div className="w-full h-full rounded-full overflow-hidden bg-white/95 flex items-center justify-center">
                  <img
                    src={ayusetuEmblem}
                    alt="AyuSetu Emblem"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </div>
              
              {/* Title and Subtitle */}
              <div className="space-y-1">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white drop-shadow-lg" style={{
                  textShadow: '0 4px 12px rgba(0,0,0,0.5)'
                }}>
                  AyuSetu
                </h1>
                <p className="text-xs md:text-sm font-light text-white/80 leading-relaxed drop-shadow" style={{
                  textShadow: '0 2px 6px rgba(0,0,0,0.4)'
                }}>
                  Trusted Herbal Supply Chain for Bharat
                </p>
              </div>
            </div>
          </div>

          {/* BOTTOM SECTION - Trust Indicators (Left-Aligned Card) */}
          <div className="space-y-2 backdrop-blur-md bg-white/10 p-2 md:p-3 rounded-lg border border-white/20 shadow-[0_8px_18px_rgba(15,23,42,0.13)] w-full max-w-xs">
            {/* Trust Indicator 1 */}
            <div className="flex items-start gap-2 group">
              <div className="w-6 h-6 rounded-full bg-sky-300/20 flex items-center justify-center flex-shrink-0 group-hover:bg-sky-300/30 transition-all duration-300 border border-sky-300/35">
                <svg className="w-3.5 h-3.5 text-sky-200" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 2.5a1 1 0 01.61.208l5.5 4.167a1 1 0 01.39.797V12.5c0 3.59-2.288 5.61-5.86 6.914a1 1 0 01-.68 0C6.388 18.11 4.1 16.09 4.1 12.5V7.672a1 1 0 01.39-.797l5.5-4.167A1 1 0 0110 2.5zm2.177 6.8a.75.75 0 10-1.06-1.06l-2.164 2.165-.87-.87a.75.75 0 00-1.06 1.06l1.4 1.4a.75.75 0 001.06 0l2.694-2.695z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] sm:text-xs font-semibold text-white/95 leading-tight">Government Verified System</p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/10" />

            {/* Trust Indicator 2 */}
            <div className="flex items-start gap-2 group">
              <div className="w-6 h-6 rounded-full bg-amber-300/20 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-300/30 transition-all duration-300 border border-amber-300/35">
                <svg className="w-3.5 h-3.5 text-amber-200" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <circle cx="4" cy="6" r="1.5" fill="currentColor" />
                  <circle cx="10" cy="10" r="1.5" fill="currentColor" />
                  <circle cx="16" cy="6" r="1.5" fill="currentColor" />
                  <circle cx="16" cy="14" r="1.5" fill="currentColor" />
                  <path d="M5.2 6.8L8.8 9.2M11.2 9.2L14.8 6.8M11.2 10.8L14.8 13.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] sm:text-xs font-semibold text-white/95 leading-tight">End-to-End Secure Traceability</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Panel (60% on desktop) */}
      <div className={`${hasStarted ? 'flex flex-1 lg:w-3/5 items-center justify-center px-4 py-4 sm:px-6 sm:py-6 lg:p-16' : 'flex flex-1 lg:w-3/5 items-center justify-center px-4 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-10'}`}>
        <div className={`relative overflow-hidden ${hasStarted ? 'w-full max-w-md bg-white/80 lg:bg-transparent backdrop-blur-sm lg:backdrop-blur-none rounded-2xl lg:rounded-none border border-white/70 lg:border-transparent p-4 sm:p-5 lg:p-0 shadow-sm lg:shadow-none' : 'w-full max-w-xl rounded-[2rem] border border-white/70 bg-white/90 p-5 sm:p-6 lg:p-8 shadow-2xl backdrop-blur-xl'}`}>
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className={`absolute -top-24 right-[-4rem] h-72 w-72 rounded-full blur-3xl ${hasStarted ? 'bg-emerald-200/20' : 'bg-emerald-200/40'}`} />
            {!hasStarted && (
              <div className="absolute bottom-[-6rem] left-[-5rem] h-80 w-80 rounded-full bg-amber-200/35 blur-3xl" />
            )}
            <div
              className={`absolute inset-0 ${hasStarted
                ? 'bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.06),transparent_40%)]'
                : 'bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(217,119,6,0.1),transparent_30%)]'}`}
            />
          </div>

          {/* Header */}
          <div className={`${hasStarted ? 'relative z-10 mb-4 sm:mb-5 text-center' : 'relative z-10 mb-6 sm:mb-8 text-center lg:text-left'}`}>
            {!hasStarted && (
              <div className="mx-auto lg:mx-0 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                <span>Secure Access Portal</span>
              </div>
            )}
            <h2 className={`${hasStarted ? 'text-2xl sm:text-3xl' : 'mt-4 text-3xl sm:text-4xl lg:text-5xl'} font-bold text-gray-900 mb-1`}>AyuSetu</h2>
            <p className={`${hasStarted ? 'text-xs sm:text-sm' : 'text-xs sm:text-sm max-w-2xl mx-auto lg:mx-0'} text-gray-600`}>Ministry of AYUSH - Government of India</p>
          </div>

          {!hasStarted && (
            <div className="relative z-10 flex justify-center">
              <div className="w-full max-w-xl flex flex-col items-center text-center">
                <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.35em] text-emerald-800">Get Started</p>
                <h3 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-semibold text-gray-900 leading-tight tracking-tight">
                  Start your AyuSetu access flow
                </h3>
                <p className="mt-3 text-sm sm:text-base text-gray-700 leading-relaxed max-w-lg mx-auto">
                  Choose your role and enter the secure supply-chain dashboard in a few guided steps.
                </p>

                <div className="mt-5 flex flex-col items-center gap-3 w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setHasStarted(true);
                      setTimeout(() => {
                        roleSelectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 0);
                    }}
                    className="uiverse-button"
                  >
                    <svg viewBox="0 0 24 24" className="uiverse-button__arr uiverse-button__arr--left" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
                    </svg>
                    <span className="uiverse-button__text">Get Started</span>
                    <span className="uiverse-button__circle" />
                    <svg viewBox="0 0 24 24" className="uiverse-button__arr uiverse-button__arr--right" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
                    </svg>
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <span className="rounded-full border border-emerald-200 bg-white/85 px-3 py-1 text-[11px] font-medium text-emerald-900 shadow-sm">Role-based access</span>
                  <span className="rounded-full border border-emerald-200 bg-white/85 px-3 py-1 text-[11px] font-medium text-emerald-900 shadow-sm">Secure sign-in</span>
                  <span className="rounded-full border border-emerald-200 bg-white/85 px-3 py-1 text-[11px] font-medium text-emerald-900 shadow-sm">Traceability ready</span>
                </div>
              </div>

            </div>
          )}


          {hasStarted && step === 'role-selection' && (
            <div ref={roleSelectionRef} className="relative z-10 space-y-4 animate-in fade-in duration-300 max-w-md mx-auto text-center w-full">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Select Your Role</h3>
              
              <div className="grid grid-cols-1 gap-4">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => handleRoleSelect(role.id)}
                    className={`group flex items-center gap-5 p-5 rounded-[2rem] border-2 border-transparent transition-all text-left ${role.color} hover:border-emerald-600 hover:bg-white hover:shadow-xl hover:shadow-emerald-900/5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2`}
                  >
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                      <span className="text-2xl leading-none">{role.icon}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-base leading-tight mb-0.5 tracking-tight">
                        {role.label}
                      </p>
                      <p className="text-xs sm:text-[13px] font-medium text-slate-600 leading-snug">
                        {role.description}
                      </p>
                    </div>

                    <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Credentials Entry Step */}
          {hasStarted && step === 'credentials-entry' && (
            <div className="w-full max-w-xl rounded-[2rem] border border-white/70 bg-white/90 p-5 sm:p-6 lg:p-8 shadow-2xl backdrop-blur-xl mx-auto animate-in fade-in duration-300">
              <div id="recaptcha-container" />
              <div className="relative z-10 space-y-6 sm:space-y-7">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {getRoleConfig(selectedRole)?.loginLabel}
                </h2>
                <p className="text-sm text-gray-600">Enter your credentials to proceed</p>
              </div>

              <div className="space-y-4">
                {getRoleConfig(selectedRole)?.fields.map((field) => (
                  <div key={field}>
                    {field === 'mobile' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                          {getFieldLabel(field)}
                        </label>
                        <div className="flex gap-2">
                          <div className="flex items-center px-4 py-3 bg-white border-2 border-gray-200 rounded-xl font-semibold text-gray-700 flex-shrink-0">
                            +91
                          </div>
                          <input
                            type="tel"
                            placeholder="Enter 10-digit number"
                            value={credentials.mobile}
                            onChange={(e) => handleCredentialChange('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                            maxLength={10}
                            className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all font-semibold text-gray-900 placeholder-gray-400"
                          />
                        </div>
                        {credentials.mobile && (
                          <p className="text-xs text-emerald-600 font-medium mt-2">
                            ✓ +91{credentials.mobile.slice(-10)}
                          </p>
                        )}
                      </div>
                    )}

                    {field === 'aggregatorId' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                          {getFieldLabel(field)}
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., AGG001"
                          value={credentials.aggregatorId}
                          onChange={(e) => handleCredentialChange('aggregatorId', e.target.value)}
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all font-semibold text-gray-900 placeholder-gray-400"
                        />
                      </div>
                    )}

                    {field === 'organizationId' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                          {getFieldLabel(field)}
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., PROC001"
                          value={credentials.organizationId}
                          onChange={(e) => handleCredentialChange('organizationId', e.target.value)}
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all font-semibold text-gray-900 placeholder-gray-400"
                        />
                      </div>
                    )}

                    {field === 'companyId' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                          {getFieldLabel(field)}
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., MFG001"
                          value={credentials.companyId}
                          onChange={(e) => handleCredentialChange('companyId', e.target.value)}
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all font-semibold text-gray-900 placeholder-gray-400"
                        />
                      </div>
                    )}

                    {field === 'distributorId' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                          {getFieldLabel(field)}
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., DIST001"
                          value={credentials.distributorId}
                          onChange={(e) => handleCredentialChange('distributorId', e.target.value)}
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all font-semibold text-gray-900 placeholder-gray-400"
                        />
                      </div>
                    )}

                    {field === 'password' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                          {getFieldLabel(field)}
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            value={credentials.password}
                            onChange={(e) => handleCredentialChange('password', e.target.value)}
                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all font-semibold text-gray-900 placeholder-gray-400"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-900"
                          >
                            {showPassword ? '👁️' : '👁️‍🗨️'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-center mt-2">
                <button
                  type="button"
                  onClick={handleSubmitCredentials}
                  disabled={isLoading}
                  className="uiverse-button"
                >
                  <svg viewBox="0 0 24 24" className="uiverse-button__arr uiverse-button__arr--left" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
                  </svg>
                  <span className="uiverse-button__text">{isLoading ? 'Processing...' : 'Continue'}</span>
                  <span className="uiverse-button__circle" />
                  <svg viewBox="0 0 24 24" className="uiverse-button__arr uiverse-button__arr--right" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
                  </svg>
                </button>
              </div>

              <button
                onClick={handleBackToRole}
                className="w-full text-sm text-emerald-700 hover:text-emerald-800 font-medium py-2 transition-colors"
              >
                ← Back to Role Selection
			  </button>
			  </div>
			</div>
          )}

          {/* OTP Verification Step */}
          {hasStarted && step === 'otp-verification' && (
            <div className="w-full max-w-xl rounded-[2rem] border border-white/70 bg-white/90 p-5 sm:p-6 lg:p-8 shadow-2xl backdrop-blur-xl mx-auto animate-in fade-in duration-300">
              <div className="relative z-10 space-y-6 sm:space-y-7">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Verify with OTP</h2>
                <p className="text-sm text-gray-600">
                  Enter the verification code sent to your registered {selectedRole === 'farmer' ? 'mobile number' : 'email'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                  Enter 6-Digit Code
                </label>
                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      ref={el => otpInputRefs.current[index] = el}
                      type="text"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      maxLength={1}
                      className="w-10 sm:w-12 h-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-lg border-2 border-gray-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all bg-white hover:border-gray-400"
                      autoComplete="one-time-code"
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-center mt-2">
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={isLoading}
                  className="uiverse-button flex items-center gap-2 justify-center"
                >
                  <Lock size={18} />
                  <span className="uiverse-button__text">{isLoading ? 'Verifying...' : 'Verify & Login'}</span>
                  <span className="uiverse-button__circle" />
                  <svg viewBox="0 0 24 24" className="uiverse-button__arr uiverse-button__arr--right" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
                  </svg>
                </button>
              </div>

              <button
                onClick={handleBackToCredentials}
                className="w-full text-sm text-emerald-700 hover:text-emerald-800 font-medium py-2 transition-colors"
              >
                Back to Credentials
              </button>
            </div>
          )}

          {/* Security Footer */}
          {!(hasStarted && step === 'role-selection') && (
            <div className="relative z-10 mt-6 sm:mt-8 pt-4 sm:pt-5 border-t border-gray-200">
              <div className="flex items-center justify-center gap-3 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>Government Verified</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-gray-400" />
                <div className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                  </svg>
                  <span>End-to-End Secure</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
};

export default AuthComponent;