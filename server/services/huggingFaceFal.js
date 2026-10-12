// HF's public provider mapping is authoritative; do not guess a Fal model URL.
// Use Fal's documented sync_mode to return images inline, outside its public
// request history. The official HF SDK currently rejects these data-URL outputs.
const mappingCache = new Map();
export async function generateFalImage({ model, prompt, imageDataUrl, seed, token, signal, fetchImpl = fetch }) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(model)) throw Object.assign(new Error('Invalid model ID'), { name: 'InputError' });
  let mapping = mappingCache.get(model);
  if (!mapping || Date.now() - mapping.time > 300000) {
    const response = await fetchImpl(`https://huggingface.co/api/models/${model}?expand=inferenceProviderMapping`, { signal, redirect: 'error' });
    if (!response.ok) throw Object.assign(new Error('Hub mapping failed'), { httpResponse: { status: response.status } });
    const metadata = await boundedJSON(response, 128000);
    const value = metadata.inferenceProviderMapping?.['fal-ai'];
    if (!value || value.status !== 'live' || !/^[\w./-]+$/.test(value.providerId || '') || value.task !== (imageDataUrl ? 'image-to-image' : 'text-to-image')) throw Object.assign(new Error('Model/task unavailable'), { name: 'InputError' });
    mapping = { ...value, time: Date.now() }; mappingCache.set(model, mapping);
  }
  if (mapping.task !== (imageDataUrl ? 'image-to-image' : 'text-to-image')) throw Object.assign(new Error('Model task mismatch'), { name: 'InputError' });
  const response = await fetchImpl(`https://router.huggingface.co/fal-ai/${mapping.providerId}`, {
    method: 'POST', signal, redirect: 'error',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, ...(imageDataUrl ? { image_url: imageDataUrl } : {}), ...(seed !== undefined ? { seed } : {}), sync_mode: true, num_images: 1, image_size: 'portrait_4_3', output_format: 'png' }),
  });
  if (!response.ok) throw Object.assign(new Error('Inference request failed'), { httpResponse: { status: response.status } });
  const output = await boundedJSON(response, 6 * 1024 * 1024);
  if (output.has_nsfw_concepts?.some(Boolean)) throw Object.assign(new Error('Provider blocked the output'), { name: 'ProviderBlockedOutput' });
  if (Array.isArray(output.images) && !output.images.length) throw Object.assign(new Error('Empty image output'), { name: 'ProviderEmptyOutput' });
  const imageDataUrlOutput = output.images?.[0]?.url;
  if (typeof imageDataUrlOutput !== 'string' || !imageDataUrlOutput.startsWith('data:image/')) throw Object.assign(new Error('Expected inline image output'), { name: 'ProviderOutputError' });
  return imageDataUrlOutput;
}

async function boundedJSON(response, limit) {
  const chunks = []; let total = 0;
  for await (const chunk of response.body || []) {
    total += chunk.length;
    if (total > limit) throw Object.assign(new Error('Response too large'), { name: 'ProviderOutputError' });
    chunks.push(Buffer.from(chunk));
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw Object.assign(new Error('Invalid JSON'), { name: 'ProviderOutputError' }); }
}
