/**
 * ThreadLabs AI Requirement Extraction Service
 * Converts multimodal customer input (text prompt, voice transcription, sketch descriptors, image tags)
 * into a structured production Tech-Pack and matching criteria.
 */

const GARMENT_PATTERNS = [
  { match: /(kurta|kurti|tunic|angrakha)/i, garment: "Traditional Kurta / Kurti", defaultYardage: "3.2m", basePrice: 3200 },
  { match: /(nehru\s*jacket|waistcoat|bandhgala\s*vest|vest)/i, garment: "Nehru Jacket / Bandhgala Vest", defaultYardage: "1.8m", basePrice: 2800 },
  { match: /(shirt|camp\s*collar|button\s*down|cuban\s*collar)/i, garment: "Tailored Artisan Shirt", defaultYardage: "2.4m", basePrice: 2400 },
  { match: /(blazer|coat|jacket|overcoat|shrug)/i, garment: "Contemporary Structured Blazer / Overcoat", defaultYardage: "3.5m", basePrice: 4200 },
  { match: /(anarkali|maxi|gown|dress)/i, garment: "Anarkali / Flowing Silhouette Dress", defaultYardage: "4.5m", basePrice: 4500 },
  { match: /(blouse|choli|top)/i, garment: "Designer Saree Blouse / Crop Top", defaultYardage: "1.2m", basePrice: 2200 },
  { match: /(sherwani|achkan)/i, garment: "Royal Sherwani / Achkan", defaultYardage: "4.8m", basePrice: 6500 },
];

const FABRIC_PATTERNS = [
  { match: /(raw\s*silk|katan|mulberry\s*silk|pure\s*silk|silk)/i, fabric: "Pure Raw Silk / Katan Silk", fabricType: "Silk" },
  { match: /(khadi|khaddar|handspun\s*cotton)/i, fabric: "Handspun Organic Khadi Cotton", fabricType: "Cotton" },
  { match: /(chanderi|silk\s*cotton)/i, fabric: "Chanderi Silk-Cotton Blend", fabricType: "Silk-Cotton" },
  { match: /(georgette|chiffon|organza)/i, fabric: "Fine Pure Georgette", fabricType: "Sheer/Georgette" },
  { match: /(mulmul|malmal|cotton|cambric)/i, fabric: "Breathable Mulmul Fine Cotton", fabricType: "Cotton" },
  { match: /(tussar|kosa|wild\s*silk)/i, fabric: "Wild Forest Tussar Silk", fabricType: "Tussar" },
  { match: /(linen|flax)/i, fabric: "European Heritage Linen", fabricType: "Linen" },
  { match: /(velvet|makhmal)/i, fabric: "Plush Micro-Velvet", fabricType: "Velvet" },
];

const CRAFT_PATTERNS = [
  { match: /(zardozi|zari|dabka|metallic|gold\s*thread|aari)/i, craft: "Zardozi & Banarasi Brocade", craftSlug: "zardozi", complexity: 8 },
  { match: /(ajrakh|mud\s*resist|indigo\s*print|block\s*print)/i, craft: "Ajrakh Hand Block Printing & Natural Dyeing", craftSlug: "ajrakh", complexity: 6 },
  { match: /(chikankari|chikan|shadow\s*work|bakhiya|mukaish)/i, craft: "Chikankari & Mukaish Hand Embroidery", craftSlug: "chikankari", complexity: 7 },
  { match: /(ikat|pochampally|patola|tie\s*dye\s*weave|double\s*ikat)/i, craft: "Pochampally Ikat & Double-Weave", craftSlug: "ikat", complexity: 8 },
  { match: /(kantha|nakshi|running\s*stitch|bengal\s*stitch)/i, craft: "Kantha Narrative Stitching", craftSlug: "kantha", complexity: 7 },
  { match: /(dabu|bagru|mud\s*resist|kashish)/i, craft: "Dabu Mud Resist & Natural Indigo", craftSlug: "dabu", complexity: 5 },
];

const COLOR_MAP = [
  { match: /(royal\s*blue|navy|midnight\s*blue|dark\s*blue|blue)/i, name: "Royal Midnight Navy", hex: "#1b2a4a" },
  { match: /(indigo|deep\s*indigo)/i, name: "Botanical Deep Indigo", hex: "#2c3e6b" },
  { match: /(terracotta|rust|brick\s*red|burnt\s*orange)/i, name: "Heritage Terracotta & Rust", hex: "#c85a32" },
  { match: /(mustard|turmeric|ochre|yellow|gold)/i, name: "Warm Turmeric Mustard", hex: "#d4af37" },
  { match: /(sage|olive|forest\s*green|emerald|green)/i, name: "Emerald & Sage Green", hex: "#1e4d3b" },
  { match: /(crimson|maroon|ruby|red|wine)/i, name: "Deep Madder Crimson", hex: "#8b1e2c" },
  { match: /(white|pearl|ivory|cream|off\s*white)/i, name: "Pearl Ivory White", hex: "#fffdf9" },
  { match: /(black|charcoal|iron)/i, name: "Mineral Iron Charcoal", hex: "#222226" },
];

export async function parseDesignIdea({ textPrompt = "", voiceTranscript = "", sketchDescription = "", imageTags = [] }) {
  const combinedText = `${textPrompt} ${voiceTranscript} ${sketchDescription} ${imageTags.join(" ")}`.toLowerCase();

  // 1. Detect Garment
  let selectedGarment = "Bespoke Heritage Garment";
  let defaultYardage = "3.0 meters";
  let estimatedBasePrice = 3000;
  for (const item of GARMENT_PATTERNS) {
    if (item.match.test(combinedText)) {
      selectedGarment = item.garment;
      defaultYardage = item.defaultYardage;
      estimatedBasePrice = item.basePrice;
      break;
    }
  }

  // 2. Detect Fabric
  let selectedFabric = "Handloom Organic Khadi Cotton";
  let fabricType = "Cotton";
  for (const item of FABRIC_PATTERNS) {
    if (item.match.test(combinedText)) {
      selectedFabric = item.fabric;
      fabricType = item.fabricType;
      break;
    }
  }

  // 3. Detect Craft Technique
  let selectedCraft = "Ajrakh Hand Block Printing & Natural Dyeing";
  let craftSlug = "ajrakh";
  let complexityScore = 6;
  for (const item of CRAFT_PATTERNS) {
    if (item.match.test(combinedText)) {
      selectedCraft = item.craft;
      craftSlug = item.craftSlug;
      complexityScore = item.complexity;
      break;
    }
  }

  // 4. Detect Color
  let selectedColor = { name: "Royal Midnight Navy", hex: "#1b2a4a" };
  for (const item of COLOR_MAP) {
    if (item.match.test(combinedText)) {
      selectedColor = { name: item.name, hex: item.hex };
      break;
    }
  }

  // Calculate realistic production ranges
  const minPrice = Math.round(estimatedBasePrice * (0.85 + complexityScore * 0.05));
  const maxPrice = Math.round(minPrice * 1.35);
  const minDays = Math.max(6, Math.round(complexityScore * 1.5));
  const maxDays = minDays + 6;

  // Generate structured Tech-Pack summary
  const techPack = {
    garmentType: selectedGarment,
    fabric: selectedFabric,
    fabricCategory: fabricType,
    craftTechnique: selectedCraft,
    craftSlug: craftSlug,
    colorScheme: selectedColor,
    estimatedYardage: defaultYardage,
    complexityScore: `${complexityScore}/10`,
    recommendedTimeline: `${minDays} - ${maxDays} Days`,
    estimatedPriceRange: `₹${minPrice.toLocaleString('en-IN')} - ₹${maxPrice.toLocaleString('en-IN')}`,
    recommendedBasePrice: minPrice,
    productionSpecifications: [
      { spec: "Fabric Base", detail: `${selectedFabric} (Pre-washed & shrinkage treated)` },
      { spec: "Craft Style", detail: `${selectedCraft} with natural pigments / authentic threads` },
      { spec: "Stitching & Seams", detail: "Double-reinforced lock-stitch with French seams on inner sides" },
      { spec: "Lining Specification", detail: fabricType === 'Silk' || complexityScore > 6 ? "Breathable Mulmul cotton inner lining" : "Self-faced collars and plackets" },
      { spec: "Button / Fastener", detail: craftSlug === 'zardozi' ? "Handmade Potli buttons with zari loop" : "Eco-friendly polished coconut / wooden shell buttons" },
      { spec: "Care Recommendation", detail: complexityScore >= 7 ? "Dry Clean Recommended" : "Gentle Cold Hand Wash, dry in shade" }
    ],
    designSummary: `Custom ${selectedGarment} tailored in ${selectedFabric}, embellished with authentic ${selectedCraft} in a ${selectedColor.name} palette.`,
    extractedAt: new Date().toISOString()
  };

  return techPack;
}
