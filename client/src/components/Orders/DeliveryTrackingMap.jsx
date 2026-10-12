import React from 'react';
import { useReducedMotion } from 'framer-motion';
import { MapPin, PackageCheck, Phone, Route } from 'lucide-react';

/** Illustrative local route used for the project demo; it is not live GPS data. */
export default function DeliveryTrackingMap({ order, active }) {
  const reduceMotion = useReducedMotion();
  const eta = order.deliveryEtaMinutes || 12;
  const courierName = order.courierName || 'ThreadLabs courier';
  const delivered = order.currentStageIndex >= 8;

  return (
    <section className="overflow-hidden rounded-sm border border-line bg-white text-muted " aria-label="Delivery tracking">
      <div className="relative h-72 overflow-hidden bg-sand sm:h-80">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 420" role="img" aria-label="Illustrated route from artisan workshop to your address">
          <rect width="800" height="420" fill="var(--paper)" />
          <path d="M42 46h190v70H42zm545 18h158v92H587zM86 278h180v91H86zm483-20h178v102H569z" fill="var(--sand)" />
          <g fill="none" stroke="var(--surface)" strokeWidth="22" strokeLinecap="round">
            <path d="M-20 167 213 132 359 182 496 128 820 176"/><path d="M98 -20 144 119 115 235 170 440"/><path d="M336 -20 300 106 359 182 326 300 383 440"/><path d="M568 -20 528 126 585 225 529 440"/><path d="M-20 344 190 310 346 346 488 291 820 320"/>
          </g>
          <g fill="none" stroke="var(--line)" strokeWidth="2">
            <path d="M-20 157 213 122 359 172 496 118 820 166M-20 177 213 142 359 192 496 138 820 186"/>
            <path d="M88 -20 134 119 105 235 160 440M108 -20 154 119 125 235 180 440"/>
            <path d="M326 -20 290 106 349 182 316 300 373 440M346 -20 310 106 369 182 336 300 393 440"/>
            <path d="M558 -20 518 126 575 225 519 440M578 -20 538 126 595 225 539 440"/>
            <path d="M-20 334 190 300 346 336 488 281 820 310M-20 354 190 320 346 356 488 301 820 330"/>
          </g>
          <g fill="var(--muted)" fontFamily="sans-serif" fontSize="13" fontWeight="600">
            <text x="218" y="82" transform="rotate(-8 218 82)">12TH MAIN ROAD</text>
            <text x="407" y="245" transform="rotate(67 407 245)">100 FEET ROAD</text>
            <text x="617" y="208" transform="rotate(8 617 208)">INDIRANAGAR</text>
          </g>
          <path d="M138 203 244 183 325 213 406 189 489 219 568 203 622 252 595 293 521 324 462 301" fill="none" stroke="var(--rose)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M138 203 244 183 325 213 406 189 489 219 568 203 622 252 595 293 521 324 462 301" fill="none" stroke="var(--surface)" strokeWidth="2" strokeDasharray="4 10" />
          <g transform="translate(138 203)"><circle r="23" fill="var(--surface)"/><circle r="16" fill="var(--rose)"/><path d="M-5 7 0-8 5 7z" fill="var(--surface)"/></g>
          <g transform="translate(462 301)"><circle r="25" fill="var(--surface)"/><circle r="18" fill="var(--ink)"/><path d="M-8 4h16v7H-8zm2-10h12l3 9H-9z" fill="var(--surface)"/><circle cx="-4" cy="12" r="2" fill="var(--ink)"/><circle cx="5" cy="12" r="2" fill="var(--ink)"/></g>
          {active && !reduceMotion && <g><circle r="7" fill="#f59e0b"><animateMotion dur="12s" repeatCount="indefinite"><mpath href="#courier-route" /></animateMotion></circle></g>}
          <path id="courier-route" d="M138 203 244 183 325 213 406 189 489 219 568 203 622 252 595 293 521 324 462 301" fill="none" />
        </svg>

        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-sand px-3 py-2 text-xs font-bold ">
          <Route className="h-4 w-4 text-blue-600" />
          {delivered ? 'DELIVERED' : active ? `ETA · ${eta} MIN` : 'DELIVERY ROUTE'}
        </div>
        <div className="absolute bottom-4 left-4 rounded-lg bg-sand px-3 py-2 text-[10px] text-muted shadow">
          Illustrative route · ETA is an estimate, not live GPS
        </div>
      </div>

      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${active ? 'bg-forest/10 text-forest' : 'bg-rose-light text-rose'}`}>
            {active || delivered ? <PackageCheck className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="font-bold">{delivered ? 'Order delivered' : active ? 'Order picked up' : 'Delivery arranged'}</h3>
            <p className="text-sm text-muted">{delivered ? 'Your custom garment has arrived' : active ? `${courierName} is on the way to you` : 'Tracking starts when the artisan hands your order to the courier'}</p>
          </div>
        </div>
        {active && order.courierPhone && (
          <a href={`tel:${order.courierPhone}`} className="inline-flex items-center justify-center gap-2 rounded-sm bg-surface px-4 py-2.5 text-sm font-semibold text-ink">
            <Phone className="h-4 w-4" /> Call courier
          </a>
        )}
      </div>
    </section>
  );
}
