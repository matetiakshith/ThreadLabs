# 🧠 THREADLABS — MASTER PROJECT MEMORY & KNOWLEDGE BASE

> **Project Name**: ThreadLabs  
> **Team**: BEATLES_X  
> **Hackathon**: Avishkar 2026  
> **Theme**: Heritage and Culture | **Category**: Software  
> **Problem Statement**: *"AI-Driven market linkage and smart cataloging mobile/web application for marginalized artisans."*

---

## 1. 📌 Core Value Proposition & System Workflows

ThreadLabs connects customers who have custom-made clothing ideas with nearby master tailoring and heritage craft artisans.

### The 4-Tab Core Application Flow:
$$\text{1. EXPLORE (3D Shopping Mall)} \longrightarrow \text{2. CUSTOMER NEEDS (AI Extraction)} \longrightarrow \text{3. FIND ARTISAN (Rapido-Style Matching)} \longrightarrow \text{4. ORDER TRACKING (Amazon-Style Live Stages)}$$

1. **Tab 1 — Explore (3D Luxury Shopping Mall)**:
   - Automated cinematic camera tour through Women's Outfits $\rightarrow$ Men's Outfits $\rightarrow$ Haute & Anime Couture $\rightarrow$ End of Mall prompt ("WHAT ARE YOU LOOKING FOR?").
   - Realistic articulated fashion mannequins with tailored PBR garments and cloth physics.
   - Interactive hover cards and 360° inspector mode.
2. **Tab 2 — Customer Needs ("WHAT DO YOU NEED?")**:
   - Multimodal inputs: Text, Voice, Image Upload, Sketch Canvas.
   - AI Processing sequence: Understanding $\rightarrow$ Identifying Clothing $\rightarrow$ Matching Requirements $\rightarrow$ Finding Available Artisans.
3. **Tab 3 — Find Your Artisan (Rapido / Ola Model)**:
   - Proximity radar map showing YOU at center and nearby artisans with distance (1.8 km, 2.4 km, 3.2 km, 4.0 km).
   - Artisan cards with pricing, days, specialties, and profile modal.
   - Instant order confirmation modal.
4. **Tab 4 — Order Tracking (Amazon Live Stages)**:
   - Real-time progress bar and stages: Request Placed $\rightarrow$ Artisan Accepted $\rightarrow$ Measurements Confirmed $\rightarrow$ Fabric Ready $\rightarrow$ Cutting $\rightarrow$ Stitching $\rightarrow$ Quality Check $\rightarrow$ Out for Delivery.
   - Workshop location and direct telephone / chat link to tailor.

### Frontend (`/client`)
- **Framework**: React 19 + Vite + Tailwind CSS
- **3D WebGL Engine**: Three.js (`three`, `@types/three`, `@react-three/fiber`, `@react-three/drei`)
- **Motion & Physics**: Framer Motion
- **Icons & Effects**: Lucide React, Canvas Confetti
- **Audio & Speech**: Web Audio API (tactile clicks, loom swoosh, success chime), Web Speech API (multilingual Indian English, Hindi, Tamil, Bengali, Telugu)

### Backend (`/server`)
- **Framework**: Node.js + Express
- **Persistence**: File-based JSON Database (`server/data/artisans.json`, `server/data/orders.json`, `server/data/heritage_crafts.json`)
- **AI Services**:
  - `aiExtractionService.js`: Parses messy multimodal inputs into standardized tailor tech-packs.
  - `matcherService.js`: Computes weighted matching percentage (craft alignment, fabric compatibility, experience, rating).

---

## 3. 🎨 Visual Design Language (Inspired by unseen.studio)

1. **3D WebGL Architectural Sanctuary (`UnseenWorld3D.jsx`)**:
   - Rose-marble stepped plinth rising out of reflective animated water.
   - Classical Indian colonnade arches with warm blush sun and soft shadows.
   - Floating iridescent silk orb encircled by rotating golden thread rings.
   - Cinematic 3D camera pan/dolly transitions between sections.

2. **Luxury Editorial Typography & Floating UI (`UnseenNav.jsx` & `EditorialHero.jsx`)**:
   - Minimalist logo: `threadlabs • studio`.
   - Editorial serif headlines: *"Creating the unforgotten"*.
   - Floating pill CTAs (`Start Custom Outfit ↘`, `Explore Artisan Gallery`).
   - Sound toggle (`🔊 / 🔇`) and edition stamp `©2026 THREADLABS`.

3. **Curated Showcase Gallery (`SelectedProjectsGallery.jsx`)**:
   - 2-column luxury project cards with 700ms smooth image zoom on hover and filter tabs (`Silk & Zari`, `Ajrakh`, `Chikankari`, `Ikat`).

4. **3D Virtual Fashion Platform & GPU Cloth Physics Engine**:
   - `AvatarManager.js`: High-precision **Articulated Atelier Fashion Mannequins** (Male & Female) directly modeled from professional 3D fashion atelier reference:
     - Pure matte white satin resin PBR finish (`#f6f6f8`, roughness 0.32, clearcoat 0.28, sheen 0.45) with polished titanium joint accents (`#8e929b`).
     - Articulated ball-and-socket shoulders, dual-disc elbow hinges, grooved forearms, wrist rings, relaxed hands with sculpted fingers, hip sockets, quadriceps thighs, dual-disc knee hinges with patella shields, gastrocnemius calves, articulated ankle bolts, and sculpted feet.
     - Strict architectural separation: Rendered `visibleGroup` vs invisible physics `collisionGroup` (9 collision spheres active in PBD physics).
     - Automated `applyGarmentCoverage` mask ensures zero body clipping or show-through when rotating or pulling fabric.
   - `GarmentManager.js`: Complete 3D tailored garment pattern constructor (collars, yokes, button plackets, shell buttons, curved sleeves, cuffs, pockets, pleated hems, and Bleach Anime haori/trench/hakama outfits).
   - `ClothPhysics.js`: Real-time Verlet Integration & Position-Based Dynamics (PBD) simulation engine:
     - Structural, shear, and bending constraints.
     - Gravity, air drag, Perlin wind turbulence, and angular/centrifugal momentum transfer.
     - Avatar body collision capsules to prevent skin penetration.
     - Interactive **Grab Fabric Mode** with 3D raycasting and dynamic vertex pulling.
     - Configurable fabric profiles (**Silk**, **Satin**, **Cotton**, **Denim**, **Leather**, **Wool**, **Linen**, **Techwear**, **Gold Zari**).
   - `ClothMaterial.js`: PBR material engine with procedural twill, satin, denim, knit, and pebble leather normal maps.
   - `garmentDatabase.js`: 14+ outfits across Men, Women, Anime (Bleach-inspired), Streetwear, Casual, Formal, and Futuristic.
   - `ClothingViewer.jsx`: Dedicated 360° product viewer with grab mode, wind slider, avatar model switcher, color customizer, lighting presets, zoom, and reset controls.
   - `ProductGallery.jsx`: Multi-filtered high-fashion gallery (Gender, Category, Collection, Fabric, Live Search).
   - `FashionMall3D.jsx`: Top-level 3D virtual luxury shopping mall & runway boutique.

---

## 4. 👥 Dual User Journeys

### A. Customer Journey
1. **Express Vision**: Speak via microphone ("Bol ke batayein"), upload photo reference, sketch on canvas, or choose an outfit card (Kurta, Shirt, Anarkali, Jacket, Blouse, Blazer).
2. **AI Tech-Pack Blueprint**: View 3D garment drape, fabric breakdown, required yardage, fair price estimate, and size selector (S, M, L, XL, or custom fit).
3. **Match & Commission**: View ranked master artisans with match scores (e.g. 99% Match) and hire with 1 tap.
4. **Live Order Tracker**: Watch parcel move through `Submitted` $\rightarrow$ `Accepted` $\rightarrow$ `In Production` $\rightarrow$ `Quality Check` $\rightarrow$ `Dispatched`, with direct workshop chat.

### B. Artisan Journey (`Artisan Desk`)
1. **Tactile Dashboard**: Large 1-tap progress buttons in dual Hindi/English (*"1. Accept Order"*, *"2. Start Stitching"*, *"3. Ready for Quality Check"*, *"4. Dispatch"*).
2. **Smart Catalog Manager**: 1-tap photo upload to add newly crafted garments to digital storefront.
3. **Direct Line**: Instant reply to customer inquiries.

---

## 5. 🗺️ Master Artisan Clusters in Database

| Artisan Name | Region / State | Heritage Craft | GI Status |
|---|---|---|---|
| **Ustad Rahimuddin Ansari** | Varanasi, UP | Zardozi & Banarasi Brocade | National Merit Awardee |
| **Khatri Ismail Mohammed** | Kutch, Gujarat | Ajrakh Hand-Block Print & Indigo | UNESCO Seal of Excellence |
| **Begum Shagufta Parveen** | Lucknow, UP | Chikankari & Mukaish Work | 30-Woman Guild Leader |
| **Balaram Padmashali** | Pochampally, Telangana | Double Ikat Handloom Weave | Bhoodan Weavers Lineage |
| **Manjula Devi Roy** | Bolpur, West Bengal | Kantha Narrative Stitching | Folk Storytelling Master |
| **Devi Lal Chhipa** | Bagru, Rajasthan | Dabu Mud-Resist & Indigo | 7th-Gen Chhipa Lineage |

---

## 6. 🚀 How to Run the Project in Future Sessions

### Backend API:
```bash
cd server
npm start
# API runs on http://localhost:5000
```

### Frontend App:
```bash
cd client
npm run dev -- --host
# App runs on http://localhost:5173
```

---

## 7. 🔌 API Endpoints Reference

- `GET /api/health` — API status
- `GET /api/artisans` — List/filter artisans by craft, state, or search
- `GET /api/artisans/:id` — Single artisan profile & catalog
- `POST /api/artisans/:id/catalog` — Add item to smart catalog
- `GET /api/heritage-crafts` — Knowledge encyclopedia
- `POST /api/ai/parse-requirements` — Parse multimodal prompt into Tech-Pack
- `POST /api/ai/match-artisans` — Rank artisans based on tech-pack specs
- `GET /api/orders` — List orders
- `POST /api/orders` — Create new custom order
- `PATCH /api/orders/:id/status` — Update milestone status
- `POST /api/orders/:id/messages` — Send direct workshop chat message
