import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Navigation,
  Compass,
  Star,
  Clock,
  IndianRupee,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  Phone,
  Scissors,
  Layers,
  User,
  X
} from 'lucide-react';
import { playClickSound, playLoomSwoosh, playSuccessChime } from '../../utils/audioEffects';
import indiaMap from '@svg-maps/india';
import statewideProfiles from '../../data/artisans.json';

const ALL_INDIA_STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry'];

/**
 * Tab 3: AI Artisan Recommendation (Rapido / Ola Model)
 * - Map proximity radar showing YOU and nearby available artisans
 * - Distance, capabilities, pricing, and estimated completion days
 * - Artisan Profile Modal & Instant Order Confirmation Dialog -> Leads to Tab 4 (Order Tracking)
 */
export default function ArtisanMatchingMap({
  customerRequirement,
  customerName,
  onConfirmOrder,
  onBackToNeeds,
}) {
  const [selectedArtisan, setSelectedArtisan] = useState(null);
  const [activeProfileModal, setActiveProfileModal] = useState(null);
  const [confirmationOrder, setConfirmationOrder] = useState(null);
  const [deliveryMode, setDeliveryMode] = useState('pickup');
  const [searchMode, setSearchMode] = useState(null);
  const [chosenState, setChosenState] = useState('Uttar Pradesh');

  // Realistic mock artisan dataset with geolocation offsets for proximity radar
  const nearbyArtisans = [
    {
      id: 'art-ravi',
      state: 'Karnataka',
      name: 'Ravi Tailors & Studio',
      distanceKm: 1.8,
      specialties: ['Casual Wear', 'T-Shirts', 'Denim Jeans'],
      textiles: ['Organic Cotton', 'Selvedge Denim', 'Slub Twill'],
      stitchingExp: '24 Years Master Tailor',
      rating: 4.95,
      reviewsCount: 312,
      priceRange: '₹900 – ₹1,200',
      estimatedDays: '3–4 Days',
      availability: 'AVAILABLE NOW',
      location: 'Indiranagar 100ft Rd, Bangalore',
      mapPos: { x: 58, y: 38 }, // Percentage coordinates on radar
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      bio: 'Master craftsman specializing in modern relaxed silhouettes, heavy GSM jersey, and denim flat-felled seam construction.',
      recentWorks: [
        'Black Drop-Shoulder Oversized Tee',
        'Raw Indigo Selvedge 5-Pocket Jeans',
        'Relaxed Camp Collar Linen Shirt'
      ]
    },
    {
      id: 'art-meera',
      state: 'Karnataka',
      name: 'Meera Boutique & Atelier',
      distanceKm: 2.4,
      specialties: ["Women's Wear", 'Dresses', 'Traditional Silk'],
      textiles: ['Chanderi Silk', 'Mulberry Weft', 'Georgette'],
      stitchingExp: '18 Years Bridal & Couture',
      rating: 4.98,
      reviewsCount: 428,
      priceRange: '₹1,200 – ₹1,600',
      estimatedDays: '3 Days',
      availability: 'AVAILABLE NOW',
      location: 'Koramangala 4th Block, Bangalore',
      mapPos: { x: 35, y: 64 },
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
      bio: 'Specialist in precision waist sculpting, French seam hand finishes, and zari neck embroidery.',
      recentWorks: [
        'Asymmetric Pleated Chanderi Dress',
        'Zari Neck Kimono Wrap Top',
        'Flared Anarkali Ensemble'
      ]
    },
    {
      id: 'art-stylecraft',
      state: 'Karnataka',
      name: 'StyleCraft Bespoke Lab',
      distanceKm: 3.2,
      specialties: ['Streetwear', 'Jackets', 'Oversized Fits'],
      textiles: ['French Terry', 'Technical Nylon', 'Worsted Twill'],
      stitchingExp: '12 Years Contemporary Fashion',
      rating: 4.92,
      reviewsCount: 184,
      priceRange: '₹1,000 – ₹1,400',
      estimatedDays: '4 Days',
      availability: 'AVAILABLE NOW',
      location: 'HSR Layout Sector 2, Bangalore',
      mapPos: { x: 74, y: 68 },
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      bio: 'Contemporary tailoring lab crafting boxy hoodies, utility cargo jackets, and anime streetwear collaborations.',
      recentWorks: [
        'Wandenreich Military Trench',
        'Heavyweight Kimono Hoodie',
        'Curved Dart Cargo Trousers'
      ]
    },
    {
      id: 'art-classic',
      state: 'Karnataka',
      name: 'Classic Cuts Tailoring',
      distanceKm: 4.0,
      specialties: ['Formal Wear', 'Suits', 'Pleated Trousers'],
      textiles: ['Giza Cotton', 'Super 120s Wool', 'Linen'],
      stitchingExp: '30 Years Savile-Style Tailoring',
      rating: 4.88,
      reviewsCount: 260,
      priceRange: '₹1,100 – ₹1,500',
      estimatedDays: '4 Days',
      availability: 'AVAILABLE NOW',
      location: 'Lavelle Road, Bangalore',
      mapPos: { x: 28, y: 32 },
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
      bio: 'Handmade canvas fronts, hand-sewn buttonholes, and precision pattern drafting for executive gentlemen.',
      recentWorks: [
        'Spread Collar Formal Dress Shirt',
        'High-Waisted Gurkha Trousers',
        'Single-Breasted Italian Blazer'
      ]
    },
  ];

  const priorRating = 4.6;
  const priorVotes = 20;
  const artisanDirectory = [...statewideProfiles, ...nearbyArtisans];
  const rankedArtisans = nearbyArtisans.map((artisan) => ({
    ...artisan,
    trustScore: (artisan.rating * artisan.reviewsCount + priorRating * priorVotes) / (artisan.reviewsCount + priorVotes),
  })).sort((a, b) => b.trustScore - a.trustScore || b.reviewsCount - a.reviewsCount);
  const visibleArtisans = searchMode === 'nearby'
    ? rankedArtisans.filter((artisan) => artisan.distanceKm <= 5)
    : artisanDirectory.filter((artisan) => artisan.state === chosenState).map((artisan) => ({ ...artisan, trustScore: (artisan.rating * artisan.reviewsCount + priorRating * priorVotes) / (artisan.reviewsCount + priorVotes) })).sort((a,b)=>b.trustScore-a.trustScore || b.reviewsCount-a.reviewsCount);
  const highlightedState = searchMode === 'state'
    ? chosenState
    : visibleArtisans.find((artisan) => artisan.id === selectedArtisan?.id)?.state || visibleArtisans[0]?.state;
  const highlightedMapNames = highlightedState === 'Dadra and Nagar Haveli and Daman and Diu'
    ? ['Dadra and Nagar Haveli', 'Daman and Diu']
    : [highlightedState];

  if (!searchMode) return <div data-palette="rose" className="min-h-screen bg-[#F7F4D5] text-[#382b29] px-6 pt-32 pb-20"><div className="max-w-4xl mx-auto rounded-[2rem] bg-[#F7F4D5] border border-[#dcc3b9] p-8 sm:p-12 shadow-xl"><p className="text-xs tracking-[.25em] uppercase text-[#105666]">Step 3 · Find your maker</p><h2 className="mt-3 text-3xl sm:text-4xl font-serif">Where should we search?</h2><p className="mt-3 text-[#705a56]">Choose local workshops or compare artisans across a state. Recommendations weigh rating quality together with the number of reviews.</p><div className="mt-8 grid sm:grid-cols-2 gap-4"><button onClick={()=>setSearchMode('nearby')} className="rounded-2xl bg-[#E2E8CB] border border-[#d9b8ae] p-6 text-left hover:bg-[#ecd5cb]"><strong className="text-xl">Nearby artisans</strong><span className="block mt-2 text-sm text-[#705a56]">Prioritize workshops close to you.</span></button><div className="rounded-2xl bg-[#E2E8CB] border border-[#d9b8ae] p-6"><label className="text-sm font-semibold">Search by state or union territory</label><select value={chosenState} onChange={(e)=>setChosenState(e.target.value)} className="mt-3 w-full rounded-xl border border-[#c9aaa0] bg-[#F7F4D5] px-3 py-3">{ALL_INDIA_STATES.map((state)=><option key={state}>{state}</option>)}</select><button onClick={()=>setSearchMode('state')} className="mt-3 w-full rounded-xl bg-[#a96f7e] px-4 py-3 font-semibold text-white">Compare state artisans</button></div></div><button onClick={onBackToNeeds} className="mt-7 text-sm text-[#8a625d]">← Edit outfit requirements</button></div></div>;

  const handleSelectArtisanForOrder = (artisan) => {
    playClickSound();
    const baseCost = Number(artisan.priceRange.split('–')[0].replace(/[^0-9]/g, '')) || 1100;
    const deliveryFee = Math.round((45 + artisan.distanceKm * 15) / 10) * 10;
    const deliveryEtaMinutes = Math.max(8, Math.round(8 + artisan.distanceKm * 2));
    setDeliveryMode('pickup');
    setConfirmationOrder({
      artisan,
      garmentTitle: customerRequirement?.title || 'Black Oversized T-Shirt + Blue Jeans',
      baseCost,
      deliveryFee,
      deliveryEtaMinutes,
      days: artisan.estimatedDays,
      distance: `${artisan.distanceKm} km away`,
    });
  };

  const handleFinalConfirm = () => {
    playSuccessChime();
    const orderObj = {
      orderId: `TL${Math.floor(1000 + Math.random() * 9000)}`,
      artisanId: confirmationOrder.artisan.id,
      artisanName: confirmationOrder.artisan.name,
      artisanRating: confirmationOrder.artisan.rating,
      artisanState: confirmationOrder.artisan.state,
      artisanAvatar: confirmationOrder.artisan.avatar,
      artisanPhone: '+91 98765 43210',
      artisanLocation: confirmationOrder.artisan.location,
      garmentTitle: confirmationOrder.garmentTitle,
      baseCost: confirmationOrder.baseCost,
      deliveryMode,
      deliveryFee: deliveryMode === 'delivery' ? confirmationOrder.deliveryFee : 0,
      totalCost: confirmationOrder.baseCost + (deliveryMode === 'delivery' ? confirmationOrder.deliveryFee : 0),
      deliveryStatus: deliveryMode === 'delivery' ? 'awaiting_pickup' : null,
      deliveryEtaMinutes: deliveryMode === 'delivery' ? confirmationOrder.deliveryEtaMinutes : null,
      estimatedCompletion: confirmationOrder.days,
      distanceKm: confirmationOrder.artisan.distanceKm,
      currentStageIndex: 4, // Cutting is the active benchmark stage
      createdAt: new Date().toISOString(),
      ...customerRequirement,
      garmentTitle: confirmationOrder.garmentTitle,
      artisanId: confirmationOrder.artisan.id,
      artisanName: confirmationOrder.artisan.name,
      artisanState: confirmationOrder.artisan.state,
      artisanRating: confirmationOrder.artisan.rating,
      customerName: customerName || 'ThreadLabs customer',
      currentStageIndex: 0,
    };
    onConfirmOrder(orderObj);
  };

  return (
    <div data-palette="rose" className="min-h-screen bg-[#090d16] text-slate-100 pt-24 pb-20 px-6 sm:px-12 relative overflow-hidden font-sans">
      
      {/* Background Ambience */}
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-10 relative z-10">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-mono tracking-[0.25em] text-emerald-400 font-bold uppercase">
                STEP 3 OF 4 • RAPIDO-STYLE ARTISAN MATCHING
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black font-display text-white mt-1 uppercase">
              {searchMode === 'nearby' ? 'NEARBY MAKERS FOR YOUR OUTFIT' : `MAKERS IN ${chosenState.toUpperCase()}`}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Matching for: <span className="text-amber-400 font-bold font-mono">{customerRequirement?.title || 'Black Oversized T-Shirt + Blue Jeans'}</span>
            </p>
          </div>

          <button
            onClick={onBackToNeeds}
            className="text-xs font-mono text-slate-400 hover:text-white transition-colors self-start sm:self-auto"
          >
            ← Modify Requirements
          </button>
        </div>

        {/* Proximity Radar Map + Artisan Results List Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: ThreadLabs Stylized Proximity Radar Map (Rapido/Ola style) */}
          <div className="lg:col-span-5 bg-slate-900/80 border border-white/10 rounded-3xl p-6 backdrop-blur-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '10s' }} />
                <span>{highlightedState || 'India'} · Artisan state</span>
              </span>
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold">
                {visibleArtisans.length} Listed
              </span>
            </div>

            {/* Simulated Radar Screen */}
            <div className="relative w-full aspect-square rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
              
              <svg viewBox={indiaMap.viewBox} className="w-full h-full p-5" role="img" aria-label={`Map of India highlighting ${highlightedState || 'artisan state'}`}>
                {indiaMap.locations.map((location) => <path key={location.id} d={location.path} fill={highlightedMapNames.includes(location.name) ? '#D3968C' : '#E2E8CB'} stroke="#839958" strokeWidth="1.5" className="transition-colors" />)}
              </svg>
            </div>

            <p className="text-[11px] font-mono text-slate-400 text-center leading-relaxed">
              Highlighted state: {highlightedState || 'No match'} · State boundary map by SVG Maps (CC BY 4.0)
            </p>
          </div>

          {/* RIGHT: Artisan Recommendation Cards (Rapido-Style) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="mb-2 flex items-center justify-between"><p className="text-xs text-slate-400">{searchMode === 'nearby' ? 'Nearby workshops' : `Artisans in ${chosenState}`} · ranked by rating volume</p><button onClick={()=>setSearchMode(null)} className="text-xs text-amber-300">Change search area</button></div>
            {visibleArtisans.map((artisan) => {
              const isSelected = selectedArtisan?.id === artisan.id;
              return (
                <motion.div
                  key={artisan.id}
                  whileHover={{ y: -2 }}
                  className={`bg-slate-900/80 rounded-2xl p-6 border transition-all shadow-xl space-y-4 ${
                    isSelected
                      ? 'border-amber-400 bg-slate-900 shadow-amber-500/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    
                    {/* Artisan Identity */}
                    <div className="flex items-center gap-3">
                      <img
                        src={artisan.avatar}
                        alt={artisan.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-amber-400/50"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-bold text-white font-display">
                            {artisan.name}
                          </h4>
                          <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                            {artisan.availability}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-0.5">
                          <span className="text-amber-400 font-bold">📍 {artisan.distanceKm} km away</span>
                          <span>★ {artisan.rating} ({artisan.reviewsCount} reviews)</span><span className="text-emerald-300">Adjusted ★ {artisan.trustScore.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Price & Completion Estimate */}
                    <div className="text-left sm:text-right font-mono">
                      <div className="text-xs text-slate-400">ESTIMATED PRICE</div>
                      <div className="text-base font-bold text-emerald-400">{artisan.priceRange}</div>
                      <div className="text-[11px] text-slate-400">Completion: {artisan.estimatedDays}</div>
                    </div>
                  </div>

                  {/* Expertise Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-rose-100/10 border border-rose-200/10 text-rose-200">{artisan.state}</span>
                    {artisan.specialties.map((spec) => (
                      <span
                        key={spec}
                        className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-slate-950/70 border border-white/5 text-slate-300"
                      >
                        ✓ {spec}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => {
                        playClickSound();
                        setActiveProfileModal(artisan);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      View Profile
                    </button>

                    <button
                      onClick={() => handleSelectArtisanForOrder(artisan)}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all shadow-md flex items-center gap-1.5"
                    >
                      <span>Request This Artisan</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
            {visibleArtisans.length === 0 && <div className="rounded-2xl border border-white/10 bg-slate-900 p-8 text-center text-slate-300">There are no artisan profiles listed for {chosenState} yet. Choose another state or search nearby.</div>}
          </div>

        </div>

      </div>

      {/* Artisan Profile Modal */}
      {activeProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <img src={activeProfileModal.avatar} alt="Avatar" className="w-12 h-12 rounded-full object-cover border border-amber-400" />
                <div>
                  <h3 className="text-xl font-bold text-white font-display">{activeProfileModal.name}</h3>
                  <span className="text-xs font-mono text-amber-400">{activeProfileModal.stitchingExp}</span>
                </div>
              </div>
              <button onClick={() => setActiveProfileModal(null)} className="p-2 rounded-full hover:bg-slate-800 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-light">
              {activeProfileModal.bio}
            </p>

            <div className="space-y-2 text-xs font-mono">
              <span className="text-slate-400 block uppercase">Recent Tailored Works:</span>
              <div className="space-y-1">
                {activeProfileModal.recentWorks.map((work) => (
                  <div key={work} className="p-2 rounded-xl bg-slate-950 border border-white/5 text-slate-200">
                    • {work}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-white/5 grid grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-500 block">LOCATION:</span>
                <span className="text-white font-bold">{activeProfileModal.location}</span>
              </div>
              <div>
                <span className="text-slate-500 block">EST. COMPLETION:</span>
                <span className="text-emerald-400 font-bold">{activeProfileModal.estimatedDays}</span>
              </div>
            </div>

            <button
              onClick={() => {
                const a = activeProfileModal;
                setActiveProfileModal(null);
                handleSelectArtisanForOrder(a);
              }}
              className="w-full py-4 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs tracking-widest uppercase transition-all shadow-xl"
            >
              Request {activeProfileModal.name} ↘
            </button>
          </motion.div>
        </div>
      )}

      {/* Instant Order Confirmation Dialog */}
      {confirmationOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-amber-500/40 rounded-3xl p-8 max-w-md w-full space-y-6 shadow-2xl text-center"
          >
            <div className="w-14 h-14 rounded-full bg-amber-400/20 border border-amber-400 text-amber-400 flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono tracking-widest uppercase text-amber-400 font-bold">
                ORDER REVIEW
              </span>
              <h3 className="text-2xl font-black font-display text-white">
                CONFIRM YOUR COMMISSION
              </h3>
            </div>

            <div className="bg-slate-950/80 rounded-2xl p-5 border border-white/5 space-y-3 text-xs font-mono text-left">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">GARMENT:</span>
                <span className="text-white font-bold">{confirmationOrder.garmentTitle}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">ARTISAN:</span>
                <span className="text-amber-400 font-bold">{confirmationOrder.artisan.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-b border-slate-800 pb-3">
                <button
                  type="button"
                  onClick={() => setDeliveryMode('pickup')}
                  className={`rounded-xl border p-3 text-left transition-colors ${deliveryMode === 'pickup' ? 'border-amber-400 bg-amber-400/10 text-white' : 'border-slate-700 text-slate-400'}`}
                >
                  <span className="block font-bold">Self pickup</span>
                  <span className="mt-1 block text-[10px]">No extra charge</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryMode('delivery')}
                  className={`rounded-xl border p-3 text-left transition-colors ${deliveryMode === 'delivery' ? 'border-amber-400 bg-amber-400/10 text-white' : 'border-slate-700 text-slate-400'}`}
                >
                  <span className="block font-bold">Doorstep delivery</span>
                  <span className="mt-1 block text-[10px]">+₹{confirmationOrder.deliveryFee} · ~{confirmationOrder.deliveryEtaMinutes} min</span>
                </button>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">TAILORING:</span>
                <span className="text-white font-bold">₹{confirmationOrder.baseCost.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">DELIVERY:</span>
                <span className="text-white font-bold">{deliveryMode === 'delivery' ? `₹${confirmationOrder.deliveryFee}` : '₹0'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">TOTAL:</span>
                <span className="text-emerald-400 font-bold">₹{(confirmationOrder.baseCost + (deliveryMode === 'delivery' ? confirmationOrder.deliveryFee : 0)).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">ESTIMATED COMPLETION:</span>
                <span className="text-white font-bold">{confirmationOrder.days}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">WORKSHOP DISTANCE:</span>
                <span className="text-slate-300 font-bold">{confirmationOrder.distance}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setConfirmationOrder(null)}
                className="flex-1 py-3.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs uppercase"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalConfirm}
                className="flex-1 py-3.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg"
              >
                Confirm Order ↘
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
