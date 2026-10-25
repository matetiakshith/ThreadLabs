/**
 * ThreadLabs API Client
 */

const API_BASE = import.meta.env?.VITE_API_BASE || '/api';

export class WorkspaceRequestError extends Error {
  constructor(message, status = 0, code = 'API_ERROR') {
    super(message); this.name = 'WorkspaceRequestError'; this.status = status; this.code = code;
  }
}
async function accountRequest(endpoint, { method = 'GET', body, signal } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      method, credentials: 'include', signal,
      ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new WorkspaceRequestError('Cannot reach the ThreadLabs API. Check the backend connection and try again.', 0, 'NETWORK_ERROR');
  }
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    const fallback = [502, 503, 504].includes(response.status)
      ? `The ThreadLabs API is unavailable (HTTP ${response.status}). Check the backend connection and try again.`
      : `The workspace request failed (HTTP ${response.status}).`;
    throw new WorkspaceRequestError(typeof result?.error === 'string' ? result.error : fallback,
      response.status, typeof result?.code === 'string' ? result.code : 'HTTP_ERROR');
  }
  if (result === null || typeof result !== 'object') {
    throw new WorkspaceRequestError('The workspace API returned an invalid response. Check the API endpoint configuration.', response.status, 'INVALID_RESPONSE');
  }
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

export const registerAccount = body => accountRequest('/auth/register', {method:'POST',body});
export const forgotPassword = identity => accountRequest('/auth/forgot-password',{method:'POST',body:{identity}});
export const resetPassword = body => accountRequest('/auth/reset-password',{method:'POST',body});
export const fetchProfile = () => accountRequest('/profile/me');
export const saveProfile = body => accountRequest('/profile/me',{method:'PATCH',body});
export const addPortfolio = body => accountRequest('/profile/portfolio',{method:'POST',body});
export const editPortfolio = (id,body) => accountRequest(`/profile/portfolio/${encodeURIComponent(id)}`,{method:'PATCH',body});
export const removePortfolio = id => accountRequest(`/profile/portfolio/${encodeURIComponent(id)}`,{method:'DELETE'});
export const mediaURL = (id,download=false) => `${API_BASE}/media/${encodeURIComponent(id)}${download?'?download=1':''}`;
export const fetchDesigns = options => accountRequest('/designs',options);
export const fetchDesign = (id,options) => accountRequest(`/designs/${encodeURIComponent(id)}`,options);
export const createDesign = (body,options={}) => accountRequest('/designs',{method:'POST',body,...options});
export const generateDesignView = (id,viewId,options={}) => accountRequest(`/designs/${encodeURIComponent(id)}/views/${encodeURIComponent(viewId)}`,{method:'POST',body:{},...options});
export const askBeatle = (body,options={}) => accountRequest('/beatle/reply',{method:'POST',body,...options});
export const fetchBeatleCapabilities = () => accountRequest('/beatle/capabilities');
export const fetchConversation = () => accountRequest('/beatle/conversation');
export const clearConversation = () => accountRequest('/beatle/conversation',{method:'DELETE'});

export const fetchRegisteredArtisans = options => accountRequest('/artisan-directory', options);

export const fetchAssignedDesign = (id,options) => accountRequest(`/commissions/${encodeURIComponent(id)}/design`,options);
