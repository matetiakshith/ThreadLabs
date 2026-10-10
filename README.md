# 🧵 ThreadLabs — AI-Driven Market Linkage for Marginalized Artisans

> **Theme**: Heritage & Culture | **Category**: Software | **Team**: BEATLES_X (Avishkar 2026)

**ThreadLabs** is an intelligent marketplace platform connecting customers who have custom-made clothing ideas with traditional, marginalized Indian artisans (weavers, block-printers, and embroiderers).

---

## 🌟 Key Capabilities

### 1. Multimodal AI Customization Studio
Customers express their custom clothing vision via 4 intuitive methods:
- ✍️ **Natural Language Text Prompts** with heritage style suggestions.
- 🎙️ **Voice Notes** powered by real-time speech recognition (supporting Indian English, Hindi, Tamil, Bengali, Telugu).
- 🎨 **Interactive Digital SketchPad** with silhouette guides (Kurta, Shirt, Nehru Jacket, Blank) for sketching custom necklines, motifs, and patterns.
- 🖼️ **Image Moodboard Upload** with automatic feature & tag extraction.

### 2. AI Production Tech-Pack Generator
Converts unstructured customer ideas into a standardized **Master Tailor Specification Blueprint**:
- **Garment Silhouette & Type**
- **Textile & Fabric Base** (Varanasi Raw Silk, Organic Khadi Cotton, Chanderi, Georgette, Mulmul, Pochampally Ikat, Tussar Silk)
- **Heritage Craft Technique** (Zardozi, Ajrakh 16-Stage Mud-Resist, Lucknowi Chikankari, Double Ikat, Shantiniketan Kantha, Bagru Dabu)
- **Color Palette & Pantone Specs**
- **Yardage & Lining Requirements**
- **Fair-Pay Estimation & Lead Time**
- **Custom Body Fit Measurements Editor**

### 3. Smart Matchmaking Engine
Ranks master artisans using a multi-factor weighted scoring algorithm evaluating craft alignment, fabric expertise, generational experience, and workshop capacity.

### 4. Artisan Smart Digital Catalog & Storefront
Gives marginalized artisans their own digital presence to showcase previous custom orders, list lead times, highlight GI heritage, and accept direct commissions.

### 5. Live Milestone Lifecycle & Order Tracker
Real-time tracking of tailoring phases:
$$\text{Submitted} \longrightarrow \text{Artisan Accepted} \longrightarrow \text{In Production (Weaving/Zari)} \longrightarrow \text{Quality Check} \longrightarrow \text{Dispatched}$$
Includes a direct message line between customer and master artisan.

### 6. Artisan Workspace Portal
Dedicated interface for artisans to:
- Review incoming custom blueprints.
- Advance production milestones with a single click.
- Chat directly with customers to finalize fittings.
- Upload new handcrafted creations to their smart catalog.

---

## 🚀 Running the Project Locally

### 1. Backend Server (Express API)
```bash
cd server
npm install
npm start
# Server runs on http://localhost:5000
```

### 2. Frontend Client (React + Vite + Tailwind)
```bash
cd client
npm install
npm run dev
# App runs on http://localhost:5173
```

### Image Generation Preview
Provider keys belong in `server/.env` (never in the client). Copy `server/.env.example` as a reference, then add `OPENAI_API_KEY` and `GEMINI_API_KEY` to `server/.env`. Restart the backend after changing the keys. In Customer Needs, generate a preview with either provider, compare the boards, and select one before artisan matching. Preview generation uses provider API credits.

---

## 📁 Repository Architecture

```
ThreadLabs/
├── client/                     # Vite + React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ArtisanPortal/  # Artisan Dashboard & Catalog Manager
│   │   │   ├── Artisans/       # Discovery, Explorer & Profiles
│   │   │   ├── Orders/         # Live Milestone Order Tracker & Chat
│   │   │   ├── Studio/         # Multimodal Studio (Voice, Sketch, Text)
│   │   │   ├── Hero.jsx        # Landing Showcase
│   │   │   ├── Navbar.jsx      # Navigation, Language & Role Switcher
│   │   │   └── Footer.jsx      # Heritage & Fair-Trade Attribution
│   │   ├── services/api.js     # REST API Client
│   │   ├── App.jsx             # Master State & Orchestration
│   │   └── index.css           # Custom Artisan Heritage Design System
│   └── tailwind.config.js
│
├── server/                     # Node.js + Express Backend
│   ├── data/                   # JSON Persistent Store (Artisans, Orders, Crafts)
│   │   ├── artisans.json
│   │   ├── orders.json
│   │   └── heritage_crafts.json
│   ├── services/
│   │   ├── aiExtractionService.js # Multimodal Requirement Extraction
│   │   └── matcherService.js      # Artisan Matchmaking Algorithm
│   └── server.js               # API Server & Routes
└── README.md
```

---

## 🏆 Impact for Marginalized Artisans
- **Digital Visibility**: Direct access to high-value custom clientele without exploitative middlemen.
- **Fair Compensation**: 100% transparent pricing and guaranteed commission advance.
- **Cultural Preservation**: Highlights GI-tagged crafts and indigenous techniques for the next generation.
- **Sustainable Fashion**: Eliminates mass overproduction through zero-waste, on-demand bespoke creation.
