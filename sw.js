const MANIFEST={"version":"e570eef32f380a4463a4","core":["index.html","assets/index-BiVo35wk.css","assets/index-DReBAAi-.js","assets/supabase-D_iOwayF.js"],"media":["assets/pet/initial-poster.webp","assets/pet/initial-rig.webp","assets/pet/happy-rig-v1.webp","assets/pet/sleep-rig-v3.webp","assets/pet/takeoff-rig-v2.webp","assets/pet/hover-rig-v2.webp","assets/expedition/meadow.webp","assets/expedition/forest.webp","assets/expedition/lake.webp","assets/expedition/pressed-flower.webp","assets/expedition/amber-cone.webp","assets/expedition/lake-pebble.webp","assets/editorial/bag-cutout.webp","assets/editorial/bag.webp","assets/editorial/bottle.webp","assets/editorial/cover.webp","assets/editorial/dairy.webp","assets/editorial/empty.webp","assets/editorial/forest.webp","assets/editorial/fruit.webp","assets/editorial/garden.webp","assets/editorial/grain.webp","assets/editorial/hat-cutout.webp","assets/editorial/hat.webp","assets/editorial/kindness.webp","assets/editorial/lake.webp","assets/editorial/meadow.webp","assets/editorial/nuts.webp","assets/editorial/protein.webp","assets/editorial/room.webp","assets/editorial/scarf-cutout.webp","assets/editorial/scarf.webp","assets/editorial/vegetable.webp"]};
/* MANIFEST is injected by build-offline.mjs. Never cache API/auth responses. */
const PREFIX='leeb-static-';
const CACHE=PREFIX+MANIFEST.version;
const base=self.registration.scope;
const url=path=>new URL(path,base).href;
const allowed=new Set([...MANIFEST.core,...MANIFEST.media].map(url));
async function store(path){
 const cache=await caches.open(CACHE),key=url(path);
 if(await cache.match(key))return;
 const response=await fetch(new Request(key,{cache:'reload',signal:AbortSignal.timeout(30000)}));
 if(!response.ok)throw new Error('Offline resource unavailable');
 await cache.put(key,response);
}
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{for(const path of MANIFEST.core)await store(path)})());
 // No skipWaiting: a new release must not replace the resources of open tabs.
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);
  await self.clients.claim();
 })());
});
let warming;
self.addEventListener('message',event=>{
 if(event.data?.type!=='WARM_STATIC')return;
 warming??=(async()=>{for(const path of MANIFEST.media){try{await store(path)}catch{/* Retry on next visit; never claim missing resources are cached. */}}})().finally(()=>{warming=null});
 event.waitUntil(warming);
});
self.addEventListener('fetch',event=>{
 const request=event.request,target=new URL(request.url);
 if(request.method!=='GET'||target.origin!==new URL(base).origin)return;
 const navigation=request.mode==='navigate'&&(target.pathname===new URL(base).pathname||target.pathname===new URL('index.html',base).pathname);
 if(!navigation&&!allowed.has(target.href))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE),key=navigation?url('index.html'):target.href;
  const saved=await cache.match(key);if(saved)return saved;
  // Do not reuse the intercepted image request and its HTTP cache transaction.
  const response=await fetch(new Request(key,{cache:"no-store"}));
  if(response.ok&&!navigation)event.waitUntil(cache.put(key,response.clone()).catch(()=>{}));
  return response;
 })());
});
