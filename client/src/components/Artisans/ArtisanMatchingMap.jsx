import MeasurementSummary from '../Measurements/MeasurementSummary';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Compass, CheckCircle, ArrowRight, X } from 'lucide-react';
import { playClickSound, playSuccessChime } from '../../utils/audioEffects';
import IndiaArtisanMap from './IndiaArtisanMap';
import DialogFrame from '../ui/DialogFrame';
import statewideProfiles from '../../data/artisans.json';


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
  const [submitting, setSubmitting] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState('pickup');
  const [searchMode, setSearchMode] = useState(null);
  const [chosenState, setChosenState] = useState('Uttar Pradesh');

  // Realistic mock artisan dataset with geolocation offsets for proximity radar
  const nearbyArtisans = import.meta.env.DEV ? [
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
  ] : [];

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
  const exploreState = (state) => { setChosenState(state); setSearchMode('state'); };

  if (!searchMode) return <section className="product-page"><div className="page-container"><header className="page-heading"><div><span className="eyebrow">03 / Meet your maker</span><h1>Extraordinary hands.<br/><em>Your kind of craft.</em></h1></div><p>Around the corner or across the country.<br/>Find an artisan for your vision.</p></header><div className="maker-search"><div className="maker-search-intro"><span className="eyebrow">A more personal way to make</span><h2>Good things are<br/><em>made together.</em></h2><p>Choose local workshops or explore a region's craft. Recommendations weigh rating quality together with the number of reviews.</p><button onClick={onBackToNeeds} className="text-button">← Refine your design brief</button></div><div className="maker-search-options"><button onClick={()=>setSearchMode('nearby')} className="nearby-choice"><span className="eyebrow">01 / Close to home</span><span className="nearby-title">Nearby artisans <ArrowRight size={22}/></span><span>Discover workshops within 5 km.</span></button><div className="state-choice"><span className="eyebrow">02 / Across India</span><h3>Find a craft, find a place.</h3><IndiaArtisanMap initialState={chosenState} onExplore={exploreState} /></div></div></div></div></section>;

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

  const handleFinalConfirm = async () => {
    if (customerRequirement?.hasMeasurementErrors || submitting) return;
    setSubmitting(true);
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
    delete orderObj.hasMeasurementErrors;
    try { await onConfirmOrder(orderObj); } finally { setSubmitting(false); }
  };

  return (
    <div className="product-page artisan-matching">
      


      <div className="page-container space-y-10">
        
        {/* Top Header */}
        <div className="page-heading">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-forest " />
              <span className="text-[11px] font-mono tracking-[0.25em] text-forest font-bold uppercase">
                03 / THE ARTISAN DIRECTORY
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-normal font-display text-ink mt-1">
              {searchMode === 'nearby' ? 'Meet your makers.' : `Makers in ${chosenState}`}
            </h2>
            <p className="text-xs sm:text-sm text-muted mt-1">
              Matching for: <span className="text-rose font-bold font-mono">{customerRequirement?.title || 'Black Oversized T-Shirt + Blue Jeans'}</span>
            </p>
          </div>

          <button
            onClick={onBackToNeeds}
            className="text-xs font-mono text-muted hover:text-ink transition-colors self-start sm:self-auto"
          >
            ← Modify Requirements
          </button>
        </div>

        {/* Proximity Radar Map + Artisan Results List Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: ThreadLabs Stylized Proximity Radar Map (Rapido/Ola style) */}
          <div className="artisan-map lg:col-span-5 bg-surface border border-line rounded-sm p-6   space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-ink font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-rose " style={{ animationDuration: '10s' }} />
                <span>{highlightedState || 'India'} · Artisan state</span>
              </span>
              <span className="text-[10px] font-mono bg-forest/10 text-forest px-2.5 py-0.5 rounded-full font-bold">
                {visibleArtisans.length} Listed
              </span>
            </div>

            <IndiaArtisanMap initialState={highlightedState} onExplore={exploreState} />
          </div>

          {/* RIGHT: Artisan Recommendation Cards (Rapido-Style) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="mb-2 flex items-center justify-between"><p className="text-xs text-muted">{searchMode === 'nearby' ? 'Nearby workshops' : `Artisans in ${chosenState}`} · ranked by rating volume</p><button onClick={()=>setSearchMode(null)} className="text-xs text-rose">Change search area</button></div>
            {visibleArtisans.map((artisan) => {
              const isSelected = selectedArtisan?.id === artisan.id;
              return (
                <motion.div
                  key={artisan.id}
                  whileHover={{ y: -2 }}
                  className={`artisan-row bg-surface rounded-sm p-6 border transition-all  space-y-4 ${
                    isSelected
                      ? 'border-line bg-surface shadow-amber-500/10'
                      : 'border-line hover:border-line'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    
                    {/* Artisan Identity */}
                    <div className="flex items-center gap-3">
                      <img
                        src={artisan.avatar}
                        alt={artisan.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-line"
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-lg font-bold text-ink font-display">
                            {artisan.name}
                          </h4>
                          <span className="text-[10px] font-mono bg-forest/10 text-forest px-2 py-0.5 rounded-full font-bold">
                            {artisan.availability}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted mt-1">
                          <span className="text-rose font-bold">{artisan.distanceKm} km away</span>
                          <span>★ {artisan.rating} ({artisan.reviewsCount} reviews)</span><span className="text-forest">Adjusted ★ {artisan.trustScore.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Price & Completion Estimate */}
                    <div className="text-left sm:text-right font-mono">
                      <div className="text-xs text-muted">ESTIMATED PRICE</div>
                      <div className="text-base font-bold text-forest">{artisan.priceRange}</div>
                      <div className="text-[11px] text-muted">Completion: {artisan.estimatedDays}</div>
                    </div>
                  </div>

                  {/* Expertise Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-rose-light border border-line text-rose">{artisan.state}</span>
                    {artisan.specialties.map((spec) => (
                      <span
                        key={spec}
                        className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-paper border border-line text-ink"
                      >
                        ✓ {spec}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-line">
                    <button
                      onClick={() => {
                        playClickSound();
                        setActiveProfileModal(artisan);
                      }}
                      className="px-4 py-2 rounded-sm text-xs font-mono text-ink hover:text-ink hover:bg-sand transition-colors"
                    >
                      View Profile
                    </button>

                    <button
                      onClick={() => handleSelectArtisanForOrder(artisan)}
                      className="px-6 py-2.5 rounded-sm bg-ink   text-surface font-bold text-xs tracking-wider uppercase transition-all  flex items-center gap-1.5"
                    >
                      <span>Request This Artisan</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
            {visibleArtisans.length === 0 && <div className="rounded-sm border border-line bg-surface p-8 text-center text-ink">There are no artisan profiles listed for {chosenState} yet. Choose another state or search nearby.</div>}
          </div>

        </div>

      </div>

      {/* Artisan Profile Modal */}
      {activeProfileModal && (
        <DialogFrame label="Artisan profile" onClose={() => setActiveProfileModal(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface border border-line rounded-sm p-6 sm:p-8 max-w-lg w-full space-y-6  max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-3">
                <img src={activeProfileModal.avatar} alt="Avatar" className="w-12 h-12 rounded-full object-cover border border-line" />
                <div>
                  <h3 className="text-xl font-bold text-ink font-display">{activeProfileModal.name}</h3>
                  <span className="text-xs font-mono text-rose">{activeProfileModal.stitchingExp}</span>
                </div>
              </div>
              <button aria-label="Close artisan profile" onClick={() => setActiveProfileModal(null)} className="p-2 rounded-full hover:bg-sand text-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-ink leading-relaxed font-light">
              {activeProfileModal.bio}
            </p>

            <div className="space-y-2 text-xs font-mono">
              <span className="text-muted block uppercase">Recent Tailored Works:</span>
              <div className="space-y-1">
                {activeProfileModal.recentWorks.map((work) => (
                  <div key={work} className="p-2 rounded-sm bg-paper border border-line text-ink">
                    • {work}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-sm bg-paper border border-line grid grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <span className="text-muted block">LOCATION:</span>
                <span className="text-ink font-bold">{activeProfileModal.location}</span>
              </div>
              <div>
                <span className="text-muted block">EST. COMPLETION:</span>
                <span className="text-forest font-bold">{activeProfileModal.estimatedDays}</span>
              </div>
            </div>

            <button
              onClick={() => {
                const a = activeProfileModal;
                setActiveProfileModal(null);
                handleSelectArtisanForOrder(a);
              }}
              className="w-full py-4 rounded-full bg-ink hover:bg-ink text-surface font-bold text-xs tracking-widest uppercase transition-all "
            >
              Request {activeProfileModal.name} ↘
            </button>
          </motion.div>
        </DialogFrame>
      )}

      {/* Instant Order Confirmation Dialog */}
      {confirmationOrder && (
        <DialogFrame label="Review your commission" onClose={() => setConfirmationOrder(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="commission-dialog bg-surface border border-line rounded-sm p-6 sm:p-8 max-w-md w-full space-y-6 text-center"
          >
            <div className="w-14 h-14 rounded-full bg-rose-light border border-line text-rose flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono tracking-widest uppercase text-rose font-bold">
                ORDER REVIEW
              </span>
              <h3 className="text-4xl font-serif text-ink">
                Your commission.
              </h3>
            </div>

            <div className="bg-paper rounded-sm p-5 border border-line space-y-3 text-xs font-mono text-left">
              <div className="flex justify-between gap-5 border-b border-line pb-2">
                <span className="text-muted">GARMENT:</span>
                <span className="text-ink text-right">{confirmationOrder.garmentTitle}</span>
              </div>
              <div className="flex justify-between gap-5 border-b border-line pb-2">
                <span className="text-muted">ARTISAN:</span>
                <span className="text-rose font-bold">{confirmationOrder.artisan.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-b border-line pb-3">
                <button
                  type="button"
                  onClick={() => setDeliveryMode('pickup')}
                  className={`rounded-sm border p-3 text-left transition-colors ${deliveryMode === 'pickup' ? 'border-line bg-ink text-surface' : 'border-line text-muted'}`}
                >
                  <span className="block font-bold">Self pickup</span>
                  <span className="mt-1 block text-[10px]">No extra charge</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryMode('delivery')}
                  className={`rounded-sm border p-3 text-left transition-colors ${deliveryMode === 'delivery' ? 'border-line bg-ink text-surface' : 'border-line text-muted'}`}
                >
                  <span className="block font-bold">Doorstep delivery</span>
                  <span className="mt-1 block text-[10px]">+₹{confirmationOrder.deliveryFee} · ~{confirmationOrder.deliveryEtaMinutes} min</span>
                </button>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">TAILORING:</span>
                <span className="text-ink font-bold">₹{confirmationOrder.baseCost.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between gap-5 border-b border-line pb-2">
                <span className="text-muted">DELIVERY:</span>
                <span className="text-ink font-bold">{deliveryMode === 'delivery' ? `₹${confirmationOrder.deliveryFee}` : '₹0'}</span>
              </div>
              <div className="flex justify-between gap-5 border-b border-line pb-2">
                <span className="text-muted">TOTAL:</span>
                <span className="text-forest font-bold">₹{(confirmationOrder.baseCost + (deliveryMode === 'delivery' ? confirmationOrder.deliveryFee : 0)).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between gap-5 border-b border-line pb-2">
                <span className="text-muted">ESTIMATED COMPLETION:</span>
                <span className="text-ink font-bold">{confirmationOrder.days}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">WORKSHOP DISTANCE:</span>
                <span className="text-ink font-bold">{confirmationOrder.distance}</span>
              </div>
            </div>

            <MeasurementSummary measurements={customerRequirement?.measurements} />
            {customerRequirement?.hasMeasurementErrors && <div className="measurement-error" role="alert">Your measurement entries need checking before this order can be submitted. <button className="text-button" onClick={onBackToNeeds}>Return to measurements</button></div>}

            <div className="flex items-center gap-3">
              <button
                onClick={() => setConfirmationOrder(null)}
                className="flex-1 py-3.5 rounded-full bg-sand hover:bg-sand text-ink font-mono text-xs uppercase"
              >
                Cancel
              </button>
              <button
                disabled={customerRequirement?.hasMeasurementErrors || submitting}
                onClick={handleFinalConfirm}
                className="flex-1 py-3.5 rounded-full bg-ink   text-surface font-bold text-xs uppercase tracking-wider "
              >
                {submitting ? 'Saving commission…' : 'Confirm Order ↘'}
              </button>
            </div>
          </motion.div>
        </DialogFrame>
      )}

    </div>
  );
}
