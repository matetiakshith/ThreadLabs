import { decodeImage } from './imageGenerationService.js';
import { randomUUID } from 'node:crypto';
export const storageConfigured = env => !!(env.OBJECT_STORAGE_URL && env.OBJECT_STORAGE_KEY && env.OBJECT_STORAGE_BUCKET);
export class PrivateStorage {
  constructor(env = process.env, fetchImpl = fetch) { this.env=env; this.fetch=fetchImpl; }
  url(key) {
    if (!storageConfigured(this.env)) throw Object.assign(new Error('Private image storage is not configured.'),{status:503});
    const base = new URL(this.env.OBJECT_STORAGE_URL);
    if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash || !/^[a-z0-9-]+$/.test(this.env.OBJECT_STORAGE_BUCKET)) throw Object.assign(new Error('Private storage configuration is invalid.'),{status:503});
    return `${base.origin}/storage/v1/object/${this.env.OBJECT_STORAGE_BUCKET}/${key.split('/').map(encodeURIComponent).join('/')}`;
  }
  headers() { return { Authorization:`Bearer ${this.env.OBJECT_STORAGE_KEY}`,apikey:this.env.OBJECT_STORAGE_KEY }; }
  async ensurePrivateBucket() {
    if(this.privateUntil>Date.now())return;
    const objectURL=new URL(this.url('configuration-check'));
    const url=`${objectURL.origin}/storage/v1/bucket/${this.env.OBJECT_STORAGE_BUCKET}`;
    const response=await this.fetch(url,{redirect:'error',signal:AbortSignal.timeout(15000),headers:this.headers()});
    if(!response.ok)throw Object.assign(new Error('The private storage bucket is unavailable.'),{status:503});
    const bucket=await response.json();
    if(bucket.public!==false)throw Object.assign(new Error('Image storage must use a private bucket. Public uploads are disabled.'),{status:503});
    this.privateUntil=Date.now()+60000;
  }
  async put(user, dataUrl, store) {
    await this.ensurePrivateBucket();
    const clean = await decodeImage(dataUrl);
    const bytes=Buffer.from(clean.split(',')[1],'base64');
    const id=randomUUID(), key=`${user.id}/${id}.png`;
    const response=await this.fetch(this.url(key),{method:'POST',redirect:'error',signal:AbortSignal.timeout(30000),headers:{...this.headers(),'Content-Type':'image/png','x-upsert':'false'},body:bytes});
    if (!response.ok) throw Object.assign(new Error('The image could not be stored. Check the private bucket and storage permissions.'),{status:502});
    try { await store.saveMedia(user,id,key); }
    catch (error) { await this.remove(key).catch(()=>{}); throw error; }
    return id;
  }
  async remove(key) { return this.fetch(this.url(key),{method:'DELETE',redirect:'error',signal:AbortSignal.timeout(30000),headers:this.headers()}); }
  async get(key) {
    await this.ensurePrivateBucket();
    const response=await this.fetch(this.url(key),{redirect:'error',signal:AbortSignal.timeout(30000),headers:this.headers()});
    if (!response.ok) throw Object.assign(new Error('The saved image is unavailable.'),{status:502});
    const chunks=[]; let size=0;
    for await (const chunk of response.body) { size+=chunk.length; if(size>4*1024*1024) throw Object.assign(new Error('Saved image exceeds the size limit.'),{status:502}); chunks.push(Buffer.from(chunk)); }
    return Buffer.concat(chunks);
  }
}
