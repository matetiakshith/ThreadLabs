import React from 'react';
import { Sparkles, ShieldCheck, HeartHandshake, Leaf, Scissors } from 'lucide-react';

export default function MarqueeTicker() {
  const items = [
    { text: '100% Direct Fair Artisan Compensation', icon: '💰' },
    { text: 'UNESCO & National Awardee Clusters', icon: '🏆' },
    { text: 'Zero Mass-Production Waste', icon: '🌿' },
    { text: 'Multimodal AI Tailoring Blueprint', icon: '✨' },
    { text: 'GI-Tagged Indian Handlooms', icon: '🧵' },
    { text: 'Real-time Workshop Milestone Tracking', icon: '📦' },
  ];

  return (
    <div className="w-full overflow-hidden bg-slate-900 text-white py-3 border-y border-slate-800 select-none">
      <div className="flex w-max animate-marquee space-x-8">
        {[...items, ...items, ...items].map((item, i) => (
          <div key={i} className="flex items-center space-x-2 text-xs font-bold tracking-wide">
            <span>{item.icon}</span>
            <span className="text-slate-200">{item.text}</span>
            <span className="text-slate-600 px-2">•</span>
          </div>
        ))}
      </div>
    </div>
  );
}
