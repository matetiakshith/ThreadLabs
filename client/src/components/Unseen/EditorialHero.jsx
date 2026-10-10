import React from 'react';
import { ArrowDownRight, Sparkles, Mic, Palette, Camera } from 'lucide-react';
import { playClickSound, playLoomSwoosh } from '../../utils/audioEffects';

export default function EditorialHero({ onStartStudio, onExploreArtisans, onEnterFashionMall }) {
  return (
    <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-4 pt-24 pb-16 z-10 select-none">
      
      {/* Category Pill / Subtitle */}
      <div className="space-y-3 max-w-3xl">
        <p className="text-xs sm:text-sm font-sans tracking-[0.25em] text-slate-700 uppercase font-semibold">
          AN AI-DRIVEN HERITAGE & BESPOKE TAILORING STUDIO
        </p>

        {/* Main Editorial Serif Headline (Unseen Studio style) */}
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-serif italic font-normal text-slate-900 tracking-tight leading-[1.08] drop-shadow-sm">
          Creating the <br />
          <span className="font-sans not-italic font-bold tracking-tight text-slate-900">
            unforgotten
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 font-sans max-w-xl mx-auto pt-2 font-normal leading-relaxed">
          Bridging your custom clothing ideas with master Indian artisans and anime-inspired haute couture in our interactive 3D virtual shopping mall.
        </p>

        {/* Floating Pill Actions */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <button
            onClick={() => {
              playLoomSwoosh();
              if (onEnterFashionMall) onEnterFashionMall();
            }}
            className="px-8 py-3.5 rounded-full text-xs sm:text-sm font-extrabold tracking-wide bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group"
          >
            <Sparkles className="w-4 h-4 text-slate-950 fill-current animate-pulse" />
            <span>Enter 3D Runway Mall</span>
            <ArrowDownRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform" />
          </button>

          <button
            onClick={() => {
              playLoomSwoosh();
              onStartStudio();
            }}
            className="px-7 py-3.5 rounded-full text-xs sm:text-sm font-bold tracking-wide bg-slate-900 hover:bg-slate-800 text-white shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <span>Start Custom Studio</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              onExploreArtisans();
            }}
            className="px-7 py-3.5 rounded-full text-xs sm:text-sm font-bold tracking-wide bg-white/80 hover:bg-white text-slate-900 backdrop-blur-md border border-slate-300/80 shadow-sm hover:scale-105 active:scale-95 transition-all"
          >
            <span>Artisan Gallery</span>
          </button>
        </div>

      </div>

    </section>
  );
}
