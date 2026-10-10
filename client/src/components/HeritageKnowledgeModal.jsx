import React from 'react';
import { X, BookOpen, Sparkles, MapPin, Scissors, HeartHandshake } from 'lucide-react';

export default function HeritageKnowledgeModal({ isOpen, onClose, crafts }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-heritage-charcoal/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-heritage-silk relative p-6 sm:p-8 space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-heritage-sand hover:bg-heritage-silk text-heritage-indigo flex items-center justify-center font-bold"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-heritage-terracotta/10 text-heritage-terracotta text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Living Textile Archive</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-heritage-indigo font-display">
            Indian Heritage Textile & Craft Knowledge
          </h2>
          <p className="text-xs text-heritage-muted">
            Preserving indigenous craftsmanship, natural dye ecosystems, and traditional GI-tagged clusters.
          </p>
        </div>

        {/* Crafts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {crafts.map((craft) => (
            <div
              key={craft.slug}
              className="bg-heritage-sand/50 p-5 rounded-2xl border border-heritage-silk space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-heritage-indigo text-base font-display">{craft.name}</h3>
                  <p className="text-xs text-heritage-muted flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-heritage-terracotta" /> {craft.origin}
                  </p>
                </div>
              </div>

              <p className="text-xs text-heritage-charcoal leading-relaxed">{craft.history}</p>

              <div className="space-y-1 text-xs">
                <p><strong className="text-heritage-indigo">Ideal Fabrics:</strong> {craft.idealFabrics?.join(', ')}</p>
                <p><strong className="text-heritage-indigo">Care:</strong> {craft.care}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
