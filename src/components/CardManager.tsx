import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Sparkles, 
  Plus, 
  Cpu, 
  Wifi, 
  Shield, 
  ArrowRight,
  Sliders,
  DollarSign,
  Globe,
  Trash2
} from 'lucide-react';
import { FlowCard, UserProfile } from '../types';

interface CardProps {
  cards: FlowCard[];
  profile: UserProfile;
  onUpdateCards: (updated: FlowCard[]) => void;
}

const TEMPLATE_STYLES = {
  obsidian: {
    bg: 'bg-gradient-to-br from-[#1a1c23] via-[#101217] to-[#080d14]',
    text: 'text-white',
    accent: '#A5C8FF',
    name: 'Obsidian Matte',
    border: 'border-white/5 shadow-[0_20px_40px_rgba(0,0,0,0.6)]'
  },
  aurora: {
    bg: 'bg-gradient-to-tr from-[#7B5CFF] via-[#1E90FF] to-[#00E0C7]',
    text: 'text-white',
    accent: '#00E0C7',
    name: 'Aurora Laser',
    border: 'border-white/20 shadow-[0_20px_40px_rgba(123,92,255,0.3)]'
  },
  cyberGold: {
    bg: 'bg-gradient-to-br from-[#1E1A11] via-[#E1B13C]/20 to-[#3b2d12] border-amber-500/20',
    text: 'text-[#E1B13C]',
    accent: '#E1B13C',
    name: 'Cyber Gold Tech',
    border: 'border-amber-500/20 shadow-[0_20px_40px_rgba(225,177,60,0.15)]'
  },
  hologram: {
    bg: 'bg-gradient-to-tr from-[#FF007A]/80 via-[#7B5CFF]/80 to-[#00E0C7]/80 backdrop-blur-xl',
    text: 'text-white',
    accent: '#FF007A',
    name: 'Quantum Hologram',
    border: 'border-white/25 shadow-[0_20px_40px_rgba(255,0,122,0.25)]'
  }
};

export default function CardManager({ cards, profile, onUpdateCards }: CardProps) {
  const [activeCardId, setActiveCardId] = useState<string>(cards[0]?.id || '');
  const [showNumbers, setShowNumbers] = useState<Record<string, boolean>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [newCardType, setNewCardType] = useState<'virtual' | 'physical'>('virtual');
  const [newCardCurrency, setNewCardCurrency] = useState('USD');
  const [newCardLimit, setNewCardLimit] = useState(5000);
  const [newCardStyle, setNewCardStyle] = useState<'obsidian' | 'aurora' | 'cyberGold' | 'hologram'>('obsidian');

  // Security center toggles mapped on per-card-id basis to make everything highly dynamic and functional!
  const [contactless, setContactless] = useState<Record<string, boolean>>({
    'card-default-black': true,
    'card-default-amber': true,
  });
  const [atm, setAtm] = useState<Record<string, boolean>>({
    'card-default-black': true,
    'card-default-amber': true,
  });
  const [onlineEnabled, setOnlineEnabled] = useState<Record<string, boolean>>({
    'card-default-black': true,
    'card-default-amber': true,
  });

  // Card perspective tilt state values for beautiful interactive 3D effect
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const activeCard = cards.find((c) => c.id === activeCardId) || cards[0];

  const handleToggleFreeze = (id: string) => {
    const updated = cards.map((c) => {
      if (c.id === id) {
        return { ...c, isFrozen: !c.isFrozen };
      }
      return c;
    });
    onUpdateCards(updated);
  };

  const handleToggleNumberVisibility = (id: string) => {
    setShowNumbers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateCard = () => {
    const randomCardNo = Array.from({ length: 4 }, () =>
      Math.floor(1000 + Math.random() * 9000).toString()
    ).join(' ');

    const randomCvc = Math.floor(100 + Math.random() * 900).toString();
    const expiryDate = '10/31';
    const generatedId = `card-${Date.now()}`;

    const newCard: FlowCard = {
      id: generatedId,
      cardholderName: profile.name,
      cardNumber: randomCardNo,
      expiry: expiryDate,
      cvc: randomCvc,
      cardType: newCardType,
      limit: newCardLimit,
      spent: 0,
      currency: newCardCurrency,
      isFrozen: false,
      selectedTemplate: newCardStyle,
    };

    // Initialize security feature toggles default value as active
    setContactless(prev => ({ ...prev, [generatedId]: true }));
    setAtm(prev => ({ ...prev, [generatedId]: true }));
    setOnlineEnabled(prev => ({ ...prev, [generatedId]: true }));

    onUpdateCards([...cards, newCard]);
    setActiveCardId(generatedId);
    setIsCreating(false);
  };

  const handleDeleteCard = (id: string) => {
    if (cards.length <= 1) return;
    const updated = cards.filter((c) => c.id !== id);
    onUpdateCards(updated);
    setActiveCardId(updated[0].id);
  };

  const handleUpdateLimit = (id: string, newLimit: number) => {
    const updated = cards.map((c) => {
      if (c.id === id) {
        return { ...c, limit: newLimit };
      }
      return c;
    });
    onUpdateCards(updated);
  };

  // Card 3D Tilt handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const cardComp = e.currentTarget;
    const rect = cardComp.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    // Cap at maximum 10-12 degrees rotation
    const rotY = (x / (rect.width / 2)) * 12;
    const rotX = -(y / (rect.height / 2)) * 12;
    setTilt({ x: rotX, y: rotY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const currencySymbol = (cur: string) => {
    if (cur === 'MAD') return 'DH';
    if (cur === 'EUR') return '€';
    return '$';
  };

  return (
    <div className="w-full animate-fade-in" id="card-management-view">
      
      {/* DESKTOP VIEW */}
      <div className="hidden md:block space-y-6">
        {/* Page Header matching mockup */}
        <header className="flex justify-between items-end pb-2">
          <div>
            <h1 className="text-[32px] md:text-[48px] font-bold leading-[40px] md:leading-[56px] tracking-[-0.02em] mb-1">Your Cards</h1>
            <p className="text-[#8a919f] max-w-2xl">Manage physical and virtual liquid assets.</p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="hidden md:flex items-center gap-2 bg-white/[0.03] hover:bg-white/10 border border-white/5 hover:border-white/10 px-4 py-2 rounded-full text-xs font-bold font-mono text-white transition-all uppercase tracking-wider"
            id="btn-trigger-new-card"
          >
            <Plus className="w-4 h-4 text-[#00E0C7]" />
            <span>Get New Card</span>
          </button>
        </header>

        {/* Main Grid: matches exactly the 3-column layout constraints */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* LEFT & CENTER REGION: Card Stack and Spending Limit */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Card visual stack wrapper */}
          <section className="bg-[#182029]/60 backdrop-blur-2xl rounded-3xl border border-[#8a919f]/10 p-8 relative overflow-hidden flex flex-col items-center justify-center min-h-[380px] shadow-xl hover:border-white/10 hover:shadow-[0_0_20px_rgba(165,200,255,0.15)] transition-all duration-300">
            {/* Ambient aesthetic glow background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#00dfc6]/10 rounded-full blur-[100px] pointer-events-none" />
            
            <div 
              className="w-full max-w-md relative z-10 select-none cursor-pointer"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{ perspective: '1000px' }}
            >
              {activeCard ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeCard.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25 }}
                    style={{ 
                      transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                      transformStyle: 'preserve-3d',
                      transition: 'transform 0.1s ease-out'
                    }}
                    className={`w-full aspect-[1.586/1] rounded-2xl p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden border ${
                      TEMPLATE_STYLES[activeCard.selectedTemplate]?.bg
                    } ${TEMPLATE_STYLES[activeCard.selectedTemplate]?.border}`}
                    id={`active-render-card-${activeCard.id}`}
                  >
                    {/* Card Texture Overlay */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.06),_transparent_60%)] pointer-events-none" />

                    {/* TOP DECK */}
                    <div className="flex justify-between items-start relative z-10 leading-none">
                      <span className="text-lg font-bold text-white tracking-tight uppercase font-sans">FLOW</span>
                      <Wifi className="w-5 h-5 text-white/50 rotate-90 shrink-0" />
                    </div>

                    {/* MID DECK: CPU chip & togglable card numerical display */}
                    <div className="relative z-10 flex flex-col gap-1 mt-4">
                      <div className="w-12 h-9 bg-gradient-to-br from-amber-200 to-amber-500/50 rounded-md mb-2 flex items-center justify-center border border-white/10 shadow-inner">
                        <Cpu className="w-5 h-5 text-black/50" />
                      </div>
                      
                      <div className="font-mono text-lg sm:text-xl text-white/90 tracking-[0.15em] flex justify-between items-center leading-none pr-1">
                        {showNumbers[activeCard.id] ? (
                          <span>{activeCard.cardNumber}</span>
                        ) : (
                          <span>•••• •••• •••• {activeCard.cardNumber.slice(-4)}</span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleNumberVisibility(activeCard.id);
                          }}
                          className="text-white/40 hover:text-white transition-colors"
                          title="Toggle security visible info"
                        >
                          {showNumbers[activeCard.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* BOTTOM DECK: metadata and mastercard look circles */}
                    <div className="relative z-10 flex justify-between items-end mt-4">
                      <div>
                        <span className="text-[10px] font-mono font-bold tracking-wider text-white/50 uppercase block leading-none mb-1">
                          {activeCard.cardType} · {activeCard.selectedTemplate}
                        </span>
                        <span className="font-mono text-xs text-white/80 tracking-wide uppercase block">
                          {activeCard.cardholderName}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <div className="text-left font-mono">
                          <span className="text-[8px] tracking-wider text-white/40 block leading-none">EXP</span>
                          <span className="text-[11px] text-white/80 font-bold">{activeCard.expiry}</span>
                        </div>
                        <div className="text-left font-mono">
                          <span className="text-[8px] tracking-wider text-white/40 block leading-none font-bold">CVC</span>
                          <span className="text-[11px] text-white/80 font-bold">
                            {showNumbers[activeCard.id] ? activeCard.cvc : '•••'}
                          </span>
                        </div>
                        
                        {/* CSS-only overlaps card manufacturer badges */}
                        <div className="flex relative items-center justify-center w-10 h-6 shrink-0 select-none">
                          <div className="w-5 h-5 rounded-full bg-[#EB001B]/80 absolute left-1 mix-blend-screen" />
                          <div className="w-5 h-5 rounded-full bg-[#F59E0B]/80 absolute right-1 mix-blend-screen" />
                        </div>
                      </div>
                    </div>

                    {/* Frozen overlay lock screen state */}
                    {activeCard.isFrozen && (
                      <div className="absolute inset-0 rounded-2xl bg-[#080d14]/75 backdrop-blur-xs flex flex-col items-center justify-center space-y-1 border border-rose-500/10 z-20">
                        <Lock className="w-6 h-6 text-rose-400 animate-pulse" />
                        <span className="font-mono text-[10px] uppercase tracking-widest text-rose-400 font-bold">Temporarily Frozen</span>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className="p-8 text-center text-gray-400">Card stack empty. Create a new digital target card.</div>
              )}
            </div>

            {/* Dynamic Card selector pills directly below the active card preview */}
            <div className="mt-8 flex flex-wrap gap-2.5 z-10 justify-center">
              {cards.map((c) => {
                const isActive = c.id === activeCardId;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveCardId(c.id)}
                    className={`px-4 py-2 rounded-full text-[11px] font-bold font-mono tracking-wider hover:shadow-[0_0_20px_rgba(165,200,255,0.15)] transition-all duration-300 ${
                      isActive
                        ? 'bg-white/15 text-[#00E0C7] border border-[#00E0C7]/30 shadow-md shadow-black/25 scale-100'
                        : 'bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/5 text-gray-400 hover:text-white'
                    }`}
                    id={`card-selector-pill-${c.id}`}
                  >
                    {c.cardType === 'physical' ? 'Physical' : 'Virtual'} •••• {c.cardNumber.slice(-4)}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Monthly Spending Limit section matching design mockup */}
          {activeCard && (
            <section className="bg-[#182029]/60 backdrop-blur-2xl rounded-3xl border border-[#8a919f]/10 p-6 hover:border-white/10 hover:shadow-[0_0_20px_rgba(165,200,255,0.15)] transition-all duration-300 shadow-xl">
              <div className="flex justify-between items-center mb-6 gap-2">
                <div>
                  <h3 className="text-lg font-bold text-white leading-none">Monthly Spending Limit</h3>
                  <p className="text-xs text-gray-400 font-sans mt-1">Regulate your real-time foreign trade boundaries.</p>
                </div>
                {/* Dynamically computes standard format matching design mockup beautifully */}
                <div className="px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/5 text-xs text-[#00E0C7] font-mono font-bold shrink-0">
                  {currencySymbol(activeCard.currency)}{activeCard.spent.toLocaleString()} <span className="text-gray-400 font-normal">/</span> {currencySymbol(activeCard.currency)}{activeCard.limit.toLocaleString()}
                </div>
              </div>

              {/* Progress visual bar with customized premium layout */}
              <div className="space-y-4">
                <div className="relative w-full h-2 rounded-full bg-[#182029] overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#00E0C7] to-[#1E90FF] rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(0,224,199,0.3)]" 
                    style={{ width: `${Math.min(100, (activeCard.spent / activeCard.limit) * 100)}%` }}
                  />
                </div>
                
                {/* Visual guidelines */}
                <div className="flex justify-between text-[11px] font-mono leading-none text-gray-500">
                  <span>{currencySymbol(activeCard.currency)}0</span>
                  <span className="text-gray-400 uppercase font-sans font-semibold tracking-wider text-[10px]">Reset in 14 days</span>
                  <span>{currencySymbol(activeCard.currency)}{activeCard.limit.toLocaleString()}</span>
                </div>

                {/* SLIDER FOR LIMIT ADJUSTMENT: Adds incredible interactivity to the spend limits block */}
                <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-mono leading-none">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-[#00E0C7]" />
                      <span>ADJUST CLEARING LIMIT POOL</span>
                    </span>
                    <span className="text-white font-bold">{currencySymbol(activeCard.currency)} {activeCard.limit.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="25000"
                    step="500"
                    value={activeCard.limit}
                    onChange={(e) => handleUpdateLimit(activeCard.id, parseInt(e.target.value))}
                    className="w-full accent-[#00E0C7] h-1 bg-white/10 rounded-lg appearance-none cursor-pointer hover:accent-[#00dfc6] transition-all"
                    id="adjust-card-range-slider"
                  />
                </div>
              </div>
            </section>
          )}

        </div>

        {/* RIGHT COLUMN: Security center & Card Designer */}
        <div className="space-y-6">
          
          {/* Security center card list */}
          {activeCard && (
            <section className="bg-[#182029]/60 backdrop-blur-2xl rounded-3xl border border-[#8a919f]/10 p-6 hover:border-white/10 hover:shadow-[0_0_20px_rgba(165,200,255,0.15)] transition-all duration-300 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#00E0C7]" />
                <span>Security Center</span>
              </h3>

              <div className="space-y-3.5">
                
                {/* Switch Item 1: Contactless */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#00E0C7]">
                      <Wifi className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Contactless</h4>
                      <p className="text-[10px] text-gray-400 font-medium">Tap to pay anywhere</p>
                    </div>
                  </div>
                  <label className="relative flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={!!contactless[activeCard.id]}
                      onChange={() => setContactless(prev => ({ ...prev, [activeCard.id]: !prev[activeCard.id] }))}
                      className="sr-only"
                    />
                    <div className={`w-12 h-6 rounded-full border transition-colors duration-200 ${
                      contactless[activeCard.id]
                        ? 'bg-[#2792ff] border-[#2792ff]'
                        : 'bg-[#2d353f] border-white/10'
                    }`}>
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform duration-200 ${
                        contactless[activeCard.id] ? 'translate-x-[25px]' : 'translate-x-1.5'
                      }`} />
                    </div>
                  </label>
                </div>

                {/* Switch Item 2: ATM Withdrawals */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#00E0C7]">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">ATM Withdrawals</h4>
                      <p className="text-[10px] text-gray-400 font-medium">Cash access globally</p>
                    </div>
                  </div>
                  <label className="relative flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={!!atm[activeCard.id]}
                      onChange={() => setAtm(prev => ({ ...prev, [activeCard.id]: !prev[activeCard.id] }))}
                      className="sr-only"
                    />
                    <div className={`w-12 h-6 rounded-full border transition-colors duration-200 ${
                      atm[activeCard.id]
                        ? 'bg-[#2792ff] border-[#2792ff]'
                        : 'bg-[#2d353f] border-white/10'
                    }`}>
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform duration-200 ${
                        atm[activeCard.id] ? 'translate-x-[25px]' : 'translate-x-1.5'
                      }`} />
                    </div>
                  </label>
                </div>

                {/* Switch Item 3: Online Payments */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#00E0C7]">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Online Payments</h4>
                      <p className="text-[10px] text-gray-400 font-medium font-sans">E-commerce enabled</p>
                    </div>
                  </div>
                  <label className="relative flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={!!onlineEnabled[activeCard.id]}
                      onChange={() => setOnlineEnabled(prev => ({ ...prev, [activeCard.id]: !prev[activeCard.id] }))}
                      className="sr-only"
                    />
                    <div className={`w-12 h-6 rounded-full border transition-colors duration-200 ${
                      onlineEnabled[activeCard.id]
                        ? 'bg-[#2792ff] border-[#2792ff]'
                        : 'bg-[#2d353f] border-white/10'
                    }`}>
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform duration-200 ${
                        onlineEnabled[activeCard.id] ? 'translate-x-[25px]' : 'translate-x-1.5'
                      }`} />
                    </div>
                  </label>
                </div>

              </div>

              {/* Lock/Unlock Card freeze switcher */}
              <div className="flex gap-2.5 mt-4">
                <button
                  onClick={() => handleToggleFreeze(activeCard.id)}
                  className={`flex-1 py-3 px-4 rounded-xl border font-bold text-[11px] font-mono tracking-wider uppercase hover:shadow-[0_0_20px_rgba(165,200,255,0.15)] transition-all duration-300 flex items-center justify-center gap-2 ${
                    activeCard.isFrozen
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15'
                      : 'bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/10 text-rose-400'
                  }`}
                  id="btn-active-card-freeze-toggle"
                >
                  {activeCard.isFrozen ? (
                    <>
                      <Unlock className="w-4 h-4 shrink-0" />
                      <span>Unlock Card</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 shrink-0" />
                      <span>Freeze Card</span>
                    </>
                  )}
                </button>
                
                {/* Dispose card capability */}
                <button
                  onClick={() => {
                    if (window.confirm("Permanently destroy this single-use ledger card? This action is irreversible.")) {
                      handleDeleteCard(activeCard.id);
                    }
                  }}
                  disabled={cards.length <= 1}
                  className="px-4 rounded-xl border border-white/5 hover:border-rose-500/20 text-gray-500 hover:text-rose-400 hover:bg-rose-500/5 transition-all text-xs flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none"
                  title="Dispose Card"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </section>
          )}

          {/* Design your next card visual block */}
          <section 
            onClick={() => setIsCreating(true)}
            className="bg-[#182029]/60 backdrop-blur-2xl rounded-3xl border border-[#8a919f]/10 p-6 hover:border-white/10 hover:shadow-[0_0_20px_rgba(165,200,255,0.15)] transition-all duration-300 shadow-xl cursor-pointer group"
          >
            <div className="flex justify-between items-center mb-4 gap-2">
              <h3 className="text-xs uppercase font-mono tracking-wider font-bold text-gray-400">Design Your Next Card</h3>
              <ArrowRight className="w-4 h-4 text-[#00E0C7] group-hover:translate-x-1.5 transition-transform shrink-0" />
            </div>
            
            <div className="h-32 rounded-2xl bg-gradient-to-tr from-[#7B5CFF] to-[#1E90FF] p-4 relative overflow-hidden flex items-end shadow-inner hover:scale-[1.01] transition-transform duration-300">
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <span className="text-xs uppercase font-mono font-bold text-white tracking-widest relative z-10 drop-shadow-sm">Titanium Blue Edition</span>
            </div>
          </section>

        </div>

      </div>
      
      </div>
      {/* END DESKTOP VIEW */}

      {/* MOBILE VIEW */}
      <div className="block md:hidden space-y-6" id="mobile-cards-view">
        {/* Header row with configure / new card button */}
        <div className="flex justify-between items-center px-1">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-display-lg-mobile font-display-lg-mobile text-white">Cards</h1>
            <p className="text-xs text-on-surface-variant opacity-70 font-medium">Manage physical and virtual liquid assets.</p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="px-3.5 py-1.5 bg-surface-container border border-outline-variant/35 rounded-xl text-xs text-[#00E0C7] hover:text-white hover:bg-surface-variant transition-all font-mono cursor-pointer uppercase flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>NEW</span>
          </button>
        </div>

        {/* Card visual stack wrapper */}
        <section className="flex flex-col gap-4">
          {activeCard ? (
            <div 
              className={`w-full aspect-[1.586/1] rounded-3xl p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden border active:scale-95 transition-transform ${
                TEMPLATE_STYLES[activeCard.selectedTemplate]?.bg
              } ${TEMPLATE_STYLES[activeCard.selectedTemplate]?.border}`}
              id={`mobile-render-card-${activeCard.id}`}
            >
              {/* Card Texture Overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.06),_transparent_60%)] pointer-events-none" />

              {/* TOP DECK */}
              <div className="flex justify-between items-start relative z-10 leading-none">
                <Wifi className="w-6 h-6 text-white/50 rotate-90 shrink-0" />
                <div className="flex flex-col items-end">
                  <span className="text-white text-sm font-bold tracking-[0.2em] font-sans">FLOW</span>
                  <span className="text-[9px] text-gray-400 tracking-widest uppercase font-mono mt-0.5">
                    {TEMPLATE_STYLES[activeCard.selectedTemplate]?.name}
                  </span>
                </div>
              </div>

              {/* MID DECK: CPU chip & togglable card numerical display */}
              <div className="relative z-10 flex flex-col gap-1 mt-3">
                <div className="font-mono text-[16px] text-white/90 tracking-[0.16em] flex justify-between items-center leading-none pr-1 select-all">
                  {showNumbers[activeCard.id] ? (
                    <span>{activeCard.cardNumber}</span>
                  ) : (
                    <span>•••• •••• •••• {activeCard.cardNumber.slice(-4)}</span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleNumberVisibility(activeCard.id);
                    }}
                    className="text-white/40 hover:text-white transition-colors cursor-pointer"
                  >
                    {showNumbers[activeCard.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* BOTTOM DECK: metadata */}
              <div className="relative z-10 flex justify-between items-end">
                <div>
                  <span className="text-[8px] text-on-surface-variant uppercase tracking-widest opacity-60 mb-1 block">Card Holder</span>
                  <div className="text-[11px] text-white uppercase tracking-widest font-semibold font-mono truncate max-w-[130px] select-all">
                    {activeCard.cardholderName}
                  </div>
                </div>
                <div className="flex items-center space-x-3 shrink-0">
                  <div className="text-left font-mono">
                    <span className="text-[7px] tracking-wider text-white/40 block leading-none">EXP</span>
                    <span className="text-[10px] text-white/80 font-bold select-all">{activeCard.expiry}</span>
                  </div>
                  <div className="text-left font-mono">
                    <span className="text-[7px] tracking-wider text-white/40 block leading-none font-bold">CVC</span>
                    <span className="text-[10px] text-white/80 font-bold select-all">
                      {showNumbers[activeCard.id] ? activeCard.cvc : '•••'}
                    </span>
                  </div>
                  <div className="flex relative items-center justify-center w-8 h-5 shrink-0 select-none">
                    <div className="w-4 h-4 rounded-full bg-[#EB001B]/80 absolute left-0.5 mix-blend-screen" />
                    <div className="w-4 h-4 rounded-full bg-[#F59E0B]/80 absolute right-0.5 mix-blend-screen" />
                  </div>
                </div>
              </div>

              {/* Frozen overlay lock screen state */}
              {activeCard.isFrozen && (
                <div className="absolute inset-0 rounded-3xl bg-[#080d14]/75 backdrop-blur-xs flex flex-col items-center justify-center space-y-1 border border-rose-500/10 z-20">
                  <Lock className="w-6 h-6 text-rose-400 animate-pulse" />
                  <span className="font-mono text-[9px] uppercase tracking-widest text-rose-400 font-bold">Temporarily Frozen</span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 glass-panel rounded-3xl">Card stack empty. Create a new digital target card.</div>
          )}

          {/* Mobile Card selector pills */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 shrink-0 snap-x">
            {cards.map((c) => {
              const isActive = c.id === activeCardId;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCardId(c.id)}
                  className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold font-mono tracking-wider transition-all shrink-0 cursor-pointer snap-center ${
                    isActive
                      ? 'bg-white/15 text-[#00E0C7] border border-[#00E0C7]/30 shadow-md shadow-black/25'
                      : 'bg-white/[0.02] border border-white/5 text-gray-400 hover:text-white'
                  }`}
                  id={`mobile-card-selector-pill-${c.id}`}
                >
                  {c.cardType === 'physical' ? 'Phys' : 'Virt'} •• {c.cardNumber.slice(-4)}
                </button>
              );
            })}
          </div>
        </section>

        {/* Freeze Card Tactile Switch */}
        {activeCard && (
          <label 
            className="w-full glass-panel rounded-2xl p-5 flex justify-between items-center cursor-pointer hover:bg-white/[0.02] transition-colors"
            id="mobile-freeze-toggle-wrapper"
          >
            <div className="flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${
                activeCard.isFrozen
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              }`}>
                {activeCard.isFrozen ? <Lock className="w-5 h-5 animate-pulse" /> : <Unlock className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Freeze Card</h3>
                <p className="text-xs text-on-surface-variant opacity-70">
                  {activeCard.isFrozen ? 'Unfreeze to resume trades' : 'Block all new transactions'}
                </p>
              </div>
            </div>
            <div className="relative">
              <input 
                type="checkbox"
                checked={activeCard.isFrozen}
                onChange={() => handleToggleFreeze(activeCard.id)}
                className="sr-only"
              />
              <div className={`w-12 h-7 rounded-full border transition-colors duration-200 relative flex items-center ${
                activeCard.isFrozen
                  ? 'bg-rose-500 border-rose-500'
                  : 'bg-outline-variant border-transparent'
              }`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 absolute ${
                  activeCard.isFrozen ? 'translate-x-[22px]' : 'translate-x-[4px]'
                }`} />
              </div>
            </div>
          </label>
        )}

        {/* Security Center toggles */}
        {activeCard && (
          <section className="flex flex-col gap-4">
            <h2 className="text-headline-md font-headline-md text-white px-1">Security Center</h2>
            <div className="glass-panel rounded-3xl overflow-hidden flex flex-col">
              {/* Contactless Payments */}
              <label className="px-5 py-4.5 flex justify-between items-center hover:bg-white/[0.01] transition-colors border-b border-outline-variant/10 cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Wifi className="w-5 h-5 text-[#a5c8ff] rotate-90" />
                  </div>
                  <div className="text-sm font-semibold text-white">Contactless Payments</div>
                </div>
                <div className="relative">
                  <input 
                    type="checkbox"
                    checked={!!contactless[activeCard.id]}
                    onChange={() => setContactless(prev => ({ ...prev, [activeCard.id]: !prev[activeCard.id] }))}
                    className="sr-only"
                  />
                  <div className={`w-12 h-7 rounded-full border transition-colors duration-200 relative flex items-center ${
                    contactless[activeCard.id] ? 'bg-primary border-primary' : 'bg-outline-variant border-transparent'
                  }`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 absolute ${
                      contactless[activeCard.id] ? 'translate-x-[22px]' : 'translate-x-[4px]'
                    }`} />
                  </div>
                </div>
              </label>

              {/* ATM Withdrawals */}
              <label className="px-5 py-4.5 flex justify-between items-center hover:bg-white/[0.01] transition-colors border-b border-outline-variant/10 cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <DollarSign className="w-5 h-5 text-[#a5c8ff]" />
                  </div>
                  <div className="text-sm font-semibold text-white">ATM Withdrawals</div>
                </div>
                <div className="relative">
                  <input 
                    type="checkbox"
                    checked={!!atm[activeCard.id]}
                    onChange={() => setAtm(prev => ({ ...prev, [activeCard.id]: !prev[activeCard.id] }))}
                    className="sr-only"
                  />
                  <div className={`w-12 h-7 rounded-full border transition-colors duration-200 relative flex items-center ${
                    atm[activeCard.id] ? 'bg-primary border-primary' : 'bg-outline-variant border-transparent'
                  }`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 absolute ${
                      atm[activeCard.id] ? 'translate-x-[22px]' : 'translate-x-[4px]'
                    }`} />
                  </div>
                </div>
              </label>

              {/* Online Payments */}
              <label className="px-5 py-4.5 flex justify-between items-center hover:bg-white/[0.01] transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Globe className="w-5 h-5 text-[#a5c8ff]" />
                  </div>
                  <div className="text-sm font-semibold text-white">Online Payments</div>
                </div>
                <div className="relative">
                  <input 
                    type="checkbox"
                    checked={!!onlineEnabled[activeCard.id]}
                    onChange={() => setOnlineEnabled(prev => ({ ...prev, [activeCard.id]: !prev[activeCard.id] }))}
                    className="sr-only"
                  />
                  <div className={`w-12 h-7 rounded-full border transition-colors duration-200 relative flex items-center ${
                    onlineEnabled[activeCard.id] ? 'bg-primary border-primary' : 'bg-outline-variant border-transparent'
                  }`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 absolute ${
                      onlineEnabled[activeCard.id] ? 'translate-x-[22px]' : 'translate-x-[4px]'
                    }`} />
                  </div>
                </div>
              </label>
            </div>
          </section>
        )}

        {/* Monthly Spending Limit */}
        {activeCard && (
          <section className="glass-panel rounded-3xl p-6 flex flex-col gap-5">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-label-sm text-on-surface-variant uppercase tracking-widest opacity-60">Monthly Spending Limit</h3>
                <div className="flex items-baseline gap-1 mt-1 font-mono">
                  <span className="text-headline-md font-bold text-white">
                    {currencySymbol(activeCard.currency)}{activeCard.spent.toLocaleString()}
                  </span>
                  <span className="text-body-md text-outline opacity-60">/ {currencySymbol(activeCard.currency)}{activeCard.limit.toLocaleString()}</span>
                </div>
              </div>
              <button 
                onClick={() => {
                  const ans = prompt("Set card spending limit amount:", activeCard.limit.toString());
                  if (ans) {
                    const parsed = parseInt(ans);
                    if (!isNaN(parsed) && parsed >= 500) {
                      handleUpdateLimit(activeCard.id, parsed);
                    }
                  }
                }}
                className="h-9 px-5 rounded-full bg-white/[0.05] border border-outline-variant/20 text-[#a5c8ff] hover:text-white text-xs font-bold active:scale-95 transition-all cursor-pointer"
              >
                EDIT
              </button>
            </div>
            <div className="relative pt-1">
              <div className="w-full h-3 bg-white/[0.02] rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-[#00dfc6] rounded-full relative transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(100, (activeCard.spent / activeCard.limit) * 100)}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold font-mono tracking-wider leading-none">
              <span className="text-[#a5c8ff] uppercase">
                {Math.round(Math.min(100, (activeCard.spent / activeCard.limit) * 100))}% UTILIZED
              </span>
              <span className="text-on-surface-variant opacity-50 uppercase">
                {currencySymbol(activeCard.currency)}{(activeCard.limit - activeCard.spent).toLocaleString()} REMAINING
              </span>
            </div>
          </section>
        )}

        {/* Promotion Option design custom card */}
        <section 
          onClick={() => setIsCreating(true)}
          className="relative rounded-3xl overflow-hidden p-7 border border-white/5 cursor-pointer group active:scale-[0.98] transition-transform" 
          style={{ background: 'linear-gradient(135deg, #0c1219, #1c0062)' }}
        >
          <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-700" style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, #a5c8ff 0%, transparent 70%)' }}></div>
          <div className="relative z-10 flex flex-col gap-4">
            <div className="w-11 h-11 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Design Your Next Card</h3>
              <p className="text-xs text-on-surface-variant opacity-80 mt-2 max-w-[90%] leading-relaxed font-normal">
                Upgrade to Aerospace Titanium or customize a 24k Gold edition with laser engraving.
              </p>
            </div>
            <div className="flex items-center gap-2 text-primary font-bold mt-1 text-xs">
              <span>Explore Options</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </section>

        {/* Delete Card Button (Mobile) if multiple exist */}
        {activeCard && cards.length > 1 && (
          <div className="pt-2">
            <button
              onClick={() => {
                if (window.confirm("Permanently destroy this single-use ledger card? This action is irreversible.")) {
                  handleDeleteCard(activeCard.id);
                }
              }}
              className="w-full py-3.5 rounded-2xl border border-rose-500/10 text-rose-400 bg-rose-500/[0.02] hover:bg-rose-500/5 transition-colors font-mono font-bold text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Destroy Current Card</span>
            </button>
          </div>
        )}

        {/* Subtle Brand Logo */}
        <div className="flex justify-center items-center py-6 opacity-15 grayscale">
          <div className="w-8 h-8 bg-[#131722] border border-white/10 rounded-full flex items-center justify-center text-[10px] font-mono font-bold text-[#00E0C7]">F</div>
        </div>

      </div>
      {/* END MOBILE VIEW */}

      {/* NEW CARD CREATOR MODAL OVERLAY */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#0c121c] border border-white/10 max-w-md w-full rounded-3xl p-6 space-y-5 shadow-2xl relative"
              id="card-creator-modal-popup"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/[0.05]">
                <h4 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#00E0C7]" />
                  <span>Configure Ledger Card</span>
                </h4>
                <button
                  onClick={() => setIsCreating(false)}
                  className="text-xs font-bold font-mono tracking-widest text-gray-400 hover:text-white uppercase"
                >
                  Close
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* 1. Card Type Selection */}
                <div>
                  <p className="text-gray-500 block font-mono font-bold uppercase tracking-wider mb-2">Prototyping Level</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setNewCardType('virtual')}
                      className={`py-2 rounded-xl text-[10px] font-mono uppercase tracking-wider transition-colors border ${
                        newCardType === 'virtual'
                          ? 'bg-white text-black font-bold border-white'
                          : 'bg-white/[0.02] text-gray-400 border-white/5 hover:border-white/10'
                      }`}
                    >
                      Virtual Card
                    </button>
                    <button
                      onClick={() => setNewCardType('physical')}
                      className={`py-2 rounded-xl text-[10px] font-mono uppercase tracking-wider transition-colors border ${
                        newCardType === 'physical'
                          ? 'bg-white text-black font-bold border-white'
                          : 'bg-white/[0.02] text-gray-400 border-white/5 hover:border-white/10'
                      }`}
                    >
                      Physical Card
                    </button>
                  </div>
                </div>

                {/* 2. Billing currency and trigger pool limits */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="newcard-currency-select" className="text-gray-500 block font-mono font-bold uppercase tracking-wider mb-2">Clearance Base</label>
                    <select
                      value={newCardCurrency}
                      onChange={(e) => setNewCardCurrency(e.target.value)}
                      className="w-full bg-[#131722] py-2 px-3 border border-white/5 rounded-xl font-mono text-white text-xs focus:outline-none focus:border-[#00e0c7]"
                      id="newcard-currency-select"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="MAD">MAD (DH)</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="newcard-limit-input" className="text-gray-500 block font-mono font-bold uppercase tracking-wider mb-2">Trigger Limit</label>
                    <input
                      type="number"
                      value={newCardLimit}
                      onChange={(e) => setNewCardLimit(parseInt(e.target.value) || 1000)}
                      className="w-full bg-[#131722] py-2 px-3 border border-white/5 rounded-xl font-mono text-white text-xs focus:outline-none focus:border-[#00e0c7]"
                      id="newcard-limit-input"
                    />
                  </div>
                </div>

                {/* 3. Designer visual shells */}
                <div>
                  <p className="text-gray-500 block font-mono font-bold uppercase tracking-wider mb-2">Visual Core Shell</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(TEMPLATE_STYLES).map(([key, style]) => (
                      <button
                        key={key}
                        onClick={() => setNewCardStyle(key as any)}
                        className={`text-left p-2.5 rounded-xl border flex items-center space-x-2.5 transition-all ${
                          newCardStyle === key
                            ? 'bg-white/10 border-[#00edf2]'
                            : 'bg-white/[0.01] border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className={`w-6 h-4 rounded-xs shrink-0 ${style.bg}`} />
                        <span className="text-[10px] font-medium truncate text-white">{style.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Creation compile output */}
              <button
                onClick={handleCreateCard}
                className="w-full py-3 bg-[#00E0C7] text-black font-bold uppercase font-mono tracking-widest rounded-xl text-xs transition-transform hover:scale-[1.02]"
                id="btn-confirm-ledger-creation"
              >
                COMPILE & PROVISION TARGET
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
