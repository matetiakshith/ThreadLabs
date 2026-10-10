import React, { useState } from 'react';
import { Sparkles, FileText, CheckCircle2, Sliders, Clock, IndianRupee, Scissors, ArrowRight, UserCheck, ChevronRight } from 'lucide-react';

export default function TechPackPreview({ techPack, onFindArtisans, onEditInput }) {
  const [measurements, setMeasurements] = useState({
    chest: '40 in',
    shoulder: '18.5 in',
    length: '42 in',
    sleeveLength: '25 in',
    neck: '16 in'
  });
  const [showMeasurementsModal, setShowMeasurementsModal] = useState(false);

  if (!techPack) return null;

  return (
    <div className="bg-heritage-sand/40 py-10 border-t border-b border-heritage-silk">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Header Notification */}
        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-900">AI Production Tech-Pack Successfully Generated</h3>
              <p className="text-xs text-emerald-700">Requirements structured into standardized artisanal workshop specifications.</p>
            </div>
          </div>
          <button
            onClick={onEditInput}
            className="text-xs font-bold text-heritage-indigo hover:underline px-3 py-1 bg-white rounded-lg border border-emerald-200"
          >
            Refine Prompt
          </button>
        </div>

        {/* Tech-Pack Master Card */}
        <div className="bg-white rounded-3xl border border-heritage-silk shadow-soft overflow-hidden">
          
          {/* Top Banner Header */}
          <div className="bg-heritage-indigo p-6 text-white flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-heritage-gold text-heritage-indigo">
                  SPECIFICATION BLUEPRINT
                </span>
                <span className="text-xs text-heritage-goldLight">Ref #{Math.floor(100000 + Math.random() * 900000)}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-display">{techPack.garmentType}</h2>
              <p className="text-xs text-slate-300 italic font-serif">"{techPack.designSummary}"</p>
            </div>

            <div className="flex gap-3 text-right">
              <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10">
                <p className="text-[10px] uppercase font-bold text-heritage-goldLight tracking-wider">Est. Price Range</p>
                <p className="text-lg font-extrabold text-white">{techPack.estimatedPriceRange}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10">
                <p className="text-[10px] uppercase font-bold text-heritage-goldLight tracking-wider">Lead Time</p>
                <p className="text-lg font-extrabold text-white">{techPack.recommendedTimeline}</p>
              </div>
            </div>
          </div>

          {/* Grid of Key Technical Attributes */}
          <div className="p-6 sm:p-8 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Fabric Base */}
              <div className="bg-heritage-sand/60 p-4 rounded-2xl border border-heritage-silk space-y-1.5">
                <span className="text-[11px] font-bold text-heritage-muted uppercase tracking-wider">Selected Fabric Base</span>
                <p className="text-sm font-bold text-heritage-indigo">{techPack.fabric}</p>
                <div className="flex items-center gap-2 pt-1 text-xs text-heritage-charcoal">
                  <span className="bg-white px-2 py-0.5 rounded border border-heritage-silk text-[11px] font-semibold">
                    Yardage: {techPack.estimatedYardage}
                  </span>
                </div>
              </div>

              {/* Craft Technique */}
              <div className="bg-heritage-sand/60 p-4 rounded-2xl border border-heritage-silk space-y-1.5">
                <span className="text-[11px] font-bold text-heritage-muted uppercase tracking-wider">Craft Technique</span>
                <p className="text-sm font-bold text-heritage-terracotta">{techPack.craftTechnique}</p>
                <div className="flex items-center gap-2 pt-1 text-xs">
                  <span className="bg-heritage-terracotta/10 text-heritage-terracotta px-2 py-0.5 rounded font-bold text-[11px]">
                    Complexity: {techPack.complexityScore}
                  </span>
                </div>
              </div>

              {/* Color Scheme */}
              <div className="bg-heritage-sand/60 p-4 rounded-2xl border border-heritage-silk space-y-1.5">
                <span className="text-[11px] font-bold text-heritage-muted uppercase tracking-wider">Color Specification</span>
                <div className="flex items-center gap-2">
                  <div
                    style={{ backgroundColor: techPack.colorScheme.hex }}
                    className="w-5 h-5 rounded-full border border-heritage-silk shadow-sm"
                  />
                  <p className="text-sm font-bold text-heritage-indigo">{techPack.colorScheme.name}</p>
                </div>
                <p className="text-[11px] text-heritage-muted font-mono">{techPack.colorScheme.hex}</p>
              </div>

            </div>

            {/* Production Specifications Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-heritage-indigo flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-heritage-terracotta" /> Master Tailor Stitching Specs
              </h4>
              <div className="bg-heritage-cream rounded-2xl border border-heritage-silk overflow-hidden">
                <table className="w-full text-left text-xs">
                  <tbody className="divide-y divide-heritage-silk">
                    {techPack.productionSpecifications.map((item, index) => (
                      <tr key={index} className="hover:bg-white/70 transition-colors">
                        <td className="py-3 px-4 font-bold text-heritage-indigo w-1/3 bg-heritage-sand/30">
                          {item.spec}
                        </td>
                        <td className="py-3 px-4 text-heritage-charcoal">
                          {item.detail}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Measurements Summary & Quick Edit */}
            <div className="bg-heritage-sand/30 p-4 rounded-2xl border border-heritage-silk flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-heritage-indigo">Tailoring Measurements (Standard Men's 40 / Custom):</p>
                <div className="flex flex-wrap gap-3 text-xs text-heritage-charcoal">
                  <span>Chest: <strong className="text-heritage-indigo">{measurements.chest}</strong></span>
                  <span>Shoulder: <strong className="text-heritage-indigo">{measurements.shoulder}</strong></span>
                  <span>Length: <strong className="text-heritage-indigo">{measurements.length}</strong></span>
                  <span>Sleeve: <strong className="text-heritage-indigo">{measurements.sleeveLength}</strong></span>
                </div>
              </div>

              <button
                onClick={() => setShowMeasurementsModal(true)}
                className="text-xs font-bold text-heritage-terracotta hover:text-heritage-terracottaLight flex items-center gap-1 underline"
              >
                <Sliders className="w-3.5 h-3.5" /> Adjust Measurements
              </button>
            </div>

          </div>

          {/* Action Footer */}
          <div className="bg-heritage-sand/80 p-6 border-t border-heritage-silk flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-heritage-muted text-center sm:text-left">
              <p className="font-semibold text-heritage-charcoal">Ready to find master artisans for this tech-pack?</p>
              <p>Our matching algorithm will rank weavers & embroiderers with verified material expertise.</p>
            </div>

            <button
              onClick={() => onFindArtisans(techPack, measurements)}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-extrabold text-sm text-white bg-gradient-to-r from-heritage-terracotta to-heritage-saffron hover:opacity-95 shadow-craft transition-all flex items-center justify-center space-x-2 group hover:scale-[1.02]"
            >
              <span>View Matched Master Artisans</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>

      </div>

      {/* Measurements Edit Modal */}
      {showMeasurementsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-heritage-charcoal/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-heritage-silk">
            <div className="flex justify-between items-center pb-2 border-b border-heritage-silk">
              <h3 className="font-bold text-heritage-indigo text-base">Adjust Fit Measurements</h3>
              <button 
                onClick={() => setShowMeasurementsModal(false)}
                className="text-heritage-muted hover:text-heritage-charcoal text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-heritage-indigo mb-1">Chest Circumference (inches)</label>
                <input
                  type="text"
                  value={measurements.chest}
                  onChange={(e) => setMeasurements({ ...measurements, chest: e.target.value })}
                  className="w-full p-2.5 bg-heritage-sand rounded-xl border border-heritage-silk font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-heritage-indigo mb-1">Shoulder Width (inches)</label>
                <input
                  type="text"
                  value={measurements.shoulder}
                  onChange={(e) => setMeasurements({ ...measurements, shoulder: e.target.value })}
                  className="w-full p-2.5 bg-heritage-sand rounded-xl border border-heritage-silk font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-heritage-indigo mb-1">Garment Length (inches)</label>
                <input
                  type="text"
                  value={measurements.length}
                  onChange={(e) => setMeasurements({ ...measurements, length: e.target.value })}
                  className="w-full p-2.5 bg-heritage-sand rounded-xl border border-heritage-silk font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-heritage-indigo mb-1">Sleeve Length (inches)</label>
                <input
                  type="text"
                  value={measurements.sleeveLength}
                  onChange={(e) => setMeasurements({ ...measurements, sleeveLength: e.target.value })}
                  className="w-full p-2.5 bg-heritage-sand rounded-xl border border-heritage-silk font-semibold"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setShowMeasurementsModal(false)}
                className="w-full py-2.5 rounded-xl bg-heritage-indigo text-white font-bold text-xs"
              >
                Save Measurements
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
