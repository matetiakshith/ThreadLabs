import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Camera, Palette, MessageSquare, Sparkles, ArrowRight, CheckCircle2, RefreshCw, Wand2, Sliders, Scissors, ChevronRight, Rotate3d, Layers, Download } from 'lucide-react';
import SketchPad from './SketchPad';
import ThreadHeroCanvas from '../Three/ThreadHeroCanvas';
import Garment3DViewer from '../Three/Garment3DViewer';
import { generateImagePreview } from '../../services/api';

export default function ModernStepStudio({ onGenerateTechPack, isGenerating, generatedTechPack, onFindArtisans, onEditInput }) {
  const [selectedGarment, setSelectedGarment] = useState('Festive Kurta');
  const [inputMode, setInputMode] = useState('voice'); // 'voice' | 'photo' | 'sketch' | 'text'
  
  const [voiceText, setVoiceText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [textPrompt, setTextPrompt] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [realismPreview, setRealismPreview] = useState(null);
  const [isPreviewGenerating, setIsPreviewGenerating] = useState(false);
  const [sketchData, setSketchData] = useState(null);

  // Simple Size Selector
  const [selectedSize, setSelectedSize] = useState('L (40 in)');
  const [customMeasurements, setCustomMeasurements] = useState({
    chest: '40 in',
    shoulder: '18.5 in',
    length: '42 in',
    sleeveLength: '25 in'
  });
  const [showCustomFit, setShowCustomFit] = useState(false);

  const garmentCategories = [
    { id: 'haori', name: 'Bleach Captain Haori', hindi: 'कप्तान हाओरी', icon: '🥋', defaultPrompt: 'Gotei 13 Shinigami captain haori with black inner shihakusho kimono and gold zardozi crest' },
    { id: 'quincy', name: 'Quincy Trench Coat', hindi: 'क्विंसी ट्रेंच कोट', icon: '🧥', defaultPrompt: 'White Sternritter high-collar military trench coat with asymmetric shoulder capelet' },
    { id: 'anarkali', name: 'Celestial Anarkali Dress', hindi: 'अनारकली / लहंगा', icon: '👗', defaultPrompt: 'Flowing magenta silk Anarkali saree-gown with sheer dupatta and Banarasi zari embroidery' },
    { id: 'cyber', name: 'Cyber Streetwear Kimono', hindi: 'स्ट्रीटवियर किमोनो', icon: '🥼', defaultPrompt: 'Oversized draped kimono streetwear jacket in indigo Ajrakh with wide sleeves' },
    { id: 'kurta', name: 'Zardozi Silk Kurta', hindi: 'कुर्ता', icon: '👘', defaultPrompt: 'Deep midnight blue raw silk kurta with gold collar zardozi embroidery' },
    { id: 'arrancar', name: 'Espada Flared Hakama', hindi: 'एस्पाडा हाकामा', icon: '✨', defaultPrompt: 'White high-collared minimalist jacket with obsidian lining and pleated hakama' },
  ];

  const quickInspirations = [
    { title: "Bleach Captain Haori", craft: "Zardozi Crest", color: "Pure White & Black", price: "₹5,800", prompt: "Bleach Gotei 13 Shinigami captain haori with black inner shihakusho kimono, flared sleeves, and gold crest." },
    { title: "Quincy Sternritter Trench", craft: "Silver Mukaish", color: "Snow White", price: "₹6,400", prompt: "Bleach Quincy Wandenreich high-collar military trench coat with draped asymmetric shoulder capelet." },
    { title: "Celestial Saree-Gown", craft: "Banarasi Zari", color: "Royal Crimson", price: "₹7,200", prompt: "Ethereal flowing silk Anarkali gown with sheer floating dupatta veil and intricate gold brocade." },
    { title: "Cyber-Heritage Haori", craft: "Ajrakh Indigo", color: "Indigo Denim", price: "₹4,400", prompt: "Oversized draped streetwear kimono jacket in organic khadi denim with Ajrakh starburst prints." },
  ];

  // Voice recording handler
  const handleToggleVoice = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      setVoiceText('');
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.lang = 'en-IN';
        rec.continuous = false;
        rec.onresult = (e) => {
          const transcript = e.results[0][0].transcript;
          setVoiceText(transcript);
          setTextPrompt(transcript);
          setIsRecording(false);
        };
        rec.onerror = () => setIsRecording(false);
        rec.start();
      } else {
        // Fallback simulation
        setTimeout(() => {
          const sample = "Deep blue raw silk kurta with gold zardozi embroidery along the collar.";
          setVoiceText(sample);
          setTextPrompt(sample);
          setIsRecording(false);
        }, 2000);
      }
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunAI = () => {
    const combinedPrompt = voiceText || textPrompt || `${selectedGarment} with traditional Indian heritage craft`;
    onGenerateTechPack({
      textPrompt: combinedPrompt,
      voiceTranscript: voiceText,
      sketchDescription: sketchData ? sketchData.description : '',
      sketchDataUrl: sketchData ? sketchData.dataUrl : null,
      imageTags: imagePreview ? ['Visual Reference', selectedGarment] : []
    });
  };

  const handleGenerateRealismPreview = async () => {
    const combinedPrompt = voiceText || textPrompt || `${selectedGarment} with traditional Indian heritage craft`;

    if (!combinedPrompt.trim()) {
      return;
    }

    setIsPreviewGenerating(true);

    try {
      const response = await generateImagePreview({
        prompt: combinedPrompt,
        imageDataUrl: imagePreview,
        strength: 0.7,
      });

      if (response?.imageDataUrl) {
        setRealismPreview(response.imageDataUrl);
      }
    } catch (error) {
      console.error('Realism preview failed:', error);
      window.alert(error.message || 'Unable to generate the realism preview right now.');
    } finally {
      setIsPreviewGenerating(false);
    }
  };

  const handleDownloadRealismPreview = () => {
    if (!realismPreview) return;

    const link = document.createElement('a');
    link.href = realismPreview;
    link.download = `threadlabs-realism-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10 space-y-8">
      
      {/* 1. 3D WebGL Interactive Thread Hero Banner (unseen.co style) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-4"
      >
        <ThreadHeroCanvas themeColor="#2563eb" />
      </motion.div>

      {/* 2. Top Friendly Step Indicator Callout */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-float relative overflow-hidden"
      >
        <div className="relative z-10 space-y-2">
          <span className="bg-white/20 backdrop-blur-md text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            Step 1 of 3: Express Your Custom Vision
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display leading-tight">
            What custom clothing would you like made?
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
            Describe or sketch your idea below. Our AI turns it into an interactive 3D blueprint and connects you with master artisans.
          </p>
        </div>
      </motion.div>

      {/* 3. Visual Outfit Type Selector (Big Tap Cards) */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          1. Select Outfit Type (कपड़े का प्रकार चुनें)
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 sm:gap-3">
          {garmentCategories.map((garment) => (
            <button
              key={garment.id}
              onClick={() => {
                setSelectedGarment(garment.name);
                if (!textPrompt && !voiceText) {
                  setTextPrompt(garment.defaultPrompt);
                }
              }}
              className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center gap-1.5 ${
                selectedGarment === garment.name
                  ? 'border-blue-600 bg-blue-50/80 text-blue-700 shadow-sm scale-102 font-extrabold'
                  : 'border-slate-200/80 bg-white hover:border-slate-300 text-slate-700'
              }`}
            >
              <span className="text-2xl">{garment.icon}</span>
              <span className="text-xs font-bold">{garment.name}</span>
              <span className="text-[10px] text-slate-400 font-medium">{garment.hindi}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Input Mode Selector (Voice-First, Photo, Sketch, Text) */}
      <div className="app-card p-6 space-y-6">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            2. How do you want to explain your design?
          </label>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-xl">
            Voice & 3D Interactive
          </span>
        </div>

        {/* 4 Big Mode Switch Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => setInputMode('voice')}
            className={`p-3.5 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold text-xs transition-all ${
              inputMode === 'voice'
                ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>🎙️ Bol Ke Batayein</span>
          </button>

          <button
            onClick={() => setInputMode('photo')}
            className={`p-3.5 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold text-xs transition-all ${
              inputMode === 'photo'
                ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>📷 Photo Upload</span>
          </button>

          <button
            onClick={() => setInputMode('sketch')}
            className={`p-3.5 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold text-xs transition-all ${
              inputMode === 'sketch'
                ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>🎨 Draw Sketch</span>
          </button>

          <button
            onClick={() => setInputMode('text')}
            className={`p-3.5 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold text-xs transition-all ${
              inputMode === 'text'
                ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>💬 Type Details</span>
          </button>
        </div>

        {/* INPUT MODE 1: BIG VOICE BUTTON */}
        {inputMode === 'voice' && (
          <div className="text-center py-6 space-y-4 bg-slate-50 rounded-3xl border border-slate-100 p-6">
            <button
              onClick={handleToggleVoice}
              className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center transition-all ${
                isRecording
                  ? 'bg-red-500 text-white ring-8 ring-red-100 scale-105 animate-pulse'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-float hover:scale-105'
              }`}
            >
              {isRecording ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
            </button>

            <div>
              <p className="text-sm font-extrabold text-slate-800">
                {isRecording ? 'Listening... Bolna shuru kijiye' : 'Tap & Speak in Hindi, English or regional languages'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                e.g., "Mujhe navy blue silk kurta chahiye gold zari collar ke sath."
              </p>
            </div>

            {voiceText && (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 text-left space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">You said:</span>
                <p className="text-sm font-bold text-blue-900">"{voiceText}"</p>
              </div>
            )}
          </div>
        )}

        {/* INPUT MODE 2: PHOTO UPLOAD */}
        {inputMode === 'photo' && (
          <div className="border-2 border-dashed border-slate-300 rounded-3xl p-8 text-center bg-slate-50 relative cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {imagePreview ? (
              <div className="space-y-3">
                <img src={imagePreview} alt="Preview" className="max-h-56 mx-auto rounded-2xl shadow-md" />
                <p className="text-xs font-bold text-emerald-600">✓ Photo attached! Our AI will extract fabric & embroidery details.</p>
                <button
                  type="button"
                  onClick={handleGenerateRealismPreview}
                  disabled={isPreviewGenerating}
                  className="mx-auto inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:brightness-110 disabled:opacity-60"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isPreviewGenerating ? 'Generating realism preview...' : 'Generate realism preview'}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Camera className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-800">Upload a Photo of your Desired Outfit / Pattern</p>
                <p className="text-xs text-slate-400">Tap here to choose from your phone or gallery</p>
              </div>
            )}

            {realismPreview && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-600">Realism preview</p>
                  <button
                    type="button"
                    onClick={handleDownloadRealismPreview}
                    className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-violet-700 transition hover:border-violet-300 hover:bg-violet-100"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                </div>
                <img src={realismPreview} alt="Realism preview" className="max-h-72 mx-auto rounded-2xl border border-violet-200 shadow-lg" />
              </div>
            )}
          </div>
        )}

        {/* INPUT MODE 3: DRAW SKETCH */}
        {inputMode === 'sketch' && (
          <SketchPad onSketchChange={(data) => setSketchData(data)} />
        )}

        {/* INPUT MODE 4: TEXT BOX */}
        {inputMode === 'text' && (
          <div className="space-y-3">
            <textarea
              rows={3}
              value={textPrompt}
              onChange={(e) => setTextPrompt(e.target.value)}
              placeholder="e.g. Royal navy blue raw silk kurta with gold zardozi embroidery on collar for wedding..."
              className="w-full bg-slate-50 rounded-2xl border border-slate-200 p-4 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        )}

        {/* Quick Style Chips */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" /> Popular Artisan Styles:
          </p>
          <div className="flex flex-wrap gap-2">
            {quickInspirations.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTextPrompt(item.prompt);
                  setVoiceText(item.prompt);
                  setSelectedGarment(item.title.includes('Kurta') ? 'Kurta / Kurti' : item.title.includes('Shirt') ? 'Casual Shirt' : 'Anarkali Dress');
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-all flex items-center gap-2"
              >
                <span>{item.title}</span>
                <span className="text-[10px] bg-white px-1.5 py-0.5 rounded text-blue-600 font-bold">{item.price}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div className="pt-2">
          <button
            onClick={handleRunAI}
            disabled={isGenerating}
            className="btn-primary-big"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>AI is Creating Your 3D Tailor Blueprint...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span>Generate 3D Blueprint & Match Artisans</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

      </div>

      {/* 5. 3D INTERACTIVE GARMENT TECH-PACK (Appears once generated) */}
      {generatedTechPack && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="app-card border-2 border-blue-600 overflow-hidden shadow-modern space-y-6"
        >
          
          {/* Blueprint Card Banner */}
          <div className="bg-blue-600 p-6 text-white flex flex-wrap justify-between items-center gap-4">
            <div>
              <span className="bg-white/20 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <Rotate3d className="w-3.5 h-3.5" /> Step 2 of 3: Interactive 3D Blueprint
              </span>
              <h3 className="text-2xl font-extrabold font-display mt-1">{generatedTechPack.garmentType}</h3>
              <p className="text-xs text-blue-100 italic">"{generatedTechPack.designSummary}"</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-right">
              <span className="text-[10px] uppercase font-bold text-blue-200">Estimated Fair Price</span>
              <p className="text-xl font-black">{generatedTechPack.estimatedPriceRange}</p>
            </div>
          </div>

          {/* 3D Garment Viewport */}
          <div className="px-6">
            <Garment3DViewer techPack={generatedTechPack} />
          </div>

          {/* Blueprint Technical Specs */}
          <div className="p-6 pt-0 space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Fabric Base</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{generatedTechPack.fabric}</p>
                <p className="text-[11px] text-slate-500 mt-1">Required: {generatedTechPack.estimatedYardage}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Heritage Craft</span>
                <p className="text-sm font-bold text-orange-600 mt-0.5">{generatedTechPack.craftTechnique}</p>
                <p className="text-[11px] text-slate-500 mt-1">Lead Time: {generatedTechPack.recommendedTimeline}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Color Shade</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <div style={{ backgroundColor: generatedTechPack.colorScheme.hex }} className="w-4 h-4 rounded-full border border-slate-300 shadow-sm" />
                  <p className="text-sm font-bold text-slate-900">{generatedTechPack.colorScheme.name}</p>
                </div>
              </div>
            </div>

            {/* Simple Size Selector (S, M, L, XL, Custom) */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 uppercase">Choose Your Size / Fit:</span>
                <button
                  onClick={() => setShowCustomFit(!showCustomFit)}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Sliders className="w-3.5 h-3.5" /> {showCustomFit ? 'Hide Exact Inches' : 'Enter Custom Measurements (Inches)'}
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs font-bold">
                {['S (36 in)', 'M (38 in)', 'L (40 in)', 'XL (42 in)'].map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      setSelectedSize(size);
                      setCustomMeasurements({
                        chest: size.split('(')[1].replace(')', ''),
                        shoulder: '18 in',
                        length: '42 in',
                        sleeveLength: '24 in'
                      });
                    }}
                    className={`py-2 rounded-xl border transition-all ${
                      selectedSize === size
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>

              {showCustomFit && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold">Chest (in)</label>
                    <input
                      type="text"
                      value={customMeasurements.chest}
                      onChange={(e) => setCustomMeasurements({ ...customMeasurements, chest: e.target.value })}
                      className="w-full p-2 bg-white rounded-lg border border-slate-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold">Shoulder (in)</label>
                    <input
                      type="text"
                      value={customMeasurements.shoulder}
                      onChange={(e) => setCustomMeasurements({ ...customMeasurements, shoulder: e.target.value })}
                      className="w-full p-2 bg-white rounded-lg border border-slate-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold">Length (in)</label>
                    <input
                      type="text"
                      value={customMeasurements.length}
                      onChange={(e) => setCustomMeasurements({ ...customMeasurements, length: e.target.value })}
                      className="w-full p-2 bg-white rounded-lg border border-slate-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold">Sleeve (in)</label>
                    <input
                      type="text"
                      value={customMeasurements.sleeveLength}
                      onChange={(e) => setCustomMeasurements({ ...customMeasurements, sleeveLength: e.target.value })}
                      className="w-full p-2 bg-white rounded-lg border border-slate-300 font-bold"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Step 3 CTA Button */}
            <button
              onClick={() => onFindArtisans(generatedTechPack, customMeasurements)}
              className="btn-clay-big text-lg"
            >
              <span>Step 3: View Matched Master Artisans</span>
              <ArrowRight className="w-6 h-6" />
            </button>

          </div>

        </motion.div>
      )}

    </div>
  );
}
