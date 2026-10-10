import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  MapPin,
  Award,
  Scissors,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  Heart,
  Volume2
} from 'lucide-react';
import { playClickSound, playLoomSwoosh, playSuccessChime } from '../../utils/audioEffects';

/**
 * The Makers — Deep Artisanal Heritage Storytelling
 * Replaces generic vendor lists with cinematic craft documentary-style profiles:
 * - Highlighting lineage, workshop tools, looms, thread types, regional GI tags
 * - Transparent artisan payouts and direct commission pathways
 */
export default function ArtisanShowcase({ artisans = [], onSelectArtisan }) {
  const [selectedCraftFilter, setSelectedCraftFilter] = useState('all');

  const defaultMakers = [
    {
      id: 'art-1',
      name: 'Master Weft Krishnan & Smt. Lakshmi',
      craft: 'Pure Mulberry Silk & Real Zari Brocade',
      location: 'Kanchipuram, Tamil Nadu',
      generation: '5th Generation Master Weavers',
      experience: '38 Years of Pit-Loom Weaving',
      bio: 'Pioneers of the interlocking "Korvai" technique where body and border are woven separately and joined with microscopic precision. Every sari requires 140,000 thread passes.',
      tags: ['GI Tagged', 'Real Gold Zari', 'Korvai Join', 'Natural Dyes'],
      rating: 4.98,
      payoutRate: '85% Direct to Artisan',
      quote: '"The loom does not just weave silk; it carries the pulse of our ancestors into modern fashion."',
      image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=80',
    },
    {
      id: 'art-2',
      name: 'Ustad Abdul Karim & Atelier',
      craft: 'Kinkhwab & Varanasi Jamdani Weft',
      location: 'Varanasi, Uttar Pradesh',
      generation: '4th Generation Guild',
      experience: '32 Years of Handloom Brocade',
      bio: 'Specialists in heavy 320 GSM architectural silk twill and gold-embroidered motifs inspired by royal Mughal and modern avant-garde silhouettes.',
      tags: ['Varanasi Silk Guild', 'Handloom Mark', 'Pure Silver Mukaish'],
      rating: 4.95,
      payoutRate: '82% Direct to Artisan',
      quote: '"We translate digital 3D blueprints into hand-knotted warp tensions that machine factories cannot replicate."',
      image: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=1000&q=80',
    },
    {
      id: 'art-3',
      name: 'Sufiyan Ismail Khatri',
      craft: '16-Stage Natural Ajrakh Block Printing',
      location: 'Dhamadka, Kutch, Gujarat',
      generation: '9th Generation Khatri Master',
      experience: '28 Years of Indigo & Madder Dyeing',
      bio: 'Uses carved teakwood blocks to print resist-dyed patterns using river mud, fermented pomegranate rinds, and pure indigo cakes. Weather and river water minerals create distinct textural patinas.',
      tags: ['Kutch Heritage', 'Eco Natural Dyes', 'Teakwood Blocks'],
      rating: 4.99,
      payoutRate: '88% Direct to Artisan',
      quote: '"When the fabric soaks in indigo under the desert sun, the colors breathe with the sky."',
      image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=1000&q=80',
    },
  ];

  const displayMakers = artisans.length > 0 ? artisans : defaultMakers;

  return (
    <div className="min-h-screen bg-[#06080d] text-slate-100 pt-24 pb-24 px-6 sm:px-12 relative overflow-hidden font-sans">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Editorial Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="text-[11px] font-mono tracking-[0.35em] text-amber-400 font-bold uppercase">
            HUMAN MASTERY • LIVING HERITAGE
          </span>
          <h2 className="text-4xl md:text-6xl font-black font-display tracking-tight text-white uppercase">
            THE MAKERS
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed font-light">
            Every garment created in ThreadLabs is individually assigned to master handloom weavers, block printers, and couturiers across India's premier craft clusters.
          </p>
        </div>

        {/* Cinematic Artisan Cards */}
        <div className="space-y-12">
          {displayMakers.map((maker, idx) => (
            <motion.div
              key={maker.id || idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: idx * 0.15 }}
              className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 lg:p-10 backdrop-blur-2xl shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center hover:border-amber-400/40 transition-all group"
            >
              {/* Left Image / Workshop Portrait */}
              <div className="lg:col-span-5 relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-950">
                <img
                  src={maker.image || 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=80'}
                  alt={maker.name}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-white/90">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" /> {maker.location}
                  </span>
                  <span className="bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                    {maker.experience || 'Master Artisan'}
                  </span>
                </div>
              </div>

              {/* Right Story Content */}
              <div className="lg:col-span-7 space-y-5">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">
                      {maker.craft}
                    </span>
                    <span className="text-xs font-mono text-emerald-400 font-bold">
                      ★ {maker.rating || '4.98'} Master Rating
                    </span>
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-bold font-display text-white">
                    {maker.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono italic">
                    {maker.generation || 'Heritage Lineage Guild'}
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
                  {maker.bio || maker.story}
                </p>

                {maker.quote && (
                  <blockquote className="border-l-2 border-amber-400/60 pl-4 text-xs text-amber-200/90 italic font-serif">
                    {maker.quote}
                  </blockquote>
                )}

                {/* Craft Tags */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {(maker.tags || ['Handloom Certified', 'GI Tagged', 'Fair Payout']).map((t) => (
                    <span
                      key={t}
                      className="text-[10px] font-mono px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300"
                    >
                      ✓ {t}
                    </span>
                  ))}
                </div>

                {/* Commission CTA & Direct Payout Badge */}
                <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-[11px] font-mono text-slate-400">
                    Direct Payout: <span className="text-amber-400 font-bold">{maker.payoutRate || '85% of Commission'}</span>
                  </div>

                  <button
                    onClick={() => {
                      playSuccessChime();
                      if (onSelectArtisan) onSelectArtisan(maker);
                    }}
                    className="px-6 py-3 rounded-full bg-white text-slate-950 font-bold text-xs tracking-[0.15em] uppercase transition-all duration-300 hover:bg-amber-400 hover:scale-105 flex items-center justify-center gap-2 shadow-xl"
                  >
                    <span>Direct Commission ↘</span>
                  </button>
                </div>

              </div>

            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
}
