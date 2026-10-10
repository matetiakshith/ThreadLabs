import React, { useState } from 'react';
import { Search, Filter, Star, MapPin, Sparkles, ShieldCheck, Clock, Scissors, ArrowRight, Eye } from 'lucide-react';

export default function ArtisanExplorer({ artisans, activeTechPack, onSelectArtisan, onDirectOrder }) {
  const [selectedCraft, setSelectedCraft] = useState('all');
  const [selectedState, setSelectedState] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const craftFilters = [
    { id: 'all', label: 'All Crafts' },
    { id: 'zardozi', label: 'Zardozi & Brocade' },
    { id: 'ajrakh', label: 'Ajrakh Block Print' },
    { id: 'chikankari', label: 'Chikankari' },
    { id: 'ikat', label: 'Pochampally Ikat' },
    { id: 'kantha', label: 'Kantha Stitch' },
    { id: 'dabu', label: 'Bagru Dabu' },
  ];

  const stateFilters = ['all', 'Uttar Pradesh', 'Gujarat', 'Telangana', 'West Bengal', 'Rajasthan'];

  // Filter artisans based on craft, state, and search query
  const filteredArtisans = artisans.filter((artisan) => {
    const matchCraft = selectedCraft === 'all' || artisan.craftSlug === selectedCraft || artisan.craft.toLowerCase().includes(selectedCraft.toLowerCase());
    const matchState = selectedState === 'all' || artisan.state.toLowerCase() === selectedState.toLowerCase();
    const matchSearch = !searchQuery || (
      artisan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artisan.craft.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artisan.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artisan.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    return matchCraft && matchState && matchSearch;
  });

  return (
    <div className="bg-heritage-cream py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-heritage-terracotta/10 text-heritage-terracotta text-xs font-semibold mb-2">
              <Scissors className="w-3.5 h-3.5" />
              <span>Verified Master Craftsmen of India</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-heritage-indigo font-display">
              Discover Artisans & Smart Catalogs
            </h2>
            <p className="text-sm text-heritage-muted mt-1">
              Connect directly with generational weavers, block printers, and embroiderers. Zero middlemen.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative min-w-[280px]">
            <Search className="w-4 h-4 text-heritage-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by craft, fabric, or region..."
              className="w-full bg-white pl-10 pr-4 py-2.5 rounded-2xl border border-heritage-silk text-xs font-medium text-heritage-charcoal placeholder-heritage-muted focus:outline-none focus:ring-2 focus:ring-heritage-indigo/20 focus:border-heritage-indigo shadow-sm"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="space-y-3 mb-8">
          
          {/* Craft Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-heritage-muted mr-1">Craft:</span>
            {craftFilters.map((craft) => (
              <button
                key={craft.id}
                onClick={() => setSelectedCraft(craft.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedCraft === craft.id
                    ? 'bg-heritage-indigo text-white shadow-sm'
                    : 'bg-white border border-heritage-silk text-heritage-charcoal hover:bg-heritage-sand'
                }`}
              >
                {craft.label}
              </button>
            ))}
          </div>

          {/* State Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-heritage-muted mr-1">Region:</span>
            {stateFilters.map((st) => (
              <button
                key={st}
                onClick={() => setSelectedState(st)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all capitalize ${
                  selectedState === st
                    ? 'bg-heritage-terracotta text-white font-bold'
                    : 'bg-heritage-sand/80 text-heritage-muted hover:bg-white'
                }`}
              >
                {st === 'all' ? 'All Regions' : st}
              </button>
            ))}
          </div>

        </div>

        {/* Artisans Grid */}
        {filteredArtisans.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-heritage-silk max-w-lg mx-auto space-y-3">
            <p className="text-sm font-bold text-heritage-indigo">No artisans found for these filters.</p>
            <p className="text-xs text-heritage-muted">Try resetting craft or regional search criteria.</p>
            <button
              onClick={() => { setSelectedCraft('all'); setSelectedState('all'); setSearchQuery(''); }}
              className="text-xs font-bold text-heritage-terracotta underline"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArtisans.map((artisan) => (
              <div
                key={artisan.id}
                className="bg-white rounded-3xl border border-heritage-silk overflow-hidden shadow-soft hover:shadow-craft transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Header Card */}
                  <div className="relative p-5 pb-0 flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3.5">
                      <div className="relative">
                        <img
                          src={artisan.avatar}
                          alt={artisan.name}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-heritage-gold shadow-sm group-hover:scale-105 transition-transform"
                        />
                        {artisan.verified && (
                          <div className="absolute -bottom-1 -right-1 bg-heritage-indigo text-heritage-gold p-0.5 rounded-full shadow">
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      <div>
                        <h3 className="font-extrabold text-heritage-indigo text-base font-display group-hover:text-heritage-terracotta transition-colors">
                          {artisan.name}
                        </h3>
                        <p className="text-xs font-medium text-heritage-muted flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-heritage-terracotta" />
                          <span>{artisan.region}</span>
                        </p>
                        <div className="flex items-center gap-2 pt-1 text-xs font-bold text-heritage-gold">
                          <span className="flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-heritage-gold" /> {artisan.rating}
                          </span>
                          <span className="text-[11px] text-heritage-muted font-normal">
                            ({artisan.completedOrders} orders)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Match Score Badge (if present from AI match) */}
                    {artisan.matchScore && (
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
                          <Sparkles className="w-3 h-3" /> {artisan.matchScore}% Match
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Craft Technique Badge */}
                  <div className="px-5 pt-4">
                    <div className="bg-heritage-sand/80 p-3 rounded-2xl border border-heritage-silk/60 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-heritage-terracotta">
                        Heritage Craft Technique
                      </span>
                      <p className="text-xs font-bold text-heritage-indigo">
                        {artisan.craft}
                      </p>
                    </div>
                  </div>

                  {/* Bio snippet */}
                  <div className="px-5 pt-3">
                    <p className="text-xs text-heritage-charcoal/80 line-clamp-2 leading-relaxed">
                      {artisan.bio}
                    </p>
                  </div>

                  {/* Catalog Thumbnail Preview */}
                  {artisan.catalog && artisan.catalog.length > 0 && (
                    <div className="px-5 pt-3 space-y-1.5">
                      <span className="text-[11px] font-bold text-heritage-muted flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Catalog Portfolio:
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {artisan.catalog.slice(0, 3).map((item) => (
                          <div 
                            key={item.id} 
                            onClick={() => onSelectArtisan(artisan)}
                            className="h-16 rounded-xl overflow-hidden relative cursor-pointer border border-heritage-silk group/thumb"
                          >
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover/thumb:bg-transparent transition-colors" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Supported Fabrics Tags */}
                  <div className="px-5 pt-3 flex flex-wrap gap-1">
                    {artisan.fabricsSupported.slice(0, 3).map((fab, i) => (
                      <span key={i} className="text-[10px] font-medium bg-heritage-sand text-heritage-charcoal px-2 py-0.5 rounded-md border border-heritage-silk">
                        {fab}
                      </span>
                    ))}
                    {artisan.fabricsSupported.length > 3 && (
                      <span className="text-[10px] text-heritage-muted px-1">
                        +{artisan.fabricsSupported.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-5 pt-4 mt-3 border-t border-heritage-silk/60 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-heritage-muted uppercase font-semibold">Base Price</span>
                    <p className="text-sm font-extrabold text-heritage-indigo">
                      From ₹{artisan.basePriceMin?.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onSelectArtisan(artisan)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-heritage-indigo bg-heritage-sand hover:bg-heritage-silk border border-heritage-silk transition-all"
                    >
                      Smart Catalog
                    </button>

                    <button
                      onClick={() => onDirectOrder(artisan)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-heritage-terracotta hover:bg-heritage-terracottaLight shadow-sm transition-all flex items-center gap-1"
                    >
                      <span>Commission</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
