import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  Bell, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Mail, 
  Globe, 
  Sparkles,
  ChevronRight,
  Briefcase,
  Building,
  LogIn,
  Layers,
  Zap,
  Star
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLoginClick: () => void;
  onDemoLogin: (profileKey: 'freelancer' | 'business') => void;
}

export default function LandingPage({ onGetStarted, onLoginClick, onDemoLogin }: LandingPageProps) {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [activePoint, setActivePoint] = useState<number>(4); // default May
  const [isDemoDropdownOpen, setIsDemoDropdownOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  // Interactive search state just for beautiful feedback
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  
  // Custom notifications popover state
  const [notifOpen, setNotifOpen] = useState(false);

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    // Cap rotation degrees
    setRotate({ x: -y / 12, y: x / 12 });
  };

  const handleCardMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  // Portfolio Chart mock data points
  const chartPoints = [
    { label: 'Jan', value: '$12,450', gain: '+14.2%', x: 40, y: 120 },
    { label: 'Feb', value: '$14,200', gain: '+18.5%', x: 120, y: 100 },
    { label: 'Mar', value: '$16,800', gain: '+22.4%', x: 200, y: 70 },
    { label: 'Apr', value: '$15,300', gain: '+20.1%', x: 280, y: 90 },
    { label: 'May', value: '$19,250', gain: '+24.8%', x: 360, y: 30 },
  ];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setIsSubscribed(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#080D14] text-[#dbe3ef] overflow-x-hidden font-sans select-none relative pb-16">
      
      {/* Background Decorative Grid and Gloom Halos */}
      <div className="absolute inset-x-0 top-0 h-[800px] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(39,146,255,0.12),transparent)] pointer-events-none" />
      <div className="absolute top-[400px] right-[-100px] w-[500px] h-[500px] bg-[#00dfc6]/4 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[200px] left-[-150px] w-[600px] h-[600px] bg-[#7b5cff]/5 rounded-full blur-[150px] pointer-events-none" />

      {/* TOP NAVIGATION BAR: Fixed Backdrop Obsidian Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 sm:px-10 py-3.5 bg-[#080D14]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-8">
          {/* Logo Brand */}
          <div 
            className="flex items-center gap-2 cursor-pointer active:scale-98 transition-transform"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
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
              <span className="text-lg font-bold tracking-tight text-white font-sans block leading-none">FLOW</span>
              <span className="text-[7.5px] font-mono tracking-widest text-[#00E0C7] block uppercase mt-1">Liquid Finance</span>
            </div>
          </div>
          
          {/* Navigation Links (Triggers sign in since they're unregistered) */}
          <div className="hidden md:flex gap-6 text-[11px] uppercase tracking-wider font-mono text-gray-400 font-medium">
            <button onClick={onLoginClick} className="hover:text-[#00E0C7] transition-colors">Hub Dashboard</button>
            <button onClick={onLoginClick} className="hover:text-[#00E0C7] transition-colors">Analytics Vault</button>
            <button onClick={onLoginClick} className="hover:text-[#00E0C7] transition-colors">Payout Routes</button>
            <button onClick={onLoginClick} className="hover:text-[#00E0C7] transition-colors">Visa Cards</button>
          </div>
        </div>

        {/* Right Nav Utilities */}
        <div className="flex items-center gap-4">
          
          {/* Mock Global Search with Visual Neon Feedback */}
          <div className={`hidden sm:flex items-center bg-[#131722]/85 px-3 py-1.5 rounded-full border transition-all duration-300 ${
            searchFocused ? 'border-[#00dfc6] shadow-[0_0_15px_rgba(0,223,198,0.15)] ring-1 ring-[#00dfc6]/20' : 'border-white/5'
          }`}>
            <Search className={`w-3.5 h-3.5 mr-2 ${searchFocused ? 'text-[#00dfc6]' : 'text-gray-400'}`} />
            <input 
              type="text" 
              placeholder="Query live indexes" 
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="bg-transparent border-none text-[11px] focus:ring-0 text-white placeholder-gray-500 w-28 md:w-36 p-0 font-mono"
            />
          </div>

          {/* Notifications Icon with Custom Popover */}
          <div className="relative">
            <button 
              onClick={() => setNotifOpen(!notifOpen)}
              className="p-1.5 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors relative"
              aria-label="Toggle notifications info"
            >
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#00dfc6] animate-ping" />
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-3.5 w-72 bg-[#131722]/95 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-lg z-50 text-left font-mono text-[10px] space-y-2 text-white">
                <p className="font-bold text-[#00dfc6] border-b border-white/5 pb-1 uppercase tracking-wider">SYSTEM LOG-OUT</p>
                <p className="text-gray-400">Welcome to FLOW. You are signed-out from the Sandbox workspace ledger core.</p>
                <button 
                  onClick={onLoginClick} 
                  className="w-full text-center py-2 bg-gradient-to-r from-[#1E90FF] to-[#7B5CFF] text-white rounded-lg hover:brightness-110 font-bold uppercase mt-2"
                >
                  Sign In to Workspace
                </button>
              </div>
            )}
          </div>

          {/* Micro Avatar triggers Quick Login dropdown */}
          <button 
            onClick={onLoginClick}
            className="w-8 h-8 rounded-full overflow-hidden border border-white/10 hover:border-[#00dfc6] transition-all relative group shrink-0"
            title="Sign In / Create Account"
          >
            <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors flex items-center justify-center">
              <LogIn className="w-3.5 h-3.5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <img 
              alt="User profile pointer" 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&q=82" 
              className="w-full h-full object-cover"
            />
          </button>
        </div>
      </nav>

      {/* HERO SECTION: Liquid Finance Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-10 pt-32 pb-16 flex flex-col lg:flex-row items-center justify-between gap-12 relative min-h-[90vh]">
        
        {/* Left Column Content */}
        <div className="w-full lg:w-1/2 space-y-6 text-left relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E90FF]/10 border border-[#1E90FF]/25 text-[#1E90FF] text-[10px] font-mono font-bold tracking-wider uppercase animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00dfc6]" />
            FLOW VERSION 2.0 PROTOCOL SECURED
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight font-sans">
            Experience <br />
            <span className="bg-gradient-to-r from-[#a5c8ff] via-[#cabeff] to-[#00dfc6] bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(0,223,198,0.1)]">
              Liquid Finance
            </span>
          </h1>

          <p className="text-sm sm:text-base text-gray-400 font-sans leading-relaxed max-w-lg">
            Wealth is no longer static. Flow through global markets, instant exchanges, and intelligent yields with the world's most advanced obsidian ledger interface.
          </p>

          <div className="flex flex-wrap gap-4 pt-4 relative select-none">
            {/* Primary Get Started */}
            <button 
              onClick={onGetStarted}
              className="px-8 py-4 bg-gradient-to-r from-[#1E90FF] to-[#7B5CFF] text-white rounded-xl font-semibold text-xs uppercase tracking-wider hover:scale-[1.02] active:scale-98 transition-all shadow-[0_4px_24px_rgba(30,144,255,0.3)] hover:shadow-[0_4px_30px_rgba(30,144,255,0.45)]"
            >
              Get Started
            </button>

            {/* Quick Demo selector with responsive dropdown option */}
            <div className="relative">
              <button 
                onClick={() => setIsDemoDropdownOpen(!isDemoDropdownOpen)}
                className="px-7 py-4 bg-[#131722]/80 hover:bg-[#1c2131] border border-white/10 text-white rounded-xl font-semibold text-xs uppercase tracking-wider transition-all flex items-center gap-2 hover:border-white/20"
              >
                <span>View Demo Setup</span>
                <span className={`text-[9px] text-[#00dfc6] font-mono transition-transform duration-300 ${isDemoDropdownOpen ? 'rotate-90' : ''}`}>▶</span>
              </button>

              {isDemoDropdownOpen && (
                <div className="absolute top-full left-0 mt-2.5 w-80 bg-[#131722] border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl z-50 text-left space-y-3 animate-fade-in">
                  <div className="border-b border-white/5 pb-2">
                    <p className="text-[10px] font-mono uppercase text-[#00dfc6] tracking-wider">Fast-track sandbox testbed</p>
                    <p className="text-xs font-semibold text-white mt-0.5">Simulate instant ledger personas</p>
                  </div>

                  <div 
                    onClick={() => onDemoLogin('freelancer')}
                    className="p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-[#1E90FF]/10 hover:border-[#1E90FF]/40 cursor-pointer transition-all flex items-start gap-3 group"
                  >
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5 group-hover:bg-emerald-500/20">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-white leading-none">Anas El Amrani (Freelancer)</p>
                      <p className="text-[10px] text-gray-400 mt-1 leading-snug">14,200 DH balance, live Moroccan CNIE registration, active invoice histories.</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => onDemoLogin('business')}
                    className="p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-[#7B5CFF]/10 hover:border-[#7B5CFF]/40 cursor-pointer transition-all flex items-start gap-3 group"
                  >
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 mt-0.5 group-hover:bg-purple-500/20">
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-white leading-none">Yassine Benjelloun (Business)</p>
                      <p className="text-[10px] text-gray-400 mt-1 leading-snug">€125,000 corporate limit, global interbank wire clearings active in secondary nodes.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Holographic Visa Credit Card */}
        <div className="w-full lg:w-1/2 flex justify-center items-center py-10 lg:py-0 relative">
          <div className="absolute w-[350px] h-[350px] bg-gradient-to-tr from-[#1E90FF]/20 to-[#00dfc6]/10 rounded-full blur-[90px] pointer-events-none -translate-x-4" />

          <div 
            onMouseMove={handleCardMouseMove}
            onMouseLeave={handleCardMouseLeave}
            className="relative w-80 h-48 md:w-[420px] md:h-64 rounded-3xl p-6 sm:p-8 flex flex-col justify-between border border-white/10 z-10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] group select-none cursor-grab active:cursor-grabbing hover:border-white/20"
            style={{
              background: 'linear-gradient(145deg, #131722 0%, #080D14 100%)',
              transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
              transformStyle: 'preserve-3d',
              transition: 'transform 0.15s ease-out, border-color 0.3s ease-out'
            }}
          >
            {/* Gloss Highlight Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none" />

            <div className="flex justify-between items-start" style={{ transform: 'translateZ(40px)' }}>
              <div>
                <span className="text-xl md:text-2xl font-black text-white italic tracking-wider">FLOW</span>
                <span className="text-[7px] font-mono text-[#00dfc6] block tracking-widest uppercase mt-0.5 font-bold">PREMIUM CORE</span>
              </div>
              
              {/* Silver Visa style Wave symbol */}
              <div className="flex flex-col items-end opacity-75">
                <svg className="w-8 h-8 text-[#00dfc6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 4.5-4.5m-4.5 4.5a6 6 0 0 1-4.5-4.5m4.5 4.5v-9m0 0a3.75 3.75 0 0 0-3.75 3.75M12 9.75a3.75 3.75 0 0 1 3.75 3.75" />
                </svg>
              </div>
            </div>

            <div className="space-y-4 md:space-y-6" style={{ transform: 'translateZ(25px)' }}>
              <div className="text-white/95 font-mono tracking-[0.2em] text-sm md:text-lg font-medium drop-shadow-md">
                •••• •••• •••• 8892
              </div>
              
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <span className="text-[8px] uppercase text-gray-500 font-mono tracking-widest block font-bold">Card Holder</span>
                  <span className="text-xs font-semibold text-white uppercase tracking-wider font-sans block">Alex Sterling</span>
                </div>

                <div className="text-right">
                  <span className="text-[8px] uppercase text-gray-500 font-mono tracking-widest block font-bold">Expiry</span>
                  <span className="text-xs font-mono font-medium text-white/90">12 / 29</span>
                </div>
              </div>
            </div>

            {/* Glowing active chip corner decorative */}
            <div className="absolute top-1/2 left-6 -translate-y-1/2 w-10 h-7 bg-white/[0.03] border border-white/10 rounded-md pointer-events-none" />
          </div>
        </div>

      </section>

      {/* BENTO GRID: Functional Overviews */}
      <section className="max-w-7xl mx-auto px-4 sm:px-10 py-16 space-y-8">
        
        {/* Module Title */}
        <div className="text-center sm:text-left space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#00dfc6] font-bold">THE LEDGER PERFECTION</span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">Empowered Sovereign Clearance</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Global Assets with world visual */}
          <div className="md:col-span-2 bg-[#131722]/40 border border-white/5 rounded-3xl p-6 sm:p-8 relative overflow-hidden min-h-[350px] flex flex-col justify-between group hover:border-[#1E90FF]/25 transition-all duration-300">
            {/* World Vector Blueprint Graphic */}
            <div className="absolute top-4 right-4 w-2/3 opacity-30 group-hover:opacity-40 transition-opacity pointer-events-none select-none">
              <img 
                alt="Global financial network map rendering" 
                src="https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=450&q=82" 
                className="rounded-2xl shadow-xl w-full h-44 object-cover filter brightness-75 contrast-125 saturate-50 mix-blend-screen"
              />
            </div>

            <div className="p-2 w-10 h-10 bg-[#1E90FF]/10 text-[#1E90FF] rounded-xl flex items-center justify-center border border-[#1E90FF]/20">
              <Globe className="w-5 h-5" />
            </div>

            <div className="relative z-10 space-y-2 max-w-md mt-16 sm:mt-0">
              <h3 className="text-lg font-bold text-white font-sans">Global Multi-Ledger Clearances</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-sans">
                Trade corporate assets, split MAD-USD reserves, and clear foreign invoices with zero commission layers under automated regulatory compliance.
              </p>
              
              <button 
                onClick={onGetStarted}
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#1E90FF] hover:text-[#00dfc6] transition-colors mt-2 group/btn"
              >
                <span>Explore clearance nodes</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Card 2: Safe Vault / Security */}
          <div className="bg-[#131722]/40 border border-white/5 rounded-3xl p-6 sm:p-8 flex flex-col justify-between group hover:border-[#7B5CFF]/25 transition-all duration-300 min-h-[350px]">
            <div className="space-y-4">
              <div className="p-2 w-10 h-10 bg-[#7B5CFF]/10 text-[#7B5CFF] rounded-xl flex items-center justify-center border border-[#7B5CFF]/20 shadow-[0_0_15px_rgba(123,92,255,0.15)] animate-pulse">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white font-sans">Compliant Security Vault</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-sans">
                Real-time Article 92 compliance engines, instant virtual disposable card shields, and biometric-grade encryption securing transactions continuously.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-6 select-none">
              <span className="px-2.5 py-1 rounded bg-[#131722] border border-white/5 text-[9px] font-mono tracking-wider uppercase text-gray-400 font-medium">FLOW AI</span>
              <span className="px-2.5 py-1 rounded bg-[#131722] border border-white/5 text-[9px] font-mono tracking-wider uppercase text-gray-400 font-medium">AES-256</span>
              <span className="px-2.5 py-1 rounded bg-[#131722] border border-white/5 text-[9px] font-mono tracking-wider uppercase text-[#00dfc6] font-bold">PCI-DSS</span>
            </div>
          </div>

          {/* Card 3: FULL WIDTH ANALYTICS DECODER */}
          <div className="md:col-span-3 bg-[#131722]/40 border border-white/5 rounded-3xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center hover:border-[#00dfc6]/20 transition-all duration-300">
            
            {/* Left text */}
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-1 bg-[#00dfc6]/10 text-[#00dfc6] py-1 px-3.5 rounded-full border border-[#00dfc6]/25 text-[9px] font-mono tracking-widest uppercase font-bold">
                <Sparkles className="w-3 h-3 animate-spin duration-3000" />
                Flow AI Agent Insights
              </div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans leading-snug">
                Your wealth, decoded by <span className="text-[#00dfc6]">Flow AI</span>
              </h3>
              <p className="text-xs text-gray-400 font-sans leading-relaxed">
                Receive real-time predictions on spending patterns and personalized investment advice powered by our localized compliance network.
              </p>

              <div className="space-y-2.5 pt-2 text-xs text-gray-300">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00dfc6]" />
                  <span>Interactive balance projections</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00dfc6]" />
                  <span>Automated tax yield calibration</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00dfc6]" />
                  <span>Autonomous savings goal lockers</span>
                </div>
              </div>
            </div>

            {/* Right Interactive Portfolio growth Chart HUD */}
            <div className="lg:col-span-7 bg-[#080D14]/85 border border-white/10 rounded-2xl p-5 sm:p-6 w-full text-left relative overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-gray-500 font-semibold block">Index metrics</span>
                  <span className="text-xs font-bold text-white font-sans uppercase mt-1">Portfolio Growth Chart</span>
                </div>
                {/* Dynamic hovered point label */}
                <div className="text-right">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-400 block font-semibold">{chartPoints[activePoint].gain}</span>
                  <span className="text-xs font-bold text-white font-mono mt-0.5 block">{chartPoints[activePoint].value} ({chartPoints[activePoint].label})</span>
                </div>
              </div>

              {/* Responsive SVG Chart with mouse interactive hover circles */}
              <div className="relative w-full h-40">
                <svg className="w-full h-full" viewBox="0 0 400 150">
                  <defs>
                    <linearGradient id="chart-neon-fill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#00dfc6" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Draw Curved Path Area */}
                  <path 
                    d="M 40 120 Q 120 100, 200 70 T 280 90 T 360 30" 
                    fill="none" 
                    stroke="#00dfc6" 
                    strokeWidth="3.5" 
                    strokeLinecap="round"
                    className="drop-shadow-[0_0_8px_rgba(0,223,198,0.4)]"
                  />
                  <path 
                    d="M 40 120 Q 120 100, 200 70 T 280 90 T 360 30 V 150 H 40 Z" 
                    fill="url(#chart-neon-fill)" 
                  />

                  {/* Horizontal Grid lines */}
                  <line x1="20" y1="30" x2="380" y2="30" stroke="rgba(255,255,255,0.03)" strokeDasharray="4" />
                  <line x1="20" y1="90" x2="380" y2="90" stroke="rgba(255,255,255,0.03)" strokeDasharray="4" />

                  {/* Plot Dots and Hover Nodes */}
                  {chartPoints.map((pt, idx) => (
                    <g key={idx}>
                      <circle 
                        cx={pt.x} 
                        cy={pt.y} 
                        r={idx === activePoint ? 6 : 4} 
                        className={`transition-all duration-300 ${idx === activePoint ? 'fill-[#00dfc6] stroke-white stroke-2' : 'fill-[#0c141d] stroke-[#1E90FF]/60 stroke-2'}`}
                      />
                      {/* Invisible wider target circle to trigger hover instantly */}
                      <circle 
                        cx={pt.x} 
                        cy={pt.y} 
                        r="18" 
                        fill="transparent" 
                        className="cursor-pointer"
                        onMouseEnter={() => setActivePoint(idx)}
                      />
                    </g>
                  ))}
                </svg>
              </div>

              {/* Bottom labels */}
              <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 pt-4 border-t border-white/5 select-none">
                <span>INDEX SCALE STANDARD: 2026/Q2</span>
                <span>TAILORED SWIFT SEEDING</span>
              </div>
            </div>

          </div>

        </div>

      </section>

      {/* CTA SECTION BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-10 py-16">
        <div className="relative rounded-[40px] bg-gradient-to-br from-[#1E90FF] to-[#7B5CFF] p-10 sm:p-20 overflow-hidden text-center shadow-2xl">
          <div className="absolute inset-0 bg-radial from-transparent to-black/30 pointer-events-none" />
          <div className="absolute top-[-50px] left-[-50px] w-64 h-64 bg-white/5 rounded-full blur-[80px]" />
          <div className="absolute bottom-[-50px] right-[-50px] w-80 h-80 bg-[#00dfc6]/10 rounded-full blur-[100px]" />

          <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight font-sans">
              Join the future of liquidity.
            </h2>
            <p className="text-white/85 text-xs sm:text-sm font-sans leading-relaxed max-w-lg mx-auto">
              No legacy systems, no waitlists. Just absolute currency fluid intelligence secured on a multi-border Sandbox core.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 select-none max-w-sm mx-auto">
              <button 
                onClick={onGetStarted}
                className="flex-1 bg-white hover:bg-gray-100 text-black px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all hover:scale-[1.02] shadow-xl"
              >
                Create Free Account
              </button>
              
              <button 
                onClick={() => onDemoLogin('freelancer')}
                className="flex-1 bg-black/20 hover:bg-black/35 text-white border border-white/20 px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
              >
                Instant Simulation
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER AREA */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-10 pt-16 border-t border-white/5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-10">
          
          <div className="lg:col-span-2 space-y-4 text-left">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-white italic tracking-wider">FLOW</span>
              <span className="text-[8px] font-mono tracking-widest text-[#00dfc6] uppercase block font-bold">Financial core</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed font-sans pr-6">
              The premier choice for modern sovereign contractors, global businesses, and fluid explorers demanding raw transactional speed, safety, and absolute border neutrality.
            </p>
          </div>

          <div className="space-y-4 text-left">
            <h4 className="text-[11px] font-bold text-white uppercase tracking-wider font-sans">Active Ledger</h4>
            <ul className="text-xs text-gray-500 space-y-2 font-sans">
              <li onClick={onGetStarted} className="hover:text-[#00dfc6] cursor-pointer transition-colors">Morocco MAD Ledger</li>
              <li onClick={onGetStarted} className="hover:text-[#1E90FF] cursor-pointer transition-colors">Euro Interbank Pipe</li>
              <li onClick={onGetStarted} className="hover:text-[#7b5cff] cursor-pointer transition-colors">Sovereign Reserves</li>
            </ul>
          </div>

          <div className="space-y-4 text-left">
            <h4 className="text-[11px] font-bold text-white uppercase tracking-wider font-sans">Security Shield</h4>
            <ul className="text-xs text-gray-500 space-y-2 font-sans">
              <li onClick={onLoginClick} className="hover:text-[#00dfc6] cursor-pointer transition-colors">Biometric CNIE Verification</li>
              <li onClick={onLoginClick} className="hover:text-[#00dfc6] cursor-pointer transition-colors">Article 92 Compliance</li>
              <li onClick={onLoginClick} className="hover:text-[#00dfc6] cursor-pointer transition-colors">Disposable Card Shield</li>
            </ul>
          </div>

          {/* Subscription Newsletter box */}
          <div className="lg:col-span-2 block bg-[#131722]/60 border border-white/10 rounded-2xl p-5 text-left h-fit self-start space-y-3">
            <h4 className="text-[11px] font-bold text-white uppercase tracking-wider font-sans">Subscribe to Insights</h4>
            <p className="text-[10px] text-gray-500 font-sans leading-relaxed">Weekly summaries on premium yields, cross-border MAD clearances rules, and system updates.</p>
            
            {isSubscribed ? (
              <div className="text-[10px] text-[#00dfc6] font-mono font-bold leading-relaxed border border-[#00dfc6]/20 bg-[#00dfc6]/5 p-2 rounded-xl">
                ✔ Welcome aboard! You've unlocked our private Liquid Insights dispatch subscription.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input 
                  type="email" 
                  required
                  placeholder="Enter email address" 
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="bg-black/45 border border-white/10 text-xs rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00dfc6] placeholder-gray-600 flex-1 font-mono"
                />
                <button 
                  type="submit"
                  className="bg-gradient-to-tr from-[#1E90FF] to-[#7B5CFF] text-white py-2 px-3 text-xs font-bold rounded-xl active:scale-95 transition-all text-[11px] font-mono tracking-wider uppercase shrink-0"
                >
                  Join
                </button>
              </form>
            )}
          </div>

        </div>

        <div className="mt-16 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[10px] font-mono text-gray-500 gap-4 uppercase tracking-widest text-center select-none">
          <span>© 2026 FLOW TECHNOLOGIES INC. PARTNER SECURED SANDBOX WORKSPACE.</span>
          <div className="flex gap-4">
            <span className="hover:text-white cursor-pointer transition-colors">Privacy Principles</span>
            <span>·</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms of service</span>
          </div>
        </div>

      </footer>

    </div>
  );
}
