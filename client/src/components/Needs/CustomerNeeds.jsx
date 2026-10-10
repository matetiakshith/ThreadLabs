import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Mic,
  Image as ImageIcon,
  PenTool,
  Scissors,
} from 'lucide-react';
import VoiceRecorder from '../Studio/VoiceRecorder';
import SketchPad from '../Studio/SketchPad';
import { playClickSound, playLoomSwoosh, playSuccessChime } from '../../utils/audioEffects';

/**
 * Tab 2: Customer Needs Component
 * "WHAT DO YOU NEED? Tell us what you want to wear. We'll find someone who can make it."
 * Text, Voice, Image, Sketch input -> AI Extraction Sequence -> Structured Garment Specification -> Direct Handover to Tab 3 (Nearby Artisan Matching).
 */
export default function CustomerNeeds({ onProceedToArtisanMatching, initialPrompt = '' }) {
  const [inputMode, setInputMode] = useState('text'); // 'text' | 'voice' | 'image' | 'sketch'
  const [promptText, setPromptText] = useState(initialPrompt || '');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [structuredRequest, setStructuredRequest] = useState(null);
  const [garmentLength, setGarmentLength] = useState('');
  const [lengthUnit, setLengthUnit] = useState('cm');
  const processingSteps = [
    { label: 'UNDERSTANDING YOUR REQUEST', desc: 'Analyzing natural language intent, silhouettes, and style vibe' },
    { label: 'IDENTIFYING CLOTHING PIECES', desc: 'Separating individual garments (tops, trousers, outerwear, fabrics)' },
    { label: 'MATCHING REQUIREMENTS & FIT', desc: 'Determining exact measurements, stitch density, and material types' },
    { label: 'FINDING AVAILABLE ARTISANS', desc: 'Querying nearby tailors, master cutters, and handloom weavers' },
  ];

  const presetExamples = [
    "I need a black oversized T-shirt with blue jeans for a casual outfit.",
    "I want a traditional royal wedding sherwani with gold zari embroidery.",
    "I need a formal tailored silk shirt and pleated trousers.",
    "I want a custom embroidered jacket with anime streetwear aesthetics."
  ];

  // Comprehensive natural language fashion & garment intelligence parser
  const parseFashionRequest = (raw, presets = []) => {
    const p = raw.trim().toLowerCase();

    // 1. Exact preset match (only when user clicked a preset suggestion)
    const exactIdx = presets.findIndex((ex) => ex.toLowerCase() === p);
    if (exactIdx === 0) {
      return {
        title: 'Black Oversized T-Shirt + Blue Jeans',
        garments: [
          {
            name: 'Drop-Shoulder Oversized T-Shirt',
            fabric: '320 GSM Combed Cotton Jersey',
            color: 'Solid Pitch Black',
          },
          {
            name: 'Straight-Leg Denim Jeans',
            fabric: '13.5oz Japanese Selvedge Denim',
            color: 'Faded Indigo Wash with Raw Edge',
          },
        ],
        style: 'Casual Streetwear',
        fit: 'Relaxed / Drop-Shoulder',
        colorPalette: ['#09090b', '#1e3a8a', '#94a3b8', '#e2e8f0'],
        occasion: 'College / Daily Casual',
        estimatedCost: '₹1,200 – ₹1,600',
        estimatedDays: '3–4 Days',
        userPrompt: raw,
      };
    }
    if (exactIdx === 1) {
      return {
        title: 'The Lotus Legacy Royal Wedding Ensemble',
        garments: [
          {
            name: 'Hand-Embroidered Zari Choli / Angrakha',
            fabric: 'Pure Raw Silk & Velvet',
            color: 'Ivory White & Antique Gold (#F8F6ED)',
          },
          {
            name: 'Flared Kalidar Lehenga Skirt / Churidar',
            fabric: 'Raw Silk with Hand-Worked Lotus Motifs',
            color: 'Dusty Rose & Crimson (#D4A5A5)',
          },
        ],
        style: 'Royal Heritage Couture',
        fit: 'Structured Architectural Bodice',
        colorPalette: ['#f8f6ed', '#d4a5a5', '#c9a96b', '#a7b89f'],
        occasion: 'Wedding & Royal Ceremonial',
        estimatedCost: '₹6,800 – ₹12,500',
        estimatedDays: '10–14 Days',
        userPrompt: raw,
      };
    }
    if (exactIdx === 2) {
      return {
        title: 'Crisp Silk Twill Shirt & Pleated Trousers',
        garments: [
          {
            name: 'Spread Collar Tailored Shirt',
            fabric: 'Pure Silk Twill / Giza Cotton',
            color: 'Crisp Sky Blue (PMS 290C)',
          },
          {
            name: 'Architectural Pleated Trousers',
            fabric: 'Worsted Wool Gabardine',
            color: 'Charcoal Grey (PMS 425C)',
          },
        ],
        style: 'Executive Architectural Tailoring',
        fit: 'Slim Bespoke Architectural Fit',
        colorPalette: ['#38bdf8', '#334155', '#f8fafc', '#64748b'],
        occasion: 'Executive & Evening Formal',
        estimatedCost: '₹2,600 – ₹3,800',
        estimatedDays: '4–5 Days',
        userPrompt: raw,
      };
    }
    if (exactIdx === 3) {
      return {
        title: 'Custom Embroidered Anime Streetwear Bomber Jacket',
        garments: [
          {
            name: 'Oversized Cyber Bomber Jacket',
            fabric: 'Black Ripstop Nylon with Silk Satin Lining',
            color: 'Matte Black with Olive & Cyber Blue Accents',
          },
          {
            name: 'Embroidered Art Graphic Back Panel',
            fabric: 'High-Density Silk Embroidery Thread',
            color: 'Multicolor Neon Glow Palette (Pink, Cyan, Orange)',
          },
        ],
        style: 'Cyberpunk Anime Streetwear',
        fit: 'Oversized / Drop-Shoulder Relaxed',
        colorPalette: ['#09090b', '#38bdf8', '#ec4899', '#84cc16'],
        occasion: 'Creative / Streetwear Culture',
        estimatedCost: '₹3,200 – ₹4,600',
        estimatedDays: '5–7 Days',
        userPrompt: raw,
      };
    }

    // 2. DYNAMIC REAL-TIME EXTRACTION FOR ANY CUSTOM PROMPT
    const colorDictionary = [
      { key: 'crimson red', hex: '#990000', label: 'Deep Crimson Red' },
      { key: 'crimson', hex: '#990000', label: 'Deep Crimson Red' },
      { key: 'emerald green', hex: '#059669', label: 'Rich Emerald Green' },
      { key: 'emerald', hex: '#059669', label: 'Rich Emerald Green' },
      { key: 'burgundy', hex: '#800020', label: 'Royal Burgundy' },
      { key: 'maroon', hex: '#800000', label: 'Imperial Maroon' },
      { key: 'lavender', hex: '#c084fc', label: 'Pastel Lavender' },
      { key: 'navy blue', hex: '#1e3a8a', label: 'Midnight Navy Blue' },
      { key: 'navy', hex: '#1e3a8a', label: 'Midnight Navy Blue' },
      { key: 'pitch black', hex: '#09090b', label: 'Solid Pitch Black' },
      { key: 'matte black', hex: '#18181b', label: 'Matte Obsidian Black' },
      { key: 'black', hex: '#09090b', label: 'Solid Pitch Black' },
      { key: 'royal blue', hex: '#1d4ed8', label: 'Vibrant Royal Blue' },
      { key: 'sky blue', hex: '#38bdf8', label: 'Crisp Sky Blue' },
      { key: 'blue', hex: '#2563eb', label: 'Indigo Blue' },
      { key: 'ruby red', hex: '#e11d48', label: 'Ruby Red' },
      { key: 'red', hex: '#dc2626', label: 'Scarlet Red' },
      { key: 'forest green', hex: '#166534', label: 'Deep Forest Green' },
      { key: 'olive green', hex: '#65a30d', label: 'Military Olive Green' },
      { key: 'olive', hex: '#65a30d', label: 'Military Olive' },
      { key: 'green', hex: '#16a34a', label: 'Lush Green' },
      { key: 'optic white', hex: '#ffffff', label: 'Optic White' },
      { key: 'ivory white', hex: '#fdfbf7', label: 'Warm Ivory White' },
      { key: 'ivory', hex: '#fdfbf7', label: 'Warm Ivory White' },
      { key: 'white', hex: '#f8fafc', label: 'Crisp White' },
      { key: 'antique gold', hex: '#d97706', label: 'Antique Zari Gold' },
      { key: 'gold', hex: '#d97706', label: 'Gilded Antique Gold' },
      { key: 'golden', hex: '#d97706', label: 'Gilded Gold' },
      { key: 'metallic silver', hex: '#94a3b8', label: 'Metallic Silver' },
      { key: 'silver', hex: '#94a3b8', label: 'Polished Silver' },
      { key: 'charcoal grey', hex: '#334155', label: 'Charcoal Grey' },
      { key: 'charcoal', hex: '#334155', label: 'Deep Charcoal' },
      { key: 'grey', hex: '#64748b', label: 'Heather Grey' },
      { key: 'gray', hex: '#64748b', label: 'Heather Grey' },
      { key: 'mustard yellow', hex: '#eab308', label: 'Mustard Ochre' },
      { key: 'yellow', hex: '#facc15', label: 'Sunburst Yellow' },
      { key: 'deep purple', hex: '#7e22ce', label: 'Imperial Purple' },
      { key: 'purple', hex: '#9333ea', label: 'Vibrant Purple' },
      { key: 'dusty rose', hex: '#fb7185', label: 'Dusty Rose' },
      { key: 'rose', hex: '#f43f5e', label: 'Blush Rose' },
      { key: 'pink', hex: '#ec4899', label: 'Lotus Pink' },
      { key: 'beige', hex: '#d4d4d8', label: 'Muted Sand Beige' },
      { key: 'camel', hex: '#b45309', label: 'Warm Camel' },
      { key: 'brown', hex: '#78350f', label: 'Earthy Brown' },
      { key: 'teal', hex: '#0f766e', label: 'Deep Teal' },
      { key: 'cyan', hex: '#06b6d4', label: 'Electric Cyan' },
      { key: 'neon green', hex: '#84cc16', label: 'Neon Cyber Lime' },
      { key: 'neon', hex: '#a3e635', label: 'Fluorescent Neon' },
      { key: 'khaki', hex: '#a3a375', label: 'Utility Khaki' },
      { key: 'turquoise', hex: '#14b8a6', label: 'Vibrant Turquoise' },
      { key: 'peach', hex: '#fdba74', label: 'Soft Peach' },
      { key: 'rust', hex: '#c2410c', label: 'Terracotta Rust' },
      { key: 'indigo', hex: '#312e81', label: 'Raw Indigo' },
      { key: 'cream', hex: '#fef3c7', label: 'Butter Cream' },
    ];

    const fabricDictionary = [
      'crushed velvet', 'raw silk', 'banarasi silk', 'silk satin', 'pure silk', 'silk twill', 'mulberry silk', 'silk',
      'heavyweight velvet', 'velvet', 'selvedge denim', 'raw denim', 'denim', 'nappa leather', 'full-grain leather', 'leather',
      '320 gsm combed cotton jersey', 'cotton jersey', 'giza cotton', 'cotton', 'heavy silk satin', 'satin',
      'worsted wool gabardine', 'merino wool', 'wool', 'pure breathable linen', 'french linen', 'linen',
      'corduroy', 'chiffon', 'georgette', 'organza', 'ripstop nylon', 'cordura nylon', 'nylon',
      'polar fleece', 'cashmere', 'zari brocade', 'brocade', 'harris tweed', 'tweed',
      'gabardine', 'french terry', 'lace', 'sheer mesh', 'jersey', 'knit', 'suede', 'flannel'
    ];

    const garmentDictionary = [
      'motorcycle jacket', 'biker jacket', 'bomber jacket', 'leather jacket', 'denim jacket',
      'varsity jacket', 'tuxedo jacket', 'windbreaker', 'jacket',
      'oversized t-shirt', 'graphic tee', 'oversized tee', 't-shirt', 'tee',
      'button-down shirt', 'silk shirt', 'dress shirt', 'cuban collar shirt', 'camp collar shirt', 'flannel shirt', 'shirt',
      'blazer', 'oversized hoodie', 'hoodie', 'sweater', 'cardigan',
      'tactical vest', 'cargo vest', 'utility vest', 'corset vest', 'vest',
      'trench coat', 'overcoat', 'duster coat', 'coat',
      'kurti', 'kurta pajama', 'kurta', 'sherwani', 'angrakha', 'choli', 'blouse', 'corset', 'crop top', 'tank top', 'polo', 'tunic', 'pullover', 'kimono', 'cape',
      'selvedge jeans', 'straight-leg jeans', 'ripped jeans', 'baggy jeans', 'cargo jeans', 'flare jeans', 'jeans',
      'pleated trousers', 'tailored trousers', 'high-waisted trousers', 'dress trousers', 'trousers',
      'cargo pants', 'leather pants', 'sweatpants', 'joggers', 'chinos', 'bermuda shorts', 'denim shorts', 'shorts', 'pants',
      'kalidar lehenga', 'lehenga skirt', 'lehenga', 'churidar', 'dhoti', 'palazzo pants', 'palazzo', 'culottes', 'leggings', 'slacks',
      'maxi skirt', 'pleated skirt', 'mini skirt', 'pencil skirt', 'skirt',
      'evening gown', 'ballgown', 'gown', 'sundress', 'cocktail dress', 'slip dress', 'maxi dress', 'dress',
      'banarasi saree', 'kanchipuram saree', 'silk saree', 'saree', 'sari',
      'anarkali suit', 'anarkali', 'jumpsuit', 'romper', 'kaftan', 'robe', 'tuxedo', 'three-piece suit', 'suit'
    ];

    const fitDictionary = [
      'oversized / drop-shoulder', 'oversized', 'drop-shoulder',
      'slim architectural tailored', 'slim tailored', 'slim fit', 'slim',
      'relaxed drape', 'relaxed fit', 'relaxed', 'baggy',
      'structured tailored', 'tailored fit', 'tailored', 'structured',
      'cropped', 'flared', 'pleated', 'high-waisted', 'tapered'
    ];

    const detailsDictionary = [
      'silver spikes', 'spikes', 'metallic studs', 'studs', 'patches',
      'gold zari embroidery', 'zari embroidery', 'zardozi threadwork', 'hand embroidery', 'embroidery',
      'anime art graphic', 'graphic print', 'back print', 'peacock border', 'lotus motifs',
      'distressed wash', 'acid wash', 'raw edge', 'utility cargo straps', 'utility pockets',
      'chains', 'asymmetric zipper', 'zippers', 'tassels', 'sequins'
    ];

    // Split input into grammatical phrases
    const rawSegments = p
      .split(/,|\+|\band\b|\bwith\b|\bpaired with\b|\bcombined with\b|;|\&/)
      .map((s) => s.trim())
      .filter((s) => s.length > 1);

    const detectedGarments = [];
    const allDetectedColors = [];
    const allDetectedFabrics = [];

    rawSegments.forEach((segment) => {
      const matchedGarment = garmentDictionary.find((g) => segment.includes(g));
      const matchedFabric = fabricDictionary.find((f) => segment.includes(f));
      const matchedColor = colorDictionary.find((c) => segment.includes(c.key));
      const matchedFit = fitDictionary.find((f) => segment.includes(f));
      const matchedDetail = detailsDictionary.find((d) => segment.includes(d));

      if (matchedColor) allDetectedColors.push(matchedColor);
      if (matchedFabric) allDetectedFabrics.push(matchedFabric);

      if (matchedGarment) {
        const gName = matchedGarment.charAt(0).toUpperCase() + matchedGarment.slice(1);
        const colorDesc = matchedColor ? matchedColor.label : 'Custom Specified Tone';
        const fabricDesc = matchedFabric
          ? matchedFabric.charAt(0).toUpperCase() + matchedFabric.slice(1)
          : 'Premium Hand-Selected Textile';

        let itemTitle = gName;
        if (matchedFit) itemTitle = `${matchedFit.charAt(0).toUpperCase() + matchedFit.slice(1)} ${itemTitle}`;
        if (matchedDetail) itemTitle = `${itemTitle} (${matchedDetail})`;

        detectedGarments.push({
          name: itemTitle,
          fabric: fabricDesc,
          color: colorDesc,
        });
      }
    });

    // Fallback if segments didn't cleanly isolate pieces
    if (detectedGarments.length === 0) {
      const overallGarments = garmentDictionary.filter((g) => p.includes(g));
      const overallFabrics = fabricDictionary.filter((f) => p.includes(f));
      const overallColors = colorDictionary.filter((c) => p.includes(c.key));
      const overallFit = fitDictionary.find((f) => p.includes(f));
      const overallDetail = detailsDictionary.find((d) => p.includes(d));

      if (overallColors.length > 0) allDetectedColors.push(...overallColors);
      if (overallFabrics.length > 0) allDetectedFabrics.push(...overallFabrics);

      if (overallGarments.length > 0) {
        overallGarments.slice(0, 3).forEach((g, idx) => {
          const color = overallColors[idx] ? overallColors[idx].label : (overallColors[0]?.label || 'Bespoke Palette');
          const fabric = overallFabrics[idx] ? overallFabrics[idx] : (overallFabrics[0] || 'Artisan Tailoring Textile');
          detectedGarments.push({
            name: `${overallFit ? overallFit + ' ' : ''}${g.charAt(0).toUpperCase() + g.slice(1)}${overallDetail ? ' with ' + overallDetail : ''}`,
            fabric: fabric.charAt(0).toUpperCase() + fabric.slice(1),
            color,
          });
        });
      } else {
        const words = raw.split(/\s+/).slice(0, 4).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        detectedGarments.push({
          name: `Bespoke Tailored Design: ${words}`,
          fabric: allDetectedFabrics[0] ? allDetectedFabrics[0].charAt(0).toUpperCase() + allDetectedFabrics[0].slice(1) : 'Hand-Selected Fabric of Choice',
          color: allDetectedColors[0] ? allDetectedColors[0].label : 'Custom Specified Colorway',
        });
      }
    }

    // Determine Aesthetic Style
    let derivedStyle = 'Bespoke Haute Couture';
    if (/motorcycle|biker|spikes|leather jacket|punk|goth|rocker/.test(p)) {
      derivedStyle = 'Edgy Avant-Garde & Moto Couture';
    } else if (/anime|cyber|streetwear|oversized|hoodie|graphic tee|cargo/.test(p)) {
      derivedStyle = 'Contemporary Streetwear';
    } else if (/sherwani|lehenga|saree|sari|zari|royal|wedding|anarkali|kurta|angrakha|heritage/.test(p)) {
      derivedStyle = 'Royal Heritage & Festive';
    } else if (/formal|suit|blazer|trousers|pleated|tuxedo|corporate|executive|shirt/.test(p)) {
      derivedStyle = 'Architectural Formal Tailoring';
    } else if (/linen|summer|beach|resort|vacation|boho|casual/.test(p)) {
      derivedStyle = 'Relaxed Resort & Casual';
    }

    // Determine Fit
    let derivedFit = 'Custom Measurement Tailored Fit';
    const foundFit = fitDictionary.find((f) => p.includes(f));
    if (foundFit) {
      derivedFit = foundFit.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    } else if (derivedStyle.includes('Streetwear')) {
      derivedFit = 'Oversized / Drop-Shoulder Relaxed';
    } else if (derivedStyle.includes('Formal') || derivedStyle.includes('Moto')) {
      derivedFit = 'Structured Bespoke Architectural Cut';
    }

    // Determine Occasion
    let derivedOccasion = 'Bespoke Occasion';
    if (/wedding|reception|ceremony|royal/.test(p)) derivedOccasion = 'Wedding & Ceremonial Grand Gala';
    else if (/college|casual|daily|weekend|street/.test(p)) derivedOccasion = 'Daily Casual & Culture';
    else if (/party|nightclub|concert|festival/.test(p)) derivedOccasion = 'Nightlife & Concert Creative';
    else if (/office|corporate|business|conference|meeting/.test(p)) derivedOccasion = 'Executive & Evening Business';
    else if (/beach|vacation|resort|summer/.test(p)) derivedOccasion = 'Summer Resort & Travel';

    // Derive Dynamic Color Palette
    const uniqueHexes = Array.from(new Set(allDetectedColors.map((c) => c.hex)));
    const defaultPalette = ['#09090b', '#d97706', '#38bdf8', '#94a3b8'];
    while (uniqueHexes.length < 4) {
      const filler = defaultPalette.find((h) => !uniqueHexes.includes(h)) || '#334155';
      uniqueHexes.push(filler);
    }
    const colorPalette = uniqueHexes.slice(0, 4);

    // Derive Title
    let derivedTitle = '';
    if (detectedGarments.length === 1) {
      derivedTitle = detectedGarments[0].name;
    } else if (detectedGarments.length === 2) {
      derivedTitle = `${detectedGarments[0].name} & ${detectedGarments[1].name}`;
    } else {
      derivedTitle = detectedGarments.map((g) => g.name).slice(0, 2).join(' + ') + ' Ensemble';
    }

    // Derive Cost & Timeline
    let estimatedCost = '₹2,600 – ₹4,200';
    let estimatedDays = '4–6 Days';
    if (derivedStyle.includes('Royal') || /zari|embroidery|velvet|silk|lehenga|sherwani/.test(p)) {
      estimatedCost = '₹6,500 – ₹12,800';
      estimatedDays = '8–14 Days';
    } else if (derivedStyle.includes('Moto') || /leather|spikes|jacket/.test(p)) {
      estimatedCost = '₹4,200 – ₹7,500';
      estimatedDays = '6–9 Days';
    } else if (derivedStyle.includes('Streetwear') || /t-shirt|jeans|hoodie/.test(p)) {
      estimatedCost = '₹1,400 – ₹2,400';
      estimatedDays = '3–4 Days';
    }

    return {
      title: derivedTitle,
      garments: detectedGarments.slice(0, 3),
      style: derivedStyle,
      fit: derivedFit,
      colorPalette,
      occasion: derivedOccasion,
      estimatedCost,
      estimatedDays,
      lengthRequirement: garmentLength ? `${garmentLength} ${lengthUnit}` : 'Discuss with artisan',
      userPrompt: raw,
    };
  };

  const handleStartExtraction = () => {
    if (!promptText.trim()) return;
    setIsProcessing(true);
    setProcessingStep(0);
    playLoomSwoosh();

    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      setProcessingStep(step);
      playClickSound();

      if (step >= processingSteps.length) {
        clearInterval(interval);
        setTimeout(() => {
          setIsProcessing(false);
          playSuccessChime();

          const raw = promptText.trim();
          const parsed = parseFashionRequest(raw, presetExamples);
          setStructuredRequest(parsed);
        }, 600);
      }
    }, 650);
  };

  return (
    <div data-palette="rose" className="min-h-screen bg-[#090d16] text-slate-100 pt-24 pb-20 px-6 sm:px-12 relative overflow-hidden font-sans">
      
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/5 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-10 relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <span className="text-[11px] font-mono tracking-[0.3em] text-amber-400 font-bold uppercase">
            STEP 2 OF 4 • REQUIREMENTS CAPTURE
          </span>
          <h2 className="text-4xl md:text-6xl font-black font-display tracking-tight text-white uppercase">
            WHAT DO YOU NEED?
          </h2>
          <p className="text-sm md:text-base text-slate-300 max-w-xl mx-auto leading-relaxed font-light">
            Tell us what you want to wear. We'll understand your design and find nearby artisans who can craft it.
          </p>
        </div>

        {/* Input Card */}
        {!structuredRequest && !isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 sm:p-10 backdrop-blur-2xl shadow-2xl space-y-6"
          >
            {/* Input Mode Selector */}
            <div className="flex items-center justify-center gap-2 p-1.5 rounded-full bg-slate-950/80 border border-white/10 max-w-md mx-auto">
              {[
                { id: 'text', label: 'Type Idea', icon: PenTool },
                { id: 'voice', label: 'Speak Voice', icon: Mic },
                { id: 'image', label: 'Upload Photo', icon: ImageIcon },
                { id: 'sketch', label: 'Sketch Canvas', icon: Scissors },
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
                    className={`flex-1 py-2 px-3 rounded-full text-xs font-mono tracking-wider font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Input Panels */}
            {inputMode === 'text' && (
              <div className="space-y-4">
                <textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Describe your outfit in plain words: 'I need a black oversized T-shirt with blue jeans for casual wear' or 'A red silk blouse with zari borders for a party'..."
                  rows={4}
                  className="w-full bg-slate-950 border border-white/20 rounded-2xl p-5 text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 resize-none font-sans leading-relaxed"
                />

                {/* Clickable Preset Inspirations */}
                <div className="space-y-2">
                  <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider block">
                    Quick Examples (Click to Fill):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {presetExamples.map((ex) => (
                      <button
                        key={ex}
                        onClick={() => {
                          setPromptText(ex);
                          playClickSound();
                        }}
                        className="text-xs text-left px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/20 text-slate-100 font-medium transition-colors shadow-sm"
                      >
                        "{ex}"
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-[1fr_auto] gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <label className="text-xs font-mono text-slate-300">GARMENT LENGTH <span className="text-slate-500">(optional; can be agreed with artisan later)</span><input type="number" min="1" value={garmentLength} onChange={(e)=>setGarmentLength(e.target.value)} placeholder="e.g. 105" className="mt-2 block w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-sm text-white" /></label>
              <label className="text-xs font-mono text-slate-300">UNIT<select value={lengthUnit} onChange={(e)=>setLengthUnit(e.target.value)} className="mt-2 block rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-sm text-white"><option value="cm">cm</option><option value="in">inches</option></select></label>
            </div>

            {inputMode === 'voice' && (
              <div className="p-4 text-center space-y-4">
                <VoiceRecorder onTranscript={(t) => setPromptText(t)} />
                {promptText && (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-white/10 text-xs text-left text-amber-200 font-mono">
                    Captured Speech: "{promptText}"
                  </div>
                )}
              </div>
            )}

            {inputMode === 'image' && (
              <div className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center space-y-4">
                <ImageIcon className="w-10 h-10 text-slate-500 mx-auto" />
                <div className="text-xs text-slate-300">
                  <p className="font-bold">Upload a photo of your desired garment or sketch</p>
                  <p className="text-slate-500 mt-1">PNG, JPG, WebP up to 10MB</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadedImage(URL.createObjectURL(e.target.files[0]));
                      setPromptText('Custom outfit referenced from uploaded photo with tailored drape and fine seam finishes.');
                    }
                  }}
                  className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-amber-400 file:text-slate-950 hover:file:bg-amber-300"
                />
                {uploadedImage && (
                  <img src={uploadedImage} alt="Reference" className="w-32 h-32 object-cover rounded-xl mx-auto mt-4 border border-white/20" />
                )}
              </div>
            )}

            {inputMode === 'sketch' && (
              <SketchPad onSaveSketch={() => {
                setPromptText('Custom hand-drawn silhouette with tailored collar and contoured sleeves.');
              }} />
            )}

            {/* Submit Action Button */}
            <div className="flex justify-end pt-3">
              <button
                disabled={!promptText.trim()}
                onClick={handleStartExtraction}
                className={`px-8 py-4 rounded-full font-bold text-xs tracking-[0.2em] uppercase transition-all duration-300 flex items-center gap-3 shadow-xl ${
                  promptText.trim()
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 hover:scale-105 hover:shadow-amber-500/25'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Process Requirement with AI</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* AI Intelligent Processing Sequence */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-10 backdrop-blur-2xl shadow-2xl text-center space-y-6 max-w-xl mx-auto"
          >
            <div className="w-16 h-16 rounded-full border-2 border-amber-400/20 border-t-amber-400 animate-spin mx-auto flex items-center justify-center">
              <Scissors className="w-6 h-6 text-amber-400 animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono tracking-[0.25em] text-amber-400 font-bold uppercase">
                AI STEP {Math.min(processingStep + 1, processingSteps.length)} OF {processingSteps.length}
              </span>
              <h3 className="text-xl font-bold font-display text-white uppercase">
                {processingSteps[Math.min(processingStep, processingSteps.length - 1)].label}
              </h3>
              <p className="text-xs text-slate-200 font-mono font-medium">
                {processingSteps[Math.min(processingStep, processingSteps.length - 1)].desc}
              </p>
            </div>

            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${((processingStep + 1) / processingSteps.length) * 100}%` }}
              />
            </div>
          </motion.div>
        )}

        {/* Structured Request Result Card */}
        {structuredRequest && (
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-8 sm:p-10 backdrop-blur-2xl shadow-2xl space-y-8"
          >
            {/* Header & Change Input */}
            <div className="border-b border-slate-700/80 pb-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono text-amber-400 uppercase tracking-widest font-bold block">
                  AI STRUCTURED SPECIFICATION
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold font-display text-white mt-1">
                  {structuredRequest.title}
                </h3>
              </div>
              <button
                onClick={() => {
                  setStructuredRequest(null);
                }}
                className="text-xs font-mono text-amber-300 hover:text-white font-semibold transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-white/10"
              >
                Change Input ↺
              </button>
            </div>

            {/* Individual Garment Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {structuredRequest.garments.map((g, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-950/80 border border-white/15 space-y-1.5 shadow-md">
                  <span className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-wider block">Item #{idx + 1}</span>
                  <h4 className="text-base font-bold text-white">{g.name}</h4>
                  <div className="text-xs text-slate-200 font-mono">Fabric: <span className="text-white font-semibold">{g.fabric}</span></div>
                  <div className="text-xs text-slate-200 font-mono">Color: <span className="text-white font-semibold">{g.color}</span></div>
                </div>
              ))}
            </div>

            {/* Parameter Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/10 shadow-sm">
                <span className="text-amber-400 font-bold block text-[11px] tracking-wider uppercase mb-1">STYLE:</span>
                <span className="text-white font-bold text-sm block">{structuredRequest.style}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/10 shadow-sm">
                <span className="text-amber-400 font-bold block text-[11px] tracking-wider uppercase mb-1">FIT:</span>
                <span className="text-white font-bold text-sm block">{structuredRequest.fit}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/10 shadow-sm">
                <span className="text-amber-400 font-bold block text-[11px] tracking-wider uppercase mb-1">OCCASION:</span>
                <span className="text-white font-bold text-sm block">{structuredRequest.occasion}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/10 shadow-sm">
                <span className="text-emerald-400 font-bold block text-[11px] tracking-wider uppercase mb-1">EST. RANGE:</span>
                <span className="text-emerald-300 font-bold text-sm block">{structuredRequest.estimatedCost}</span>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/70 p-4 text-sm"><span className="text-amber-400 font-mono text-xs">GARMENT LENGTH</span><p className="mt-1 text-white">{structuredRequest.lengthRequirement || 'Discuss with artisan'}</p></div>

            {/* Transition to Tab 3: Find Artisan */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800">
              <div className="text-xs font-mono text-slate-200">
                Your outfit requirements are ready. Find nearby artisans who can make it.
              </div>

              <button
                type="button"
                onClick={() => {
                  playLoomSwoosh();
                  onProceedToArtisanMatching(structuredRequest);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-8 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-950 shadow-xl transition-all duration-300 hover:scale-105 sm:w-auto"
              >
                <span>Find Your Artisan ↘</span>
              </button>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
