import React, { useState } from 'react';
import { Sparkles, Globe, User, Scissors, Bell, ChevronDown, Check } from 'lucide-react';

export default function ModernHeader({ currentTab, setCurrentTab, userRole, setUserRole, onOpenHeritage }) {
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState({ code: 'EN', name: 'English', local: 'English' });

  const languages = [
    { code: 'EN', name: 'English', local: 'English' },
    { code: 'HI', name: 'Hindi', local: 'हिंदी' },
    { code: 'TA', name: 'Tamil', local: 'தமிழ்' },
    { code: 'BN', name: 'Bengali', local: 'বাংলা' },
    { code: 'TE', name: 'Telugu', local: 'తెలుగు' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Identity */}
          <div 
            onClick={() => setCurrentTab('studio')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-orange-500 flex items-center justify-center text-white font-extrabold text-xl shadow-float group-hover:scale-105 transition-transform">
              TL
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 font-display">ThreadLabs</span>
                <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  AI + Artisans
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Smart Clothing Linkage for Marginalized Tailors
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60 text-xs font-bold">
            <button
              onClick={() => setCurrentTab('studio')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                currentTab === 'studio'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span>1. Create Outfit</span>
            </button>

            <button
              onClick={() => setCurrentTab('artisans')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                currentTab === 'artisans'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>2. Artisans & Stores</span>
            </button>

            <button
              onClick={() => setCurrentTab('orders')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                currentTab === 'orders'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>3. Live Orders</span>
            </button>
          </nav>

          {/* Right Action Tools: Role Mode + Language Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-xs font-bold text-slate-700 transition-colors border border-slate-200/60"
              >
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>{selectedLang.local}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-2xl shadow-modern border border-slate-100 p-1.5 z-50 animate-in fade-in zoom-in-95">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setSelectedLang(lang);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        selectedLang.code === lang.code ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{lang.local} ({lang.name})</span>
                      {selectedLang.code === lang.code && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Role Switcher Pill */}
            <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200/60 flex items-center text-xs font-bold">
              <button
                onClick={() => {
                  setUserRole('customer');
                  if (currentTab === 'artisan_portal') setCurrentTab('studio');
                }}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  userRole === 'customer'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Customer
              </button>

              <button
                onClick={() => {
                  setUserRole('artisan');
                  setCurrentTab('artisan_portal');
                }}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  userRole === 'artisan'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-orange-600'
                }`}
              >
                <Scissors className="w-3 h-3" />
                <span>Artisan Desk</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
