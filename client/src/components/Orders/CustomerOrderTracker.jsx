import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Scissors,
  Check,
  Phone,
  MessageSquare,
  MapPin,
} from 'lucide-react';
import DeliveryTrackingMap from './DeliveryTrackingMap';

/**
 * Tab 4: Customer Order Status & Live Tracking (Amazon Order Tracking Style)
 * - Tracks live production progress stages: Order Placed -> Accepted -> Measurements -> Fabric Ready -> Cutting -> Stitching -> Quality Check -> Out for Delivery -> Delivered
 * - Displays active progress percentage, estimated days remaining, artisan contact direct line, and recent updates
 */
export default function CustomerOrderTracker({
  activeOrder,
  onExploreMoreMall,
}) {
  // Default benchmark order if no active order is passed yet
  const defaultOrder = {
    orderId: 'TL1024',
    garmentTitle: 'Black Oversized T-Shirt + Blue Jeans',
    artisanName: 'Ravi Tailors & Studio',
    artisanPhone: '+91 98765 43210',
    artisanLocation: 'Indiranagar 100ft Rd, Bangalore',
    baseCost: 1100,
    deliveryMode: 'delivery',
    deliveryFee: 70,
    totalCost: 1170,
    estimatedCompletion: '2 Days Remaining',
    deliveryEtaMinutes: 12,
    deliveryStatus: 'in_transit',
    currentStageIndex: 7,
    createdAt: 'Oct 08, 2026',
  };

  const order = activeOrder || defaultOrder;

  const hasDelivery = order.deliveryMode === 'delivery';
  const trackingStages = [
    { name: 'Request Placed', desc: 'Customer requirements submitted with AI tech pack', isCompleted: true },
    { name: 'Artisan Accepted', desc: 'Ravi Tailors accepted commission into workshop queue', isCompleted: true },
    { name: 'Measurements Confirmed', desc: 'Drop-shoulder chest 42in & straight inseam 32in verified', isCompleted: true },
    { name: 'Fabric Ready', desc: '240 GSM organic combed black cotton & raw denim inspected', isCompleted: true },
    { name: 'Cutting', desc: 'Pattern pieces chalked and hand-cut on the workbench', isCurrent: true },
    { name: 'Stitching & Assembly', desc: 'Flat-felled twin needle seams and neck ribbing attached', isPending: true },
    { name: 'Quality & Steam Press', desc: 'Tolerance inspection and high-temperature steam shaping', isPending: true },
    ...(hasDelivery
      ? [
          { name: 'Out for Delivery', desc: 'Picked up by the courier and traveling to your delivery address', isPending: true },
          { name: 'Delivered', desc: 'Your custom garment has arrived at your doorstep', isPending: true },
        ]
      : [{ name: 'Ready for Pickup', desc: 'Your finished garment is ready to collect from the artisan workshop', isPending: true }]),
  ];

  const currentStageIndex = Math.min(order.currentStageIndex ?? 4, trackingStages.length - 1);
  const currentStage = trackingStages[currentStageIndex];
  const currentStageName = order.status === 'Declined' ? 'Request Declined' : currentStage.name;
  const progressPercent = Math.round((currentStageIndex / (trackingStages.length - 1)) * 100);
  const formatRupees = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

  return (
    <div data-palette="rose" className="min-h-screen bg-[#090d16] text-slate-100 pt-24 pb-20 px-6 sm:px-12 relative overflow-hidden font-sans">
      
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-emerald-500/5 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-10 relative z-10">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono tracking-[0.25em] text-emerald-400 font-bold uppercase">
                STEP 4 OF 4 • AMAZON-STYLE LIVE ORDER TRACKING
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black font-display text-white mt-1 uppercase">
              ORDER #{order.orderId}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {order.garmentTitle} • Crafted by <span className="text-amber-400 font-bold">{order.artisanName}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onExploreMoreMall}
              className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-mono uppercase tracking-wider text-slate-200 transition-colors"
            >
              Explore Mall ↺
            </button>
          </div>
        </div>

        {/* Current Active Stage Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-bold">
                CURRENT PRODUCTION STATUS
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold font-display text-white uppercase">
                {currentStageName}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                {currentStage.desc}
              </p>
            </div>

            <div className="text-left sm:text-right font-mono bg-slate-950/70 p-4 rounded-2xl border border-white/5 shrink-0">
              <div className="text-xs text-slate-400">ESTIMATED COMPLETION</div>
              <div className="text-lg font-bold text-amber-400">{order.estimatedCompletion}</div>
              <div className="text-[11px] text-emerald-400 font-bold">Total: {formatRupees(order.totalCost)}</div>
              {order.deliveryMode === 'delivery' && (
                <div className="mt-1 text-[10px] text-slate-400">
                  Tailoring {formatRupees(order.baseCost)} + delivery {formatRupees(order.deliveryFee)}
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span>Overall Progress</span>
              <span className="text-emerald-400 font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-white/10">
              <motion.div
                className="bg-gradient-to-r from-emerald-500 to-amber-400 h-full rounded-full"
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Direct Line to Artisan Tailor */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>Workshop: {order.artisanLocation}</span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`tel:${order.artisanPhone}`}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-white flex items-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Call Tailor</span>
              </a>
              <button
                onClick={() => alert(`Direct workshop message sent to ${order.artisanName}`)}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Workshop Chat</span>
              </button>
            </div>
          </div>
        </motion.div>

        {hasDelivery && (
          <DeliveryTrackingMap order={order} active={currentStageIndex === 7} />
        )}

        {/* Detailed Timeline Stages Sequence (Amazon Style) */}
        <div className="bg-slate-900/70 border border-white/10 rounded-3xl p-6 sm:p-10 backdrop-blur-2xl shadow-2xl space-y-6">
          <h4 className="text-base font-bold font-display text-white uppercase tracking-wider">
            Live Production Milestones
          </h4>

          <div className="space-y-6 relative before:absolute before:inset-y-3 before:left-3.5 before:w-0.5 before:bg-slate-800">
            {trackingStages.map((stage, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;

              return (
                <div key={stage.name} className="relative flex items-start gap-4">
                  {/* Status Indicator Icon */}
                  <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                    isPast
                      ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-md'
                      : isCurrent
                      ? 'bg-amber-400 border-white text-slate-950 shadow-[0_0_15px_#f59e0b] animate-pulse'
                      : 'bg-slate-950 border-slate-700 text-slate-600'
                  }`}>
                    {isPast ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : isCurrent ? (
                      <Scissors className="w-3.5 h-3.5" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-slate-700" />
                    )}
                  </div>

                  {/* Stage Text */}
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-bold font-display uppercase tracking-wide ${
                        isCurrent ? 'text-amber-400' : isPast ? 'text-white' : 'text-slate-500'
                      }`}>
                        {stage.name}
                      </span>
                      {isPast && (
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">COMPLETED ✓</span>
                      )}
                      {isCurrent && (
                        <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30">
                          IN PROGRESS ●
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-light">
                      {stage.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
