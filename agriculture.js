// Mobile agriculture: crop footprints, staffing and contextual explanations.
(() => {
'use strict';
const bounds=b=>VER_SACRUM_VILLAGE.bounds(b);
const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
Game.prototype.cropWorkers=function(b){return this.units.filter(u=>u.health>0&&u.task?.type==='farm'&&u.task.target===b.id);};
Game.prototype.cropPlacementError=function(b,crop){
 const r=bounds({...b,crop}),old=bounds(b);
 if(r.left<0||r.top<0||r.right>this.world.size||r.bottom>this.world.size)return 'Il campo deve rientrare nella mappa.';
 for(let y=r.top;y<r.bottom;y++)for(let x=r.left;x<r.right;x++){
  const t=this.world.tile(x,y);if(!t||!BIOME[t.biome].walk)return 'La coltura richiede terreno coltivabile su tutta la superficie.';
 }
 if([...this.buildings,...(this.warCamps||[])].some(e=>e!==b&&e.health>0&&overlap(r,bounds(e))))return 'Spazio insufficiente: la coltura occuperebbe un’altra struttura.';
 if(this.world.resources.some(e=>!e.cleared&&(e.amount>0||e.renewable)&&overlap(r,{left:e.x-.515,right:e.x+.515,top:e.y-.515,bottom:e.y+.515})))return 'Libera le risorse nell’area prima di ampliare il campo.';
 const actors=[...this.units.filter(u=>u.health>0&&u.location?.kind==='world'),...this.animals.filter(a=>a.health>0),...this.raiders.filter(a=>a.health>0)];
 if(actors.some(e=>{const a={left:e.x-.45,right:e.x+.45,top:e.y-.45,bottom:e.y+.45};return overlap(r,a)&&!overlap(old,a);}))return 'Sposta gli abitanti o gli animali dalle nuove tile del campo.';
 return null;
};
const setCrop=Game.prototype.setCrop;
Game.prototype.setCrop=function(b,crop){
 const c=TERRA_CROPS[crop];if(!b?.alive||b.type!=='farm'||!c||b.owner!==0)return false;
 if(b.growth>0)return setCrop.call(this,b,crop);
 if(this.cropWorkers(b).length>c.maxWorkers){this.message(`Riassegna i lavoratori in eccesso: ${c.label} ammette al massimo ${c.maxWorkers} abitanti.`);return false;}
 const error=this.cropPlacementError(b,crop);if(error){this.message(error);return false;}
 return setCrop.call(this,b,crop);
};
const assignFarm=Game.prototype.assignFarm;
Game.prototype.assignFarm=function(u,b){
 if(!u||u.health<=0||u.location?.kind!=='world'||!b?.alive||!b.built||b.type!=='farm'||b.owner!==u.owner)return false;
 const c=TERRA_CROPS[b.crop]||TERRA_CROPS.grain;
 if(this.cropWorkers(b).filter(e=>e!==u).length>=c.maxWorkers){this.message(`${c.label}: raggiunto il limite di ${c.maxWorkers} lavoratori.`);return false;}
 if(this.pathToBuilding(u,b)===null){this.message('Campo non raggiungibile.');return false;}
 assignFarm.call(this,u,b);return true;
};
// Older saves could assign unlimited workers. Keep the first valid assignments.
const load=Game.prototype.load;
Game.prototype.load=function(){const ok=load.call(this);if(ok)for(const b of this.buildings.filter(b=>b.type==='farm')){
 for(const u of this.cropWorkers(b).slice((TERRA_CROPS[b.crop]||TERRA_CROPS.grain).maxWorkers))this.cancelTask(u);
 }return ok;};
const selection=Game.prototype.selectionHTML;
Game.prototype.selectionHTML=function(e){
 let html=selection.call(this,e);if(!(e instanceof Building)||e.type!=='farm')return html;
 const c=TERRA_CROPS[e.crop]||TERRA_CROPS.grain;
 html+=`<p><b>Campo attraversabile · ${c.side} × ${c.side} tile</b><br>Lavoratori assegnati: ${this.cropWorkers(e).length}/${c.maxWorkers}. Impianto: 10 legno. Nessuna crescita senza lavoratori presenti.</p>`;
 html+='<p><b>Guida alle quattro colture</b></p>';
 for(const [id,crop] of Object.entries(TERRA_CROPS))html+=`<p><b>${crop.label}</b> · ${crop.side} × ${crop.side} tile · massimo ${crop.maxWorkers} lavoratori · ${crop.days} giorni base · ${crop.yield} ${this.resourceName(id)} di resa base.</p>`;
 return html+'<p>Grano e orzo alimentano mulino e forno. Vite produce uva; olivo produce olive. Vino e olio richiedono filiere ancora da implementare.</p><p>Fertilità, acqua e stagione modificano crescita e resa; la competenza agricola accelera la crescita. Il raccolto resta nell’inventario del campo: va trasportato. Se manca spazio, il raccolto maturo attende senza andare perso.</p><p>Il campo nasce a grano. Cambia coltura tra due cicli; le colture più grandi richiedono spazio libero verso destra e in basso. Gli altri edifici, incluso il recinto, non sono attraversabili.</p>';
};
const draw=Game.prototype.drawBuilding;
Game.prototype.drawBuilding=function(b){
 if(b.type!=='farm')return draw.call(this,b);
 const r=bounds(b),p=this.worldToScreen(r.left*TILE,r.top*TILE),s=TILE*this.camera.zoom,side=r.right-r.left,c=this.ctx,growth=Math.max(0,Math.min(1,b.growth||0));
 c.save();c.globalAlpha*=b.built?1:.55;c.fillStyle='#896445';c.fillRect(p.x,p.y,side*s,side*s);
 for(let y=0;y<side;y++)for(let x=0;x<side;x++){
  const px=p.x+x*s,py=p.y+y*s;
  c.strokeStyle='#644933';c.lineWidth=Math.max(1,s*.035);
  for(let row=1;row<=3;row++){c.beginPath();c.moveTo(px+s*.15,py+s*row/4);c.lineTo(px+s*.85,py+s*row/4);c.stroke();}
  if(b.crop==='olives'){
   c.fillStyle='#4c6143';c.beginPath();c.arc(px+s*.5,py+s*.5,s*(.19+.09*growth),0,Math.PI*2);c.fill();
   c.fillStyle='#a2a06b';c.beginPath();c.arc(px+s*.46,py+s*.45,s*.13,0,Math.PI*2);c.fill();
  }else for(let row=1;row<=3;row++)for(let col=1;col<=3;col++){
   c.fillStyle=b.crop==='grapes'?'#57663c':growth>.7?(b.crop==='barley'?'#bba35b':'#ddc276'):'#81934e';
   c.fillRect(px+s*(col/4-.035),py+s*(row/4-.03-growth*.06),s*.07,s*(.07+growth*.08));
   if(b.crop==='grapes'&&growth>.65){c.fillStyle='#624653';c.beginPath();c.arc(px+s*col/4,py+s*(row/4+.045),s*.04,0,Math.PI*2);c.fill();}
  }
 }
 c.strokeStyle=this.selected?.id===b.id?'#fff0ad':(window.terraFactionStyle?.(b.owner)?.color||'#934c36');c.lineWidth=this.selected?.id===b.id?3:1;c.strokeRect(p.x,p.y,side*s,side*s);
 if(!b.built){c.fillStyle='#382f23';c.fillRect(p.x,p.y+side*s-4,side*s,4);c.fillStyle='#d4af62';c.fillRect(p.x,p.y+side*s-4,side*s*b.progress,4);}
 c.restore();
};
})();
