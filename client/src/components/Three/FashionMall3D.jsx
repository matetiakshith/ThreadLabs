import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Compass,
  Grid,
  Rotate3d,
  ShoppingBag,
  ArrowRight,
  Hand,
  Sliders,
  Layers,
  Wind
} from 'lucide-react';
import ClothingViewer from './ClothingViewer';
import ProductGallery from './ProductGallery';
import { GARMENT_DATABASE } from './garments/garmentDatabase';
import { playClickSound, playLoomSwoosh, playSuccessChime } from '../../utils/audioEffects';

export default function FashionMall3D({ onSelectOutfitForStudio, onCommissionArtisan }) {
  const [selectedGarment, setSelectedGarment] = useState(GARMENT_DATABASE[0]);
  const [activeTab, setActiveTab] = useState('viewer'); // 'viewer' | 'gallery'
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-8">
      
      {/* Top Experience Navigation Pills */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-mono text-cyan-400 tracking-wider uppercase font-extrabold">
              Virtual 3D Fashion Showroom & GPU Cloth Physics Engine
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-white mt-1">
            Bleach Anime & Modern Haute Couture
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1">
            Interact with real 3D garments powered by Position-Based Dynamics (PBD) cloth simulation. Rotate in 360°, grab & pull fabric, test wind breeze, and commission master tailors.
          </p>
        </div>

        {/* View Switcher (360° Fitting Stage vs Full Catalog Gallery) */}
        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow-xl">
          <button
            onClick={() => {
              setActiveTab('viewer');
              playClickSound();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'viewer'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Rotate3d className="w-4 h-4" />
            <span>360° 3D Fitting Stage</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('gallery');
              playClickSound();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'gallery'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>All Outfits ({GARMENT_DATABASE.length})</span>
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <AnimatePresence mode="wait">
        {activeTab === 'viewer' ? (
          <motion.div
            key="viewer"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
            className="space-y-6"
          >
            {/* Dedicated 360° 3D Product Viewer */}
            <ClothingViewer
              garment={selectedGarment}
              onCommission={(g) => onCommissionArtisan && onCommissionArtisan(g)}
              onCustomizeInStudio={(g) => onSelectOutfitForStudio && onSelectOutfitForStudio(g)}
            />

            {/* Quick Garment Carousel at the Bottom */}
            <div className="bg-slate-900/90 backdrop-blur-md p-5 rounded-3xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Switch Silhouette in Fitting Stage:
                </span>
                <button
                  onClick={() => {
                    setActiveTab('gallery');
                    playClickSound();
                  }}
                  className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <span>Browse Full Catalog</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-2.5">
                {GARMENT_DATABASE.slice(0, 7).map((g) => {
                  const isSelected = g.id === selectedGarment.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => {
                        setSelectedGarment(g);
                        playLoomSwoosh();
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden ${
                        isSelected
                          ? 'bg-blue-900/60 border-blue-500 text-white ring-2 ring-blue-500/40 shadow-lg scale-102 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-amber-300 uppercase font-black">{g.collection}</span>
                        <span className="text-emerald-400 font-mono font-black">{g.price}</span>
                      </div>
                      <div className="text-xs font-bold truncate text-white">{g.name}</div>
                      <div className="text-[10px] text-slate-500 truncate capitalize">{g.fabricType} • {g.gender}</div>

                      {isSelected && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-amber-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="gallery"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
          >
            <ProductGallery
              onSelectGarment={(g) => {
                setSelectedGarment(g);
                setActiveTab('viewer');
                playLoomSwoosh();
              }}
              onDirectCommission={(g) => onCommissionArtisan && onCommissionArtisan(g)}
            />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
