import React, { useState } from 'react';
import { X, Star, MapPin, Award, Clock, ShieldCheck, CheckCircle2, Phone, Sparkles, Scissors, Image as ImageIcon } from 'lucide-react';

export default function ArtisanProfileModal({ artisan, activeTechPack, activeMeasurements, onClose, onCommission }) {
  const [selectedCatalogItem, setSelectedCatalogItem] = useState(null);

  if (!artisan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-heritage-charcoal/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-heritage-silk relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-md transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Header of Artisan Profile */}
        <div className="relative bg-gradient-to-r from-heritage-indigo via-heritage-indigoLight to-heritage-terracotta p-6 sm:p-8 text-white">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <img
              src={artisan.avatar}
              alt={artisan.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-heritage-gold shadow-lg"
            />
            
            <div className="text-center sm:text-left space-y-2 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-heritage-gold text-heritage-indigo flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Master Artisan
                </span>
                {artisan.matchScore && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500 text-white flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> {artisan.matchScore}% Match
                  </span>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold font-display">{artisan.name}</h2>

              <p className="text-xs sm:text-sm text-slate-200 flex items-center justify-center sm:justify-start gap-1.5">
                <MapPin className="w-4 h-4 text-heritage-terracottaLight" />
                <span>{artisan.region}</span>
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1 text-xs">
                <span className="flex items-center gap-1 text-heritage-goldLight font-bold">
                  <Star className="w-3.5 h-3.5 fill-heritage-gold" /> {artisan.rating} ({artisan.reviewCount} reviews)
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-200 font-semibold">{artisan.experienceYears} Years Experience</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-200 font-semibold">{artisan.completedOrders} Orders Crafted</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Biography & Heritage Story */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-heritage-indigo uppercase tracking-wider">Artisan Heritage & Story</h4>
            <p className="text-sm text-heritage-charcoal leading-relaxed">
              {artisan.bio}
            </p>
          </div>

          {/* Specialties & Supported Fabrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-heritage-sand/50 p-4 rounded-2xl border border-heritage-silk space-y-2">
              <span className="text-xs font-bold text-heritage-indigo uppercase tracking-wider flex items-center gap-1">
                <Scissors className="w-3.5 h-3.5 text-heritage-terracotta" /> Master Craft Techniques
              </span>
              <div className="flex flex-wrap gap-1.5">
                {artisan.specialties.map((spec, i) => (
                  <span key={i} className="text-xs bg-white px-2.5 py-1 rounded-lg border border-heritage-silk font-semibold text-heritage-indigo">
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-heritage-sand/50 p-4 rounded-2xl border border-heritage-silk space-y-2">
              <span className="text-xs font-bold text-heritage-indigo uppercase tracking-wider flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-heritage-gold" /> Fabrics & Textiles Supported
              </span>
              <div className="flex flex-wrap gap-1.5">
                {artisan.fabricsSupported.map((fab, i) => (
                  <span key={i} className="text-xs bg-white px-2.5 py-1 rounded-lg border border-heritage-silk font-semibold text-heritage-charcoal">
                    {fab}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Smart Digital Catalog Showcase */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-heritage-indigo uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-heritage-terracotta" /> Digital Portfolio / Smart Catalog ({artisan.catalog?.length || 0} Pieces)
              </h4>
              <span className="text-[11px] text-heritage-muted">Real hand-tailored pieces</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {artisan.catalog?.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => setSelectedCatalogItem(item)}
                  className="bg-white rounded-2xl border border-heritage-silk overflow-hidden shadow-sm hover:shadow-md transition-all group cursor-pointer"
                >
                  <div className="h-44 overflow-hidden relative">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute bottom-2 right-2 bg-heritage-indigo/90 text-white text-xs font-bold px-2.5 py-1 rounded-lg backdrop-blur-sm">
                      ₹{item.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-3.5 space-y-1">
                    <h5 className="font-bold text-heritage-indigo text-sm">{item.title}</h5>
                    <p className="text-xs text-heritage-muted line-clamp-2">{item.description}</p>
                    <div className="flex justify-between items-center pt-2 text-[11px] font-semibold text-heritage-terracotta">
                      <span>{item.craft}</span>
                      <span className="text-heritage-charcoal flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-heritage-muted" /> {item.leadTime}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Commission Bar */}
          <div className="bg-heritage-sand p-5 rounded-2xl border border-heritage-silk flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-heritage-indigo">
                {activeTechPack ? `Commission for "${activeTechPack.garmentType}"` : `Direct Custom Order Inquiry`}
              </p>
              <p className="text-xs text-heritage-muted">
                Estimated pricing starts from ₹{artisan.basePriceMin?.toLocaleString('en-IN')} • {artisan.turnaroundDays}
              </p>
            </div>

            <button
              onClick={() => onCommission(artisan)}
              className="w-full sm:w-auto px-7 py-3 rounded-xl font-extrabold text-sm text-white bg-gradient-to-r from-heritage-terracotta to-heritage-saffron hover:opacity-95 shadow-craft transition-all flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4 text-heritage-goldLight" />
              <span>Place Custom Order with {artisan.name.split(' ')[0]}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
