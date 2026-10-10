import React, { useState } from 'react';
import { Sparkles, Compass, Scissors, PackageCheck, Globe, UserCheck, Menu, X, BookOpen } from 'lucide-react';

export default function Navbar({ currentTab, setCurrentTab, userRole, setUserRole, onOpenHeritage }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState('EN');

  const languages = [
    { code: 'EN', label: 'English' },
    { code: 'HI', label: 'हिंदी' },
    { code: 'TA', label: 'தமிழ்' },
    { code: 'BN', label: 'বাংলা' },
    { code: 'TE', label: 'తెలుగు' }
  ];

  return (
    <header className="sticky top-0 z-50 bg-heritage-cream/90 backdrop-blur-md border-b border-heritage-silk transition-all shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand Identity */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => setCurrentTab('studio')}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-heritage-terracotta to-heritage-saffron flex items-center justify-center text-white shadow-craft group-hover:scale-105 transition-transform">
              <span className="font-serif text-2xl font-bold tracking-tight">TL</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-display font-extrabold text-2xl tracking-tight text-heritage-indigo">ThreadLabs</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-heritage-terracotta/10 text-heritage-terracotta border border-heritage-terracotta/20">
                  SIH 2026
                </span>
              </div>
              <p className="text-[11px] font-medium text-heritage-muted tracking-wide flex items-center gap-1">
                <span>AI Market Linkage for Marginalized Artisans</span>
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <button
              onClick={() => setCurrentTab('studio')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center space-x-2 ${
                currentTab === 'studio'
                  ? 'bg-heritage-indigo text-white shadow-soft'
                  : 'text-heritage-indigo/80 hover:text-heritage-indigo hover:bg-heritage-sand'
              }`}
            >
              <Sparkles className="w-4 h-4 text-heritage-gold" />
              <span>AI Design Studio</span>
            </button>

            <button
              onClick={() => setCurrentTab('artisans')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center space-x-2 ${
                currentTab === 'artisans'
                  ? 'bg-heritage-indigo text-white shadow-soft'
                  : 'text-heritage-indigo/80 hover:text-heritage-indigo hover:bg-heritage-sand'
              }`}
            >
              <Compass className="w-4 h-4 text-heritage-terracotta" />
              <span>Artisan Discovery</span>
            </button>

            <button
              onClick={() => setCurrentTab('orders')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center space-x-2 ${
                currentTab === 'orders'
                  ? 'bg-heritage-indigo text-white shadow-soft'
                  : 'text-heritage-indigo/80 hover:text-heritage-indigo hover:bg-heritage-sand'
              }`}
            >
              <PackageCheck className="w-4 h-4 text-heritage-emerald" />
              <span>Track Orders</span>
            </button>

            <button
              onClick={onOpenHeritage}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-heritage-terracotta hover:bg-heritage-terracotta/10 transition-colors flex items-center space-x-1.5"
              title="Learn about Indian Heritage Crafts"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Craft Heritage</span>
            </button>
          </nav>

          {/* Right Action Tools: Role Switcher & Multilingual */}
          <div className="hidden md:flex items-center space-x-3">
            
            {/* Language Selector */}
            <div className="relative inline-flex items-center bg-heritage-sand rounded-xl p-1 border border-heritage-silk text-xs">
              <Globe className="w-3.5 h-3.5 text-heritage-muted ml-1 mr-1" />
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent text-xs font-semibold text-heritage-charcoal focus:outline-none cursor-pointer pr-2"
              >
                {languages.map(l => (
                  <option key={l.code} value={l.code}>{l.label} ({l.code})</option>
                ))}
              </select>
            </div>

            {/* Role Switcher Pill (Customer Mode vs Artisan Portal) */}
            <div className="bg-heritage-sand p-1 rounded-xl border border-heritage-silk flex items-center text-xs font-semibold">
              <button
                onClick={() => {
                  setUserRole('customer');
                  if (currentTab === 'artisan_portal') setCurrentTab('studio');
                }}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                  userRole === 'customer'
                    ? 'bg-white text-heritage-indigo shadow-sm font-bold'
                    : 'text-heritage-muted hover:text-heritage-indigo'
                }`}
              >
                <span>Customer</span>
              </button>
              
              <button
                onClick={() => {
                  setUserRole('artisan');
                  setCurrentTab('artisan_portal');
                }}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                  userRole === 'artisan'
                    ? 'bg-heritage-terracotta text-white shadow-sm font-bold'
                    : 'text-heritage-muted hover:text-heritage-terracotta'
                }`}
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Artisan Portal</span>
              </button>
            </div>
          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-heritage-indigo hover:bg-heritage-sand"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-heritage-cream border-b border-heritage-silk px-4 pt-2 pb-6 space-y-3">
          <div className="flex justify-between items-center bg-heritage-sand p-2 rounded-xl mb-4">
            <span className="text-xs font-medium text-heritage-muted">Active View:</span>
            <div className="flex gap-2 text-xs font-semibold">
              <button 
                onClick={() => { setUserRole('customer'); setCurrentTab('studio'); setMobileMenuOpen(false); }}
                className={`px-3 py-1 rounded-md ${userRole === 'customer' ? 'bg-heritage-indigo text-white' : 'bg-white'}`}
              >
                Customer
              </button>
              <button 
                onClick={() => { setUserRole('artisan'); setCurrentTab('artisan_portal'); setMobileMenuOpen(false); }}
                className={`px-3 py-1 rounded-md ${userRole === 'artisan' ? 'bg-heritage-terracotta text-white' : 'bg-white'}`}
              >
                Artisan Portal
              </button>
            </div>
          </div>

          <button
            onClick={() => { setCurrentTab('studio'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-3 rounded-xl font-semibold flex items-center space-x-3 ${
              currentTab === 'studio' ? 'bg-heritage-indigo text-white' : 'text-heritage-charcoal hover:bg-heritage-sand'
            }`}
          >
            <Sparkles className="w-4 h-4 text-heritage-gold" />
            <span>AI Design Studio</span>
          </button>

          <button
            onClick={() => { setCurrentTab('artisans'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-3 rounded-xl font-semibold flex items-center space-x-3 ${
              currentTab === 'artisans' ? 'bg-heritage-indigo text-white' : 'text-heritage-charcoal hover:bg-heritage-sand'
            }`}
          >
            <Compass className="w-4 h-4 text-heritage-terracotta" />
            <span>Artisan Discovery</span>
          </button>

          <button
            onClick={() => { setCurrentTab('orders'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-3 rounded-xl font-semibold flex items-center space-x-3 ${
              currentTab === 'orders' ? 'bg-heritage-indigo text-white' : 'text-heritage-charcoal hover:bg-heritage-sand'
            }`}
          >
            <PackageCheck className="w-4 h-4 text-heritage-emerald" />
            <span>Track Orders</span>
          </button>

          <button
            onClick={() => { onOpenHeritage(); setMobileMenuOpen(false); }}
            className="w-full text-left px-4 py-3 rounded-xl font-semibold flex items-center space-x-3 text-heritage-terracotta hover:bg-heritage-sand"
          >
            <BookOpen className="w-4 h-4" />
            <span>Craft Heritage Archive</span>
          </button>
        </div>
      )}
    </header>
  );
}
