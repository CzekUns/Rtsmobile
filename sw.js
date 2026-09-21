const CACHE='terra-italica-v45';
const ASSETS=[
  './','./index.html','./app.css','./game.js','./logistics.js','./livestock.js','./persistence.js','./boot.js','./community.js','./population.js','./equipment.js','./character.js','./skills.js','./construction-knowledge.js','./touch-modifier.js','./p16-render.js','./asset-render.js','./manifest.webmanifest',
  './assets/p16/units/unit_human_p16.png','./assets/p16/units/unit_raider_p16.png',
  './assets/p16/animals/animal_sheep_p16.png','./assets/p16/animals/animal_wolf_p16.png',
  './assets/p16/resources/resource_tree_p16.png','./assets/p16/resources/resource_stone_p16.png',
  './assets/p16/resources/resource_iron_p16.png','./assets/p16/resources/resource_berry_p16.png',
  './assets/p16/buildings/building_house_p16.png','./assets/p16/buildings/building_farm_p16.png',
  './assets/p16/buildings/building_warehouse_p16.png','./assets/p16/buildings/building_tower_p16.png',
  './assets/p16/buildings/building_palisade_p16.png'
];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{const clone=r.clone();caches.open(CACHE).then(c=>c.put(e.request,clone));return r}).catch(()=>caches.match(e.request,{ignoreSearch:true}))) });
