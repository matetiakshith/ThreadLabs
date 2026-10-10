import React, { useState } from 'react';
import { MapPin, Sparkles, Scissors, ArrowRight, BookOpen, Star, Volume2 } from 'lucide-react';
import { playClickSound, playLoomSwoosh } from '../../utils/audioEffects';

export default function HeritageMap3D({ onSelectArtisanByCraft }) {
  const [selectedCluster, setSelectedCluster] = useState('kutch');

  const clusters = [
    {
      id: 'kutch',
      name: 'Kutch, Gujarat',
      craft: 'Ajrakh Mud-Resist & Natural Indigo',
      craftSlug: 'ajrakh',
      artisanName: 'Khatri Ismail Mohammed',
      artisanAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
      description: '16-stage botanical resist printing using river washing and teak-wood hand blocks.',
      badge: 'UNESCO Awardee Cluster',
      tagColor: 'from-blue-600 to-indigo-700',
      mapPos: { top: '48%', left: '22%' }
    },
    {
      id: 'varanasi',
      name: 'Varanasi, Uttar Pradesh',
      craft: 'Zardozi Metallic Zari & Brocades',
      craftSlug: 'zardozi',
      artisanName: 'Ustad Rahimuddin Ansari',
      artisanAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
      description: 'Generational real gold and silver metallic wire needle embroidery on pure raw silk.',
      badge: 'GI-Tagged National Heritage',
      tagColor: 'from-amber-500 to-orange-600',
      mapPos: { top: '38%', left: '55%' }
    },
    {
      id: 'lucknow',
      name: 'Lucknow, Uttar Pradesh',
      craft: 'Chikankari & Mukaish Work',
      craftSlug: 'chikankari',
      artisanName: 'Begum Shagufta Parveen',
      artisanAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
      description: '32 ancient needle stitches including shadow work Bakhiya and delicate silver Mukaish badla.',
      badge: '30-Woman Artisan Guild',
      tagColor: 'from-emerald-600 to-teal-700',
      mapPos: { top: '33%', left: '48%' }
    },
    {
      id: 'pochampally',
      name: 'Pochampally, Telangana',
      craft: 'Double Ikat Handloom Weave',
      craftSlug: 'ikat',
      artisanName: 'Balaram Padmashali',
      artisanAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
      description: 'Pagdu Bandhu warp-and-weft tie-dye weaving creating sharp geometric chevron symmetries.',
      badge: 'Bhoodan Weavers Village',
      tagColor: 'from-rose-600 to-pink-700',
      mapPos: { top: '65%', left: '46%' }
    },
    {
      id: 'shantiniketan',
      name: 'Bolpur, West Bengal',
      craft: 'Kantha Narrative Stitching',
      craftSlug: 'kantha',
      artisanName: 'Manjula Devi Roy',
      artisanAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
      description: 'Rural folk storytelling through running stitches on wild Tussar and handspun cotton.',
      badge: 'Folk Living Heritage',
      tagColor: 'from-amber-600 to-yellow-700',
      mapPos: { top: '44%', left: '74%' }
    },
    {
      id: 'bagru',
      name: 'Bagru, Rajasthan',
      craft: 'Dabu Mud-Resist & Kashish Dye',
      craftSlug: 'dabu',
      artisanName: 'Devi Lal Chhipa',
      artisanAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400',
      description: 'Ancient mud-resist printing using underground indigo pits and botanical harda mineral extract.',
      badge: '7th-Gen Chhipa Lineage',
      tagColor: 'from-stone-600 to-neutral-800',
      mapPos: { top: '36%', left: '33%' }
    }
  ];

  const current = clusters.find(c => c.id === selectedCluster) || clusters[0];

  return (
    <div className="app-card p-6 sm:p-8 space-y-6 border border-slate-200">
      
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-4 border-b border-slate-100">
        <div>
          <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Regional GI-Tagged Heritage Clusters
          </span>
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display mt-0.5">
            Explore Master Craft Hubs Across India
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          Tap any cluster pin to explore generational master artisans
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Interactive Stylized 3D-Look Map Canvas */}
        <div className="lg:col-span-7 relative h-[360px] sm:h-[420px] rounded-3xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 overflow-hidden shadow-2xl p-4">
          
          {/* Subtle Grid Overlay */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
          
          {/* Stylized India Geography Contour Silhouette */}
          <svg className="w-full h-full opacity-40" viewBox="0 0 500 500" fill="none">
            <path
              d="M 200 60 Q 260 80 290 120 T 320 180 T 380 220 T 400 280 T 340 320 T 260 440 T 220 460 T 180 380 T 140 320 T 120 220 T 150 140 Z"
              stroke="#60a5fa"
              strokeWidth="2"
              fill="rgba(37, 99, 235, 0.08)"
            />
          </svg>

          {/* Pulsing Interactive Cluster Pins */}
          {clusters.map((cluster) => {
            const isSelected = selectedCluster === cluster.id;
            return (
              <div
                key={cluster.id}
                style={{ top: cluster.mapPos.top, left: cluster.mapPos.left }}
                onClick={() => {
                  setSelectedCluster(cluster.id);
                  playClickSound();
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
              >
                <div className={`relative flex items-center justify-center transition-all ${
                  isSelected ? 'scale-125' : 'hover:scale-110'
                }`}>
                  <span className={`absolute w-8 h-8 rounded-full animate-ping opacity-60 ${
                    isSelected ? 'bg-orange-400' : 'bg-blue-400'
                  }`} />
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg border-2 ${
                    isSelected ? 'bg-orange-500 border-white ring-4 ring-orange-500/30' : 'bg-blue-600 border-white/80'
                  }`}>
                    <Scissors className="w-4 h-4" />
                  </div>
                </div>

                <div className={`absolute top-9 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-1 rounded-xl text-[10px] font-bold backdrop-blur-md border transition-all ${
                  isSelected
                    ? 'bg-orange-500 text-white border-orange-400 shadow-md'
                    : 'bg-slate-900/90 text-slate-300 border-white/10 group-hover:text-white'
                }`}>
                  {cluster.name.split(',')[0]}
                </div>
              </div>
            );
          })}

        </div>

        {/* Selected Cluster Info Card */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="app-card p-6 border-2 border-slate-200 space-y-4 shadow-sm bg-gradient-to-br from-white via-slate-50 to-white">
            
            <div className="flex justify-between items-start">
              <div>
                <span className="bg-orange-100 text-orange-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {current.badge}
                </span>
                <h4 className="text-xl font-extrabold text-slate-900 font-display mt-2">{current.name}</h4>
                <p className="text-xs font-bold text-blue-600">{current.craft}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {current.description}
            </p>

            {/* Featured Master Artisan of this cluster */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <img
                  src={current.artisanAvatar}
                  alt={current.artisanName}
                  className="w-12 h-12 rounded-xl object-cover border-2 border-orange-400"
                />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Featured Master</span>
                  <h5 className="font-extrabold text-slate-900 text-xs">{current.artisanName}</h5>
                  <p className="text-[11px] text-emerald-600 font-bold">✓ Verified Direct Workshop</p>
                </div>
              </div>

              <button
                onClick={() => {
                  playLoomSwoosh();
                  if (onSelectArtisanByCraft) onSelectArtisanByCraft(current.craftSlug);
                }}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-1 shrink-0"
              >
                <span>Explore</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
