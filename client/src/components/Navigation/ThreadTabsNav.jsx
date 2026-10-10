import React from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, Sparkles, ShoppingBag, Compass, MapPin, Package } from 'lucide-react';
import { playClickSound } from '../../utils/audioEffects';

/**
 * Clean 4-Tab Top Navigation Header
 * Corresponds directly to ThreadLabs Core Flow:
 * 1. EXPLORE (3D Shopping Mall)
 * 2. CUSTOMER NEEDS (AI Requirement Intake)
 * 3. FIND ARTISAN (Rapido-Style Proximity Matching)
 * 4. ORDER TRACKING (Amazon-Style Live Status)
 */
export default function ThreadTabsNav({
  activeTab,
  onSelectTab,
  isMuted,
  onToggleSound,
}) {
  const tabs = [
    { id: 'mall', label: '1. EXPLORE MALL', icon: ShoppingBag },
    { id: 'needs', label: '2. CUSTOMER NEEDS', icon: Sparkles },
    { id: 'matching', label: '3. FIND ARTISAN', icon: MapPin },
    { id: 'orders', label: '4. ORDER TRACKING', icon: Package },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 px-6 sm:px-10 py-4 pointer-events-none font-sans ${activeTab !== 'mall' ? 'rose-flow-nav' : ''}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">
        
        {/* Brand Logo Button */}
        <button
          onClick={() => {
            playClickSound();
            onSelectTab('mall');
          }}
          className="group flex items-center space-x-3 text-left focus:outline-none"
        >
          <div className="w-2 h-2 rounded-full bg-[#9d795f] group-hover:scale-110 transition-transform" />
          <div>
            <span className={`text-xs font-mono font-bold tracking-[0.25em] uppercase block leading-none ${activeTab === 'mall' ? 'text-[#40362f]' : 'text-white'}`}>
              THREADLABS
            </span>
            <span className={`text-[9px] font-mono tracking-[0.2em] uppercase block mt-0.5 ${activeTab === 'mall' ? 'text-[#79695d]' : 'text-slate-400'}`}>
              {activeTab === 'mall' ? 'DIGITAL ATELIER' : 'FASHION • ARTISANS • RUNWAY'}
            </span>
          </div>
        </button>

        {activeTab === 'mall' ? (
          <div className="rounded-full border border-[#746357]/20 bg-[#f7f0e9]/45 px-4 py-2 text-[9px] tracking-[0.24em] text-[#51443b] backdrop-blur-md">
            EXPLORE
          </div>
        ) : (
          <nav className="flex items-center gap-1 p-1.5 rounded-full bg-slate-950/85 border border-white/10 backdrop-blur-2xl shadow-2xl">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    playClickSound();
                    onSelectTab(tab.id);
                  }}
                  className={`relative px-3 sm:px-4 py-2 rounded-full text-[10px] sm:text-xs font-mono tracking-wider font-semibold transition-all duration-300 flex items-center gap-1.5 ${
                    isActive ? 'text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeAppTabPill"
                      className="absolute inset-0 bg-amber-400 rounded-full shadow-lg"
                      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                    />
                  )}
                  <Icon className={`w-3.5 h-3.5 relative z-10 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span className="relative z-10 hidden sm:inline">{tab.label}</span>
                  <span className="relative z-10 sm:hidden">{tab.id.toUpperCase()}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Right Audio Toggle */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSound}
            className={`p-2.5 rounded-full border backdrop-blur-xl transition-all ${activeTab === 'mall' ? 'border-[#746357]/20 bg-[#f7f0e9]/45 text-[#69584b] hover:bg-[#f7f0e9]/80' : 'bg-slate-950/80 border-white/10 text-slate-300 hover:text-white shadow-lg'}`}
            title={isMuted ? 'Turn Sound On' : 'Mute Ambient Audio'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className={`w-3.5 h-3.5 ${activeTab === 'mall' ? 'text-[#9d795f]' : 'text-amber-400'}`} />}
          </button>
        </div>

      </div>
    </header>
  );
}
