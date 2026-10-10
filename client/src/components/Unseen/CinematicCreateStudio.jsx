import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Mic,
  Image,
  PenTool,
  Send,
  Sliders,
  CheckCircle2,
  Users,
  Layers,
  ArrowRight,
  Palette,
  Scissors
} from 'lucide-react';
import VoiceRecorder from '../Studio/VoiceRecorder';
import SketchPad from '../Studio/SketchPad';
import { FABRIC_DEFINITIONS } from '../Three/materials/ClothMaterial';
import { playClickSound, playLoomSwoosh, playSuccessChime } from '../../utils/audioEffects';

/**
 * Cinematic AI Fashion Creation Studio
 * Implements the core visionary workflow:
 * WHAT DO YOU IMAGINE? → Multimodal Capture → Cinematic Generative Construction Sequence → 3D Garment Reveal → Parametric Refinement → Find Your Maker Handover
 */
export default function CinematicCreateStudio({ onFindArtisans, onOpenViewerWithOutfit }) {
  const [inputMode, setInputMode] = useState('text'); // 'text' | 'voice' | 'image' | 'sketch'
  const [promptText, setPromptText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0); // 0: Idle, 1: Idea, 2: Form, 3: Textile, 4: Silhouette, 5: Complete
  const [generatedOutfit, setGeneratedOutfit] = useState(null);

  // Parametric Design Controls
  const [silhouette, setSilhouette] = useState('relaxed');
  const [selectedFabric, setSelectedFabric] = useState('silk');
  const [selectedColor, setSelectedColor] = useState('#f8fafc');
  const [sleeveType, setSleeveType] = useState('curved-flare');
  const [collarType, setCollarType] = useState('mandarin');

  const generationSequence = [
    { label: 'UNDERSTANDING YOUR IDEA', sub: 'Extracting aesthetic intentions, cultural roots, and drape physics' },
    { label: 'CONSTRUCTING FORM', sub: 'Generating 3D anatomical pattern panels over articulated mannequin' },
    { label: 'WEAVING TEXTILE MATRIX', sub: 'Calibrating PBR sheen, GSM weight, and thread density' },
    { label: 'REFINING SILHOUETTE & CRAFT', sub: 'Injecting artisanal embroidery, plackets, and stitch tension' },
    { label: 'BUILDING YOUR GARMENT', sub: 'Simulating position-based dynamics fabric drape' },
  ];

  const handleStartGeneration = () => {
    if (!promptText.trim()) return;
    setIsGenerating(true);
    setGenerationStep(0);
    playLoomSwoosh();

    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      setGenerationStep(step);
      playClickSound();

      if (step >= generationSequence.length) {
        clearInterval(interval);
        setTimeout(() => {
          setIsGenerating(false);
          playSuccessChime();

          // Generate synthetic bespoke tech pack & 3D garment object
          setGeneratedOutfit({
            id: 'bespoke-ai-creation',
            name: 'Custom Atelier Creation',
            category: 'Bespoke',
            collection: 'Custom',
            fabricType: selectedFabric,
            defaultColor: selectedColor,
            price: '₹5,600',
            description: promptText,
            animeRef: promptText.toLowerCase().includes('anime') || promptText.toLowerCase().includes('bleach') ? 'Anime Atelier Blend' : null,
            coverage: {
              chest: false,
              abdomen: false,
              hips: false,
              upperArms: false,
              forearms: sleeveType === 'sleeveless',
              thighs: true,
              calves: true,
              neck: collarType === 'open-camp',
              head: true,
              hands: true,
              feet: true,
            }
          });
        }, 800);
      }
    }, 700);
  };

  return (
    <div className="min-h-screen bg-[#06080d] text-slate-100 pt-24 pb-20 px-6 sm:px-12 relative overflow-hidden font-sans">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/5 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-12 relative z-10">
        
        {/* Editorial Header */}
        <div className="text-center space-y-3">
          <span className="text-[11px] font-mono tracking-[0.35em] text-amber-400 font-bold uppercase">
            AI ATELIER • BESPOKE GENERATION
          </span>
          <h2 className="text-4xl md:text-6xl font-black font-display tracking-tight text-white uppercase">
            WHAT DO YOU IMAGINE?
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Express your dream garment through text, spoken words, reference images, or hand-drawn sketches.
          </p>
        </div>

        {/* Multimodal Input Modes */}
        {!generatedOutfit && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Mode Switcher Tabs */}
            <div className="flex items-center justify-center gap-2 p-1.5 rounded-full bg-slate-900/90 border border-white/10 max-w-md mx-auto backdrop-blur-xl">
              {[
                { id: 'text', label: 'Text Idea', icon: PenTool },
                { id: 'voice', label: 'Spoken Voice', icon: Mic },
                { id: 'sketch', label: 'Draw Sketch', icon: Scissors },
              ].map((m) => {
                const Icon = m.icon;
                const isActive = inputMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setInputMode(m.id);
                      playClickSound();
                    }}
                    className={`flex-1 py-2.5 px-4 rounded-full text-xs font-mono tracking-wider font-semibold transition-all flex items-center justify-center gap-2 ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 shadow-lg'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Input Canvas / Box */}
            <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6">
              {inputMode === 'text' && (
                <div className="space-y-4">
                  <textarea
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="e.g. An oversized pure white structured trench coat with asymmetric shoulder capelet, gold zari stitching along the lapels, inspired by traditional Indian royal angrakha and modern techwear..."
                    rows={4}
                    className="w-full bg-slate-950/60 border border-white/10 rounded-2xl p-5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/60 resize-none font-sans leading-relaxed"
                  />
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="text-slate-500 text-[11px] font-mono self-center mr-1">Inspirations:</span>
                    {[
                      'Bleach Gotei Captain Haori in Mulberry Silk',
                      'Oversized Khadi Camp Shirt with Wooden Buttons',
                      'High-Waist Pleated Asymmetric Chanderi Dress',
                      'Cyberpunk Kimono Trench with Zari Trims'
                    ].map((sample) => (
                      <button
                        key={sample}
                        onClick={() => setPromptText(sample)}
                        className="text-[11px] font-mono px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:border-amber-400/50 hover:text-white transition-all"
                      >
                        + {sample}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {inputMode === 'voice' && (
                <div className="p-4 text-center">
                  <VoiceRecorder onTranscript={(text) => setPromptText(text)} />
                  {promptText && (
                    <div className="mt-4 p-4 rounded-xl bg-slate-950/60 border border-white/10 text-xs text-left text-amber-200 font-mono">
                      Captured: "{promptText}"
                    </div>
                  )}
                </div>
              )}

              {inputMode === 'sketch' && (
                <div className="space-y-3">
                  <SketchPad onSaveSketch={(dataUrl) => {
                    setPromptText('Hand-drawn bespoke silhouette design with customized seam placements and draped hemline.');
                  }} />
                </div>
              )}

              {/* Generate Action Button */}
              <div className="flex justify-end pt-2">
                <button
                  disabled={!promptText.trim()}
                  onClick={handleStartGeneration}
                  className={`px-8 py-4 rounded-full font-bold text-xs tracking-[0.2em] uppercase transition-all duration-300 flex items-center gap-3 shadow-xl ${
                    promptText.trim()
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 hover:scale-105 hover:shadow-amber-500/25'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Transform Idea into 3D Garment</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Cinematic Procedural Generation Sequence */}
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-12 backdrop-blur-2xl shadow-2xl text-center space-y-8 max-w-2xl mx-auto"
          >
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-amber-400/20 border-t-amber-400 animate-spin" />
              <Scissors className="w-8 h-8 text-amber-400 animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-amber-400 font-bold">
                PHASE {Math.min(generationStep + 1, generationSequence.length)} OF {generationSequence.length}
              </span>
              <h3 className="text-2xl font-black font-display text-white uppercase tracking-tight">
                {generationSequence[Math.min(generationStep, generationSequence.length - 1)].label}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {generationSequence[Math.min(generationStep, generationSequence.length - 1)].sub}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <motion.div
                className="bg-amber-400 h-full rounded-full"
                animate={{ width: `${((generationStep + 1) / generationSequence.length) * 100}%` }}
                transition={{ ease: 'easeInOut' }}
              />
            </div>
          </motion.div>
        )}

        {/* Revealed Garment & Parametric Tuning Studio */}
        {generatedOutfit && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Left: Parametric Controls */}
            <div className="lg:col-span-2 bg-slate-900/80 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl space-y-8">
              <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold">
                    GENERATION COMPLETE
                  </span>
                  <h3 className="text-2xl font-bold font-display text-white mt-1">
                    {generatedOutfit.name}
                  </h3>
                </div>
                <button
                  onClick={() => setGeneratedOutfit(null)}
                  className="text-xs font-mono text-slate-400 hover:text-white transition-colors"
                >
                  Create Another ↺
                </button>
              </div>

              {/* Parametric Tuning Modules */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                
                {/* 1. Fabric Selection */}
                <div className="space-y-2">
                  <label className="font-mono text-slate-400 uppercase tracking-wider">Textile Matrix</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['silk', 'cotton', 'denim', 'leather'].map((fab) => (
                      <button
                        key={fab}
                        onClick={() => {
                          setSelectedFabric(fab);
                          playClickSound();
                        }}
                        className={`py-2 px-3 rounded-xl font-mono text-xs font-bold border transition-all ${
                          selectedFabric === fab
                            ? 'bg-amber-400 text-slate-950 border-amber-400'
                            : 'bg-slate-950/60 border-white/10 text-slate-300'
                        }`}
                      >
                        {fab.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Silhouette Cut */}
                <div className="space-y-2">
                  <label className="font-mono text-slate-400 uppercase tracking-wider">Silhouette & Fit</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['relaxed', 'oversized', 'structured', 'draped'].map((sil) => (
                      <button
                        key={sil}
                        onClick={() => {
                          setSilhouette(sil);
                          playClickSound();
                        }}
                        className={`py-2 px-3 rounded-xl font-mono text-xs font-bold border transition-all ${
                          silhouette === sil
                            ? 'bg-amber-400 text-slate-950 border-amber-400'
                            : 'bg-slate-950/60 border-white/10 text-slate-300'
                        }`}
                      >
                        {sil.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Sleeve Architecture */}
                <div className="space-y-2">
                  <label className="font-mono text-slate-400 uppercase tracking-wider">Sleeve Pattern</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['curved-flare', 'kimono-bell', 'cuffed', 'sleeveless'].map((slv) => (
                      <button
                        key={slv}
                        onClick={() => {
                          setSleeveType(slv);
                          playClickSound();
                        }}
                        className={`py-2 px-3 rounded-xl font-mono text-xs font-bold border transition-all ${
                          sleeveType === slv
                            ? 'bg-amber-400 text-slate-950 border-amber-400'
                            : 'bg-slate-950/60 border-white/10 text-slate-300'
                        }`}
                      >
                        {slv.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Color Palette */}
                <div className="space-y-2">
                  <label className="font-mono text-slate-400 uppercase tracking-wider">Atelier Dye Palette</label>
                  <div className="flex items-center gap-2 pt-1">
                    {['#f8fafc', '#0f172a', '#b91c1c', '#d97706', '#059669', '#1e1b4b'].map((col) => (
                      <button
                        key={col}
                        onClick={() => setSelectedColor(col)}
                        style={{ backgroundColor: col }}
                        className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                          selectedColor === col ? 'border-amber-400 scale-110 shadow-lg' : 'border-white/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>

              </div>

              {/* Inspect in 3D Runway CTA */}
              <div className="pt-4 flex items-center gap-4">
                <button
                  onClick={() => {
                    playLoomSwoosh();
                    onOpenViewerWithOutfit({
                      ...generatedOutfit,
                      fabricType: selectedFabric,
                      defaultColor: selectedColor,
                    });
                  }}
                  className="flex-1 py-4 rounded-full bg-white text-slate-950 font-bold text-xs tracking-[0.2em] uppercase transition-all duration-300 hover:bg-amber-400 hover:scale-105 flex items-center justify-center gap-2 shadow-2xl"
                >
                  <Layers className="w-4 h-4" />
                  <span>Inspect in 3D Interactive Runway</span>
                </button>
              </div>
            </div>

            {/* Right: Artisan Matching Summary Card */}
            <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-amber-500/30 rounded-3xl p-8 backdrop-blur-xl shadow-2xl flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> MASTER CRAFT MATCHING
                </span>
                <h4 className="text-xl font-bold font-display text-white">
                  Handcrafted by Heritage Masters
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your custom tech pack has been automatically analyzed and ready for pairing with master weavers and embroiderers across Kanchipuram, Varanasi, and Kutch.
                </p>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Est. Artisan Craft Time:</span>
                    <span className="text-white">5-7 Days</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Authenticity Mark:</span>
                    <span className="text-emerald-400">GI Heritage Tag</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Direct Artisan Payout:</span>
                    <span className="text-amber-400">82% of Commission</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  playSuccessChime();
                  onFindArtisans({
                    ...generatedOutfit,
                    fabricType: selectedFabric,
                    defaultColor: selectedColor,
                  });
                }}
                className="w-full py-4 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs tracking-[0.2em] uppercase transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 shadow-xl"
              >
                <span>Find Your Maker ↘</span>
              </button>
            </div>

          </motion.div>
        )}

      </div>
    </div>
  );
}
