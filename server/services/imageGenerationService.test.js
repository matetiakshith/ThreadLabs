import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { generateGarmentImage, validateImageRequest, decodeImage, imageConfiguration, EXISTING_IMAGE_MODEL } from './imageGenerationService.js';
import { generateFalImage } from './huggingFaceFal.js';
const env = { HF_TOKEN: 'test-only-not-a-credential' };
const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#ffffff' } }).png().toBuffer();
const fixture = `data:image/png;base64,${png.toString('base64')}`;
const metadata = (model, edit=false) => ({ id: model, inferenceProviderMapping: { 'fal-ai': { status: 'live', task: edit ? 'image-to-image' : 'text-to-image', providerId: edit ? 'fal-ai/qwen-image-edit' : 'fal-ai/qwen-image' } } });
function falFetch(calls, { status=200, output={images:[{url:fixture}]} }={}) {
  return async (url, options={}) => {
    calls.push({ url:String(url), ...options });
    if (String(url).includes('/api/models/')) return Response.json(metadata(url.includes('Image-Edit') ? 'Qwen/Qwen-Image-Edit' : 'Qwen/Qwen-Image',url.includes('Image-Edit')));
    return status===200 ? Response.json(output) : Response.json({error:'Secret upstream debug message'}, {status});
  };
}

test('three required briefs reach the hosted provider verbatim; private output and no body data', async()=>{
  for (const prompt of ['A white linen shirt with a mandarin collar.', 'An oversized black hoodie with red embroidery, distressed sleeves and a big back graphic.', 'An Indian ivory kurta with gold embroidery and a contemporary silhouette.']) {
    const calls=[];
    const result = await generateGarmentImage({prompt,measurements:{chest:97},customerEmail:'private@example.com'}, {env,fetchImpl:falFetch(calls)});
    const request = calls.find(call=>call.method==='POST');
    const payload = JSON.parse(request.body);
    assert.ok(payload.prompt.includes(prompt));
    assert.equal(payload.sync_mode,true); assert.equal(payload.num_images,1);
    assert.ok(!request.body.includes('private@example.com')); assert.ok(!request.body.includes('"chest"'));
    assert.equal(result.model,'Qwen/Qwen-Image'); assert.match(result.imageDataUrl,/^data:image\/png;base64,/);
  }
});

test('reference/sketch pixels condition the editing model inline; never public uploads', async()=>{
  const calls=[];
  await generateGarmentImage({prompt:'Keep my sketched collar, make the sleeves red.',imageDataUrl:fixture,seed:42},{env,fetchImpl:falFetch(calls)});
  const request=calls.find(call=>call.method==='POST'),payload=JSON.parse(request.body);
  assert.ok(request.url.endsWith('fal-ai/qwen-image-edit'));
  assert.match(payload.image_url,/^data:image\/png;base64,/); assert.equal(payload.seed,42);
  assert.ok(payload.prompt.includes('Keep my sketched collar, make the sleeves red.'));
  assert.equal(calls.filter(call=>call.method==='POST').length,1);
});

test('no token fails before contacting any provider; unsupported adapter does not silently switch',async()=>{
  const fetchImpl=()=>assert.fail('Unexpected network call');
  await assert.rejects(generateGarmentImage({prompt:'white shirt'},{env:{},fetchImpl}),{code:'GENERATION_NOT_CONFIGURED',status:503});
  await assert.rejects(generateGarmentImage({prompt:'white shirt'},{env:{...env,HF_IMAGE_MODEL:EXISTING_IMAGE_MODEL},fetchImpl}),{code:'TEXT_UNSUPPORTED'});
  await assert.rejects(generateGarmentImage({prompt:'white shirt',imageDataUrl:fixture},{env:{...env,HF_IMAGE_EDIT_MODEL:'none'},fetchImpl}),{code:'REFERENCE_UNSUPPORTED'});
  await assert.rejects(generateGarmentImage({prompt:'white shirt',imageDataUrl:fixture},{env:{...env,HF_IMAGE_EDIT_PROVIDER:'replicate'},fetchImpl}),{code:'REFERENCE_UNSUPPORTED'});
});

test('prompt/upload/seed validation rejects damaged, spoofed, oversized and unsupported content', async()=>{
  for (const prompt of ['',null,'x'.repeat(6001)]) assert.throws(()=>validateImageRequest({prompt}),{code:'INVALID_PROMPT'});
  for (const imageDataUrl of ['https://private.example/photo','data:image/svg+xml;base64,PHN2Zz4=', 'data:image/png;base64,dGhpcyBpcyBub3QgYW4gaW1hZ2U=']) assert.throws(()=>validateImageRequest({prompt:'shirt',imageDataUrl}),{code:'INVALID_IMAGE'});
  for(const seed of [-1,1.5,'42',NaN,2147483648]) assert.throws(()=>validateImageRequest({prompt:'shirt',seed}),{code:'INVALID_SEED'});
  await assert.rejects(decodeImage(`data:image/png;base64,${png.subarray(0,24).toString('base64')}`),{code:'INVALID_IMAGE'});
  assert.throws(()=>validateImageRequest({prompt:'shirt',imageDataUrl:`data:image/png;base64,${'A'.repeat(6*1024*1024)}`}),{code:'INVALID_IMAGE'});
});

test('provider authentication, credits, rate limits, missing models and unavailable services have distinct errors',async()=>{
  for (const [status,code] of [[401,'PROVIDER_AUTH'],[403,'PROVIDER_ACCESS'],[402,'PROVIDER_CREDITS'],[429,'PROVIDER_RATE_LIMIT'],[404,'PROVIDER_UNAVAILABLE'],[503,'PROVIDER_UNAVAILABLE'],[422,'PROVIDER_INPUT'],[500,'PROVIDER_FAILURE']]) {
    await assert.rejects(generateGarmentImage({prompt:'shirt'},{env,fetchImpl:falFetch([],{status})}),error=>error.code===code&&!error.message.includes('Secret upstream'));
  }
});

test('empty, invalid, blocked or public URL outputs never become a successful garment image',async()=>{
  for(const output of [{},{images:[]},{images:[{url:'https://fal.media/public.png'}]},{images:[{url:'data:image/png;base64,AAAA'}]},{images:[{url:fixture}],has_nsfw_concepts:[true]}]) {
    await assert.rejects(generateGarmentImage({prompt:'shirt'},{env,fetchImpl:falFetch([],{output})}),error=>['INVALID_OUTPUT','EMPTY_OUTPUT','PROVIDER_BLOCKED'].includes(error.code));
  }
});

test('timeout and cancellation terminate provider work without exposing upstream errors',async()=>{
  const blockedFetch=(_url,{signal})=>new Promise((_resolve,reject)=>{
    if(signal.aborted) reject(signal.reason); else signal.addEventListener('abort',()=>reject(signal.reason),{once:true});
  });
  const keepAlive=setTimeout(()=>{},1000);
  await assert.rejects(generateGarmentImage({prompt:'shirt'},{env,fetchImpl:blockedFetch,timeoutMs:10}),{code:'PROVIDER_TIMEOUT'});
  const controller=new AbortController(); controller.abort();
  await assert.rejects(generateGarmentImage({prompt:'shirt'},{env,fetchImpl:blockedFetch,signal:controller.signal}),{code:'CANCELLED'});
  clearTimeout(keepAlive);
});

test('future dedicated deployment is explicit and validates endpoint and capabilities',async()=>{
  const dedicated={...env,HF_IMAGE_MODE:'dedicated',HF_IMAGE_ENDPOINT:'https://test.endpoints.huggingface.cloud',HF_IMAGE_SUPPORTS_REFERENCE:'true'};
  assert.equal(imageConfiguration(dedicated).model,EXISTING_IMAGE_MODEL);
  await assert.rejects(generateGarmentImage({prompt:'shirt'},{env:dedicated}),{code:'TEXT_UNSUPPORTED'});
  await assert.rejects(generateGarmentImage({prompt:'shirt',imageDataUrl:fixture},{env:{...dedicated,HF_IMAGE_ENDPOINT:'http://localhost:8080'}}),{code:'INVALID_CONFIGURATION'});
  const calls=[];
  const result=await generateGarmentImage({prompt:'Make the referenced shirt white.',imageDataUrl:fixture},{env:dedicated,fetchImpl:async(_url,options)=>{calls.push(JSON.parse(options.body));return new Response(png,{headers:{'content-type':'image/png'}});}});
  assert.match(calls[0].inputs.image,/^data:image\/png/);assert.match(result.imageDataUrl,/^data:image\/png/);
});

test('a live provider mapping is required; unsupported models never spend a generation request',async()=>{
  const calls=[];
  await assert.rejects(generateFalImage({model:'qa/unsupported-model',prompt:'shirt',fetchImpl:async url=>{calls.push(url);return Response.json({inferenceProviderMapping:{}});}}),{name:'InputError'});
  assert.equal(calls.length,1);
});

test('configured alternative HF text providers use the official SDK with original brief and abort signal',async()=>{
  let args,options;
  const result=await generateGarmentImage({prompt:'white shirt'},{env:{...env,HF_IMAGE_PROVIDER:'replicate'},clientFactory:()=>({textToImage:async(a,o)=>{args=a;options=o;return new Blob([png],{type:'image/png'});}})});
  assert.equal(args.provider,'replicate');assert.ok(args.inputs.includes('white shirt'));assert.equal(options.retry_on_error,false);assert.ok(options.signal);assert.match(result.provider,/replicate/);
});
