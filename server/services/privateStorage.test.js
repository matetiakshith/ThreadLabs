import test from 'node:test';
import assert from 'node:assert/strict';
import { PrivateStorage } from './privateStorage.js';

for (const [label,key,bearer] of [
  ['modern secret key','sb_secret_fixture_not_a_real_key',false],
  ['legacy service-role JWT','fixture-legacy-jwt',true],
]) {
  test(`private storage authenticates ${label} using the correct headers`, async () => {
    const env={OBJECT_STORAGE_URL:'https://fixture.supabase.co',OBJECT_STORAGE_BUCKET:'threadlabs-private',OBJECT_STORAGE_KEY:key};
    const requests=[];
    const storage=new PrivateStorage(env, async(url,options)=>{
      requests.push({url,options});
      assert.equal(options.headers.apikey,key);
      assert.equal(options.headers.Authorization,bearer?`Bearer ${key}`:undefined);
      assert.ok(!url.includes(key));
      return url.includes('/bucket/')?Response.json({public:false}):new Response(new Uint8Array([1,2,3]));
    });
    assert.deepEqual(await storage.get('account-id/photo.png'),Buffer.from([1,2,3]));
    assert.equal(requests.length,2);
    assert.equal(requests[1].url,'https://fixture.supabase.co/storage/v1/object/threadlabs-private/account-id/photo.png');
  });
}
