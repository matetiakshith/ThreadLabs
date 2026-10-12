import ScrollScene from '../Motion/ScrollScene.jsx';
import MeasurementSummary from '../Measurements/MeasurementSummary';
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
import DialogFrame from '../ui/DialogFrame';

/**
 * Tab 4: Customer Order Status & Live Tracking (Amazon Order Tracking Style)
 * - Tracks live production progress stages: Order Placed -> Accepted -> Measurements -> Fabric Ready -> Cutting -> Stitching -> Quality Check -> Out for Delivery -> Delivered
 * - Displays active progress percentage, estimated days remaining, artisan contact direct line, and recent updates
 */
export default function CustomerOrderTracker({
  activeOrder,
  onExploreMoreMall,
}) {
  const [chatOpen, setChatOpen] = useState(false);
  // Default benchmark order if no active order is passed yet
  const defaultOrder = import.meta.env.DEV ? {
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
  } : null;

  const order = activeOrder || defaultOrder;
  if (!order) return <div className="product-page order-page"><div className="page-container"><h2 className="font-serif text-4xl">Your commissions</h2><p className="muted mt-4">You have no commissions yet. Create a design brief to begin.</p><button className="primary-button mt-6" onClick={onExploreMoreMall}>Explore the atelier</button></div></div>;

  const hasDelivery = order.deliveryMode === 'delivery';
  const trackingStages = [
    { name: 'Request Placed', desc: 'Customer requirements submitted with AI tech pack', isCompleted: true },
    { name: 'Artisan Accepted', desc: `${order.artisanName} adds the commission to the workshop queue`, isCompleted: true },
    { name: 'Measurements Confirmed', desc: 'Your artisan confirms the measurements and intended fit', isCompleted: true },
    { name: 'Fabric Ready', desc: 'Materials selected for your design are prepared for cutting', isCompleted: true },
    { name: 'Cutting', desc: 'Pattern pieces chalked and hand-cut on the workbench', isCurrent: true },
    { name: 'Stitching & Assembly', desc: 'Garment panels are joined, stitched and finished', isPending: true },
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
    <div className="product-page order-page">
      


      <div className="page-container order-container">
        {!activeOrder && <p className="demo-note">Sample commission — create a design brief to start your own.</p>}
        
        {/* Top Header */}
        <div className="page-heading order-heading">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-forest " />
              <span className="text-[11px] font-mono tracking-[0.25em] text-forest font-bold uppercase">
                04 / FROM OUR HANDS TO YOURS
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-normal font-display text-ink mt-1">
              Your commission. <span className="order-id" title={order.orderId}>#{import.meta.env.DEV ? order.orderId : order.orderId.slice(0,8).toUpperCase()}</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted mt-1">
              {order.garmentTitle} • Crafted by <span className="text-rose font-bold">{order.artisanName}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onExploreMoreMall}
              className="px-5 py-2.5 rounded-full bg-sand hover:bg-sand text-xs font-mono uppercase tracking-wider text-ink transition-colors"
            >
              Explore Mall ↺
            </button>
          </div>
        </div>

        {/* Current Active Stage Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="order-status-sheet bg-surface border border-line p-6 sm:p-8 space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono tracking-widest text-forest uppercase font-bold">
                On the workbench
              </span>
              <h3 className="text-4xl sm:text-5xl font-normal font-serif text-ink">
                {currentStageName}
              </h3>
              <p className="text-xs sm:text-sm text-ink">
                {currentStage.desc}
              </p>
            </div>

            <div className="text-left sm:text-right font-mono bg-paper p-4 rounded-sm border border-line shrink-0">
              <div className="text-xs text-muted">ESTIMATED COMPLETION</div>
              <div className="text-lg font-bold text-rose">{order.estimatedCompletion}</div>
              <div className="text-[11px] text-forest font-bold">Total: {formatRupees(order.totalCost)}</div>
              {order.deliveryMode === 'delivery' && (
                <div className="mt-1 text-[10px] text-muted">
                  Tailoring {formatRupees(order.baseCost)} + delivery {formatRupees(order.deliveryFee)}
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono text-muted">
              <span>Overall Progress</span>
              <span className="text-forest font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full bg-paper h-3 rounded-full overflow-hidden p-0.5 border border-line">
              <motion.div
                className="bg-forest h-full rounded-full"
                initial={false}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Direct Line to Artisan Tailor */}
          <div className="pt-4 border-t border-line flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-mono text-ink">
              <MapPin className="w-4 h-4 text-rose" />
              <span>Workshop: {order.artisanLocation}</span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={order.artisanPhone ? `tel:${order.artisanPhone}` : undefined}
                aria-disabled={!order.artisanPhone}
                className="px-4 py-2 rounded-sm bg-sand hover:bg-sand text-xs font-mono text-ink flex items-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-forest" />
                <span>{order.artisanPhone ? 'Call Tailor' : 'Phone unavailable'}</span>
              </a>
              <button
                onClick={() => setChatOpen(true)}
                className="px-4 py-2 rounded-sm bg-ink hover:bg-ink text-surface font-bold text-xs font-mono flex items-center gap-1.5 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Workshop Chat</span>
              </button>
            </div>
          </div>
          <MeasurementSummary measurements={order.measurements} />
        </motion.div>

        {hasDelivery && (
          <DeliveryTrackingMap order={order} active={currentStageIndex === 7} />
        )}

        {/* Detailed Timeline Stages Sequence (Amazon Style) */}
        <ScrollScene name="commission-journey" treatment="journey" className="order-timeline bg-surface border border-line p-6 sm:p-10 space-y-6">
          <h4 className="text-3xl font-normal font-serif text-ink">
            Every stitch of the journey
          </h4>

          <div className="space-y-6 relative before:absolute before:inset-y-3 before:left-3.5 before:w-0.5 before:bg-sand">
            {trackingStages.map((stage, idx) => {
              const isPast = idx < currentStageIndex || (idx === currentStageIndex && stage.name === 'Delivered');
              const isCurrent = idx === currentStageIndex && !isPast;

              return (
                <div key={stage.name} className="relative flex items-start gap-4">
                  {/* Status Indicator Icon */}
                  <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                    isPast
                      ? 'bg-forest border-line text-surface '
                      : isCurrent
                      ? 'bg-ink border-line text-surface '
                      : 'bg-paper border-line text-muted'
                  }`}>
                    {isPast ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : isCurrent ? (
                      <Scissors className="w-3.5 h-3.5" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-sand" />
                    )}
                  </div>

                  {/* Stage Text */}
                  <div className="space-y-0.5 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className={`text-sm font-medium ${
                        isCurrent ? 'text-rose' : isPast ? 'text-ink' : 'text-muted'
                      }`}>
                        {stage.name}
                      </span>
                      {isPast && (
                        <span className="text-[10px] font-mono text-forest font-bold">COMPLETED ✓</span>
                      )}
                      {isCurrent && (
                        <span className="text-[10px] font-mono text-rose font-bold bg-rose-light px-2 py-0.5 rounded-full border border-line">
                          IN PROGRESS ●
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted font-light">
                      {stage.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollScene>

      </div>
      {chatOpen && <DialogFrame label="Workshop chat" onClose={()=>setChatOpen(false)}><div className="bg-surface border border-line p-7 max-w-md w-full"><span className="eyebrow">Workshop connection</span><h3 className="font-serif text-4xl my-3">{order.artisanName}</h3><p className="muted">Workshop chat is a demo in this prototype. No message has been sent. Use the call link on your commission to contact the workshop.</p><button className="primary-button mt-6" onClick={()=>setChatOpen(false)}>Back to your commission</button></div></DialogFrame>}
    </div>
  );
}
