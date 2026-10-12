/**
 * ThreadLabs API Client
 */

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

async function accountRequest(endpoint, { method = 'GET', body, signal } = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method, credentials: 'include', signal,
    ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'The workspace request failed.');
  return result;
}
export const signIn = body => accountRequest('/auth/login', { method: 'POST', body });
export const registerCustomer = body => accountRequest('/auth/register', { method: 'POST', body });
export const signOut = () => accountRequest('/auth/logout', { method: 'POST' });
export const fetchSession = () => accountRequest('/auth/me');
export const fetchCommissions = options => accountRequest('/commissions', options);
export const submitCommission = body => accountRequest('/commissions', { method: 'POST', body });
export const changeCommissionStage = (id, body) => accountRequest(`/commissions/${encodeURIComponent(id)}/status`, { method: 'PATCH', body });

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

export async function fetchImageCapabilities({ signal } = {}) {
  const res = await fetch(`${API_BASE}/ai/image-capabilities`, { signal });
  if (!res.ok) throw new Error('The image service is unavailable. Start the ThreadLabs backend.');
  return res.json();
}

export async function generateImagePreview(payload, { signal } = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}/ai/generate-image`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Cannot reach the ThreadLabs image service. Check that the backend is running.');
  }
  if (!res.ok) {
    const result = await res.json().catch(() => ({}));
    throw new Error(result.error || (res.status === 413 ? 'The reference is too large. Use an image smaller than 4 MB.' : 'Image generation failed. Please try again.'));
  }
  const result = await res.json();
  if (!/^data:image\/(png|jpeg|webp);base64,/.test(result.imageDataUrl || '')) throw new Error('The image service returned no supported garment image.');
  return result;
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
