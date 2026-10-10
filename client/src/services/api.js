/**
 * ThreadLabs API Client
 */

const API_BASE = 'http://localhost:5000/api';

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return await res.json();
  } catch (err) {
    console.error('API health check failed:', err);
    return null;
  }
}

export async function fetchArtisans(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/artisans?${query}`);
  if (!res.ok) throw new Error('Failed to fetch artisans');
  return await res.json();
}

export async function fetchArtisanById(id) {
  const res = await fetch(`${API_BASE}/artisans/${id}`);
  if (!res.ok) throw new Error('Failed to fetch artisan details');
  return await res.json();
}

export async function addCatalogItem(artisanId, itemData) {
  const res = await fetch(`${API_BASE}/artisans/${artisanId}/catalog`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(itemData),
  });
  if (!res.ok) throw new Error('Failed to add catalog piece');
  return await res.json();
}

export async function parseDesignAI(payload) {
  const res = await fetch(`${API_BASE}/ai/parse-requirements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to parse design with AI');
  return await res.json();
}

export async function matchArtisansAI(techPack) {
  const res = await fetch(`${API_BASE}/ai/match-artisans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ techPack }),
  });
  if (!res.ok) throw new Error('Failed to rank matched artisans');
  return await res.json();
}

export async function fetchOrders(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/orders?${query}`);
  if (!res.ok) throw new Error('Failed to fetch orders');
  return await res.json();
}

export async function createOrder(orderPayload) {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload),
  });
  if (!res.ok) throw new Error('Failed to create custom order');
  return await res.json();
}

export async function updateOrderStatus(orderId, updateData) {
  const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
  });
  if (!res.ok) throw new Error('Failed to update status');
  return await res.json();
}

export async function sendOrderMessage(orderId, msgData) {
  const res = await fetch(`${API_BASE}/orders/${orderId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(msgData),
  });
  if (!res.ok) throw new Error('Failed to send message');
  return await res.json();
}

export async function fetchHeritageCrafts() {
  const res = await fetch(`${API_BASE}/heritage-crafts`);
  if (!res.ok) throw new Error('Failed to fetch heritage crafts');
  return await res.json();
}
