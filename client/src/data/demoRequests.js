const shared = {
  artisanId: 'art-001',
  artisanName: 'Ustad Rahimuddin Ansari',
  artisanState: 'Uttar Pradesh',
  artisanRating: 4.95,
  artisanLocation: 'Varanasi, Uttar Pradesh',
  artisanAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
  deliveryMode: 'delivery',
  deliveryFee: 120,
  baseCost: 4200,
  totalCost: 4320,
  estimatedCompletion: '8–12 days',
  lengthRequirement: '42 in',
  style: 'Heritage formal',
  fit: 'Tailored',
  occasion: 'Wedding',
  estimatedCost: '₹3,800 – ₹5,200',
  garments: [{ name: 'Embroidered Sherwani', fabric: 'Raw silk', color: 'Ivory and antique gold' }],
  userPrompt: 'A hand-finished sherwani with subtle gold embroidery and a clean, structured fit.',
};

const examples = [
  ['TL-DEMO-104', 'Aarav Mehta', 'Request Placed', 0, 'Ivory Zardozi Sherwani'],
  ['TL-DEMO-103', 'Mira Kapoor', 'Artisan Accepted', 1, 'Rose Silk Anarkali'],
  ['TL-DEMO-102', 'Kabir Shah', 'Measurements Confirmed', 2, 'Midnight Blue Achkan'],
  ['TL-DEMO-101', 'Ananya Rao', 'Cutting', 4, 'Antique Gold Lehenga'],
  ['TL-DEMO-100', 'Ishaan Verma', 'Stitching & Assembly', 5, 'Indigo Brocade Jacket'],
  ['TL-DEMO-099', 'Diya Sen', 'Quality & Steam Press', 6, 'Ivory Zari Kurta Set'],
  ['TL-DEMO-098', 'Rohan Das', 'Out for Delivery', 7, 'Bespoke Wedding Sherwani'],
  ['TL-DEMO-097', 'Sana Khan', 'Delivered', 8, 'Rose Gold Celebration Set'],
];

export const demoRequests = examples.map(([orderId, customerName, status, currentStageIndex, garmentTitle], index) => ({
  ...shared,
  isDemo: true,
  orderId,
  customerName,
  status,
  currentStageIndex,
  garmentTitle,
  createdAt: new Date(Date.now() - index * 45 * 60 * 1000).toISOString(),
  deliveryStatus: currentStageIndex >= 7 ? (currentStageIndex === 8 ? 'delivered' : 'in_transit') : 'awaiting_pickup',
}));
