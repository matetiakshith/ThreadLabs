import React from 'react';
import { Heart, Sparkles, ShieldCheck } from 'lucide-react';

export default function Footer({ onOpenHeritage, onSwitchToArtisan }) {
  return (
    <footer className="bg-heritage-indigo text-white border-t border-heritage-silk/20 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-heritage-terracotta to-heritage-saffron flex items-center justify-center text-white font-serif text-xl font-bold">
                TL
              </div>
              <span className="font-display font-extrabold text-2xl tracking-tight">ThreadLabs</span>
            </div>
            <p className="text-xs text-slate-300 max-w-sm leading-relaxed">
              AI-driven market linkage and smart cataloging platform empowering marginalized artisans, weavers, and embroiderers across India.
            </p>
            <p className="text-[11px] text-heritage-goldLight flex items-center gap-1 font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> Team BEATLES_X • Avishkar 2026 Hackathon
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-heritage-goldLight">Platform Modules</h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li><a href="#studio" className="hover:text-white transition-colors">Multimodal AI Studio</a></li>
              <li><a href="#artisans" className="hover:text-white transition-colors">Artisan Discovery & Portfolios</a></li>
              <li><a href="#orders" className="hover:text-white transition-colors">Order Milestone Tracker</a></li>
              <li><button onClick={onSwitchToArtisan} className="hover:text-heritage-gold transition-colors text-left font-semibold">Artisan Partner Portal</button></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-heritage-goldLight">Heritage & Impact</h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li><button onClick={onOpenHeritage} className="hover:text-white transition-colors text-left">Textile Craft Archive</button></li>
              <li><span className="text-emerald-400 font-semibold">100% Direct Fair Compensation</span></li>
              <li><span>Zero Overproduction Waste</span></li>
              <li><span>Preserving Cultural GI Crafts</span></li>
            </ul>
          </div>

        </div>

        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <p>© 2026 ThreadLabs. Designed & Crafted with cultural pride.</p>
          <p className="flex items-center gap-1">
            <span>Built for marginalized artisans</span>
            <Heart className="w-3 h-3 text-red-400 fill-red-400" />
          </p>
        </div>

      </div>
    </footer>
  );
}
