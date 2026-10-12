import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { parseDesignIdea } from './services/aiExtractionService.js';
import { matchArtisans } from './services/matcherService.js';
import { imageGenerationRouter } from './routes/imageGeneration.js';
import { configureDeployment, frontendOrigins, initializeData, serveFrontend } from './deployment.js';
import { AccountStore } from './services/accountStore.js';
import { accountRoutes, commissionRoutes } from './routes/accounts.js';
import { validMeasurementPayload } from './services/measurementValidation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5001;
const asyncApi = (method, route, handler) => app[method](route, (req, res, next) => {
  Promise.resolve().then(() => handler(req, res, next)).catch(next);
});

configureDeployment(app);
app.use(express.json({ limit: '10mb' }));
app.use('/api', (req, res, next) => {
  if (Object.values(req.query).some(value => typeof value !== 'string' || value.length > 1000)) return res.status(400).json({ error: 'Invalid query parameters.' });
  if (['POST','PATCH'].includes(req.method) && (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))) return res.status(400).json({ error: 'Send a JSON object.' });
  next();
});

// Helper paths
const dataDirectory = await initializeData(__dirname);
const ARTISANS_FILE = path.join(dataDirectory, 'artisans.json');
const ORDERS_FILE = path.join(dataDirectory, 'orders.json');
const HERITAGE_FILE = path.join(dataDirectory, 'heritage_crafts.json');

let accountStore;
if (process.env.DATABASE_URL) {
  const candidate = new AccountStore(process.env.DATABASE_URL);
  try {
    await candidate.initialize();
    for (const filename of ['artisans.json','heritage_crafts.json','orders.json']) {
      const seed = filename === 'orders.json' && process.env.NODE_ENV === 'production' ? [] : JSON.parse(await fs.readFile(path.join(dataDirectory,filename),'utf8'));
      await candidate.seedLegacy(filename, seed);
    }
    accountStore = candidate;
  }
  catch { console.error('Account database initialization failed. Verify DATABASE_URL and database availability.'); await candidate.close(); }
}
const accounts = accountRoutes({ store: accountStore });
app.use('/api/auth', accounts.router);
const publicArtisans = JSON.parse(await fs.readFile(path.join(__dirname, '../client/src/data/artisans.json'), 'utf8'));
const catalogArtisans = JSON.parse(await fs.readFile(ARTISANS_FILE, 'utf8'));
const artisanProfiles = new Map(publicArtisans.map(artisan => [artisan.id, { ...artisan, phone: catalogArtisans.find(profile => profile.id === artisan.id)?.phone }]));
app.use('/api/commissions', commissionRoutes({ store: accountStore, requireUser: accounts.requireUser, artisanIds: new Set(publicArtisans.map(artisan => artisan.id)), artisanProfiles, validateMeasurements: validMeasurementPayload }));
if (process.env.NODE_ENV === 'production') asyncApi('post', '/api/ai/generate-image', accounts.requireUser);
app.use('/api/ai', imageGenerationRouter({ env: { ...process.env, FRONTEND_ORIGINS: frontendOrigins().join(',') } }));

// File DB helpers
async function readData(filePath) {
  if (accountStore && process.env.NODE_ENV === 'production') return accountStore.readLegacy(path.basename(filePath));
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return [];
  }
}

async function writeData(filePath, data) {
  if (process.env.NODE_ENV === 'production') {
    if (!accountStore) throw new Error('Database unavailable');
    return accountStore.writeLegacy(path.basename(filePath), data);
  }
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// ---------------- ROUTES ----------------

// Health check
asyncApi('get', '/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'ThreadLabs Backend API', accountsReady: !!accountStore, revision: process.env.RENDER_GIT_COMMIT || null, time: new Date().toISOString() });
});

// 1. Heritage Crafts Knowledge Base
asyncApi('get', '/api/heritage-crafts', async (req, res) => {
  const crafts = await readData(HERITAGE_FILE);
  res.json(crafts);
});

// 2. Artisans Discovery & Filter
asyncApi('get', '/api/artisans', async (req, res) => {
  const { craft, search, state } = req.query;
  let artisans = await readData(ARTISANS_FILE);

  if (craft && craft !== 'all') {
    artisans = artisans.filter(a => a.craftSlug === craft || a.craft.toLowerCase().includes(craft.toLowerCase()));
  }

  if (state && state !== 'all') {
    artisans = artisans.filter(a => a.state.toLowerCase() === state.toLowerCase());
  }

  if (search) {
    const q = search.toLowerCase();
    artisans = artisans.filter(a => 
      a.name.toLowerCase().includes(q) ||
      a.craft.toLowerCase().includes(q) ||
      a.region.toLowerCase().includes(q) ||
      a.specialties.some(s => s.toLowerCase().includes(q))
    );
  }

  res.json(artisans);
});

// 3. Single Artisan Detail
asyncApi('get', '/api/artisans/:id', async (req, res) => {
  const artisans = await readData(ARTISANS_FILE);
  const artisan = artisans.find(a => a.id === req.params.id);
  if (!artisan) {
    return res.status(404).json({ error: 'Artisan not found' });
  }
  res.json(artisan);
});

// 4. Add item to Artisan Smart Catalog
asyncApi('post', '/api/artisans/:id/catalog', async (req, res) => {
  const artisans = await readData(ARTISANS_FILE);
  const index = artisans.findIndex(a => a.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Artisan not found' });
  }

  const newItem = {
    id: `cat-${Date.now()}`,
    title: req.body.title || 'Untitled Craft Piece',
    craft: req.body.craft || artisans[index].craft,
    fabric: req.body.fabric || 'Handloom Textile',
    price: Number(req.body.price) || 2500,
    leadTime: req.body.leadTime || '10 days',
    imageUrl: req.body.imageUrl || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800',
    description: req.body.description || 'Handcrafted bespoke piece.'
  };

  artisans[index].catalog = [newItem, ...(artisans[index].catalog || [])];
  await writeData(ARTISANS_FILE, artisans);

  res.status(201).json({ message: 'Item added to catalog', catalogItem: newItem, artisan: artisans[index] });
});

// 5. AI Requirement Extraction Engine
asyncApi('post', '/api/ai/parse-requirements', async (req, res) => {
  try {
    const { textPrompt, voiceTranscript, sketchDescription, imageTags } = req.body;
    if ([textPrompt,voiceTranscript,sketchDescription].some(value => value !== undefined && (typeof value !== 'string' || value.length > 6000)) || (imageTags !== undefined && (!Array.isArray(imageTags) || imageTags.length > 50 || imageTags.some(value => typeof value !== 'string' || value.length > 200)))) return res.status(400).json({ error: 'Invalid design input.' });
    const techPack = await parseDesignIdea({ textPrompt, voiceTranscript, sketchDescription, imageTags });
    res.json(techPack);
  } catch (err) {
    console.error('AI Extraction Error:', err);
    res.status(500).json({ error: 'Failed to extract requirements' });
  }
});

// 6. AI Matchmaking: Find & Rank Artisans for a Tech-Pack
asyncApi('post', '/api/ai/match-artisans', async (req, res) => {
  try {
    const { techPack } = req.body;
    if (!techPack || typeof techPack !== 'object' || Array.isArray(techPack)) {
      return res.status(400).json({ error: 'techPack specification required' });
    }
    const artisans = await readData(ARTISANS_FILE);
    const matched = matchArtisans(techPack, artisans);
    res.json(matched);
  } catch (err) {
    console.error('Matching Error:', err);
    res.status(500).json({ error: 'Failed to rank artisans' });
  }
});

// 7. Orders: List all
asyncApi('get', '/api/orders', async (req, res) => {
  const { artisanId, customerId } = req.query;
  let orders = await readData(ORDERS_FILE);

  if (artisanId) {
    orders = orders.filter(o => o.artisanId === artisanId);
  }
  if (customerId) {
    orders = orders.filter(o => o.customerId === customerId);
  }

  res.json(orders);
});

// 8. Orders: Get single
asyncApi('get', '/api/orders/:id', async (req, res) => {
  const orders = await readData(ORDERS_FILE);
  const order = orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(order);
});

// 9. Orders: Create new custom order
asyncApi('post', '/api/orders', async (req, res) => {
  try {
    const orders = await readData(ORDERS_FILE);
    const artisans = await readData(ARTISANS_FILE);
    
    const artisan = artisans.find(a => a.id === req.body.artisanId) || artisans[0];
    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder = {
      id: orderId,
      customerId: req.body.customerId || `cust-${Date.now()}`,
      customerName: req.body.customerName || 'Aditi Sengupta',
      customerEmail: req.body.customerEmail || 'aditi@example.com',
      customerPhone: req.body.customerPhone || '+91 98765 43210',
      artisanId: artisan.id,
      artisanName: artisan.name,
      artisanCraft: artisan.craft,
      artisanAvatar: artisan.avatar,
      garmentType: req.body.techPack?.garmentType || req.body.garmentType || 'Bespoke Artisan Kurta',
      fabric: req.body.techPack?.fabric || req.body.fabric || 'Khadi Silk',
      craftTechnique: req.body.techPack?.craftTechnique || artisan.craft,
      primaryColor: req.body.techPack?.colorScheme?.hex || '#1b2a4a',
      colorName: req.body.techPack?.colorScheme?.name || 'Deep Indigo',
      measurements: req.body.measurements || {
        chest: "38 inches",
        shoulder: "17.5 inches",
        length: "40 inches",
        sleeveLength: "24 inches"
      },
      requirementsSummary: req.body.techPack?.designSummary || req.body.prompt || 'Custom handcrafted heritage garment with bespoke artisan detailing.',
      inputMethod: req.body.inputMethod || 'text',
      originalPrompt: req.body.prompt || '',
      status: 'Submitted',
      currentMilestoneIndex: 0,
      price: req.body.price || req.body.techPack?.recommendedBasePrice || 3200,
      createdAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      timeline: [
        {
          status: 'Submitted',
          title: 'Design Specs Submitted',
          timestamp: new Date().toISOString(),
          completed: true,
          note: 'Customer approved AI Tech-Pack specifications and sent to artisan.'
        },
        {
          status: 'Accepted',
          title: 'Artisan Confirmation',
          timestamp: null,
          completed: false,
          note: 'Artisan reviewing measurements & raw material availability.'
        },
        {
          status: 'In_Production',
          title: 'Weaving / Embroidery in Progress',
          timestamp: null,
          completed: false,
          note: 'Artisan actively handcrafting on workshop loom or framing needle.'
        },
        {
          status: 'Quality_Check',
          title: 'Finishing & Quality Verification',
          timestamp: null,
          completed: false,
          note: 'Checking seam integrity, pattern alignment, and pressing.'
        },
        {
          status: 'Dispatched',
          title: 'Dispatched in Eco-Wrap',
          timestamp: null,
          completed: false,
          note: 'Wrapped with artisan authentication seal & tracking id.'
        }
      ],
      messages: [
        {
          sender: 'system',
          senderName: 'ThreadLabs Concierge',
          time: 'Just now',
          text: `Your custom request for ${artisan.name} has been placed. The artisan has been notified on their dashboard.`
        }
      ]
    };

    orders.unshift(newOrder);
    await writeData(ORDERS_FILE, orders);

    res.status(201).json({ message: 'Order created successfully', order: newOrder });
  } catch (err) {
    console.error('Create Order Error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// 10. Orders: Update milestone status (Artisan action)
asyncApi('patch', '/api/orders/:id/status', async (req, res) => {
  const { status, milestoneIndex, note } = req.body;
  const orders = await readData(ORDERS_FILE);
  const orderIndex = orders.findIndex(o => o.id === req.params.id);

  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const order = orders[orderIndex];
  if (status) order.status = status;
  if (milestoneIndex !== undefined) {
    order.currentMilestoneIndex = milestoneIndex;
    if (order.timeline[milestoneIndex]) {
      order.timeline[milestoneIndex].completed = true;
      order.timeline[milestoneIndex].timestamp = new Date().toISOString();
      if (note) order.timeline[milestoneIndex].note = note;
    }
  }

  await writeData(ORDERS_FILE, orders);
  res.json({ message: 'Status updated', order });
});

// 11. Orders: Post a direct message between customer & artisan
asyncApi('post', '/api/orders/:id/messages', async (req, res) => {
  const { sender, senderName, text } = req.body;
  const orders = await readData(ORDERS_FILE);
  const orderIndex = orders.findIndex(o => o.id === req.params.id);

  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const newMsg = {
    sender: sender || 'customer',
    senderName: senderName || 'User',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    text: text || ''
  };

  orders[orderIndex].messages = [...(orders[orderIndex].messages || []), newMsg];
  await writeData(ORDERS_FILE, orders);

  res.json({ message: 'Message sent', order: orders[orderIndex] });
});

if (process.env.SERVE_FRONTEND === 'true') {
  serveFrontend(app, path.resolve(__dirname, '../client/dist'));
}

app.use((error, _req, res, _next) => {
  const status = error.status === 413 ? 413 : error.type === 'entity.parse.failed' ? 400 : 500;
  res.status(status).json({ error: status === 413 ? 'Request body exceeds 10 MB.' : status === 400 ? 'Invalid JSON request.' : 'The request could not be completed.' });
});

app.listen(PORT, process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1'), () => {
  console.log(`🧵 ThreadLabs Backend listening on port ${PORT}`);
});
