// Settlement links, communal construction stock and autonomous artisan commissions.
(() => {
'use strict';
const RANGE=12,EDIBLE=['food','milk','bread','barleyBread'];
const operational=b=>b&&b.alive&&b.built;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pair=(a,b)=>[a.id,b.id].sort().join(':');
window.VER_SACRUM={version:1,linkRange:RANGE,edible:EDIBLE};
const ensure=Game.prototype.ensureInventories;
Game.prototype.ensureInventories=function(){ensure.call(this);const store=this.buildings.find(b=>b.owner===0&&b.type==='warehouse'&&b.alive);if(store)this.stock=store.inventory.items;};
Game.prototype.ensureSettlement=function(){
 this.ensureInventories();
 for(const b of this.buildings){b.linkSettings??={};b.returnDue??={};if(TERRA_RECIPES[b.type]){b.desiredWorkers??=1;b.returnPercent??=75;}}
};
Game.prototype.linkCompatible=function(a,b){if(a===b||a.owner!==b.owner||!operational(a)||!operational(b)||dist(a,b)>RANGE)return false;const types=[a.type,b.type];return types.includes('base')&&types.includes('warehouse')||types.includes('market')&&(types.includes('warehouse')||types.includes('house')||types.some(t=>TERRA_RECIPES[t]))||types.includes('house')&&types.some(t=>TERRA_RECIPES[t]);};
Game.prototype.linkPolicy=function(a,b){const holder=a.id<b.id?a:b;holder.linkSettings??={};return holder.linkSettings[pair(a,b)]??={enabled:true,goods:{}};};
Game.prototype.linkOpen=function(a,b){return this.linkCompatible(a,b)&&this.linkPolicy(a,b).enabled!==false;};
Game.prototype.linkedBuildings=function(b,type){return this.buildings.filter(a=>(!type||a.type===type)&&this.linkOpen(a,b));};
Game.prototype.linkGoodPolicy=function(a,b,good){const p=this.linkPolicy(a,b);p.goods??={};return p.goods[good]??={import:true,export:true,min:good==='planks'?20:0,keep:good==='planks'?20:good==='food'?30:good==='wood'?30:good==='stone'?20:0};};
Game.prototype.communalStores=function(owner=0,anchor=null){return this.buildings.filter(b=>b.type==='warehouse'&&b.owner===owner&&operational(b)&&this.linkedBuildings(b,'base').some(t=>!anchor||t.id===anchor.id));};
Game.prototype.communalStock=function(owner=0){const items={};for(const b of this.communalStores(owner))for(const k of Object.keys(TERRA_GOODS))items[k]=(items[k]||0)+this.available(b,k);return items;};
Game.prototype.canPay=function(cost){this.ensureInventories();if(!cost)return false;const items=this.communalStock();return Object.entries(cost).every(([k,n])=>Number.isSafeInteger(n)&&n>=0&&(items[k]||0)>=n);};
Game.prototype.pay=function(cost){if(!this.canPay(cost))return false;for(const[k,n]of Object.entries(cost)){let left=n;for(const b of this.communalStores()){const used=Math.min(left,this.available(b,k));b.inventory.items[k]=(b.inventory.items[k]||0)-used;left-=used;if(!left)break;}}return true;};
Game.prototype.moveLinkedGoods=function(a,b,good,wanted){const n=Math.max(0,Math.floor(Math.min(wanted,this.available(a,good),this.freeSpace(b))));if(n){a.inventory.items[good]-=n;b.inventory.items[good]=(b.inventory.items[good]||0)+n;}return n;};
Game.prototype.initializeSettlement=function(){
 this.ensureSettlement();
 for(const base of this.buildings.filter(b=>b.type==='base'&&b.alive)){
  base.cityName??=base.factionName||'Ver Sacrum';
  if(base.economyVersion===1&&!Object.values(base.inventory.items).some(n=>n>0))continue;
  let warehouse=this.buildings.find(b=>b.type==='warehouse'&&b.owner===base.owner&&b.alive&&dist(b,base)<=RANGE);
  if(!warehouse){let spot=null;for(let r=1;r<=5&&!spot;r++)for(let dy=-r;dy<=r&&!spot;dy++)for(let dx=-r;dx<=r;dx++){const x=Math.floor(base.x)+dx,y=Math.floor(base.y)+dy;if(this.world.walkable(x,y,1,null,this.buildings)&&!this.buildings.some(b=>b.alive&&Math.floor(b.x)===x&&Math.floor(b.y)===y)){spot={x,y};break;}}if(!spot)continue;warehouse=new Building('warehouse',spot.x,spot.y,base.owner,true);this.buildings.push(warehouse);this.ensureInventories();}
  const old=base.inventory.items;warehouse.inventory.capacity=Math.max(warehouse.inventory.capacity,Object.values(old).reduce((a,b)=>a+b,0)+Object.values(warehouse.inventory.items).reduce((a,b)=>a+b,0));
  for(const[k,n]of Object.entries(old))warehouse.inventory.items[k]=(warehouse.inventory.items[k]||0)+n;base.inventory.items={};base.economyVersion=1;
 }
 this.ensureInventories();
 for(const u of this.units)if(u.task?.type==='caravan'&&!u.task.barter)this.cancelTask(u);
};
const newGame=Game.prototype.newGame;Game.prototype.newGame=function(seed){newGame.call(this,seed);this.initializeSettlement();this.year=800;this.economyTimer=0;this.updateUI();};
const load=Game.prototype.load;Game.prototype.load=function(){const ok=load.call(this);if(ok){this.initializeSettlement();this.economyTimer=0;this.updateUI();}return ok;};
// Opening a site transfers its full material requirement once from linked warehouses.
const place=Game.prototype.placeBuild;Game.prototype.placeBuild=function(type,x,y){const before=new Set(this.buildings.map(b=>b.id));place.call(this,type,x,y);const site=this.buildings.find(b=>!before.has(b.id));if(site&&this.pay(site.requiredMaterials)){site.inventory.items={...site.requiredMaterials};this.message('Materiali assegnati al cantiere dai magazzini collegati al totem.');}};
const nearest=Game.prototype.nearestStorage;Game.prototype.nearestStorage=function(u){this.ensureInventories();return this.buildings.filter(b=>b.owner===u.owner&&b.type==='warehouse'&&operational(b)&&this.freeSpace(b)>0).sort((a,b)=>dist(u,a)-dist(u,b)).find(b=>this.pathToBuilding(u,b)!==null)||null;};
// Food is consumed once per person per 30 days, including artisans.
Game.prototype.foodStoresFor=function(u){
 const factory=u.task?.type==='production'?this.findById(this.buildings,u.task.target):null;
 if(factory)return [factory,...this.linkedBuildings(factory,'market')];
 const home=this.buildings.find(b=>b.id===(u.location.kind==='resident'?u.location.settlementId:u.homeVillageId));
 if(home?.alive)return [home,...this.linkedBuildings(home,'market')];
 // Exiles and directly commanded workers use their communal supplies before a village exists.
 return this.communalStores(u.owner);
};
Game.prototype.takeFood=function(stores,amount){if(stores.reduce((s,b)=>s+EDIBLE.reduce((n,k)=>n+Math.max(0,this.available(b,k)-(b.returnDue?.[k]||0)),0),0)<amount)return false;let left=amount;for(const b of stores)for(const k of EDIBLE){const n=Math.min(left,Math.max(0,this.available(b,k)-(b.returnDue?.[k]||0)));b.inventory.items[k]=(b.inventory.items[k]||0)-n;left-=n;}return true;};
Game.prototype.feedPeople=function(){for(const u of this.units.filter(u=>u.health>0)){if((u.fedUntil??-1)>this.totalDays)continue;u.hungry=!this.takeFood(this.foodStoresFor(u),1);if(!u.hungry)u.fedUntil=this.totalDays+30;}};
Game.prototype.settlementTick=function(){
 this.ensureSettlement();const markets=this.buildings.filter(b=>b.type==='market'&&operational(b));
 for(const m of markets)for(const w of this.linkedBuildings(m,'warehouse')){
  for(const good of Object.keys(TERRA_GOODS)){const p=this.linkGoodPolicy(w,m,good);let n=this.available(w,good);if(p.import&&n<p.min){this.moveLinkedGoods(m,w,good,p.min-n);continue;}if(p.export&&n>p.keep){const due=EDIBLE.includes(good)?this.units.filter(u=>u.owner===w.owner&&u.health>0).length:0;this.moveLinkedGoods(w,m,good,Math.min(12,Math.max(0,n-Math.max(p.keep,due))));}}
 }
 for(const b of this.buildings.filter(b=>operational(b)&&TERRA_RECIPES[b.type])){
  const markets=this.linkedBuildings(b,'market');
  // Finished products carry a precise communal quota, even if a store is temporarily full.
  for(const good of Object.keys(b.returnDue)){
   let due=b.returnDue[good];for(const m of markets)for(const w of this.linkedBuildings(m,'warehouse').filter(w=>this.communalStores(b.owner).includes(w))){if(!this.linkGoodPolicy(w,m,good).import)continue;due-=this.moveLinkedGoods(b,w,good,due);}b.returnDue[good]=Math.max(0,due);
  }
  const outputs=new Set(TERRA_RECIPES[b.type].flatMap(r=>Object.keys(r.outputs)));
  for(const good of outputs)for(const m of markets)this.moveLinkedGoods(b,m,good,Math.max(0,this.available(b,good)-(b.returnDue[good]||0)));
  for(const m of markets){for(const r of TERRA_RECIPES[b.type])for(const[k,n]of Object.entries(r.inputs))this.moveLinkedGoods(m,b,k,Math.max(0,n*2-this.available(b,k)));for(const k of EDIBLE)this.moveLinkedGoods(m,b,k,Math.max(0,b.desiredWorkers-EDIBLE.reduce((n,k)=>n+this.available(b,k),0)));}
  let workers=this.factoryWorkers(b);const extra=workers.filter(u=>u.autoArtisan).slice(Math.max(0,b.desiredWorkers-workers.filter(u=>!u.autoArtisan).length));for(const u of extra){this.cancelTask(u);u.autoArtisan=false;const home=this.findById(this.buildings,u.homeVillageId);if(home?.alive)this.assignEnter(u,home);}
  workers=this.factoryWorkers(b);
  if(workers.length<b.desiredWorkers&&markets.length&&EDIBLE.some(k=>this.available(b,k)>0))for(const home of this.linkedBuildings(b,'house')){
   const u=this.units.find(u=>u.owner===b.owner&&u.health>0&&u.location.kind==='resident'&&u.location.settlementId===home.id&&!u.mobilized);if(!u)continue;
   if(this.pathToBuilding(home,b)===null)continue;
   if(this.releaseResident(u.id,home)){const error=this.assignProduction(u,b);if(!error){u.homeVillageId=home.id;u.autoArtisan=true;}}if(this.factoryWorkers(b).length>=b.desiredWorkers)break;
  }
 }
 this.feedPeople();
};
const update=Game.prototype.update;Game.prototype.update=function(dt){if(this.paused||this.suspended||this.gameEnded)return;this.economyTimer=(this.economyTimer||0)+dt;if(this.economyTimer>=1){this.economyTimer=0;this.settlementTick();}return update.call(this,dt);};
// Intercept recipe progression, preserving other building systems.
const updateBuilding=Game.prototype.updateBuilding;Game.prototype.updateBuilding=function(b,dt){if(!TERRA_RECIPES[b.type])return updateBuilding.call(this,b,dt);if(!operational(b))return;const workers=this.factoryWorkers(b).filter(u=>this.buildingDistance(u,b)<=1.15&&(u.fedUntil??-1)>this.totalDays);if(!workers.length)return;const old=b.batch?{...b.batch,outputs:{...b.batch.outputs}}:null;updateBuilding.call(this,b,dt);if(old&&!b.batch){b.returnDue??={};b.returnRemainder??={};for(const[k,n]of Object.entries(old.outputs)){const exact=n*(b.returnPercent??75)+(b.returnRemainder[k]||0);b.returnDue[k]=(b.returnDue[k]||0)+Math.floor(exact/100);b.returnRemainder[k]=exact%100;}}};
const assignProduction=Game.prototype.assignProduction;Game.prototype.assignProduction=function(u,b){const error=assignProduction.call(this,u,b);if(!error){u.autoArtisan=false;b.desiredWorkers=Math.max(b.desiredWorkers||0,this.factoryWorkers(b).length);}return error;};
// Remove manufactured goods from the build pool unless returned to a connected store.
BUILD_COSTS.tower={wood:8,planks:6,stone:8};
TERRA_CONSTRUCTION.requirements.sawmill=['insediamento'];
Game.prototype.openLinks=function(b=this.selected){this.ensureSettlement();this.linkFocus=b instanceof Building?b.id:this.buildings.find(b=>b.owner===0)?.id;this.pauseBeforeLinks=this.paused;this.pointerCancel();this.renderLinks();this.showManagement('linksDialog');};
Game.prototype.renderLinks=function(){const own=this.buildings.filter(b=>b.owner===0&&b.alive),select=$('#linkBuilding');select.innerHTML=own.map(b=>`<option value="${b.id}">${BUILD_LABEL[b.type]} (${Math.floor(b.x)},${Math.floor(b.y)})</option>`).join('');select.value=own.some(b=>b.id===this.linkFocus)?this.linkFocus:own[0]?.id||'';const b=own.find(b=>b.id===select.value);if(!b)return;this.linkFocus=b.id;$('#cityForm').hidden=b.type!=='base';$('#cityName').value=b.cityName||'';const linked=own.filter(a=>this.linkCompatible(a,b)),list=$('#linkPair');list.innerHTML=linked.map(a=>`<option value="${a.id}">${BUILD_LABEL[a.type]} (${Math.floor(a.x)},${Math.floor(a.y)})</option>`).join('');list.value=linked[0]?.id||'';$('#linksList').textContent=linked.length?linked.map(a=>`${BUILD_LABEL[a.type]}: ${this.linkOpen(a,b)?'aperto':'chiuso'}`).join(' · '):'Nessuna struttura compatibile entro 12 tile.';$('#linkGood').innerHTML=Object.keys(TERRA_GOODS).map(k=>`<option value="${k}">${this.resourceName(k)}</option>`).join('');$('#linkGood').value='wood';$('#factoryPolicy').hidden=!TERRA_RECIPES[b.type];$('#factoryWorkers').value=b.desiredWorkers||0;$('#factoryReturn').value=b.returnPercent??75;this.renderLinkPolicy();};
Game.prototype.renderLinkPolicy=function(){const a=this.findById(this.buildings,this.linkFocus),b=this.findById(this.buildings,$('#linkPair').value);if(!a||!b)return;const p=this.linkGoodPolicy(a,b,$('#linkGood').value);$('#linkEnabled').checked=this.linkOpen(a,b);$('#linkImport').checked=p.import;$('#linkExport').checked=p.export;$('#linkMin').value=p.min;$('#linkKeep').value=p.keep;};
const init=Game.prototype.initUI;Game.prototype.initUI=function(){init.call(this);$('#settlementBtn').onclick=()=>this.openLinks();$('#cityForm').onsubmit=e=>{e.preventDefault();const b=this.findById(this.buildings,this.linkFocus),name=$('#cityName').value.trim();if(b?.type!=='base'||!name||name.length>60||/[<>]/.test(name))return;b.cityName=name;this.save(true);$('#linkStatus').textContent='Nome dell’insediamento aggiornato.';};$('#closeLinks').onclick=()=>this.closeManagement();$('#linksDialog').addEventListener('close',()=>{if(!this.suspended)this.setPaused(this.pauseBeforeLinks);});$('#linkBuilding').onchange=()=>{this.linkFocus=$('#linkBuilding').value;this.renderLinks();};for(const id of ['linkPair','linkGood'])$('#'+id).onchange=()=>this.renderLinkPolicy();$('#linkForm').onsubmit=e=>{e.preventDefault();const a=this.findById(this.buildings,this.linkFocus),b=this.findById(this.buildings,$('#linkPair').value),min=Number($('#linkMin').value),keep=Number($('#linkKeep').value);if(!a||!b||![min,keep].every(n=>Number.isSafeInteger(n)&&n>=0)||min>keep){$('#linkStatus').textContent='Il minimo deve essere intero, non negativo e non superiore alla scorta da trattenere.';return;}this.linkPolicy(a,b).enabled=$('#linkEnabled').checked;Object.assign(this.linkGoodPolicy(a,b,$('#linkGood').value),{min,keep,import:$('#linkImport').checked,export:$('#linkExport').checked});$('#linkStatus').textContent=this.save(true)?'Collegamento salvato.':'Impostazione applicata; salvataggio non riuscito.';};$('#factoryPolicy').onsubmit=e=>{e.preventDefault();const b=this.findById(this.buildings,this.linkFocus),n=Number($('#factoryWorkers').value),p=Number($('#factoryReturn').value);if(!b||!Number.isSafeInteger(n)||n<0||n>8||!Number.isSafeInteger(p)||p<0||p>100)return;b.desiredWorkers=n;b.returnPercent=p;this.save(true);$('#linkStatus').textContent='Produzione impostata.';};};
const selection=Game.prototype.selectionHTML;Game.prototype.selectionHTML=function(e){let html=selection.call(this,e);if(e instanceof Building){if(e.type==='base')html+=`<p>Città di <b>${esc(e.cityName||e.factionName||'Ver Sacrum')}</b> · segnaposto dell’insediamento.</p>`;if(e.owner===0)html+='<button id="openLinks" type="button">Collegamenti e produzione</button>';if(TERRA_RECIPES[e.type])html+=`<p>Artigiani ${this.factoryWorkers(e).length}/${e.desiredWorkers??1} · ritorno comunitario ${e.returnPercent??75}%. Senza razioni la lavorazione si ferma.</p>`;}return html;};
const ui=Game.prototype.updateUI;Game.prototype.updateUI=function(){ui.call(this);const s=this.communalStock();for(const[k,id]of [['wood','woodVal'],['stone','stoneVal'],['iron','ironVal']])if($('#'+id))$('#'+id).textContent=s[k]||0;if($('#foodVal'))$('#foodVal').textContent=EDIBLE.reduce((n,k)=>n+(s[k]||0),0);const btn=$('#openLinks');if(btn)btn.onclick=()=>this.openLinks();};
const drawBuilding=Game.prototype.drawBuilding;Game.prototype.drawBuilding=function(b){const p=this.worldToScreen(b.x*TILE,b.y*TILE),z=this.camera.zoom,c=this.ctx;
 c.save();c.fillStyle='#e4d4ad';c.fillRect(p.x-18*z,p.y-18*z,36*z,36*z);c.strokeStyle=window.terraFactionStyle?.(b.owner)?.color||'#934c36';c.lineWidth=3*z;c.strokeRect(p.x-18*z,p.y-18*z,36*z,36*z);c.restore();
 if(b.type==='base'||b.type==='sawmill'||b.type==='house'){c.save();c.fillStyle='#6c3426';if(b.type==='base'){c.fillRect(p.x-3*z,p.y-13*z,6*z,27*z);c.fillRect(p.x-11*z,p.y-10*z,22*z,6*z);}else if(b.type==='sawmill'){c.fillRect(p.x-12*z,p.y-3*z,24*z,7*z);c.strokeStyle='#332d27';c.beginPath();c.moveTo(p.x-8*z,p.y-11*z);c.lineTo(p.x+9*z,p.y+10*z);c.stroke();}else {const n=Math.min(8,Math.ceil((b.residents.length+this.units.filter(u=>u.homeVillageId===b.id&&u.health>0&&u.location.kind!=='resident').length)*8/5));for(let i=0;i<n;i++){const x=p.x+((i%3)-1)*10*z,y=p.y+(Math.floor(i/3)-1)*10*z;c.fillRect(x-3*z,y-2*z,6*z,5*z);c.beginPath();c.moveTo(x-4*z,y-2*z);c.lineTo(x,y-6*z);c.lineTo(x+4*z,y-2*z);c.fill();}}c.restore();if(this.selected?.id===b.id)this.selectionRing(p.x,p.y,23*z);}else drawBuilding.call(this,b);
 if(this.selected?.id===b.id){c.save();c.setLineDash?.([4*z,3*z]);for(const a of this.buildings.filter(a=>this.linkCompatible(a,b))){const q=this.worldToScreen(a.x*TILE,a.y*TILE);c.strokeStyle=this.linkOpen(a,b)?'#e0c27a':'#8c4940';c.lineWidth=2*z;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(q.x,q.y);c.stroke();}c.restore();}
};
})();
