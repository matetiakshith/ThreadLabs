import React, { useState } from 'react';
import { Sparkles, MessageSquare, Mic, Palette, Image as ImageIcon, ArrowRight, Wand2, RefreshCw, CheckCircle2 } from 'lucide-react';
import SketchPad from './SketchPad';
import VoiceRecorder from './VoiceRecorder';

export default function MultimodalStudio({ onGenerateTechPack, isGenerating }) {
  const [activeTab, setActiveTab] = useState('text');
  
  // State for different modalities
  const [textPrompt, setTextPrompt] = useState('');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [sketchData, setSketchData] = useState(null);
  const [imageReference, setImageReference] = useState(null);
  const [imageTags, setImageTags] = useState([]);

  const inspirationPresets = [
    {
      title: "Royal Zardozi Kurta",
      prompt: "Deep midnight blue raw silk kurta with intricate antique gold zardozi embroidery along the mandarin collar for a family wedding.",
      craft: "Zardozi",
      tag: "Festive Silk"
    },
    {
      title: "Indigo Ajrakh Camp Shirt",
      prompt: "Relaxed-fit camp collar shirt crafted in 100% organic khadi cotton, hand-block printed in natural indigo Ajrakh starburst patterns.",
      craft: "Ajrakh",
      tag: "Organic Khadi"
    },
    {
      title: "Lucknowi Chikankari Anarkali",
      prompt: "Sage green pastel flowy anarkali kurti in fine georgette featuring traditional shadow work bakhiya stitches and pearl highlights.",
      craft: "Chikankari",
      tag: "Pastel Elegance"
    },
    {
      title: "Pochampally Ikat Blazer",
      prompt: "Contemporary unstructured casual blazer woven in monochrome double-ikat chevron handloom cotton with wooden buttons.",
      craft: "Ikat Weave",
      tag: "Modern Handloom"
    },
    {
      title: "Shantiniketan Kantha Vest",
      prompt: "Reversible quilted vest with folk narrative running-stitch embroidery on forest green wild tussar silk.",
      craft: "Kantha",
      tag: "Folk Storytelling"
    }
  ];

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageReference(reader.result);
        setImageTags(['Mandarin Collar', 'Raw Silk Sheen', 'Gold Zari Border', 'Festive Fit']);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunAI = () => {
    const payload = {
      textPrompt: textPrompt || (activeTab === 'text' ? inspirationPresets[0].prompt : ''),
      voiceTranscript: voiceTranscript,
      sketchDescription: sketchData ? sketchData.description : '',
      sketchDataUrl: sketchData ? sketchData.dataUrl : null,
      imageTags: imageTags,
      inputMethod: activeTab
    };
    onGenerateTechPack(payload);
  };

  return (
    <div className="bg-heritage-cream py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Studio Section Title */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-heritage-indigo text-white text-xs font-semibold">
            <Wand2 className="w-3.5 h-3.5 text-heritage-gold" />
            <span>AI Customization Studio</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-heritage-indigo font-display">
            How would you like to express your idea?
          </h2>
          <p className="text-sm text-heritage-muted max-w-xl mx-auto">
            Choose your preferred input method. Our AI synthesizes your choices into a production-grade blueprint for master tailors.
          </p>
        </div>

        {/* Multimodal Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          
          <button
            onClick={() => setActiveTab('text')}
            className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
              activeTab === 'text'
                ? 'bg-white border-heritage-indigo shadow-craft ring-2 ring-heritage-indigo/10'
                : 'bg-heritage-sand/70 border-heritage-silk hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <MessageSquare className={`w-5 h-5 ${activeTab === 'text' ? 'text-heritage-indigo' : 'text-heritage-muted'}`} />
              {textPrompt && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            </div>
            <div className="pt-3">
              <p className="text-xs font-bold text-heritage-indigo">1. Text Prompt</p>
              <p className="text-[11px] text-heritage-muted">Type in your own words</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('voice')}
            className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
              activeTab === 'voice'
                ? 'bg-white border-heritage-terracotta shadow-craft ring-2 ring-heritage-terracotta/10'
                : 'bg-heritage-sand/70 border-heritage-silk hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <Mic className={`w-5 h-5 ${activeTab === 'voice' ? 'text-heritage-terracotta' : 'text-heritage-muted'}`} />
              {voiceTranscript && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            </div>
            <div className="pt-3">
              <p className="text-xs font-bold text-heritage-terracotta">2. Voice Notes</p>
              <p className="text-[11px] text-heritage-muted">Speak in 5+ languages</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('sketch')}
            className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
              activeTab === 'sketch'
                ? 'bg-white border-heritage-emerald shadow-craft ring-2 ring-heritage-emerald/10'
                : 'bg-heritage-sand/70 border-heritage-silk hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <Palette className={`w-5 h-5 ${activeTab === 'sketch' ? 'text-heritage-emerald' : 'text-heritage-muted'}`} />
              {sketchData && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            </div>
            <div className="pt-3">
              <p className="text-xs font-bold text-heritage-emerald">3. Draw / Sketch</p>
              <p className="text-[11px] text-heritage-muted">Visual garment outline</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('image')}
            className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
              activeTab === 'image'
                ? 'bg-white border-heritage-gold shadow-craft ring-2 ring-heritage-gold/10'
                : 'bg-heritage-sand/70 border-heritage-silk hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <ImageIcon className={`w-5 h-5 ${activeTab === 'image' ? 'text-heritage-gold' : 'text-heritage-muted'}`} />
              {imageReference && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            </div>
            <div className="pt-3">
              <p className="text-xs font-bold text-heritage-indigo">4. Image Moodboard</p>
              <p className="text-[11px] text-heritage-muted">Upload photo reference</p>
            </div>
          </button>

        </div>

        {/* Tab Content Display */}
        <div className="space-y-6">
          
          {/* TAB 1: TEXT PROMPT */}
          {activeTab === 'text' && (
            <div className="bg-white rounded-3xl p-6 border border-heritage-silk shadow-soft space-y-4">
              
              <div className="space-y-2">
                <label className="block text-xs font-bold text-heritage-indigo uppercase tracking-wider">
                  Describe the garment you want made:
                </label>
                <textarea
                  rows={4}
                  value={textPrompt}
                  onChange={(e) => setTextPrompt(e.target.value)}
                  placeholder="e.g. I want a deep midnight navy blue raw silk kurta with intricate gold zardozi embroidery along the mandarin collar for a family wedding next month..."
                  className="w-full bg-heritage-sand/50 rounded-2xl border border-heritage-silk p-4 text-sm font-medium text-heritage-charcoal placeholder-heritage-muted focus:outline-none focus:ring-2 focus:ring-heritage-indigo/20 focus:border-heritage-indigo transition-all resize-none"
                />
              </div>

              {/* Quick Inspiration Presets */}
              <div className="space-y-2 pt-2">
                <p className="text-xs font-bold text-heritage-muted flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-heritage-terracotta" /> Or try these curated heritage styles:
                </p>
                <div className="flex flex-wrap gap-2">
                  {inspirationPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => setTextPrompt(preset.prompt)}
                      className="px-3 py-1.5 rounded-xl bg-heritage-sand hover:bg-heritage-silk/80 border border-heritage-silk text-xs font-medium text-heritage-indigo transition-all flex items-center gap-1.5"
                    >
                      <span className="font-semibold">{preset.title}</span>
                      <span className="text-[10px] bg-white px-1.5 py-0.5 rounded text-heritage-terracotta font-mono font-bold">
                        {preset.craft}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: VOICE RECORDER */}
          {activeTab === 'voice' && (
            <VoiceRecorder 
              onTranscriptReady={(transcript) => {
                setVoiceTranscript(transcript);
                setTextPrompt(transcript);
              }} 
            />
          )}

          {/* TAB 3: SKETCHPAD */}
          {activeTab === 'sketch' && (
            <SketchPad onSketchChange={(data) => setSketchData(data)} />
          )}

          {/* TAB 4: IMAGE UPLOAD */}
          {activeTab === 'image' && (
            <div className="bg-white rounded-3xl p-6 border border-heritage-silk shadow-soft space-y-4">
              <div className="border-2 border-dashed border-heritage-silk rounded-2xl p-8 text-center bg-heritage-sand/40 hover:bg-heritage-sand/70 transition-all cursor-pointer relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                {imageReference ? (
                  <div className="space-y-3">
                    <img
                      src={imageReference}
                      alt="Uploaded inspiration"
                      className="max-h-64 mx-auto rounded-xl object-contain shadow-md"
                    />
                    <p className="text-xs font-bold text-emerald-700">Image successfully loaded & analyzed!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-full bg-heritage-gold/10 text-heritage-gold flex items-center justify-center mx-auto">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-heritage-indigo">Click or Drag to Upload Reference Outfit / Fabric Photo</p>
                      <p className="text-xs text-heritage-muted pt-1">Supports JPG, PNG, WEBP</p>
                    </div>
                  </div>
                )}
              </div>

              {imageTags.length > 0 && (
                <div className="flex items-center gap-2 pt-2 text-xs font-medium">
                  <span className="text-heritage-muted font-bold">AI Extracted Tags:</span>
                  {imageTags.map((tag, i) => (
                    <span key={i} className="bg-heritage-sand px-2.5 py-1 rounded-lg border border-heritage-silk text-heritage-indigo font-semibold">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Generate Action Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleRunAI}
            disabled={isGenerating}
            className="px-8 py-4 rounded-2xl font-extrabold text-base text-white bg-gradient-to-r from-heritage-indigo via-heritage-indigoLight to-heritage-terracotta hover:opacity-95 shadow-soft transition-all flex items-center space-x-3 group disabled:opacity-50 hover:scale-[1.01]"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-heritage-gold" />
                <span>AI Structuring Production Tech-Pack...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-heritage-gold" />
                <span>Structure Requirements & Match Artisans</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform text-white" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
