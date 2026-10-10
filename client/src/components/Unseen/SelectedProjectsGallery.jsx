import React, { useState } from 'react';
import { ArrowUpRight, Sparkles, Star, MapPin, Eye } from 'lucide-react';
import { playClickSound, playLoomSwoosh } from '../../utils/audioEffects';

export default function SelectedProjectsGallery({ onSelectPiece, onCommissionArtisan }) {
  const [activeFilter, setActiveFilter] = useState('all');

  const projects = [
    {
      id: 'p-1',
      title: 'Midnight Zardozi Raw Silk Kurta',
      category: 'Silk & Zari',
      artisan: 'Ustad Rahimuddin Ansari',
      location: 'Varanasi, UP',
      price: '₹4,800',
      leadTime: '12 days',
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=1000',
      description: 'Gold metallic floral needlework crafted on pure handwoven raw silk base.'
    },
    {
      id: 'p-2',
      title: 'Indigo Starburst Ajrakh Shirt',
      category: 'Ajrakh',
      artisan: 'Khatri Ismail Mohammed',
      location: 'Kutch, Gujarat',
      price: '₹2,600',
      leadTime: '8 days',
      image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=1000',
      description: '16-stage natural botanical indigo and madder root hand block printing.'
    },
    {
      id: 'p-3',
      title: 'Sage Green Shadow-Work Anarkali',
      category: 'Chikankari',
      artisan: 'Begum Shagufta Parveen',
      location: 'Lucknow, UP',
      price: '₹4,200',
      leadTime: '14 days',
      image: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?auto=format&fit=crop&q=80&w=1000',
      description: 'Featherlight pure georgette with 32 traditional shadow-work needle stitches.'
    },
    {
      id: 'p-4',
      title: 'Monochrome Chevron Ikat Blazer',
      category: 'Ikat',
      artisan: 'Balaram Padmashali',
      location: 'Pochampally, Telangana',
      price: '₹3,800',
      leadTime: '11 days',
      image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=1000',
      description: 'Precision double-ikat tie-dyed warp and weft woven on traditional pit looms.'
    },
    {
      id: 'p-5',
      title: 'Forest Green Kantha Tussar Overcoat',
      category: 'Kantha',
      artisan: 'Manjula Devi Roy',
      location: 'Shantiniketan, Bengal',
      price: '₹4,600',
      leadTime: '15 days',
      image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=1000',
      description: 'Rural folk narrative running stitches on organic wild Tussar silk.'
    },
    {
      id: 'p-6',
      title: 'Earthy Grey Dabu Block Summer Shirt',
      category: 'Dabu',
      artisan: 'Devi Lal Chhipa',
      location: 'Bagru, Rajasthan',
      price: '₹2,100',
      leadTime: '6 days',
      image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&q=80&w=1000',
      description: 'Bagru mud-resist dipped in subterranean kashish mineral dye vats.'
    }
  ];

  const filterTabs = [
    { id: 'all', label: 'All (6)' },
    { id: 'Silk & Zari', label: 'Silk & Zari (1)' },
    { id: 'Ajrakh', label: 'Ajrakh (1)' },
    { id: 'Chikankari', label: 'Chikankari (1)' },
    { id: 'Ikat', label: 'Ikat (1)' },
  ];

  const filtered = activeFilter === 'all' ? projects : projects.filter(p => p.category === activeFilter);

  return (
    <section className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-8 z-10">
      
      {/* Section Title (unseen.co style) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <span className="text-xs font-sans tracking-[0.2em] text-slate-400 uppercase font-bold">
            CURATED PIECES
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif text-slate-900 mt-1">
            Selected Creations
          </h2>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveFilter(tab.id);
                playClickSound();
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white/70 text-slate-600 hover:bg-white border border-slate-200/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2-Column Luxury Showcase Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="group cursor-pointer space-y-3 bg-white/70 backdrop-blur-md p-4 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300"
          >
            {/* Image Container with Hover Scale */}
            <div className="h-72 sm:h-80 rounded-2xl overflow-hidden relative">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full">
                {item.price}
              </div>
            </div>

            {/* Metadata Footer */}
            <div className="flex justify-between items-start pt-1">
              <div>
                <h3 className="text-lg font-serif font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-orange-500" />
                  <span>{item.artisan} • {item.location}</span>
                </p>
              </div>

              <span className="text-xs font-mono text-slate-400 font-bold">
                {item.leadTime}
              </span>
            </div>

            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          </div>
        ))}
      </div>

    </section>
  );
}
