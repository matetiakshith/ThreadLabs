import React, { useState } from 'react';
import { Volume2, VolumeX, Sparkles, Globe, Compass, Package, Scissors, Menu, X, ArrowUpRight } from 'lucide-react';
import { playClickSound } from '../../utils/audioEffects';

export default function UnseenNav({ currentTab, setCurrentTab, userRole, setUserRole, onOpenHeritage }) {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [langCode, setLangCode] = useState('EN');

  const navItems = [
    { id: 'fashion_mall', label: '3D Runway Mall ✨' },
    { id: 'studio', label: 'Create' },
    { id: 'artisans', label: 'Artisans' },
    { id: 'orders', label: 'Orders' },
    { id: 'artisan_portal', label: 'Artisan Desk' },
  ];

  return (
    <>
      {/* Top Editorial Floating Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 sm:px-10 py-6 pointer-events-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo Brand / Editorial Serif */}
          <div 
            onClick={() => {
              playClickSound();
              setCurrentTab('studio');
            }}
            className="flex items-baseline space-x-1.5 cursor-pointer pointer-events-auto group"
          >
            <span className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-slate-900 group-hover:opacity-75 transition-opacity">
              threadlabs
            </span>
            <span className="text-xs font-sans tracking-widest text-slate-500 uppercase font-light">
              studio
            </span>
          </div>

          {/* Center / Right Links */}
          <div className="flex items-center space-x-4 sm:space-x-8 pointer-events-auto">
            
            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-8 text-sm font-sans tracking-wide">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    playClickSound();
                    setCurrentTab(item.id);
                  }}
                  className={`transition-all capitalize ${
                    currentTab === item.id
                      ? 'font-bold text-slate-900 border-b border-slate-900 pb-0.5'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  {item.label}
                </button>
              ))}

              <button
                onClick={() => {
                  playClickSound();
                  onOpenHeritage();
                }}
                className="text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1"
              >
                <span>Heritage</span>
                <ArrowUpRight className="w-3 h-3 text-slate-400" />
              </button>
            </nav>

            {/* Language Switcher Pill */}
            <div className="bg-white/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200/80 text-xs font-semibold text-slate-800 shadow-sm flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={langCode}
                onChange={(e) => setLangCode(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer text-xs font-bold"
              >
                <option value="EN">EN</option>
                <option value="HI">हिन्दी</option>
                <option value="TA">தமிழ்</option>
                <option value="BN">বাংলা</option>
              </select>
            </div>

            {/* Role Switcher Pill */}
            <button
              onClick={() => {
                playClickSound();
                setUserRole(userRole === 'customer' ? 'artisan' : 'customer');
                if (userRole === 'customer') setCurrentTab('artisan_portal');
                else setCurrentTab('studio');
              }}
              className="px-4 py-1.5 rounded-full text-xs font-bold transition-all backdrop-blur-md shadow-sm border border-slate-200/80 bg-white/80 hover:bg-white text-slate-900 flex items-center gap-1.5"
            >
              {userRole === 'customer' ? '✂️ Artisan Mode' : '👔 Customer View'}
            </button>

          </div>

        </div>
      </header>

      {/* Bottom Floating Bar Elements (unseen.co style) */}
      <div className="fixed bottom-6 left-6 z-40 pointer-events-auto hidden sm:flex items-center gap-3">
        <button
          onClick={() => {
            setAudioEnabled(!audioEnabled);
            playClickSound();
          }}
          className="w-10 h-10 rounded-full bg-white/80 hover:bg-white backdrop-blur-md border border-slate-200/80 flex items-center justify-center text-slate-700 shadow-sm transition-all"
          title={audioEnabled ? "Audio Active" : "Audio Muted"}
        >
          {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        <span className="text-[11px] font-mono text-slate-500 tracking-widest uppercase bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200/60">
          Avishkar 2026 Edition
        </span>
      </div>

      {/* Bottom Right Year/Copyright */}
      <div className="fixed bottom-6 right-6 z-40 pointer-events-none hidden sm:block">
        <span className="text-xs font-mono text-slate-400 tracking-wider">
          ©2026 THREADLABS
        </span>
      </div>
    </>
  );
}
