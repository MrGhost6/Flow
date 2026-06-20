import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Briefcase, 
  Plane, 
  Building, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Lock, 
  Fingerprint, 
  Sparkles, 
  ShieldCheck,
  CheckCircle2,
  Mail,
  Phone,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  AlertTriangle,
  Clock,
  Camera,
  Cpu,
  Shield,
  FileText,
  Activity,
  UserCheck
} from 'lucide-react';
import { UserProfile, UserType } from '../types';
import LandingPage from './LandingPage';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

export default function SplashAndOnboarding({ onComplete }: OnboardingProps) {
  // Navigation modes: 'landing' | 'login' | 'register' | 'otp_verify' | 'forgot_password' | 'onboarding'
  const [mode, setMode] = useState<'landing' | 'login' | 'register' | 'otp_verify' | 'forgot_password' | 'onboarding'>('landing');
  const [otpPurpose, setOtpPurpose] = useState<'registration' | 'login' | 'reset-password'>('registration');
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1); // Step 1: Details, Step 2: UseCase, Step 3: KYC, Step 4: PIN & Wallets Setup

  // Auth Context Tokens
  const [verificationToken, setVerificationToken] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [otpInput, setOtpInput] = useState<string[]>(Array(6).fill(''));
  const [otpError, setOtpError] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(3);

  // Recovery States
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');
  const [newRecoveryPassword, setNewRecoveryPassword] = useState('');
  const [showRecoveryPassword, setShowRecoveryPassword] = useState(false);

  // Login States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register States
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [registerError, setRegisterError] = useState('');

  // Onboarding States
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [nationality, setNationality] = useState('Morocco');
  const [useCase, setUseCase] = useState<UserType>('freelancer');
  const [pin, setPin] = useState<string[]>(Array(6).fill(''));
  const [fingerprint, setFingerprint] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);

  // KYC States (Step 3)
  const [docType, setDocType] = useState('CNIE Moroccan ID');
  const [docNumber, setDocNumber] = useState('');
  const [isKycScanning, setIsKycScanning] = useState(false);
  const [kycScanProgress, setKycScanProgress] = useState(0);
  const [docScanFinished, setDocScanFinished] = useState(false);
  const [isFaceScanning, setIsFaceScanning] = useState(false);
  const [faceScanFinished, setFaceScanFinished] = useState(false);
  const [kycSubmitError, setKycSubmitError] = useState('');

  // References
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // OTP Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (mode === 'otp_verify' && resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer, mode]);

  // Handle individual OTP char entry
  const handleOtpCharChange = (val: string, index: number) => {
    if (!/^\d*$/.test(val)) return;
    const copied = [...otpInput];
    copied[index] = val.slice(-1);
    setOtpInput(copied);

    if (copied[index] !== '' && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && otpInput[index] === '' && index > 0) {
      const copied = [...otpInput];
      copied[index - 1] = '';
      setOtpInput(copied);
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Synchronize PIN values
  const handlePinChange = (val: string, index: number) => {
    if (!/^\d*$/.test(val)) return;
    const updatedPin = [...pin];
    updatedPin[index] = val.slice(-1);
    setPin(updatedPin);

    if (updatedPin[index] !== '' && index < 5) {
      pinRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && pin[index] === '' && index > 0) {
      const updatedPin = [...pin];
      updatedPin[index - 1] = '';
      setPin(updatedPin);
      pinRefs.current[index - 1]?.focus();
    }
  };

  // Password criteria checker
  const checkPasswordRequirements = (pw: string) => {
    return {
      length: pw.length >= 8,
      upper: /[A-Z]/.test(pw),
      lower: /[a-z]/.test(pw),
      number: /[0-9]/.test(pw),
      symbol: /[^A-Za-z0-9]/.test(pw)
    };
  };

  // Accept password if at least 4 of the 5 checks pass (len/upper/lower/number/symbol)
  const meetsPasswordGrid = (pw: string) => {
    const checks = checkPasswordRequirements(pw);
    const passed = Object.values(checks).filter(Boolean).length;
    return passed >= 4;
  };

  const getCurrencyByUseCase = (u: UserType) => {
    if (u === 'INDIVIDUAL') return 'USD';
    if (u === 'BUSINESS') return 'EUR';
    return 'MAD';
  };

  // Resend Verification code
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setOtpError('');
    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationToken })
      });
      const data = await response.json();
      if (response.ok) {
        setSimulatedOtp(data.simulatedOtp || '');
        setResendTimer(60);
        setAttemptsLeft(3);
        setOtpInput(Array(6).fill(''));
      } else {
        setOtpError(data.error || 'Failed to dispatch Code.');
      }
    } catch (err) {
      setOtpError('Failed to establish connection with security node.');
    }
  };

  // Submit numerical code
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const joinedCode = otpInput.join('');
    if (joinedCode.length < 6) {
      setOtpError('MFA PIN must be exactly 6 parameters.');
      return;
    }
    setOtpError('');

    if (otpPurpose === 'reset-password') {
      if (!meetsPasswordGrid(newRecoveryPassword)) {
        setOtpError('New password must satisfy at least 4 of 5 security checks.');
        return;
      }

      try {
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            verificationToken,
            otpCode: joinedCode,
            newPassword: newRecoveryPassword
          })
        });
        const data = await response.json();
        if (response.ok) {
          setRecoverySuccess('FLOW ledger credentials updated successfully. Please sign-in.');
          setTimeout(() => {
            setMode('login');
            // Clean
            setRecoveryEmail('');
            setNewRecoveryPassword('');
            setOtpInput(Array(6).fill(''));
            setVerificationToken('');
            setSimulatedOtp('');
          }, 3000);
        } else {
          setOtpError(data.error || 'Recovery failed.');
        }
      } catch (err) {
        setOtpError('Biometric decryption cluster failure.');
      }
      return;
    }

    // verification during signup or during new-device log-in
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationToken,
          otpCode: joinedCode
        })
      });
      const data = await response.json();
      if (response.ok) {
        // Logged in! Save fake token to simulate SecureStore
        localStorage.setItem('flow_accessToken', data.accessToken);
        localStorage.setItem('flow_refreshToken', data.refreshToken);
        localStorage.setItem('flow_user', JSON.stringify(data.user));

        if (otpPurpose === 'registration') {
          // Proceed to profile calibration step-by-step
          setFullName(registerName);
          setMode('onboarding');
          setCurrentStep(1);
        } else {
          // Logging in on new device succeeded! Continue to OS.
          onComplete({
            name: data.user.name,
            email: data.user.email,
            userType: data.user.userType,
            primaryCurrency: data.user.primaryCurrency,
            country: data.user.country
          });
        }
      } else {
        setAttemptsLeft(prev => Math.max(0, prev - 1));
        setOtpError(data.error || 'Verification code failed.');
      }
    } catch (e) {
      setOtpError('Secured network interface failure.');
    }
  };

  // Submit password recovery email
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail.trim()) {
      setRecoveryError('Please declare your email identifier.');
      return;
    }
    setRecoveryError('');
    setRecoverySuccess('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail })
      });
      const data = await response.json();
      if (response.ok) {
        if (data.verificationToken) {
          setVerificationToken(data.verificationToken);
          setSimulatedOtp(data.simulatedOtp || '');
          setOtpPurpose('reset-password');
          setMode('otp_verify');
          setAttemptsLeft(3);
          setOtpInput(Array(6).fill(''));
          setResendTimer(60);
        } else {
          // Simulation anti-enumeration
          setRecoverySuccess(data.message || 'Dispatched safely.');
        }
      } else {
        setRecoveryError(data.error || 'Failed to dispatch resetting node.');
      }
    } catch (e) {
      setRecoveryError('Secured SMS validation routes unavailable.');
    }
  };

  // Register handler (dispatches OTP)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName.trim() || !registerEmail.trim() || !registerPhone.trim() || !registerPassword.trim()) {
      setRegisterError('All credential factors are mandatory.');
      return;
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerEmail)) {
      setRegisterError('Invalid email parameter format.');
      return;
    }

    // Check password requirements
    const pwCheck = checkPasswordRequirements(registerPassword);
    if (!meetsPasswordGrid(registerPassword)) {
      setRegisterError('Password must satisfy at least 4 of 5 vault security rules.');
      return;
    }

    setRegisterError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail.toLowerCase().trim(),
          phone: registerPhone,
          password: registerPassword
        })
      });
      const data = await response.json();
      if (response.ok) {
        setVerificationToken(data.verificationToken);
        setSimulatedOtp(data.simulatedOtp || '');
        setOtpPurpose('registration');
        setMode('otp_verify');
        setAttemptsLeft(3);
        setOtpInput(Array(6).fill(''));
        setResendTimer(60);
      } else {
        setRegisterError(data.error || 'Server rejected registration keys.');
      }
    } catch (err) {
      setRegisterError('Vault server unreachable. Falling back into offline mode.');
    }
  };

  // Direct login submit handling
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Credentials missing.');
      return;
    }
    setLoginError('');

    // Generate random mock fingerprint to demonstrate device safety
    const mockFingerprint = 'hfid-' + loginEmail.substring(0, 3) + '-990';

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
          deviceName: 'Safari Browser Client',
          deviceFingerprint: mockFingerprint
        })
      });
      const data = await response.json();
      
      if (response.ok) {
        if (data.status === 'requires_otp' || data.requiresMfa) {
          // Shift to login OTP security block
          setVerificationToken(data.verificationToken);
          setSimulatedOtp(data.simulatedOtp || '');
          setOtpPurpose('login');
          setMode('otp_verify');
          setAttemptsLeft(3);
          setOtpInput(Array(6).fill(''));
          setResendTimer(60);
        } else {
          // Direct login succeeds
          localStorage.setItem('flow_accessToken', data.accessToken);
          localStorage.setItem('flow_refreshToken', data.refreshToken);
          localStorage.setItem('flow_user', JSON.stringify(data.user));

          onComplete({
            name: data.user.name,
            email: data.user.email,
            userType: data.user.userType as any,
            primaryCurrency: data.user.primaryCurrency,
            country: data.user.country
          });
        }
      } else {
        setLoginError(data.error || 'Authentication details declined.');
      }
    } catch (err) {
      setLoginError('Secure communication layer interrupted.');
    }
  };

  // Quick Demo Access triggers to bypass custom onboarding
  const handleDemoLogin = async (profileKey: 'INDIVIDUAL' | 'BUSINESS') => {
    const demoProfile = profileKey === 'INDIVIDUAL' ? {
      name: 'Anas El Amrani',
      email: 'anas@flow.io',
      userType: 'INDIVIDUAL' as const,
      primaryCurrency: 'MAD',
      country: 'Morocco'
    } : {
      name: 'Yassine Benjelloun',
      email: 'yassine@benjellouncorp.ma',
      userType: 'BUSINESS' as const,
      primaryCurrency: 'EUR',
      country: 'Morocco'
    };

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: demoProfile.email,
          password: 'flowpassword',
          bypassMfa: true
        })
      });
      const data = await res.json();
      if (data.accessToken) {
        localStorage.setItem('flow_accessToken', data.accessToken);
        localStorage.setItem('flow_refreshToken', data.refreshToken);
      }
      onComplete(demoProfile);
    } catch (e) {
      onComplete(demoProfile);
    }
  };

  // Launch Document Scan Simulation
  const handleDocumentScan = () => {
    if (!docNumber.trim()) {
      setKycSubmitError('Please fill legal document registration serial number.');
      return;
    }
    setKycSubmitError('');
    setIsKycScanning(true);
    setKycScanProgress(0);

    const interval = setInterval(() => {
      setKycScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsKycScanning(false);
          setDocScanFinished(true);
          return 100;
        }
        return prev + 10;
      });
    }, 180);
  };

  // Launch facial sweep scanner simulation
  const handleFacialScan = () => {
    setIsFaceScanning(true);
    setTimeout(() => {
      setIsFaceScanning(false);
      setFaceScanFinished(true);
    }, 2500);
  };

  // Transmit compliance dossier to API
  const handleKycSubmit = async () => {
    if (!docScanFinished || !faceScanFinished) {
      setKycSubmitError('Secure biometric mapping and OCR scan parameters required.');
      return;
    }
    setKycSubmitError('');

    try {
      const response = await fetch('/api/kyc/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType: docType,
          documentNumber: docNumber
        })
      });
      const data = await response.json();
      if (response.ok) {
        // Proceed to next onboarding step
        setCurrentStep(4);
      } else {
        setKycSubmitError(data.error || 'Submission declined by clearing house.');
      }
    } catch (e) {
      setKycSubmitError('Compliance API gateway down.');
    }
  };

  // Triggers final asset creation and starts Flow OS dashboard with computed profile parameters
  const handleFinish = async () => {
    setIsProvisioning(true);
    
    const computedProfile: UserProfile = {
      name: fullName || registerName || 'Anas El Amrani',
      email: registerEmail || `${(fullName || 'anas').toLowerCase().replace(/\s+/g, '')}@flow.io`,
      userType: useCase,
      primaryCurrency: getCurrencyByUseCase(useCase),
      country: nationality === 'Morocco' ? 'Morocco' : 'International',
    };

    // Stagger a gorgeous asset provision simulation
    setTimeout(async () => {
      try {
        await fetch('/api/users/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userType: useCase,
            primaryCurrency: computedProfile.primaryCurrency,
            status: 'active'
          })
        });
      } catch (err) {
        // Ignored fallback
      }
      setIsProvisioning(false);
      onComplete(computedProfile);
    }, 3500);
  };

  const getStepProgressWidth = () => {
    if (currentStep === 1) return '0%';
    if (currentStep === 2) return '33%';
    if (currentStep === 3) return '66%';
    return '100%';
  };

  const activePwChecks = checkPasswordRequirements(registerPassword);
  const activeRecoveryPwChecks = checkPasswordRequirements(newRecoveryPassword);

  if (mode === 'landing') {
    return (
      <LandingPage
        onGetStarted={() => setMode('register')}
        onLoginClick={() => setMode('login')}
        onDemoLogin={handleDemoLogin}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#080D14] text-white flex flex-col justify-between overflow-x-hidden relative font-sans selection:bg-[#00E0C7]/20 selection:text-white">
      {/* Glow Effects */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-radial from-[#1E90FF]/12 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-radial from-[#7B5CFF]/12 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-[35%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[35%] h-[35%] rounded-full bg-radial from-[#00E0C7]/5 to-transparent blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-5xl mx-auto px-6 py-5 flex justify-between items-center z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-[#1E90FF] to-[#7B5CFF] rounded-lg flex items-center justify-center shadow-lg shadow-[#1e90ff]/10">
            <svg className="w-5 h-5 text-white" viewBox="0 0 100 100" fill="none">
              <path
                d="M30 25C30 25 55 25 65 35C75 45 65 55 50 55C35 55 25 65 35 75C45 85 70 85 70 85"
                stroke="white"
                strokeWidth="11"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight">FLOW</span>
            <span className="text-[8px] font-mono tracking-widest text-[#00E0C7] block uppercase">Financial Core</span>
          </div>
        </div>

        {mode !== 'onboarding' ? (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 font-mono hidden sm:inline uppercase">SANDBOX WORKSPACE</span>
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          </div>
        ) : (
          <button 
            type="button"
            onClick={() => {
              setFullName('Anas El Amrani');
              setDob('1998-05-12');
              setNationality('Morocco');
              setUseCase('freelancer');
              setCurrentStep(4);
            }}
            className="text-xs text-gray-400 hover:text-[#00E0C7] transition-all font-mono tracking-wider uppercase flex items-center gap-1.5 group font-semibold"
          >
            <span>Bypass Calibration</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-4 flex flex-col justify-center z-10 transition-all duration-300">
        
        <AnimatePresence mode="wait">
          
          {/* LOGIN SCREEN */}
          {mode === 'login' && (
            <motion.div
              key="login-screen"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
            >
              {/* Left Brand Panel */}
              <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-8 bg-gradient-to-b from-[#131722]/80 to-[#10141f]/30 border border-white/5 rounded-3xl relative overflow-hidden group">
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-radial from-[#7B5CFF]/10 to-transparent blur-2xl pointer-events-none" />
                
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gradient-to-tr from-[#1E90FF] to-[#7B5CFF] rounded-md flex items-center justify-center p-[1px]">
                      <span className="font-mono text-[10px] text-white font-bold">F</span>
                    </div>
                    <span className="text-xs font-mono font-bold tracking-widest text-[#00E0C7] uppercase">Premium Ledger OS</span>
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-white tracking-tight leading-snug">Continuous finance for global creators.</h3>
                    <p className="text-xs text-gray-400 mt-2 font-sans leading-relaxed">FLOW brings interbank liquidity, automated multi-currency invoicing, and real-time ledger accounting directly to your fingertips.</p>
                  </div>
                </div>

                <div className="space-y-4 my-8">
                  <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#00E0C7]/15 flex items-center justify-center text-[#00E0C7] shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-white">0.1% FX Markups</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">Absolute lowest spreads across MAD-USD-EUR paths.</p>
                    </div>
                  </div>
                  
                  <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#7B5CFF]/15 flex items-center justify-center text-[#7B5CFF] shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-white">Biometric Vault Guards</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">Secure on-device pin locks & RLS database encryption.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 text-[9px] text-gray-500 font-mono uppercase tracking-widest font-semibold">
                  FLOW Tech OS · PCI-DSS Compliant
                </div>
              </div>

              {/* Right Login Panel */}
              <div className="col-span-12 lg:col-span-7 flex flex-col justify-center max-w-md mx-auto lg:mx-0 lg:max-w-none w-full">
                <div className="mb-6">
                  <span className="text-[#00E0C7] font-mono text-[9px] uppercase tracking-widest block mb-1 font-bold">WELCOME BACK TO LIQUIDITY</span>
                  <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Sign in to your vault</h1>
                  <p className="text-xs sm:text-sm text-gray-400">Enter secure credentials to open your real-time transactions ledger.</p>
                </div>

                {loginError && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4 bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-md">
                  
                  {/* Email */}
                  <div className="group">
                    <label htmlFor="login-email-input" className="block text-[10px] uppercase tracking-widest font-mono text-gray-400 mb-1.5 transition-colors group-focus-within:text-[#00E0C7]">
                      Email Address
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="w-4 h-4 text-gray-500 absolute left-3 pointer-events-none group-focus-within:text-[#00E0C7] transition-colors" />
                      <input 
                        type="email" 
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="e.g. anas@flow.io"
                        className="w-full bg-black/40 border border-white/10 focus:border-[#00E0C7] text-white pl-10 pr-4 py-3 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#00E0C7] transition-all font-sans"
                        id="login-email-input"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="group">
                    <div className="flex justify-between items-center mb-1.5">
                      <label htmlFor="login-password-input" className="block text-[10px] uppercase tracking-widest font-mono text-gray-400 transition-colors group-focus-within:text-[#00E0C7]">
                        Secret Password
                      </label>
                      <button 
                        type="button" 
                        onClick={() => setMode('forgot_password')} 
                        className="text-[10px] font-semibold text-[#00E0C7] hover:underline"
                      >
                        Forgot your password?
                      </button>
                    </div>
                    <div className="relative flex items-center">
                      <Lock className="w-4 h-4 text-gray-500 absolute left-3 pointer-events-none group-focus-within:text-[#00E0C7] transition-colors" />
                      <input 
                        type={showLoginPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-black/40 border border-white/10 focus:border-[#00E0C7] text-white pl-10 pr-10 py-3 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#00E0C7] transition-all font-sans"
                        id="login-password-input"
                        required
                      />
                      <button 
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="p-1 text-gray-500 hover:text-white absolute right-3 hover:scale-105 transition-transform"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3.5 mt-2 bg-gradient-to-r from-[#1E90FF] to-[#7B5CFF] text-white font-semibold text-xs uppercase tracking-wider rounded-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-[0_4px_15px_rgba(30,144,255,0.2)] cursor-pointer"
                    id="login-submit-btn"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Open Personal Vault</span>
                  </button>
                </form>

                {/* Instant Presets for easy navigation / review */}
                <div className="mt-6 text-center lg:text-left">
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-2.5 font-bold">FAST-PASS PRESET DEMO PROFILES</span>
                  <div className="grid grid-cols-2 gap-3 max-w-md mx-auto lg:mx-0">
                    <button
                      onClick={() => handleDemoLogin('INDIVIDUAL')}
                      className="px-3.5 py-3 border border-[#00E0C7]/20 hover:border-[#00E0C7] bg-[#00E0C7]/5 rounded-xl text-left transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <div className="text-[9px] font-mono font-bold text-[#00E0C7] uppercase leading-none">Anas El Amrani</div>
                      <div className="text-[10px] font-semibold text-white mt-1">Freelancer (DH)</div>
                      <div className="text-[8px] text-gray-400 mt-1 uppercase font-mono tracking-wider">Morocco Base</div>
                    </button>
                    <button
                      onClick={() => handleDemoLogin('BUSINESS')}
                      className="px-3.5 py-3 border border-[#7B5CFF]/20 hover:border-[#7b5cff] bg-[#7B5CFF]/5 rounded-xl text-left transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <div className="text-[9px] font-mono font-bold text-[#7B5CFF] uppercase leading-none">Y. Benjelloun</div>
                      <div className="text-[10px] font-semibold text-white mt-1">Enterprise (EUR)</div>
                      <div className="text-[8px] text-gray-400 mt-1 uppercase font-mono tracking-wider">0% Export VAT</div>
                    </button>
                  </div>
                </div>

                {/* Switch to Register */}
                <div className="mt-6 text-center lg:text-left py-2 border-t border-white/[0.03] max-w-md mx-auto lg:mx-0">
                  <p className="text-xs text-gray-400">
                    New to FLOW?{' '}
                    <button 
                      onClick={() => {
                        setMode('register');
                        setRegisterError('');
                      }}
                      className="text-[#00E0C7] hover:underline font-semibold cursor-pointer"
                    >
                      Create a secure account
                    </button>
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* REGISTER SCREEN */}
          {mode === 'register' && (
            <motion.div
              key="register-screen"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
            >
              {/* Left Brand Panel */}
              <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-8 bg-gradient-to-b from-[#131722]/80 to-[#10141f]/30 border border-white/5 rounded-3xl relative overflow-hidden group">
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-radial from-[#1E90FF]/10 to-transparent blur-2xl pointer-events-none" />
                
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gradient-to-tr from-[#1E90FF] to-[#7B5CFF] rounded-md flex items-center justify-center p-[1px]">
                      <span className="font-mono text-[10px] text-white font-bold">F</span>
                    </div>
                    <span className="text-xs font-mono font-bold tracking-widest text-[#00E0C7] uppercase">Interactive Setup</span>
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-white tracking-tight leading-snug">The finance stack you deserve.</h3>
                    <p className="text-xs text-gray-400 mt-2 font-sans leading-relaxed">Register to join the modern ecosystem. We will configure your high-performance multi-currency assets immediately after calibration.</p>
                  </div>
                </div>

                {/* Interactive Password Requirements Progress Area */}
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">Vault Security Audit Guidelines</h4>
                  <div className="space-y-1.5 text-[10px]">
                    <div className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border ${activePwChecks.length ? 'bg-[#00E0C7]/10 border-[#00E0C7] text-[#00E0C7]' : 'border-white/10 text-gray-500'}`}>
                        {activePwChecks.length && <Check className="w-2.5 h-2.5 stroke-[4px]" />}
                      </div>
                      <span className={activePwChecks.length ? 'text-[#00E0C7]' : 'text-gray-400'}>Minimum 8 characters</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border ${activePwChecks.upper ? 'bg-[#00E0C7]/10 border-[#00E0C7] text-[#00E0C7]' : 'border-white/10 text-gray-500'}`}>
                        {activePwChecks.upper && <Check className="w-2.5 h-2.5 stroke-[4px]" />}
                      </div>
                      <span className={activePwChecks.upper ? 'text-[#00E0C7]' : 'text-gray-400'}>At least one CAPITAL letter</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border ${activePwChecks.lower ? 'bg-[#00E0C7]/10 border-[#00E0C7] text-[#00E0C7]' : 'border-white/10 text-gray-500'}`}>
                        {activePwChecks.lower && <Check className="w-2.5 h-2.5 stroke-[4px]" />}
                      </div>
                      <span className={activePwChecks.lower ? 'text-[#00E0C7]' : 'text-gray-400'}>At least one lowercase letter</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border ${activePwChecks.number ? 'bg-[#00E0C7]/10 border-[#00E0C7] text-[#00E0C7]' : 'border-white/10 text-gray-500'}`}>
                        {activePwChecks.number && <Check className="w-2.5 h-2.5 stroke-[4px]" />}
                      </div>
                      <span className={activePwChecks.number ? 'text-[#00E0C7]' : 'text-gray-400'}>At least one numerical digit</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border ${activePwChecks.symbol ? 'bg-[#00E0C7]/10 border-[#00E0C7] text-[#00E0C7]' : 'border-white/10 text-gray-500'}`}>
                        {activePwChecks.symbol && <Check className="w-2.5 h-2.5 stroke-[4px]" />}
                      </div>
                      <span className={activePwChecks.symbol ? 'text-[#00E0C7]' : 'text-gray-400'}>At least one special symbol (#,@,$,etc)</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 text-[9px] text-gray-500 font-mono uppercase tracking-widest font-semibold">
                  FLOW FinTech Corp · Casablanca/London
                </div>
              </div>

              {/* Right Register Panel */}
              <div className="col-span-12 lg:col-span-7 flex flex-col justify-center max-w-md mx-auto lg:mx-0 lg:max-w-none w-full">
                <div className="mb-6">
                  <span className="text-[#7B5CFF] font-mono text-[9px] uppercase tracking-widest block mb-1 font-bold">ESTABLISH DIGITAL IDENTITY</span>
                  <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Create your FLOW account</h1>
                  <p className="text-xs sm:text-sm text-gray-400">Join freelancers and remote businesses managing money at infinite speed.</p>
                </div>

                {registerError && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-300" />
                    <span>{registerError}</span>
                  </div>
                )}

                <form onSubmit={handleRegisterSubmit} className="space-y-4 bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-md">
                  
                  {/* Full Name */}
                  <div className="group">
                    <label htmlFor="register-name-input" className="block text-[10px] uppercase tracking-widest font-mono text-gray-400 mb-1.5 transition-colors group-focus-within:text-[#00E0C7]">
                      Full Legal Name
                    </label>
                    <div className="relative flex items-center">
                      <User className="w-4 h-4 text-gray-500 absolute left-3 pointer-events-none group-focus-within:text-[#00E0C7] transition-colors" />
                      <input 
                        type="text" 
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        placeholder="Anas El Amrani"
                        className="w-full bg-black/40 border border-white/10 focus:border-[#00E0C7] text-white pl-10 pr-4 py-3 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#00E0C7] transition-all font-sans"
                        id="register-name-input"
                        required
                      />
                    </div>
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="group">
                      <label htmlFor="register-email-input" className="block text-[10px] uppercase tracking-widest font-mono text-gray-400 mb-1.5 transition-colors group-focus-within:text-[#00E0C7]">
                        Email Address
                      </label>
                      <div className="relative flex items-center">
                        <Mail className="w-4 h-4 text-gray-500 absolute left-3 pointer-events-none group-focus-within:text-[#00E0C7] transition-colors" />
                        <input 
                          type="email" 
                          value={registerEmail}
                          onChange={(e) => setRegisterEmail(e.target.value)}
                          placeholder="anas@flow.io"
                          className="w-full bg-black/40 border border-white/10 focus:border-[#00E0C7] text-white pl-10 pr-4 py-3 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#00E0C7] transition-all font-sans"
                          id="register-email-input"
                          required
                        />
                      </div>
                    </div>

                    <div className="group">
                      <label htmlFor="register-phone-input" className="block text-[10px] uppercase tracking-widest font-mono text-gray-400 mb-1.5 transition-colors group-focus-within:text-[#00E0C7]">
                        Phone Number
                      </label>
                      <div className="relative flex items-center">
                        <Phone className="w-4 h-4 text-gray-500 absolute left-3 pointer-events-none group-focus-within:text-[#00E0C7] transition-colors" />
                        <input 
                          type="text" 
                          value={registerPhone}
                          onChange={(e) => setRegisterPhone(e.target.value)}
                          placeholder="+212 600000000"
                          className="w-full bg-black/40 border border-white/10 focus:border-[#00E0C7] text-white pl-10 pr-4 py-3 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#00E0C7] transition-all font-sans"
                          id="register-phone-input"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="group">
                    <label htmlFor="register-password-input" className="block text-[10px] uppercase tracking-widest font-mono text-gray-400 mb-1.5 transition-colors group-focus-within:text-[#00E0C7]">
                      Choose Account Password
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="w-4 h-4 text-gray-500 absolute left-3 pointer-events-none group-focus-within:text-[#00E0C7] transition-colors" />
                      <input 
                        type={showRegisterPassword ? 'text' : 'password'}
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        placeholder="Must meet strength guidelines"
                        className="w-full bg-black/40 border border-white/10 focus:border-[#00E0C7] text-white pl-10 pr-10 py-3 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#00E0C7] transition-all font-sans"
                        id="register-password-input"
                        required
                      />
                      <button 
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="p-1 text-gray-500 hover:text-white absolute right-3 hover:scale-105 transition-transform"
                      >
                        {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3.5 mt-2 bg-gradient-to-r from-[#1E90FF] to-[#7B5CFF] text-white font-semibold text-xs uppercase tracking-wider rounded-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-[0_4px_15px_rgba(123,92,255,0.2)] cursor-pointer"
                    id="register-submit-btn"
                  >
                    <span>Register Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>

                {/* Switch to Login */}
                <div className="mt-6 text-center lg:text-left py-2 border-t border-white/[0.03] max-w-md mx-auto lg:mx-0">
                  <p className="text-xs text-gray-400">
                    Already have an account?{' '}
                    <button 
                      onClick={() => {
                        setMode('login');
                        setLoginError('');
                      }}
                      className="text-[#00E0C7] hover:underline font-semibold cursor-pointer"
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* FORGOT PASSWORD SCREEN */}
          {mode === 'forgot_password' && (
            <motion.div
              key="forgot-password"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-md mx-auto w-full"
            >
              <div className="mb-6 text-center">
                <span className="text-[#00E0C7] font-mono text-[9px] uppercase tracking-widest block mb-1 font-bold">SECURE VAULT RESET</span>
                <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Password Recovery</h1>
                <p className="text-xs sm:text-sm text-gray-400">Input your account's email addresses to request dual path cryptographic reset code.</p>
              </div>

              {recoveryError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{recoveryError}</span>
                </div>
              )}

              {recoverySuccess && (
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{recoverySuccess}</span>
                </div>
              )}

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-md">
                
                {/* Email */}
                <div className="group">
                  <label htmlFor="recovery-email-input" className="block text-[10px] uppercase tracking-widest font-mono text-gray-400 mb-1.5 transition-colors group-focus-within:text-[#00E0C7]">
                    Account Email Address
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-gray-500 absolute left-3 pointer-events-none group-focus-within:text-[#00E0C7] transition-colors" />
                    <input 
                      type="email" 
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="e.g. anas@flow.io"
                      className="w-full bg-black/40 border border-white/10 focus:border-[#00E0C7] text-white pl-10 pr-4 py-3 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#00E0C7] transition-all font-sans"
                      id="recovery-email-input"
                      required
                    />
                  </div>
                </div>

                {/* Password parameters for when OTP screen updates */}
                <div className="group">
                  <label htmlFor="recovery-newpassword-input" className="block text-[10px] uppercase tracking-widest font-mono text-gray-400 mb-1.5 transition-colors group-focus-within:text-[#00E0C7]">
                    Declare New Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-gray-500 absolute left-3 pointer-events-none group-focus-within:text-[#00E0C7] transition-colors" />
                    <input 
                      type={showRecoveryPassword ? 'text' : 'password'}
                      value={newRecoveryPassword}
                      onChange={(e) => setNewRecoveryPassword(e.target.value)}
                      placeholder="At least 8 parameters"
                      className="w-full bg-black/40 border border-white/10 focus:border-[#00E0C7] text-white pl-10 pr-10 py-3 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#00E0C7] transition-all font-sans"
                      id="recovery-newpassword-input"
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowRecoveryPassword(!showRecoveryPassword)}
                      className="p-1 text-gray-500 hover:text-white absolute right-3 hover:scale-105 transition-transform"
                    >
                      {showRecoveryPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Recovery Passwords Strength checklist tracker */}
                {newRecoveryPassword && (
                  <div className="p-3 bg-black/20 rounded-xl space-y-1.5 text-[9px] font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className={activeRecoveryPwChecks.length ? 'text-[#00E0C7]' : 'text-gray-500'}>
                        {activeRecoveryPwChecks.length ? '✓' : '○'} Length &ge; 8
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={activeRecoveryPwChecks.upper ? 'text-[#00E0C7]' : 'text-gray-500'}>
                        {activeRecoveryPwChecks.upper ? '✓' : '○'} Uppercase
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={activeRecoveryPwChecks.lower ? 'text-[#00E0C7]' : 'text-gray-500'}>
                        {activeRecoveryPwChecks.lower ? '✓' : '○'} Lowercase
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={activeRecoveryPwChecks.number ? 'text-[#00E0C7]' : 'text-gray-500'}>
                        {activeRecoveryPwChecks.number ? '✓' : '○'} Number
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={activeRecoveryPwChecks.symbol ? 'text-[#00E0C7]' : 'text-gray-500'}>
                        {activeRecoveryPwChecks.symbol ? '✓' : '○'} Symbol
                      </span>
                    </div>
                  </div>
                )}

                <button 
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-[#1E90FF] to-[#7B5CFF] text-white font-semibold text-xs uppercase tracking-wider rounded-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-[0_4px_15px_rgba(30,144,255,0.2)] cursor-pointer"
                >
                  <span>Request Reset PIN</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              <div className="mt-6 text-center">
                <button 
                  type="button" 
                  onClick={() => setMode('login')} 
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Back to Sign In
                </button>
              </div>
            </motion.div>
          )}

          {/* OTP VERIFY SCREEN */}
          {mode === 'otp_verify' && (
            <motion.div
              key="otp-verify"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-md mx-auto w-full"
            >
              {/* Floating received SMS simulation */}
              {simulatedOtp && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 rounded-2xl bg-[#00E0C7]/10 border border-[#00E0C7]/20 flex items-center justify-between gap-3 text-xs text-white"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#00E0C7] animate-ping shrink-0" aria-label="Simulated OTP indicator" />
                    <span className="font-mono text-gray-400 uppercase tracking-wider">Simulated Message:</span>
                    <span className="font-mono font-bold text-[#00E0C7] tracking-widest">{simulatedOtp}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => {
                      const chars = simulatedOtp.split('');
                      setOtpInput(chars);
                    }}
                    className="px-2.5 py-1 rounded bg-[#00E0C7]/20 text-[#00E0C7] hover:bg-[#00E0C7]/30 transition-all font-mono font-bold uppercase text-[10px] cursor-pointer"
                  >
                    Auto Fill PIN
                  </button>
                </motion.div>
              )}

              <div className="text-center mb-6">
                <span className="text-[#00E0C7] font-mono text-[9px] uppercase tracking-widest block mb-1 font-bold">MULTI-FACTOR AUTHORIZATION ACTIVE</span>
                <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Security Verification</h1>
                <p className="text-xs text-gray-400">
                  {otpPurpose === 'registration' 
                    ? "Enter the 6-digit confirmation code dispatched to establish your legal FLOW operating identity."
                    : otpPurpose === 'reset-password'
                      ? "Verify dual authentication code to safely override and lock down credit factors."
                      : "Security Alert: New device signature detected. Input confirmation code to log in."
                  }
                </p>
              </div>

              {otpError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{otpError}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtpSubmit} className="space-y-6 bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-md">
                
                {/* 6 Grid Inputs */}
                <div>
                  <p className="block text-[10px] uppercase font-mono tracking-widest text-center text-gray-400 mb-4 font-bold">
                    6-DIGIT MFA PIN SECURITY CHECK
                  </p>
                  <div className="flex justify-center gap-2 sm:gap-3">
                    {otpInput.map((digit, index) => (
                      <input 
                        key={index}
                        ref={(el) => { otpRefs.current[index] = el; }}
                        type="text"
                        pattern="\d*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpCharChange(e.target.value, index)}
                        onKeyDown={(e) => handleOtpKeyDown(e, index)}
                        className="w-11 h-12 sm:w-12 sm:h-14 bg-black/45 border border-white/10 focus:border-[#00E0C7] text-white text-center text-lg sm:text-xl font-mono font-bold rounded-xl focus:outline-none focus:ring-1 focus:ring-[#00E0C7] transition-all"
                        placeholder="•"
                        aria-label={`Digit ${index + 1}`}
                        required
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 py-1">
                  <span>Attempts Left: <strong className="text-[#00E0C7]">{attemptsLeft}</strong></span>
                  <button 
                    type="button" 
                    onClick={handleResendOtp}
                    disabled={resendTimer > 0}
                    className={`font-semibold uppercase ${resendTimer > 0 ? 'text-gray-600 cursor-not-allowed' : 'text-[#00E0C7] hover:underline cursor-pointer'}`}
                  >
                    {resendTimer > 0 ? `Resend Code in ${resendTimer}s` : 'Resend Code'}
                  </button>
                </div>

                <button 
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-[#1E90FF] to-[#7B5CFF] text-white font-semibold text-xs uppercase tracking-wider rounded-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-[0_4px_15px_rgba(30,144,255,0.2)] cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  <span>Authenticate & Open Vault</span>
                </button>
              </form>

              <div className="mt-6 text-center">
                <button 
                  type="button" 
                  onClick={() => {
                    setMode('login');
                    setOtpInput(Array(6).fill(''));
                    setOtpError('');
                  }} 
                  className="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel & Sign Out
                </button>
              </div>
            </motion.div>
          )}

          {/* ONBOARDING FLOW */}
          {mode === 'onboarding' && (
            <motion.div
              key="onboarding-flow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              {/* Progress Stepper Section */}
              {currentStep <= 3 && (
                <div className="w-full max-w-xl mx-auto mb-10 flex items-center justify-between relative px-2 animate-fade-in">
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-white/5 -z-10 rounded-full" />
                  <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-[#1E90FF] to-[#00E0C7] transition-all duration-500 ease-out -z-10 rounded-full"
                    style={{ width: getStepProgressWidth() }}
                  />

                  {/* Step 1 Badge */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-semibold ring-4 ring-[#080D14] transition-all duration-300 ${
                      currentStep > 1 
                        ? 'bg-[#1E90FF] text-white' 
                        : currentStep === 1 
                          ? 'bg-[#00E0C7] text-black shadow-[0_0_15px_rgba(0,224,199,0.455)] font-bold' 
                          : 'bg-white/5 text-gray-400'
                    }`}>
                      {currentStep > 1 ? <Check className="w-4 h-4" /> : '1'}
                    </div>
                    <span className={`text-[10px] font-mono uppercase tracking-wider hidden sm:block ${currentStep === 1 ? 'text-[#00E0C7]' : 'text-gray-500'}`}>Identity</span>
                  </div>

                  {/* Step 2 Badge */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-semibold ring-4 ring-[#080D14] transition-all duration-300 ${
                      currentStep > 2 
                        ? 'bg-[#1E90FF] text-white'
                        : currentStep === 2 
                          ? 'bg-[#00E0C7] text-black shadow-[0_0_15px_rgba(0,224,199,0.455)] font-bold'
                          : 'bg-white/5 text-gray-400'
                    }`}>
                      {currentStep > 2 ? <Check className="w-4 h-4" /> : '2'}
                    </div>
                    <span className={`text-[10px] font-mono uppercase tracking-wider hidden sm:block ${currentStep === 2 ? 'text-[#00E0C7]' : 'text-gray-500'}`}>UseCase</span>
                  </div>

                  {/* Step 3 Badge */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-semibold ring-4 ring-[#080D14] transition-all duration-300 ${
                      currentStep > 3 
                        ? 'bg-[#1E90FF] text-white' 
                        : currentStep === 3 
                          ? 'bg-[#00E0C7] text-black shadow-[0_0_15px_rgba(0,224,199,0.455)] font-bold' 
                          : 'bg-white/5 text-gray-400'
                    }`}>
                      {currentStep > 3 ? <Check className="w-4 h-4" /> : '3'}
                    </div>
                    <span className={`text-[10px] font-mono uppercase tracking-wider hidden sm:block ${currentStep === 3 ? 'text-[#00E0C7]' : 'text-gray-500'}`}>KYC Check</span>
                  </div>
                </div>
              )}

              {/* Dynamic Steps Container */}
              <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full">
                <AnimatePresence mode="wait">
                  
                  {/* STEP 1: Personal Details */}
                  {currentStep === 1 && (
                    <motion.div
                      key="onb-step-1"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="w-full"
                    >
                      <div className="mb-6">
                        <h1 className="text-3xl font-semibold tracking-tight text-white mb-2 font-sans select-none">
                          Let's build your profile.
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-400 font-sans">
                          We need a few details to verify your identity and secure your digital cash flows under Rabat Article 92 compliance.
                        </p>
                      </div>

                      <div className="space-y-6 w-full bg-white/[0.02] border border-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-md">
                        
                        {/* Name field */}
                        <div className="relative group">
                          <label htmlFor="fullname-input-field" className="block text-xs uppercase tracking-widest font-mono text-gray-400 mb-2 transition-colors group-focus-within:text-[#00E0C7]">
                            Full Legal Name
                          </label>
                          <div className="relative flex items-center">
                            <User className="w-5 h-5 text-gray-500 absolute left-3 pointer-events-none group-focus-within:text-[#00E0C7] transition-colors" />
                            <input 
                              type="text" 
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              placeholder="As it appears on official documents"
                              className="w-full bg-black/45 border border-white/15 focus:border-[#00E0C7] text-white pl-11 pr-4 py-3 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#00E0C7] transition-all font-sans"
                              id="fullname-input-field"
                            />
                          </div>
                        </div>

                        {/* DOB and nationality inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="relative group">
                            <label htmlFor="dob-input-field" className="block text-xs uppercase tracking-widest font-mono text-gray-400 mb-2 transition-colors group-focus-within:text-[#00E0C7]">
                              Date of Birth
                            </label>
                            <input 
                              type="date"
                              value={dob}
                              onChange={(e) => setDob(e.target.value)}
                              className="w-full bg-black/45 border border-white/15 focus:border-[#00E0C7] text-white px-4 py-3 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#00E0C7] transition-all font-mono [color-scheme:dark]"
                              id="dob-input-field"
                              required
                            />
                          </div>

                          <div className="relative group">
                            <label htmlFor="nationality-dropdown-field" className="block text-xs uppercase tracking-widest font-mono text-gray-400 mb-2 transition-colors group-focus-within:text-[#00E0C7]">
                              Nationality / Location
                            </label>
                            <select
                              value={nationality}
                              onChange={(e) => setNationality(e.target.value)}
                              className="w-full bg-black/45 border border-white/15 focus:border-[#00E0C7] text-white px-4 py-3 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#00E0C7] transition-all font-sans"
                              id="nationality-dropdown-field"
                            >
                              <option value="Morocco">Morocco (MAD Base)</option>
                              <option value="US">United States (USD Base)</option>
                              <option value="EU">European Union (EUR Base)</option>
                              <option value="UK">United Kingdom (GBP Base)</option>
                            </select>
                          </div>
                        </div>

                      </div>

                      {/* Continue Actions */}
                      <div className="mt-8 pt-4 flex justify-end">
                        <button 
                          onClick={() => {
                            if (!fullName.trim() || !dob) {
                              setRegisterError('Profile tokens cannot remain empty.');
                              return;
                            }
                            setRegisterError('');
                            setCurrentStep(2);
                          }}
                          className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#1E90FF] to-[#7B5CFF] text-white font-semibold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 shadow-[0_4px_20px_rgba(30,144,255,0.3)] cursor-pointer"
                          id="btn-onboarding-continue-1"
                        >
                          <span>Continue Setup</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 2: Choose Persona / Use-case */}
                  {currentStep === 2 && (
                    <motion.div
                      key="onb-step-2"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="w-full"
                    >
                      <div className="mb-6">
                        <span className="text-[#00E0C7] font-mono text-[9px] uppercase tracking-widest block mb-1 font-bold">FLOW MULTI-ROUTING ENGINE</span>
                        <h1 className="text-3xl font-semibold tracking-tight text-white mb-2 font-sans">
                          How will you use FLOW?
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-400 font-sans">
                          Tailoring your premium experience to your specific financial velocity.
                        </p>
                      </div>

                      <div className="space-y-4">
                        {/* Freelance selection card */}
                        <div 
                          onClick={() => setUseCase('freelancer')}
                          className={`p-5 rounded-2xl border transition-all duration-300 flex items-start gap-4 cursor-pointer relative overflow-hidden group ${
                            useCase === 'freelancer'
                              ? 'bg-[#131722]/85 border-[#00E0C7] shadow-[0_0_25px_rgba(0,224,199,0.12)]'
                              : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10'
                          }`}
                          id="usecase-card-freelancer"
                        >
                          <div className={`p-3 rounded-full shrink-0 transition-colors ${
                            useCase === 'freelancer' ? 'bg-[#00E0C7]/15 text-[#00E0C7]' : 'bg-white/5 text-gray-400'
                          }`}>
                            <Briefcase className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm sm:text-base text-white">Freelance &amp; Remote Worker</h3>
                            <p className="text-xs text-gray-400 mt-1">Direct wire clearance structures, exporter invoice generators, tax declarations, and interbank DH exchange pools.</p>
                            <span className="text-[9px] font-mono text-[#00E0C7] uppercase font-bold mt-2 inline-block">Monthly Transfer Limit: 150,000 DH</span>
                          </div>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                            useCase === 'freelancer' ? 'bg-[#00E0C7] border-[#00E0C7] text-black' : 'border-white/20'
                          }`}>
                            {useCase === 'freelancer' && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                          </div>
                        </div>

                        {/* Travel selection card */}
                        <div 
                          onClick={() => setUseCase('traveler')}
                          className={`p-5 rounded-2xl border transition-all duration-300 flex items-start gap-4 cursor-pointer relative overflow-hidden group ${
                            useCase === 'traveler'
                              ? 'bg-[#131722]/85 border-[#00E0C7] shadow-[0_0_25px_rgba(0,224,199,0.12)]'
                              : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10'
                          }`}
                          id="usecase-card-traveler"
                        >
                          <div className={`p-3 rounded-full shrink-0 transition-colors ${
                            useCase === 'traveler' ? 'bg-[#00E0C7]/15 text-[#00E0C7]' : 'bg-white/5 text-gray-400'
                          }`}>
                            <Plane className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm sm:text-base text-white">Global Travelers</h3>
                            <p className="text-xs text-gray-400 mt-1">Zero FX spreads, multiple foreign ledger paths, instant currency swapping, and global contactless travel cards.</p>
                            <span className="text-[9px] font-mono text-[#00E0C7] uppercase font-bold mt-2 inline-block">Monthly Transfer Limit: $15,000</span>
                          </div>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                            useCase === 'traveler' ? 'bg-[#00E0C7] border-[#00E0C7] text-black' : 'border-white/20'
                          }`}>
                            {useCase === 'traveler' && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                          </div>
                        </div>

                        {/* Corporate selection card */}
                        <div 
                          onClick={() => setUseCase('business')}
                          className={`p-5 rounded-2xl border transition-all duration-300 flex items-start gap-4 cursor-pointer relative overflow-hidden group ${
                            useCase === 'business'
                              ? 'bg-[#131722]/85 border-[#00E0C7] shadow-[0_0_25px_rgba(0,224,199,0.12)]'
                              : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10'
                          }`}
                          id="usecase-card-business"
                        >
                          <div className={`p-3 rounded-full shrink-0 transition-colors ${
                            useCase === 'business' ? 'bg-[#00E0C7]/15 text-[#00E0C7]' : 'bg-white/5 text-gray-400'
                          }`}>
                            <Building className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm sm:text-base text-white">Small &amp; Medium Businesses</h3>
                            <p className="text-xs text-gray-400 mt-1">Unified payroll, 0% VAT export accounting registers, high volume wire routing channels, and dedicated account manager.</p>
                            <span className="text-[9px] font-mono text-[#00E0C7] uppercase font-bold mt-2 inline-block">Monthly Transfer Limit: &euro;500,000</span>
                          </div>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                            useCase === 'business' ? 'bg-[#00E0C7] border-[#00E0C7] text-black' : 'border-white/20'
                          }`}>
                            {useCase === 'business' && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                          </div>
                        </div>

                        {/* Student selection card */}
                        <div 
                          onClick={() => setUseCase('student')}
                          className={`p-5 rounded-2xl border transition-all duration-300 flex items-start gap-4 cursor-pointer relative overflow-hidden group ${
                            useCase === 'student'
                              ? 'bg-[#131722]/85 border-[#00E0C7] shadow-[0_0_25px_rgba(0,224,199,0.12)]'
                              : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10'
                          }`}
                          id="usecase-card-student"
                        >
                          <div className={`p-3 rounded-full shrink-0 transition-colors ${
                            useCase === 'student' ? 'bg-[#00E0C7]/15 text-[#00E0C7]' : 'bg-white/5 text-gray-400'
                          }`}>
                            <UserCheck className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm sm:text-base text-white">Personal / Student Dashboard</h3>
                            <p className="text-xs text-gray-400 mt-1">Daily micro-budgets tracker, instant peer transfers with QR codes, and zero maintenance fees.</p>
                            <span className="text-[9px] font-mono text-[#00E0C7] uppercase font-bold mt-2 inline-block">Monthly Transfer Limit: 5,000 DH</span>
                          </div>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                            useCase === 'student' ? 'bg-[#00E0C7] border-[#00E0C7] text-black' : 'border-white/20'
                          }`}>
                            {useCase === 'student' && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                          </div>
                        </div>
                      </div>

                      {/* Stepper controls */}
                      <div className="mt-8 pt-4 flex justify-between items-center border-t border-white/5">
                        <button 
                          onClick={() => setCurrentStep(1)}
                          className="text-xs uppercase font-mono tracking-widest text-[#00E0C7] hover:brightness-110 transition-colors flex items-center gap-1 font-semibold cursor-pointer"
                          id="btn-onboarding-back-from-2"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Back</span>
                        </button>
                        <button 
                          onClick={() => setCurrentStep(3)}
                          className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#1E90FF] to-[#7B5CFF] text-white font-semibold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 shadow-[0_4px_20px_rgba(30,144,255,0.3)] cursor-pointer"
                          id="btn-onboarding-continue-2"
                        >
                          <span>Continue Setup</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 3: HIGH TECH KYC IDENTITY VERATOR */}
                  {currentStep === 3 && (
                    <motion.div
                      key="onb-step-3"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="w-full"
                    >
                      <div className="mb-6">
                        <span className="text-[#00E0C7] font-mono text-[9px] uppercase tracking-widest block mb-1 font-bold">ARTICLE 92 ANTI-FRAUD COMPLIANCE</span>
                        <h1 className="text-3xl font-semibold tracking-tight text-white mb-2 font-sans select-none">
                          Identity Verification (KYC)
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-400 font-sans">
                          Upload legal government documentation and perform liveness sweep check to qualify for custom transfer caps.
                        </p>
                      </div>

                      {kycSubmitError && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                          <span>{kycSubmitError}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        {/* Box 1: Legal Documentation scanning */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-md space-y-4">
                          <h3 className="font-semibold text-sm text-white flex items-center gap-2 font-sans uppercase tracking-wider text-[#00E0C7]">
                            <FileText className="w-5 h-5" />
                            <span>1. Scan Government ID</span>
                          </h3>

                          <div>
                            <label htmlFor="kyc-doctype-select" className="block text-[10px] uppercase font-mono text-gray-400 mb-1.5 font-bold">Document Type</label>
                            <select 
                              value={docType}
                              onChange={(e) => setDocType(e.target.value)}
                              className="w-full bg-black/45 border border-white/10 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-[#00E0C7] text-white"
                              id="kyc-doctype-select"
                            >
                              <option value="CNIE Moroccan ID">Moroccan National ID (CNIE)</option>
                              <option value="Passport">Global Passport Identification</option>
                              <option value="Driver License">National Driver's License</option>
                            </select>
                          </div>

                          <div>
                            <label htmlFor="kyc-docserial-input" className="block text-[10px] uppercase font-mono text-gray-400 mb-1.5 font-bold">Document Registration Serial</label>
                            <input 
                              type="text" 
                              value={docNumber}
                              onChange={(e) => setDocNumber(e.target.value.toUpperCase())}
                              placeholder="e.g. BK700142"
                              className="w-full bg-black/45 border border-white/10 focus:border-[#00E0C7] rounded-xl px-3 py-2 text-xs text-white"
                              id="kyc-docserial-input"
                            />
                          </div>

                          {/* Scanner visual feedback board */}
                          <div className="relative border border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center overflow-hidden h-36 bg-black/20">
                            {isKycScanning ? (
                              <div className="w-full flex flex-col items-center gap-2">
                                {/* Horizontal Scanner Beam sweeping */}
                                <div className="absolute top-0 bottom-0 left-0 right-0 border-y border-[#00E0C7]/30 bg-gradient-to-b from-transparent to-[#00E0C7]/10 animate-pulse" />
                                <div className="w-full h-[2px] bg-[#00E0C7] absolute top-[40%] left-0 animate-bounce shadow-[0_0_15px_#00E0C7]" />
                                <Cpu className="w-7 h-7 text-[#00E0C7] animate-spin shrink-0" />
                                <span className="text-[10px] font-mono text-[#00E0C7] uppercase font-bold">OCR Digitizing grid... {kycScanProgress}%</span>
                              </div>
                            ) : docScanFinished ? (
                              <div className="flex flex-col items-center gap-1.5 text-emerald-400">
                                <CheckCircle2 className="w-8 h-8 shrink-0 text-emerald-400" />
                                <span className="text-[11px] font-bold uppercase tracking-wider">{docType} Verified</span>
                                <span className="text-[9px] font-mono text-gray-500">Document No: {docNumber} successfully parsed.</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2">
                                <UserPlus className="w-6 h-6 text-gray-500" />
                                <p className="text-[10px] text-gray-400">Drag &amp; drop document scan files or invoke sandbox reader</p>
                                <button
                                  type="button"
                                  onClick={handleDocumentScan}
                                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-[9px] font-mono text-[#00E0C7] font-bold uppercase transition-all cursor-pointer"
                                >
                                  Trigger OCR Scanner
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Box 2: Face validation liveness check */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-md space-y-4">
                          <h3 className="font-semibold text-sm text-white flex items-center gap-2 font-sans uppercase tracking-wider text-[#7B5CFF]">
                            <Camera className="w-5 h-5" />
                            <span>2. Liveness Selfie Mesh</span>
                          </h3>

                          <div className="relative border border-white/5 rounded-2xl h-[230px] overflow-hidden bg-black/40 flex flex-col items-center justify-center">
                            {isFaceScanning ? (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#080D14]/90 gap-4">
                                {/* Circular rotating facial tracker ring */}
                                <div className="relative w-32 h-32 rounded-full border border-dashed border-[#7B5CFF]/60 animate-spin flex items-center justify-center">
                                  <div className="w-28 h-28 rounded-full border-2 border-dashed border-[#00E0C7]/40 animate-pulse" />
                                </div>
                                <div className="absolute w-24 h-24 rounded-full border-4 border-[#00E0C7] shadow-[0_0_20px_rgba(0,224,199,0.3)] flex items-center justify-center">
                                  <Activity className="w-10 h-10 text-[#00E0C7] animate-pulse" />
                                </div>
                                <span className="text-[10px] font-mono text-[#7B5CFF] font-bold uppercase animate-pulse">Mapping Facial Vectors...</span>
                              </div>
                            ) : faceScanFinished ? (
                              <div className="flex flex-col items-center justify-center text-center gap-1.5 p-4">
                                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] mb-2">
                                  <img 
                                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=82" 
                                    className="w-full h-full object-cover" 
                                    alt="Face verification selfie matched"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5 stroke-[4px]" />
                                  <span>Liveness Match 99.8%</span>
                                </span>
                                <span className="text-[9px] font-mono text-gray-500 leading-tight">Biometric markers conform with State CNIE registries.</span>
                              </div>
                            ) : (
                              <div className="text-center p-6 space-y-4">
                                <div className="w-16 h-16 rounded-full border border-dashed border-white/15 flex items-center justify-center mx-auto text-gray-500">
                                  <Camera className="w-6 h-6" />
                                </div>
                                <p className="text-[10px] text-gray-400 leading-normal">Center your facial profile coordinates within camera field to verify match factor.</p>
                                <button
                                  type="button"
                                  onClick={handleFacialScan}
                                  className="px-5 py-2.5 bg-gradient-to-tr from-[#7B5CFF]/20 to-[#1E90FF]/25 border border-[#7B5CFF]/30 hover:border-[#7b5cff] text-[#7B5CFF] rounded-xl text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
                                >
                                  Initiate Biometric Sweep
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Regulatory Capping Disclaimer Banner */}
                      <div className="mt-5 p-3.5 rounded-2xl bg-yellow-400/5 border border-yellow-400/10 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-gray-400 font-sans leading-relaxed">
                          <strong>SANDBOX COMPLIANCE DISCLAIMER:</strong> Biometric OCR scanners automatically calibrate matching limits. Under Article 92 standards, daily wire payouts are capped at 5,000 DH until officer manual dossier reviews complete.
                        </p>
                      </div>

                      {/* Stepper controls */}
                      <div className="mt-8 pt-4 flex justify-between items-center border-t border-white/5 mx-auto w-full">
                        <button 
                          onClick={() => setCurrentStep(2)}
                          className="text-xs uppercase font-mono tracking-widest text-[#00E0C7] hover:brightness-110 transition-colors flex items-center gap-1 font-semibold cursor-pointer"
                          id="btn-onboarding-back-from-3"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Back</span>
                        </button>
                        <button 
                          onClick={handleKycSubmit}
                          className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#1E90FF] to-[#7B5CFF] text-white font-semibold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 shadow-[0_4px_20px_rgba(30,144,255,0.3)] cursor-pointer"
                          id="btn-onboarding-continue-3"
                        >
                          <span>Verify & Submit dossier</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 4: Ledger PIN locks & auto wallets builder progress */}
                  {currentStep === 4 && (
                    <motion.div
                      key="onb-step-4"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full max-w-sm mx-auto text-center"
                    >
                      {isProvisioning ? (
                        <div className="space-y-6">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#1E90FF]/25 to-[#00E0C7]/25 border border-[#00E0C7]/30 flex items-center justify-center text-[#00E0C7] mb-6 shadow-[0_0_20px_rgba(0,224,199,0.15)] animate-spin mx-auto">
                            <Cpu className="w-5 h-5 text-[#00E0C7]" />
                          </div>

                          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-white mb-2">
                            Compiling digital cash routes...
                          </h2>

                          <p className="text-[11px] sm:text-xs text-gray-400 mb-8 leading-relaxed font-sans max-w-xs mx-auto">
                            Securing interbank MAD-USD-EUR transaction nodes, implementing Article 92 compliance triggers, and constructing multireserve vaults.
                          </p>

                          {/* Steps checklist simulation */}
                          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-left text-[11px] font-mono space-y-2 max-w-xs mx-auto">
                            <div className="flex items-center gap-2 text-[#00E0C7]">
                              <Check className="w-3.5 h-3.5 stroke-[4px]" />
                              <span>✓ FLOW core identity certified</span>
                            </div>
                            <div className="flex items-center gap-2 text-[#00E0C7]">
                              <motion.span 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 }}
                                className="font-bold mr-1"
                              >✓</motion.span>
                              <span>MAD Ledger active (Casablanca Interbank)</span>
                            </div>
                            <div className="flex items-center gap-2 text-[#00E0C7]">
                              <motion.span 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 2 }}
                                className="font-bold mr-1"
                              >✓</motion.span>
                              <span>USD Clearing route established (NYC Hub)</span>
                            </div>
                            <div className="flex items-center gap-2 text-[#00E0C7]">
                              <motion.span 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 3 }}
                                className="font-bold mr-1"
                              >✓</motion.span>
                              <span>EUR Escrow accounts linked (London/Rabat)</span>
                            </div>
                          </div>

                          <div className="flex flex-col items-center justify-center gap-2 max-w-xs mx-auto pt-2">
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 3.2, ease: 'easeInOut' }}
                                className="h-full bg-gradient-to-r from-[#1E90FF] to-[#00E0C7]"
                              />
                            </div>
                            <span className="text-[9px] font-mono text-[#00E0C7] tracking-widest uppercase mt-1">INITIALIZING LEDGER SHELL</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#1E90FF] to-[#00E0C7] mx-auto flex items-center justify-center p-[1px] shadow-[0_0_30px_rgba(0,224,199,0.3)] mb-6">
                            <div className="w-full h-full bg-[#080D14] rounded-full flex items-center justify-center">
                              <ShieldCheck className="w-6 h-6 text-[#00E0C7]" />
                            </div>
                          </div>

                          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
                            Lock down your assets.
                          </h2>
                          
                          <p className="text-[11px] sm:text-xs text-gray-400 mb-8 leading-relaxed font-sans max-w-xs mx-auto">
                            Define a secure 6-digit transaction PIN to encrypt and authorize outgoing international transfers from your FLOW ledgers.
                          </p>

                          {/* Row of 6 PIN Inputs */}
                          <div className="flex justify-between gap-2.5 max-w-sm w-full mb-8 mx-auto">
                            {pin.map((digit, index) => (
                              <input 
                                key={index}
                                ref={(el) => { pinRefs.current[index] = el; }}
                                type="text"
                                pattern="\d*"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handlePinChange(e.target.value, index)}
                                onKeyDown={(e) => handlePinKeyDown(e, index)}
                                className="w-12 h-14 bg-black/45 border border-white/10 rounded-xl text-center text-lg sm:text-xl font-mono font-bold text-[#00E0C7] focus:outline-none focus:border-[#00E0C7] focus:ring-1 focus:ring-[#00E0C7] transition-all"
                                placeholder="•"
                                aria-label={`Digit ${index + 1}`}
                                required
                              />
                            ))}
                          </div>

                          {/* Biometric setup toggle */}
                          <button 
                            type="button"
                            onClick={() => setFingerprint(!fingerprint)}
                            className={`flex items-center gap-2 text-xs font-mono py-2.5 px-5 rounded-full border transition-all duration-300 mx-auto cursor-pointer ${
                              fingerprint 
                                ? 'bg-[#00E0C7]/15 text-[#00E0C7] border-[#00E0C7]/30 shadow-[0_0_15px_rgba(0,224,199,0.15)] font-bold' 
                                : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                            }`}
                          >
                            <Fingerprint className="w-4 h-4" />
                            <span>{fingerprint ? 'Fingerprint ID Lock Active' : 'Enable Touch ID / Biometric lock'}</span>
                          </button>

                          <div className="pt-6">
                            <button 
                              onClick={() => {
                                const pinStr = pin.join('');
                                if (pinStr.length < 6) {
                                  setRegisterError('Please enter all 6 digits of your security PIN.');
                                  return;
                                }
                                setRegisterError('');
                                handleFinish();
                              }}
                              className="w-full py-3.5 rounded-xl bg-gradient-to-tr from-[#1E90FF] to-[#7B5CFF] text-white font-semibold text-xs tracking-widest hover:brightness-110 shadow-[0_4px_24px_rgba(30,144,255,0.4)] transition-all uppercase cursor-pointer"
                              id="btn-platform-final-access"
                            >
                              Enter FLOW Operating System
                            </button>
                          </div>
                        </div>
                      )}

                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto px-6 py-5 border-t border-white/[0.03] flex flex-col sm:flex-row items-center justify-between gap-4 z-30">
        <span className="text-[9px] text-gray-500 font-mono uppercase tracking-widest text-center sm:text-left font-semibold">
          Secured with dual factor military encryption · PCI-DSS Compliant
        </span>
        <div className="flex gap-4 text-[9px] text-gray-500 font-mono uppercase tracking-widest font-semibold">
          <button onClick={() => {}} className="hover:text-white transition-colors bg-transparent border-none p-0 text-[9px] font-mono uppercase tracking-widest font-semibold text-gray-500 cursor-pointer">Privacy</button>
          <span>·</span>
          <button onClick={() => {}} className="hover:text-white transition-colors bg-transparent border-none p-0 text-[9px] font-mono uppercase tracking-widest font-semibold text-gray-500 cursor-pointer">Terms of use</button>
        </div>
      </footer>
    </div>
  );
}
