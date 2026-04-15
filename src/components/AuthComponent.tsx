'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import ayusetuEmblem from '@/assets/ayusetu-emblem.png';
import ayuestufrontpage from '@/assets/ayuestufrontpage.png';
import { Lock } from 'lucide-react';

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

const AuthComponent = ({ onLogin }: AuthComponentProps) => {
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
  const { toast } = useToast();

  // Role definitions with dynamic login methods
  const roles: RoleCard[] = [
    {
      id: 'farmer',
      label: 'Farmer / Collector',
      icon: '🌿',
      description: 'Herbal resource providers',
      loginLabel: 'Login as Farmer',
      fields: ['mobile', 'otp']
    },
    {
      id: 'aggregator',
      label: 'Aggregator',
      icon: '📦',
      description: 'Collection & consolidation',
      loginLabel: 'Login as Aggregator',
      fields: ['aggregatorId', 'password']
    },
    {
      id: 'processor',
      label: 'Processor',
      icon: '⚙️',
      description: 'Processing & refinement',
      loginLabel: 'Login as Processor',
      fields: ['organizationId', 'password']
    },
    {
      id: 'manufacturer',
      label: 'Manufacturer',
      icon: '🏭',
      description: 'Product formulation',
      loginLabel: 'Login as Manufacturer',
      fields: ['companyId', 'password', 'otp'] // Always requires 2FA
    },
    {
      id: 'distributor',
      label: 'Distributor',
      icon: '🚚',
      description: 'Logistics & delivery',
      loginLabel: 'Login as Distributor',
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

  const handleSubmitCredentials = () => {
    if (!validateCredentials()) return;

    setIsLoading(true);

    const roleConfig = getRoleConfig(selectedRole);
    const requiresOtp = roleConfig?.fields.includes('otp');

    setTimeout(() => {
      if (requiresOtp) {
        toast({
          title: "OTP Required",
          description: "Sending verification code...",
          variant: "default"
        });
        setStep('otp-verification');
      } else {
        toast({
          title: "Login Successful",
          description: `Welcome to ${roleConfig?.label}`,
          variant: "default"
        });
        onLogin(selectedRole, demoCredentials[selectedRole as keyof typeof demoCredentials]?.userId || 'DEMO_USER');
      }
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
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
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

  const handleVerifyOtp = () => {
    if (otpDigits.some(d => !d)) {
      toast({
        title: "Incomplete OTP",
        description: "Please enter all 6 digits of your OTP",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const enteredOtp = otpDigits.join('');
      const roleConfig = getRoleConfig(selectedRole);
      
      if (enteredOtp === '111111' || enteredOtp === '999999') {
        toast({
          title: "Authentication Successful",
          description: `Welcome to ${roleConfig?.label}`,
          variant: "default"
        });
        onLogin(selectedRole, demoCredentials[selectedRole as keyof typeof demoCredentials]?.userId || 'DEMO_USER');
      } else {
        toast({
          title: "Authentication Failed",
          description: "Invalid OTP. Demo OTP: 111111",
          variant: "destructive"
        });
      }
      setIsLoading(false);
    }, 1500);
  };

  const handleBackToRoles = () => {
    setStep('role-selection');
    setOtpDigits(['', '', '', '', '', '']);
  };

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-gradient-to-br from-amber-50 via-green-50 to-green-100 overflow-hidden">
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
        <div className="relative z-10 w-full h-full flex flex-col justify-between p-8 md:p-10">
          
          {/* TOP SECTION - Logo and Title (Left-Aligned) */}
          <div className="space-y-5">
            {/* Logo + Title Row */}
            <div className="flex items-start gap-4">
              {/* Small Circular Logo */}
              <div className="w-16 h-16 bg-white/15 rounded-full p-2 backdrop-blur-md shadow-lg border border-white/20 flex items-center justify-center flex-shrink-0 hover:bg-white/20 transition-all duration-300">
                <img 
                  src={ayusetuEmblem} 
                  alt="AyuSetu Emblem" 
                  className="w-full h-full object-contain filter drop-shadow-lg"
                />
              </div>
              
              {/* Title and Subtitle */}
              <div className="space-y-1">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white drop-shadow-lg" style={{
                  textShadow: '0 4px 12px rgba(0,0,0,0.5)'
                }}>
                  AyuSetu
                </h1>
                <p className="text-sm md:text-base font-light text-white/80 leading-relaxed drop-shadow" style={{
                  textShadow: '0 2px 6px rgba(0,0,0,0.4)'
                }}>
                  Trusted Herbal Supply Chain for Bharat
                </p>
              </div>
            </div>
          </div>

          {/* BOTTOM SECTION - Trust Indicators (Left-Aligned Card) */}
          <div className="space-y-3 backdrop-blur-lg bg-white/8 p-5 md:p-6 rounded-xl border border-white/15 shadow-xl w-full max-w-sm">
            {/* Trust Indicator 1 */}
            <div className="flex items-start gap-3 group">
              <div className="w-9 h-9 rounded-full bg-emerald-400/25 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-400/35 transition-all duration-300 border border-emerald-400/40">
                <svg className="w-5 h-5 text-emerald-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white/95 leading-tight">Government Verified System</p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/10" />

            {/* Trust Indicator 2 */}
            <div className="flex items-start gap-3 group">
              <div className="w-9 h-9 rounded-full bg-emerald-400/25 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-400/35 transition-all duration-300 border border-emerald-400/40">
                <svg className="w-5 h-5 text-emerald-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white/95 leading-tight">End-to-End Secure Traceability</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Panel (60% on desktop) */}
      <div className="flex-1 lg:w-3/5 flex items-center justify-start lg:justify-center p-4 sm:p-6 lg:p-16 pt-4 sm:pt-6">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">AyuSetu</h2>
            <p className="text-xs sm:text-sm text-gray-600">Ministry of AYUSH - Government of India</p>
          </div>

          {/* Step Indicator */}
          <div className="mb-5 sm:mb-6">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                Step {step === 'role-selection' ? '1' : step === 'credentials-entry' ? '2' : '3'} of 3
              </span>
              <span className="text-xs text-gray-500">
                {step === 'role-selection' ? 'Role Selection' : step === 'credentials-entry' ? 'Credentials' : 'Verification'}
              </span>
            </div>
            <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                style={{ width: step === 'role-selection' ? '33%' : step === 'credentials-entry' ? '66%' : '100%' }}
              />
            </div>
          </div>
          {step === 'role-selection' && (
            <div className="space-y-2.5 sm:space-y-3 animate-in fade-in duration-300">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Select Your Role</h3>
              
              <div className="grid grid-cols-1 gap-2">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => handleRoleSelect(role.id)}
                    className="group relative p-3 sm:p-4 text-left rounded-lg border-2 border-gray-200 bg-white transition-all duration-200 hover:border-emerald-500 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="text-xl sm:text-2xl mt-0.5">{role.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-xs sm:text-sm">{role.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{role.description}</div>
                      </div>
                      <div className="w-4 sm:w-5 h-4 sm:h-5 rounded-full border-2 border-gray-300 group-hover:border-emerald-500 transition-colors flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Credentials Entry Step */}
          {step === 'credentials-entry' && (
            <div className="space-y-6 sm:space-y-7 animate-in fade-in duration-300">
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

              <Button
                onClick={handleSubmitCredentials}
                disabled={isLoading}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg text-base"
              >
                {isLoading ? 'Processing...' : 'Continue'}
              </Button>

              <button
                onClick={handleBackToRole}
                className="w-full text-sm text-emerald-700 hover:text-emerald-800 font-medium py-2 transition-colors"
              >
                ← Back to Role Selection
              </button>
            </div>
          )}

          {/* OTP Verification Step */}
          {step === 'otp-verification' && (
            <div className="space-y-6 sm:space-y-7 animate-in fade-in duration-300">
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
                <div className="flex items-center justify-center gap-2">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      maxLength={1}
                      className="w-12 h-14 text-center text-2xl font-bold rounded-lg border-2 border-gray-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all bg-white hover:border-gray-400"
                      autoComplete="off"
                    />
                  ))}
                </div>
              </div>

              <Button
                onClick={handleVerifyOtp}
                disabled={isLoading}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-base"
              >
                <Lock size={18} />
                {isLoading ? 'Verifying...' : 'Verify & Login'}
              </Button>

              <button
                onClick={handleBackToCredentials}
                className="w-full text-sm text-emerald-700 hover:text-emerald-800 font-medium py-2 transition-colors"
              >
                Back to Credentials
              </button>
            </div>
          )}

          {/* Security Footer */}
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-5 border-t border-gray-200">
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
        </div>
      </div>

      {/* Mobile Header - Visible on mobile only */}
      <div className="lg:hidden bg-gradient-to-r from-emerald-900 to-amber-900 text-white p-3 sm:p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-white/10 rounded-lg p-1.5 backdrop-blur-sm flex-shrink-0">
          <img 
            src={ayusetuEmblem} 
            alt="AyuSetu Emblem" 
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-bold">AyuSetu</h1>
          <p className="text-xs text-amber-200">Government of India</p>
        </div>
      </div>
    </div>
  );
};

export default AuthComponent;