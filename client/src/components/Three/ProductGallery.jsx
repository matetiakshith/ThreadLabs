import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Filter,
  Search,
  Rotate3d,
  Layers,
  ArrowUpRight,
  ShoppingBag,
  Sliders,
  Check,
  Flame,
  Shirt,
  Tag
} from 'lucide-react';
import { GARMENT_DATABASE, CATEGORIES, COLLECTIONS, FABRICS } from './garments/garmentDatabase';
import { playClickSound, playLoomSwoosh } from '../../utils/audioEffects';

export default function ProductGallery({ onSelectGarment, onDirectCommission }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGender, setSelectedGender] = useState('All'); // 'All' | 'Men' | 'Women' | 'Unisex'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCollection, setSelectedCollection] = useState('All');
  const [selectedFabric, setSelectedFabric] = useState('All');

  // Filter items
  const filteredGarments = useMemo(() => {
    return GARMENT_DATABASE.filter((g) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = g.name.toLowerCase().includes(q);
        const matchAnime = g.animeRef && g.animeRef.toLowerCase().includes(q);
        const matchTags = g.tags.some(t => t.toLowerCase().includes(q));
        const matchDesc = g.description.toLowerCase().includes(q);
        if (!matchName && !matchAnime && !matchTags && !matchDesc) return false;
      }

      // Gender
      if (selectedGender !== 'All') {
        if (selectedGender === 'Unisex' && g.gender !== 'Unisex') return false;
        if (selectedGender !== 'Unisex' && g.gender !== selectedGender && g.gender !== 'Unisex') return false;
      }

      // Category
      if (selectedCategory !== 'All' && g.category !== selectedCategory) {
        if (selectedCategory === 'Streetwear' && !g.tags.includes('Streetwear')) return false;
        if (selectedCategory === 'Anime' && g.collection !== 'Anime') return false;
        if (selectedCategory !== 'Streetwear' && selectedCategory !== 'Anime' && g.category !== selectedCategory) return false;
      }

      // Collection
      if (selectedCollection !== 'All' && g.collection !== selectedCollection) {
        return false;
      }

      // Fabric
      if (selectedFabric !== 'All' && g.fabricType.toLowerCase() !== selectedFabric.toLowerCase()) {
        return false;
      }

      return true;
    });
  }, [searchQuery, selectedGender, selectedCategory, selectedCollection, selectedFabric]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* 1. Gallery Title & Intro */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-mono text-cyan-400 tracking-wider uppercase font-extrabold">
              3D Interactive Fashion Catalog
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-white mt-1">
            Haute Couture, Anime & Streetwear Collections
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1">
            Every garment is a real interactive 3D model with GPU cloth physics, natural folds, and drag inertia. Click any outfit to inspect in our 360° fitting stage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            Showing <strong className="text-white">{filteredGarments.length}</strong> of {GARMENT_DATABASE.length} Outfits
          </span>
        </div>
      </div>

      {/* 2. Multi-Filter Bar */}
      <div className="bg-slate-900/90 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-2xl space-y-4">
        
        {/* Search & Gender Switcher Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Bleach haori, trench, hoodie, silk dress..."
              className="w-full bg-slate-950 rounded-2xl border border-slate-800 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* Gender Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-bold text-slate-300 w-full sm:w-auto justify-center">
            {['All', 'Men', 'Women', 'Unisex'].map((g) => (
              <button
                key={g}
                onClick={() => {
                  setSelectedGender(g);
                  playClickSound();
                }}
                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                  selectedGender === g
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {g === 'All' ? 'All Genders' : g}
              </button>
            ))}
          </div>

        </div>

        {/* Categories & Collections Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
          
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
            Collections:
          </span>

          {COLLECTIONS.map((col) => (
            <button
              key={col}
              onClick={() => {
                setSelectedCollection(col);
                playLoomSwoosh();
              }}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                selectedCollection === col
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-extrabold shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {col === 'Anime' ? '✨ Anime (Bleach)' : col}
            </button>
          ))}

          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-4 mr-1">
            Fabric:
          </span>

          {FABRICS.map((fab) => (
            <button
              key={fab}
              onClick={() => {
                setSelectedFabric(fab);
                playLoomSwoosh();
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                selectedFabric === fab
                  ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {fab}
            </button>
          ))}

        </div>

      </div>

      {/* 3. Garments Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredGarments.map((garment) => (
          <motion.div
            key={garment.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            onClick={() => {
              playClickSound();
              onSelectGarment(garment);
            }}
            className="group bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 hover:border-blue-500/60 transition-all duration-300 shadow-xl hover:shadow-2xl cursor-pointer flex flex-col justify-between relative"
          >
            
            {/* Card Visual Header / Color Preview Banner */}
            <div className="relative h-48 bg-gradient-to-b from-slate-950 to-slate-900 p-5 flex flex-col justify-between overflow-hidden">
              
              {/* Subtle Glowing Background Accent */}
              <div
                style={{ backgroundColor: garment.accentColor || garment.defaultColor }}
                className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"
              />

              {/* Top Badges */}
              <div className="flex items-center justify-between z-10">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-800/90 text-amber-300 border border-white/10 backdrop-blur-md">
                  {garment.collection}
                </span>

                <span className="text-xs font-black text-emerald-400 font-mono bg-slate-950/80 px-2.5 py-1 rounded-xl border border-white/5">
                  {garment.price}
                </span>
              </div>

              {/* Center 3D Silhouette Hint Icon & Tag */}
              <div className="text-center my-auto z-10 space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/80 group-hover:bg-blue-600/30 border border-white/10 flex items-center justify-center mx-auto text-blue-400 group-hover:text-cyan-300 group-hover:scale-110 transition-all shadow-lg">
                  <Rotate3d className="w-6 h-6 animate-spin-slow" />
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  3D Cloth Physics • 360° Drag
                </span>
              </div>

              {/* Bottom Fabric Pill */}
              <div className="flex items-center justify-between z-10">
                <span className="text-[10px] text-slate-300 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/5 uppercase font-bold">
                  {garment.fabricType}
                </span>
                <span className="text-[10px] text-cyan-400 font-mono font-bold">
                  {garment.gender}
                </span>
              </div>

            </div>

            {/* Card Content Description */}
            <div className="p-5 space-y-3 flex-1 flex flex-col justify-between bg-slate-900/90">
              
              <div className="space-y-1">
                <h3 className="text-sm font-bold font-display text-white group-hover:text-cyan-300 transition-colors leading-tight">
                  {garment.name}
                </h3>
                {garment.animeRef && (
                  <p className="text-[11px] text-amber-400/90 italic truncate">
                    {garment.animeRef}
                  </p>
                )}
                <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                  {garment.description}
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-400 group-hover:text-cyan-300 flex items-center gap-1 transition-colors">
                  <span>360° 3D Fitting Stage</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </span>

                <div className="flex items-center gap-1">
                  {(garment.colorPalette || [garment.defaultColor]).slice(0, 3).map((hex, i) => (
                    <div
                      key={i}
                      style={{ backgroundColor: hex }}
                      className="w-3 h-3 rounded-full border border-slate-700 shadow-sm"
                    />
                  ))}
                </div>
              </div>

            </div>

          </motion.div>
        ))}
      </div>

    </div>
  );
}
