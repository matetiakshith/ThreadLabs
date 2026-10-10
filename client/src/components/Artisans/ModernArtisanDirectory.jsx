import React, { useState } from 'react';
import { Search, Star, MapPin, Sparkles, ShieldCheck, Clock, Scissors, ArrowRight, Eye, Phone, MessageSquare, Compass, Layers } from 'lucide-react';
import HeritageMap3D from '../Three/HeritageMap3D';
import InteractiveCloth3D from '../Three/InteractiveCloth3D';
import { playClickSound, playLoomSwoosh } from '../../utils/audioEffects';

export default function ModernArtisanDirectory({ artisans, activeTechPack, onSelectArtisan, onDirectOrder }) {
  const [selectedCraft, setSelectedCraft] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeViewMode, setActiveViewMode] = useState('grid'); // 'grid' | 'map' | 'cloth'

  const craftTabs = [
    { id: 'all', label: 'All Artisans (सभी कारीगर)' },
    { id: 'zardozi', label: 'Zardozi (ज़रदोज़ी)' },
    { id: 'ajrakh', label: 'Ajrakh Print (अजरक)' },
    { id: 'chikankari', label: 'Chikankari (चिकनकारी)' },
    { id: 'ikat', label: 'Pochampally Ikat (इकात)' },
    { id: 'kantha', label: 'Kantha Stitch (कांथा)' },
    { id: 'dabu', label: 'Bagru Dabu (दाबू)' },
  ];

  const filtered = artisans.filter((artisan) => {
    const matchCraft = selectedCraft === 'all' || artisan.craftSlug === selectedCraft || artisan.craft.toLowerCase().includes(selectedCraft.toLowerCase());
    const matchSearch = !searchQuery || (
      artisan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artisan.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artisan.craft.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchCraft && matchSearch;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      
      {/* Header Banner & Interactive View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            {activeTechPack ? 'Matched Master Artisans' : 'Artisan Directory & Smart Catalogs'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Connect directly with verified traditional weavers & tailors across India. 100% fair trade.
          </p>
        </div>

        {/* View Mode Pills (Grid / 3D Map / 3D Cloth Physics) */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => {
              setActiveViewMode('grid');
              playClickSound();
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeViewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Artisan Cards
          </button>
          <button
            onClick={() => {
              setActiveViewMode('map');
              playLoomSwoosh();
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              activeViewMode === 'map' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-orange-500" />
            <span>3D Craft Map</span>
          </button>
          <button
            onClick={() => {
              setActiveViewMode('cloth');
              playLoomSwoosh();
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              activeViewMode === 'cloth' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>3D Cloth Physics</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: 3D CLUSTER MAP */}
      {activeViewMode === 'map' && (
        <HeritageMap3D
          onSelectArtisanByCraft={(craftSlug) => {
            setSelectedCraft(craftSlug);
            setActiveViewMode('grid');
          }}
        />
      )}

      {/* VIEW 2: 3D CLOTH PHYSICS SIMULATOR */}
      {activeViewMode === 'cloth' && (
        <div className="space-y-3">
          <InteractiveCloth3D />
        </div>
      )}

      {/* VIEW 3: ARTISAN CARDS GRID (Always visible or primary) */}
      {activeViewMode === 'grid' && (
        <div className="space-y-6">
          
          {/* Craft Filter Horizontal Scroll & Search Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none w-full sm:w-auto">
              {craftTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSelectedCraft(tab.id);
                    playClickSound();
                  }}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCraft === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search artisan..."
                className="w-full bg-white pl-10 pr-4 py-2 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
              />
            </div>
          </div>

          {/* Modern Artisan Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((artisan) => (
              <div
                key={artisan.id}
                className="app-card overflow-hidden hover:shadow-modern transition-all flex flex-col justify-between group border border-slate-200/80"
              >
                <div>
                  {/* Card Top / Photo & Header */}
                  <div className="p-5 pb-0 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        <img
                          src={artisan.avatar}
                          alt={artisan.name}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-orange-400 shadow-sm group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-0.5 rounded-full shadow">
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base font-display group-hover:text-blue-600 transition-colors">
                          {artisan.name}
                        </h3>
                        <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-orange-500" />
                          <span>{artisan.region}</span>
                        </p>
                        <div className="flex items-center gap-2 pt-0.5 text-xs font-bold text-amber-500">
                          <span className="flex items-center gap-0.5">
                            <Star className="w-3.5 h-3.5 fill-amber-400" /> {artisan.rating}
                          </span>
                          <span className="text-[11px] text-slate-400 font-normal">
                            ({artisan.completedOrders} orders crafted)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Match percentage badge */}
                    {artisan.matchScore && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Sparkles className="w-3 h-3" /> {artisan.matchScore}% Match
                      </span>
                    )}
                  </div>

                  {/* Craft Tag */}
                  <div className="px-5 pt-4">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase text-orange-600">Heritage Craft:</span>
                      <p className="text-xs font-bold text-slate-900">{artisan.craft}</p>
                    </div>
                  </div>

                  {/* Catalog Snapshot */}
                  {artisan.catalog && artisan.catalog.length > 0 && (
                    <div className="px-5 pt-3 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                        <Eye className="w-3 h-3 text-blue-600" /> Smart Catalog Pieces ({artisan.catalog.length}):
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {artisan.catalog.slice(0, 3).map((piece) => (
                          <div
                            key={piece.id}
                            onClick={() => {
                              playClickSound();
                              onSelectArtisan(artisan);
                            }}
                            className="h-16 rounded-xl overflow-hidden relative cursor-pointer border border-slate-200 group/thumb"
                          >
                            <img src={piece.imageUrl} alt={piece.title} className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform" />
                            <div className="absolute inset-0 bg-black/20 group-hover/thumb:bg-transparent" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="p-5 pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Price starts</span>
                    <p className="text-sm font-black text-slate-900">₹{artisan.basePriceMin?.toLocaleString('en-IN')}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        playClickSound();
                        onSelectArtisan(artisan);
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      View Catalog
                    </button>

                    <button
                      onClick={() => {
                        playLoomSwoosh();
                        onDirectOrder(artisan);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <span>Hire Artisan</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
}
