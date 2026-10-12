import { InferenceClient } from '@huggingface/inference';
import sharp from 'sharp';
import { generateFalImage } from './huggingFaceFal.js';
export const EXISTING_IMAGE_MODEL = 'houseofboern/realism-nano-banana-qwen-image-2.1-lokr';
export const DEFAULT_IMAGE_MODEL = 'Qwen/Qwen-Image';
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export class ImageGenerationError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}
const fail = (status, code, message) => { throw new ImageGenerationError(status, code, message); };

// Configuration is operator-owned. A Hub adapter name is not a hosted API.
export function imageConfiguration(env = process.env) {
  if ((env.HF_IMAGE_MODE || 'providers') === 'providers') {
    const model = env.HF_IMAGE_MODEL || DEFAULT_IMAGE_MODEL;
    const provider = env.HF_IMAGE_PROVIDER || 'fal-ai';
    const editModel = env.HF_IMAGE_EDIT_MODEL === 'none' ? null : env.HF_IMAGE_EDIT_MODEL || 'Qwen/Qwen-Image-Edit';
    const editProvider = env.HF_IMAGE_EDIT_PROVIDER || provider;
    return { mode: 'providers', provider: `Hugging Face / ${provider}`, model, editModel, editProvider,
      configured: !!env.HF_TOKEN, supportsText: model !== EXISTING_IMAGE_MODEL,
      // Only fal's inline image payload has been reviewed. Other editing
      // providers may require a public file upload, so they are not enabled.
      supportsReference: !!editModel && editProvider === 'fal-ai' && editModel !== EXISTING_IMAGE_MODEL,
      supportsSeed: provider === 'fal-ai',
      reason: !env.HF_TOKEN ? 'Add HF_TOKEN with Inference Providers permission to server/.env, enable Hugging Face billing/credits, then restart the backend.' : model === EXISTING_IMAGE_MODEL ? 'The chosen LoKR adapter is not hosted by an Inference Provider. Use a supported text-to-image model or configure your future dedicated deployment.' : null,
    };
  }
  const model = env.HF_IMAGE_MODEL || EXISTING_IMAGE_MODEL;
  const configured = !!env.HF_TOKEN && !!env.HF_IMAGE_ENDPOINT;
  return {
    mode: 'dedicated', provider: 'Hugging Face / dedicated endpoint', model, configured,
    supportsText: env.HF_IMAGE_SUPPORTS_TEXT === 'true',
    supportsReference: env.HF_IMAGE_SUPPORTS_REFERENCE === 'true',
    supportsSeed: env.HF_IMAGE_SUPPORTS_SEED === 'true',
    reason: !env.HF_TOKEN ? 'Add HF_TOKEN and a deployed HF_IMAGE_ENDPOINT to server/.env.'
      : !env.HF_IMAGE_ENDPOINT ? 'Set HF_IMAGE_ENDPOINT to your private deployed Hugging Face endpoint. A model repository URL cannot generate images.'
        : env.HF_IMAGE_SUPPORTS_TEXT !== 'true' ? 'This deployment has not been configured for text-to-image generation. The existing realism adapter edits images; it is not a standalone garment generator.' : null,
  };
}

export function validateImage(dataUrl) {
  if (typeof dataUrl !== 'string') fail(400, 'INVALID_IMAGE', 'Use a PNG, JPEG or WebP reference image.');
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
  if (!match || match[2].length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4) fail(400, 'INVALID_IMAGE', 'Use a PNG, JPEG or WebP image smaller than 4 MB.');
  const bytes = Buffer.from(match[2], 'base64');
  const mime = match[1];
  const valid = mime === 'image/png' ? bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && bytes.toString('ascii',12,16) === 'IHDR'
    : mime === 'image/jpeg' ? bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      : bytes.length >= 20 && bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP';
  if (!valid || bytes.length > MAX_IMAGE_BYTES) fail(400, 'INVALID_IMAGE', 'The image content does not match its PNG, JPEG or WebP format.');
  if (mime === 'image/png' && (bytes.readUInt32BE(16) < 1 || bytes.readUInt32BE(20) < 1 || bytes.readUInt32BE(16) * bytes.readUInt32BE(20) > 20_000_000)) fail(400, 'INVALID_IMAGE', 'The reference image must be smaller than 20 megapixels.');
  return { dataUrl, mime, bytes };
}

export function validateImageRequest(body = {}) {
  if (typeof body.prompt !== 'string' || !body.prompt.trim() || body.prompt.length > 6000) fail(400, 'INVALID_PROMPT', 'Describe your garment using 1–6,000 characters.');
  const image = body.imageDataUrl ? validateImage(body.imageDataUrl).dataUrl : undefined;
  if (body.seed !== undefined && (!Number.isSafeInteger(body.seed) || body.seed < 0 || body.seed > 2147483647)) fail(400, 'INVALID_SEED', 'Use a whole-number seed between 0 and 2147483647.');
  // Deliberately whitelist fields: body measurements, customer identifiers and
  // arbitrary provider parameters never leave this server in an image request.
  return { prompt: body.prompt.trim(), imageDataUrl: image, seed: body.seed };
}

export async function decodeImage(dataUrl) {
  const input = validateImage(dataUrl);
  try {
    const bytes = await sharp(input.bytes, { limitInputPixels: 20_000_000, failOn: 'warning' }).rotate().png().toBuffer();
    if (bytes.length > MAX_IMAGE_BYTES) fail(400, 'INVALID_IMAGE', 'The decoded image exceeds 4 MB. Use a smaller image.');
    return `data:image/png;base64,${bytes.toString('base64')}`;
  } catch (error) {
    if (error instanceof ImageGenerationError) throw error;
    fail(400, 'INVALID_IMAGE', 'The reference image is damaged, incomplete or too large to decode. Choose a valid PNG, JPEG or WebP.');
  }
}

export function garmentImagePrompt(prompt, hasReference = false) {
  return `Create a garment design presentation from the following exact customer brief. Preserve every stated garment, colour, material, fit, texture, print, embroidery, distressing and placement. Do not substitute a different style or invent additional garments. Show front and back views side by side when a back detail is requested; otherwise show the whole garment clearly. Use neutral studio lighting so construction and fabric remain legible. ${hasReference ? 'Use the supplied image as a direct visual reference, retaining its silhouette and details except where the brief requests changes.' : ''}\n\nCUSTOMER BRIEF (authoritative):\n${prompt}\n\nThis is a visual concept, not a body-sizing simulation.`;
}

function endpointURL(env) {
  let url;
  try { url = new URL(env.HF_IMAGE_ENDPOINT); } catch { fail(503, 'INVALID_CONFIGURATION', 'HF_IMAGE_ENDPOINT must be a deployed private Hugging Face endpoint URL.'); }
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.endpoints.huggingface.cloud') || url.username || url.password || url.search || url.hash) fail(503, 'INVALID_CONFIGURATION', 'Use an HTTPS Hugging Face dedicated endpoint (*.endpoints.huggingface.cloud), without credentials in the URL.');
  return url;
}

async function generateDedicatedImage(body, { env = process.env, fetchImpl = fetch, signal, timeoutMs = 120000 } = {}) {
  const request = validateImageRequest(body);
  const config = imageConfiguration(env);
  if (!config.configured) fail(503, 'GENERATION_NOT_CONFIGURED', config.reason);
  if (request.imageDataUrl && !config.supportsReference) fail(422, 'REFERENCE_UNSUPPORTED', 'This deployment does not support image conditioning. Your sketch/reference has not been sent or discarded. Configure a compatible image-editing endpoint, or explicitly remove the reference.');
  if (!request.imageDataUrl && !config.supportsText) fail(422, 'TEXT_UNSUPPORTED', config.reason);
  if (request.seed !== undefined && !config.supportsSeed) fail(422, 'SEED_UNSUPPORTED', 'This deployment does not support a seed. Remove the seed to continue.');
  const endpoint = endpointURL(env);
  if (request.imageDataUrl) request.imageDataUrl = await decodeImage(request.imageDataUrl);
  const prompt = garmentImagePrompt(request.prompt, !!request.imageDataUrl);
  const payload = { inputs: request.imageDataUrl ? { prompt, image: request.imageDataUrl } : prompt };
  if (request.seed !== undefined) payload.parameters = { seed: request.seed };
  const timeout = AbortSignal.timeout(timeoutMs);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
  try {
    const response = await fetchImpl(endpoint, { method: 'POST', redirect: 'error', signal: combined, headers: { Authorization: `Bearer ${env.HF_TOKEN}`, 'Content-Type': 'application/json', Accept: 'image/png, image/jpeg, image/webp, application/json' }, body: JSON.stringify(payload) });
    if (!response.ok) {
      const messages = {
        401: ['PROVIDER_AUTH', 'Hugging Face rejected the server token. Check its inference permissions.'],
        403: ['PROVIDER_ACCESS', 'Hugging Face denied access to this endpoint or model. Check token permissions and model access.'],
        402: ['PROVIDER_CREDITS', 'Hugging Face requires billing or additional credits before generation can continue.'],
        429: ['PROVIDER_RATE_LIMIT', 'Hugging Face is rate limiting requests. Wait before trying again.'],
        404: ['PROVIDER_UNAVAILABLE', 'The configured image deployment was not found. Check HF_IMAGE_ENDPOINT.'],
        503: ['PROVIDER_UNAVAILABLE', 'The image deployment is unavailable or starting. Please try again shortly.'],
        422: ['PROVIDER_INPUT', 'The deployment rejected this input. Confirm its text/reference payload contract.'],
      };
      const [code, message] = messages[response.status] || ['PROVIDER_FAILURE', 'The image deployment failed to generate this garment. Try again or check the deployment.'];
      fail(response.status === 429 ? 429 : 502, code, message);
    }
    // Bound response memory even when a provider omits Content-Length.
    const chunks = []; let total = 0;
    for await (const chunk of response.body || []) {
      total += chunk.length;
      if (total > 6 * 1024 * 1024) { await response.body?.cancel?.().catch(() => {}); fail(502, 'INVALID_OUTPUT', 'The image response is too large. Configure a smaller output size.'); }
      chunks.push(Buffer.from(chunk));
    }
    const bytes = Buffer.concat(chunks);
    if (!bytes.length) fail(502, 'EMPTY_OUTPUT', 'The provider returned no image. Please try again.');
    const contentType = (response.headers.get('content-type') || '').split(';')[0].trim();
    let imageDataUrl;
    if (contentType === 'application/json') {
      let output;
      try { output = JSON.parse(bytes.toString('utf8')); } catch { fail(502, 'INVALID_OUTPUT', 'The provider returned invalid JSON instead of an image.'); }
      imageDataUrl = output.imageDataUrl || output.image || (output[0]?.b64_json ? `data:image/png;base64,${output[0].b64_json}` : null);
    } else if (['image/png','image/jpeg','image/webp'].includes(contentType)) imageDataUrl = `data:${contentType};base64,${bytes.toString('base64')}`;
    if (!imageDataUrl) fail(502, 'INVALID_OUTPUT', 'The provider response contains no supported image. No placeholder has been substituted.');
    try { imageDataUrl = await decodeImage(imageDataUrl); } catch { fail(502, 'INVALID_OUTPUT', 'The provider returned an invalid image. No placeholder has been substituted.'); }
    return { imageDataUrl, model: config.model, provider: config.provider, ...(request.seed !== undefined ? { seed: request.seed } : {}) };
  } catch (error) {
    if (error instanceof ImageGenerationError) throw error;
    if (timeout.aborted) fail(504, 'PROVIDER_TIMEOUT', 'Image generation took longer than two minutes. Try again shortly.');
    if (signal?.aborted) fail(499, 'CANCELLED', 'Image generation was cancelled.');
    fail(502, 'PROVIDER_CONNECTION', 'Cannot reach the configured Hugging Face image deployment. Check its availability.');
  }
}

export async function generateGarmentImage(body, { env = process.env, fetchImpl = fetch, clientFactory = token => new InferenceClient(token), signal, timeoutMs = 120000 } = {}) {
  if ((env.HF_IMAGE_MODE || 'providers') === 'dedicated') return generateDedicatedImage(body, { env, fetchImpl, signal, timeoutMs });
  if (env.HF_IMAGE_MODE && env.HF_IMAGE_MODE !== 'providers') fail(503, 'INVALID_CONFIGURATION', 'HF_IMAGE_MODE must be providers or dedicated.');
  const request = validateImageRequest(body);
  const config = imageConfiguration(env);
  if (!config.configured) fail(503, 'GENERATION_NOT_CONFIGURED', config.reason);
  if (!request.imageDataUrl && !config.supportsText) fail(422, 'TEXT_UNSUPPORTED', config.reason);
  if (request.imageDataUrl && !config.supportsReference) fail(422, 'REFERENCE_UNSUPPORTED', 'The configured editing model/provider does not support private inline references. Your image has not been sent or discarded. Configure Qwen/Qwen-Image-Edit with fal-ai, or explicitly remove the reference.');
  if (request.seed !== undefined && !config.supportsSeed) fail(422, 'SEED_UNSUPPORTED', 'This provider has not been configured for seeds. Remove the seed to continue.');
  const timeout = AbortSignal.timeout(timeoutMs);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
  try {
    const prompt = garmentImagePrompt(request.prompt, !!request.imageDataUrl);
    const parameters = request.seed !== undefined ? { seed: request.seed } : {};
    const options = { signal: combined, fetch: fetchImpl, retry_on_error: false };
    let image, model, provider, imageDataUrl;
    if (request.imageDataUrl) request.imageDataUrl = await decodeImage(request.imageDataUrl);
    model = request.imageDataUrl ? config.editModel : config.model;
    provider = request.imageDataUrl ? config.editProvider : env.HF_IMAGE_PROVIDER || 'fal-ai';
    if (provider === 'fal-ai') {
      imageDataUrl = await generateFalImage({ model, prompt, imageDataUrl: request.imageDataUrl, seed: request.seed, token: env.HF_TOKEN, signal: combined, fetchImpl });
    } else {
      const client = clientFactory(env.HF_TOKEN);
      image = await client.textToImage({ model, provider, inputs: prompt, parameters }, options);
    }
    if (!imageDataUrl) {
      if (!(image instanceof Blob) || !image.size) fail(502, 'EMPTY_OUTPUT', 'The image provider returned no image. No placeholder has been substituted.');
      if (image.size > MAX_IMAGE_BYTES) fail(502, 'INVALID_OUTPUT', 'The provider image is too large. Configure a smaller output resolution.');
      imageDataUrl = `data:${image.type.split(';')[0]};base64,${Buffer.from(await image.arrayBuffer()).toString('base64')}`;
    }
    try { imageDataUrl = await decodeImage(imageDataUrl); } catch { fail(502, 'INVALID_OUTPUT', 'The provider returned an invalid PNG, JPEG or WebP image. No placeholder has been substituted.'); }
    return { imageDataUrl, model, provider: `Hugging Face / ${provider}`, ...(request.seed !== undefined ? { seed: request.seed } : {}) };
  } catch (error) {
    if (error instanceof ImageGenerationError) throw error;
    if (timeout.aborted) fail(504, 'PROVIDER_TIMEOUT', 'Image generation took longer than two minutes. Please try again shortly.');
    if (signal?.aborted) fail(499, 'CANCELLED', 'Image generation was cancelled.');
    const status = error.httpResponse?.status;
    const messages = {
      401: ['PROVIDER_AUTH', 'Hugging Face rejected the server token. Check its Inference Providers permission.'],
      403: ['PROVIDER_ACCESS', 'Hugging Face denied model/provider access. Check token permissions and model access.'],
      402: ['PROVIDER_CREDITS', 'Hugging Face requires billing or additional credits to generate this image.'],
      429: ['PROVIDER_RATE_LIMIT', 'The image provider is rate limiting requests. Wait before trying again.'],
      404: ['PROVIDER_UNAVAILABLE', 'The configured model is unavailable from this inference provider. Check the model/provider combination.'],
      503: ['PROVIDER_UNAVAILABLE', 'The image provider is unavailable. Please try again shortly.'],
      422: ['PROVIDER_INPUT', 'The provider rejected this image request. Check the configured model and its supported inputs.'],
    };
    if (status) { const [code, message] = messages[status] || ['PROVIDER_FAILURE', 'The image provider could not complete this garment. Please try again.']; fail(status === 429 ? 429 : 502, code, message); }
    if (['InputError','RoutingError'].includes(error.name)) fail(422, 'MODEL_UNSUPPORTED', 'This model is not available for the requested task through the configured Hugging Face provider. Update the server model/provider settings.');
    if (error.name === 'ProviderOutputError') fail(502, 'INVALID_OUTPUT', 'The provider returned an invalid image response. No placeholder has been substituted.');
    if (error.name === 'ProviderEmptyOutput') fail(502, 'EMPTY_OUTPUT', 'The provider returned no garment image. Please try again.');
    if (error.name === 'ProviderBlockedOutput') fail(422, 'PROVIDER_BLOCKED', 'The image provider declined this output. Revise your garment brief and try again.');
    fail(502, 'PROVIDER_CONNECTION', 'Cannot reach Hugging Face Inference Providers. Check the connection and provider availability.');
  }
}
