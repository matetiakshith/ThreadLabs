import React from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, Sparkles, User, ShoppingBag } from 'lucide-react';
import { playClickSound } from '../../utils/audioEffects';

/**
 * Editorial Fashion Top Navigation Bar
 * Features a minimalist, luxury fashion typography aesthetic with subtle glassmorphism
 */
export default function FashionNav({
  activeTab,
  onSelectTab,
  isMuted,
  onToggleSound,
  userRole,
  onToggleRole,
  onOpenOpeningCinematic,
}) {
  const navItems = [
    { id: 'fashion_mall', label: '3D RUNWAY' },
    { id: 'create', label: 'CREATE (AI)' },
    { id: 'artisans', label: 'THE MAKERS' },
    { id: 'orders', label: 'TIMELINE' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 sm:px-10 py-5 pointer-events-none font-sans">
      <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">
        
        {/* Brand / Logo Button */}
        <button
          onClick={() => {
            playClickSound();
            if (onOpenOpeningCinematic) onOpenOpeningCinematic();
          }}
          className="group flex items-center space-x-3 text-left focus:outline-none"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 group-hover:scale-125 transition-transform" />
          <div>
            <span className="text-xs font-mono font-bold tracking-[0.25em] text-white uppercase block leading-none">
              THREADLABS
            </span>
            <span className="text-[9px] font-mono tracking-[0.2em] text-slate-400 uppercase block mt-0.5">
              HAUTE ATELIER
            </span>
          </div>
        </button>

        {/* Center Spatial Navigation Pills */}
        <nav className="hidden md:flex items-center gap-1.5 p-1.5 rounded-full bg-slate-950/80 border border-white/10 backdrop-blur-2xl shadow-2xl">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  playClickSound();
                  onSelectTab(item.id);
                }}
                className={`relative px-4 py-2 rounded-full text-[11px] font-mono tracking-wider font-semibold transition-all duration-300 ${
                  isActive ? 'text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavPill"
                    className="absolute inset-0 bg-white rounded-full shadow-lg"
                    transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Controls: Sound & Role Portal Toggle */}
        <div className="flex items-center space-x-4">
          
          <button
            onClick={onToggleSound}
            className="p-2.5 rounded-full bg-slate-950/80 border border-white/10 text-slate-300 hover:text-white backdrop-blur-xl transition-all shadow-lg"
            title={isMuted ? 'Turn Sound On' : 'Mute Ambient Audio'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
          </button>

          <button
            onClick={onToggleRole}
            className="px-3.5 py-2 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-amber-500/30 text-amber-300 text-[10px] font-mono tracking-wider uppercase backdrop-blur-xl transition-all shadow-lg hidden sm:flex items-center gap-1.5"
          >
            <User className="w-3 h-3 text-amber-400" />
            <span>{userRole === 'artisan' ? 'Switch: Customer' : 'Artisan Portal'}</span>
          </button>

        </div>

      </div>
    </header>
  );
}
