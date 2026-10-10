import React from 'react';
import { Sparkles, Mic, Palette, Image as ImageIcon, ArrowRight, ShieldCheck, HeartHandshake, Award } from 'lucide-react';

export default function Hero({ onStartCreating, onExploreArtisans }) {
  return (
    <section className="relative overflow-hidden pt-8 pb-12 md:pt-14 md:pb-20 border-b border-heritage-silk bg-gradient-to-b from-heritage-sand/60 via-heritage-cream to-heritage-cream">
      {/* Subtle decorative heritage radial glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-heritage-terracotta/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-heritage-indigo/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Column */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-heritage-terracotta/10 border border-heritage-terracotta/20 text-heritage-terracotta text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-heritage-terracotta" />
              <span>Multimodal AI meets Centuries of Traditional Craftsmanship</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-heritage-indigo leading-[1.15] tracking-tight font-display">
              Describe your idea. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-heritage-terracotta via-heritage-saffron to-heritage-gold">
                Master artisans
              </span> craft it for you.
            </h1>

            <p className="text-base sm:text-lg text-heritage-charcoal/80 max-w-2xl leading-relaxed">
              ThreadLabs translates your thoughts—spoken, typed, sketched, or uploaded—into precise tailor tech-packs, linking you directly with marginalized weavers, block printers, and embroiderers across India.
            </p>

            {/* Input Method Badges */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-heritage-silk text-xs font-medium text-heritage-indigo shadow-sm">
                <span className="w-2 h-2 rounded-full bg-heritage-indigo"></span>
                Type Text Prompt
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-heritage-silk text-xs font-medium text-heritage-terracotta shadow-sm">
                <Mic className="w-3.5 h-3.5 text-heritage-terracotta" />
                Speak in Any Language
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-heritage-silk text-xs font-medium text-heritage-emerald shadow-sm">
                <Palette className="w-3.5 h-3.5 text-heritage-emerald" />
                Hand-Draw Sketch
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-heritage-silk text-xs font-medium text-heritage-gold shadow-sm">
                <ImageIcon className="w-3.5 h-3.5 text-heritage-gold" />
                Upload Reference Image
              </span>
            </div>

            {/* CTAs */}
            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <button
                onClick={onStartCreating}
                className="px-7 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-heritage-terracotta to-heritage-saffron hover:opacity-95 shadow-craft transition-all flex items-center justify-center space-x-2 group hover:scale-[1.02]"
              >
                <span>Launch AI Studio</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onExploreArtisans}
                className="px-6 py-3.5 rounded-xl font-bold text-heritage-indigo bg-white border border-heritage-silk hover:bg-heritage-sand transition-all flex items-center justify-center shadow-soft"
              >
                <span>Browse Artisan Portfolios</span>
              </button>
            </div>

            {/* Trust & Impact Stats */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-heritage-silk">
              <div>
                <p className="text-2xl font-black text-heritage-indigo font-display">100%</p>
                <p className="text-xs text-heritage-muted font-medium">Direct Artisan Fair Pay</p>
              </div>
              <div>
                <p className="text-2xl font-black text-heritage-terracotta font-display">6+</p>
                <p className="text-xs text-heritage-muted font-medium">GI-Tagged Craft Regions</p>
              </div>
              <div>
                <p className="text-2xl font-black text-heritage-emerald font-display">Zero</p>
                <p className="text-xs text-heritage-muted font-medium">Fast-Fashion Waste</p>
              </div>
            </div>

          </div>

          {/* Right Hero Visual Showcase Card */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md">
              
              {/* Decorative behind glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-heritage-gold/20 via-heritage-terracotta/20 to-heritage-indigo/20 rounded-3xl transform rotate-2 scale-105 filter blur-lg -z-10" />

              <div className="glass-card rounded-3xl p-6 shadow-soft border border-heritage-silk relative space-y-4">
                
                {/* Header of Preview Card */}
                <div className="flex items-center justify-between pb-3 border-b border-heritage-silk">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-heritage-terracotta animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-heritage-muted">Live Workflow Demo</span>
                  </div>
                  <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    98% Artisan Match
                  </span>
                </div>

                {/* Input snippet */}
                <div className="bg-heritage-sand/80 p-3.5 rounded-2xl border border-heritage-silk/80 text-xs space-y-1">
                  <div className="flex items-center justify-between text-heritage-muted font-semibold">
                    <span className="flex items-center gap-1">
                      <Mic className="w-3 h-3 text-heritage-terracotta" /> Voice Input (Hindi / English)
                    </span>
                    <span className="text-[10px]">0:04s</span>
                  </div>
                  <p className="text-heritage-indigo italic font-serif text-sm">
                    "Deep navy raw silk kurta with delicate gold zardozi motifs on the collar for a wedding."
                  </p>
                </div>

                {/* AI Structuring Transform Arrow */}
                <div className="flex items-center justify-center">
                  <div className="bg-heritage-indigo text-white text-[11px] px-3 py-1 rounded-full font-semibold flex items-center gap-1 shadow-sm">
                    <Sparkles className="w-3 h-3 text-heritage-gold" />
                    <span>AI Structured Tech-Pack</span>
                  </div>
                </div>

                {/* Extracted Blueprint Card */}
                <div className="bg-white p-4 rounded-2xl border border-heritage-silk space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-heritage-indigo">Garment:</span>
                    <span className="font-medium text-heritage-charcoal">Festive Kurta</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-heritage-indigo">Fabric Base:</span>
                    <span className="font-medium text-heritage-charcoal">Varanasi Raw Silk</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-heritage-indigo">Craft Technique:</span>
                    <span className="font-semibold text-heritage-terracotta">Zardozi Hand Zari</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-heritage-silk/50">
                    <span className="text-heritage-muted">Matched Master:</span>
                    <span className="font-bold text-heritage-indigo">Ustad Rahimuddin (Varanasi)</span>
                  </div>
                </div>

                {/* Verified Artisan Badge Footer */}
                <div className="flex items-center space-x-3 pt-1">
                  <img 
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120"
                    alt="Artisan" 
                    className="w-10 h-10 rounded-full object-cover border-2 border-heritage-gold"
                  />
                  <div className="text-left flex-1 text-xs">
                    <p className="font-bold text-heritage-indigo">Ustad Rahimuddin Ansari</p>
                    <p className="text-heritage-muted text-[11px]">National Awardee • 28 yrs exp</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-heritage-terracotta text-sm">₹4,600</span>
                    <p className="text-[10px] text-heritage-muted">12 days crafting</p>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
