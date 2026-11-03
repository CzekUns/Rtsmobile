// Ver Sacrum · Le Genti / UI and controls. Vanilla JS, no external dependencies.
import {Strategy, BUILDINGS, FACTIONS, RESOURCE_NAMES, MAP_W, MAP_H, distance} from './sim.js';
import {Scene} from './render.js';
const $ = id => document.getElementById(id);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const scene=new Scene($('world'),$('minimap'));
let game=Strategy.restore()||new Strategy();
let selected=null,placement=null,activeTab='people';
let last=0,lastUI=0,lastSave=0,notificationTimer;
const pointers=new Map();
let drag=null,pinch=null;
const portraitBlocked=window.matchMedia('(orientation: landscape) and (pointer: coarse)');
function show(message){
  const notice=$('notice');notice.textContent=message;notice.hidden=false;
  clearTimeout(notificationTimer);notificationTimer=setTimeout(()=>{notice.hidden=true;},3200);
}
function escapeText(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function selectedPerson(){return selected?.kind==='person'?game.person(selected.id):null;}
function selectedBuilding(){return selected?.kind==='building'?game.building(selected.id):null;}
function taskLabel(p){
  if(p.inside)return 'Nel villaggio';
  if(!p.task)return p.soldier?'Soldato libero':'Disponibile';
  return ({move:'In cammino',gather:'Raccoglie',build:'Costruisce',farm:'Coltiva',home:'Rientra'})[p.task.kind]||'Impegnato';
}
function capacityLabel(){return game.people.length+'/'+game.capacity;}
function updateHud(){
  const s=game.stocks();
  $('food').textContent=s.food;$('wood').textContent=s.wood;$('stone').textContent=s.stone;
  $('population').textContent=capacityLabel();
  const seasons=['Primavera','Estate','Autunno','Inverno'];
  $('season').textContent=seasons[Math.floor((game.day-1)/30)%4]+' · giorno '+game.day;
  $('pauseBtn').textContent=game.paused?'▶':'Ⅱ';
  $('clock').textContent=game.paused?'In pausa':'1×';
}
function selectedInfo(){
  let title='Il tuo insediamento',tag='Inizio';
  let details='Seleziona un abitante, un edificio o una risorsa sulla mappa. Le persone e le merci esistono fisicamente nel mondo.';
  const p=selectedPerson();
  const b=selectedBuilding();
  if(p){
    title=p.name;tag=taskLabel(p);
    details='<b>Persona persistente</b> · '+(p.inside?'risiede nel villaggio':p.soldier?'mobilitato':'al lavoro')+
      '<br>Salute '+p.health+'/100 · Raccolta '+p.skills.gather.toFixed(1)+
      ' · Costruzione '+p.skills.build.toFixed(1)+' · Coltivazione '+p.skills.farm.toFixed(1)+
      (p.cargo.amount?'<br>Trasporta '+p.cargo.amount+' '+escapeText(RESOURCE_NAMES[p.cargo.type]||p.cargo.type):'')+
      '<div class="actions">'+(p.inside?'<button data-command="mobilize" type="button">Fai uscire</button>':
      '<button data-command="home" type="button">Rientra</button><button data-command="stop" type="button">Libera</button>'+
      '<button data-command="train" type="button">'+(p.soldier?'Torna civile':'Mobilita soldato')+'</button>')+'</div>';
  }else if(b){
    title=BUILDINGS[b.type].name+(b.owner!==0?' · '+FACTIONS[b.owner].name:'');
    tag=b.done?'Operativo':'Cantiere '+Math.floor(b.progress*100)+'%';
    if(b.type==='village'){
      details=b.owner===0?'Villaggio · Capacità 16 persone, identità individuale persistente.':'Villaggio indipendente. Usa la scheda Genti per avviare rapporti diplomatici.';
    }else if(b.type==='warehouse'){
      details='Inventario locale: '+b.stock.food+' cibo · '+b.stock.wood+' legno · '+b.stock.stone+' pietra.';
    }else if(b.type==='farm'){
      details='Campo agricolo. Un lavoratore deve essere presente per raccogliere il cibo.';
    }else details='Luogo di scambio e incontro fra comunità.';
    if(!b.done)details+='<br>Per completare, seleziona una persona e poi tocca questo cantiere sulla mappa.';
  }else if(selected?.kind==='resource'){
    const r=game.resource(selected.id);
    if(r){
      title=RESOURCE_NAMES[r.type];tag='Risorsa naturale';
      details='Quantità disponibile: '+r.quantity+'. Seleziona una persona e tocca questo punto per raccogliere la risorsa.';
    }
  }
  $('selectedTitle').textContent=title;$('statusChip').textContent=tag;
  if($('selectedDetails').innerHTML!==details)$('selectedDetails').innerHTML=details;
}
function updatePeople(){
  const html=game.people.map(p=>
    '<button class="person '+(selected?.kind==='person'&&selected.id===p.id?'active':'')+
    '" data-person="'+p.id+'" type="button"><strong>'+escapeText(p.name)+'</strong>'+
    '<small>'+taskLabel(p)+'</small><small>Raccolta '+p.skills.gather.toFixed(1)+'</small></button>'
  ).join('');
  if($('peopleList').innerHTML!==html)$('peopleList').innerHTML=html;
  $('mobilizeBtn').disabled=!game.people.some(p=>p.inside);
}
function updateNeighbours(){
  const html=game.neighbours.map(n=>
    '<article class="faction"><h3>'+escapeText(n.name)+'</h3>'+
    '<p>'+escapeText(n.relation)+' · Influenza '+n.influence+'/100 · Fiducia '+n.loyalty+'/100</p>'+
    '<button data-gift="'+n.owner+'" type="button">Offri 5 cibo</button> '+
    '<button data-annex="'+n.owner+'" type="button" '+(n.influence<75||n.loyalty<55?'disabled':'')+'>Unisci la comunità</button></article>'
  ).join('')||'<p class="muted">Tutti i popoli conosciuti si sono uniti alla comunità.</p>';
  if($('factionsList').innerHTML!==html)$('factionsList').innerHTML=html;
}
function updateChronicles(){
  const html=game.events.slice(0,25).map(e=>
    '<div class="event"><small>Giorno '+e.day+'</small>'+escapeText(e.message)+'</div>'
  ).join('');
  if($('chronicleList').innerHTML!==html)$('chronicleList').innerHTML=html;
}
function refresh(){
  updateHud();selectedInfo();
  if(activeTab==='people')updatePeople();
  if(activeTab==='politics')updateNeighbours();
  if(activeTab==='chronicle')updateChronicles();
}
function activateTab(name){
  activeTab=name;
  document.querySelectorAll('[data-tab]').forEach(btn=>btn.classList.toggle('active',btn.dataset.tab===name));
  document.querySelectorAll('.tab-panel').forEach(panel=>panel.hidden=panel.id!=='tab-'+name);
  refresh();
}
function select(kind,id){
  selected={kind,id};refresh();
}
function focusPerson(p){
  if(!p)return;
  select('person',p.id);
  if(!p.inside)scene.center(p.x,p.y);
  else{
    const b=game.building(p.homeId);
    if(b){const c=game.center(b);scene.center(c.x,c.y);}
  }
}
function startConstruction(type){
  if(!BUILDINGS[type])return;
  placement={type,x:null,y:null};
  $('placementName').textContent=BUILDINGS[type].name;
  $('placementHint').textContent='Tocca la posizione sulla mappa';
  $('placement').hidden=false;$('confirmBuild').disabled=true;
  activateTab('build');show('Scegli dove costruire: '+BUILDINGS[type].name+'.');
}
function cancelConstruction(){placement=null;$('placement').hidden=true;}
function commitConstruction(){
  if(!placement||placement.x===null)return;
  const result=game.createConstruction(placement.type,placement.x,placement.y);
  if(!result.ok){show(result.error);return;}
  cancelConstruction();select('building',result.building.id);
  show('Cantiere avviato. Il lavoratore assegnato raggiungerà l’edificio.');
  game.save();
}
function resolveHit(w){
  for(let i=game.people.length-1;i>=0;i--){
    const p=game.people[i];
    if(!p.inside&&distance(p,w)<.57)return {kind:'person',id:p.id};
  }
  for(let i=game.buildings.length-1;i>=0;i--){
    const b=game.buildings[i],size=BUILDINGS[b.type].size;
    if(w.x>=b.x&&w.x<b.x+size&&w.y>=b.y&&w.y<b.y+size)return {kind:'building',id:b.id};
  }
  for(const r of game.resources){
    if(r.quantity>0&&distance(r,w)<.47)return {kind:'resource',id:r.id};
  }
  return null;
}
function mapClick(px,py){
  const w=scene.screenToWorld(px,py),target=resolveHit(w);
  if(placement){
    placement.x=Math.floor(w.x);placement.y=Math.floor(w.y);
    const valid=!game.isOccupied(placement.x,placement.y,BUILDINGS[placement.type].size);
    $('placementHint').textContent=valid?'Posizione valida · premi Conferma':'Posizione non valida: edificio o confine';
    $('confirmBuild').disabled=!valid;
    return;
  }
  const person=selectedPerson();
  if(person&&!person.inside&&target?.kind==='resource'){
    const node=game.resource(target.id);
    if(node&&game.assign(person,'gather',node.id)){
      show(person.name+' va a raccogliere '+RESOURCE_NAMES[node.type].toLowerCase()+'.');refresh();return;
    }
  }
  if(person&&!person.inside&&target?.kind==='building'){
    const b=game.building(target.id);
    if(b&&b.owner===0&&!b.done){
      game.assign(person,'build',b.id);show(person.name+' raggiungerà il cantiere.');refresh();return;
    }
    if(b&&b.owner===0&&b.type==='farm'&&b.done){
      game.assign(person,'farm',b.id);show(person.name+' coltiverà il campo.');refresh();return;
    }
    if(b&&b.id===person.homeId){game.assign(person,'home',b.id);show(person.name+' torna nel villaggio.');refresh();return;}
  }
  if(target){select(target.kind,target.id);return;}
  if(person&&!person.inside){
    game.assign(person,'move',{x:clamp(w.x,1,MAP_W-1),y:clamp(w.y,1,MAP_H-1)});
    show(person.name+' si sposta.');refresh();return;
  }
  selected=null;refresh();
}
$('world').addEventListener('pointerdown',e=>{
  if(e.button!==0&&e.pointerType==='mouse')return;
  e.preventDefault();
  const rect=$('world').getBoundingClientRect();
  const point={x:e.clientX-rect.left,y:e.clientY-rect.top};
  pointers.set(e.pointerId,point);
  try{$('world').setPointerCapture(e.pointerId);}catch(_){}
  if(pointers.size===1)drag={id:e.pointerId,start:point,last:point,moved:false};
  else if(pointers.size===2){
    const [a,b]=[...pointers.values()];
    pinch={distance:Math.max(1,distance(a,b)),zoom:scene.camera.zoom};
    drag=null;
  }
});
$('world').addEventListener('pointermove',e=>{
  if(!pointers.has(e.pointerId))return;
  e.preventDefault();
  const rect=$('world').getBoundingClientRect();
  const point={x:e.clientX-rect.left,y:e.clientY-rect.top};
  pointers.set(e.pointerId,point);
  if(pointers.size===2&&pinch){
    const [a,b]=[...pointers.values()];
    scene.camera.zoom=clamp(pinch.zoom*distance(a,b)/pinch.distance,.65,2.8);
    scene.clampCamera();return;
  }
  if(!drag||drag.id!==e.pointerId)return;
  if(distance(point,drag.start)>6)drag.moved=true;
  if(drag.moved)scene.pan(point.x-drag.last.x,point.y-drag.last.y);
  drag.last=point;
});
function pointerEnd(e,cancel=false){
  if(!pointers.has(e.pointerId))return;
  const rect=$('world').getBoundingClientRect(),p={x:e.clientX-rect.left,y:e.clientY-rect.top};
  if(!cancel&&pointers.size===1&&drag&&drag.id===e.pointerId&&!drag.moved)mapClick(p.x,p.y);
  pointers.delete(e.pointerId);
  if(pointers.size<2)pinch=null;
  drag=null;
}
$('world').addEventListener('pointerup',e=>pointerEnd(e,false));
$('world').addEventListener('pointercancel',e=>pointerEnd(e,true));
$('world').addEventListener('contextmenu',e=>e.preventDefault());
$('minimap').addEventListener('click',e=>{
  const r=e.currentTarget.getBoundingClientRect();
  scene.center((e.clientX-r.left)*MAP_W/r.width,(e.clientY-r.top)*MAP_H/r.height);
});
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>activateTab(b.dataset.tab)));
document.querySelectorAll('[data-build]').forEach(b=>b.addEventListener('click',()=>startConstruction(b.dataset.build)));
$('confirmBuild').addEventListener('click',commitConstruction);
$('cancelBuild').addEventListener('click',cancelConstruction);
$('zoomIn').addEventListener('click',()=>scene.zoom(1.2));
$('zoomOut').addEventListener('click',()=>scene.zoom(1/1.2));
$('center').addEventListener('click',()=>{const town=game.town;if(town){const p=game.center(town);scene.center(p.x,p.y);}});
$('pauseBtn').addEventListener('click',()=>{game.paused=!game.paused;refresh();show(game.paused?'Partita in pausa.':'Simulazione ripresa.');});
$('fullscreenBtn').addEventListener('click',async()=>{
  try{
    if(!document.fullscreenElement&&document.documentElement.requestFullscreen){
      await document.documentElement.requestFullscreen({navigationUI:'hide'});
      // Supported primarily in installed PWAs or fullscreen on Android.
      if(screen.orientation?.lock){
        try{await screen.orientation.lock('portrait');}catch(_){/* CSS landscape gate below */ }
      }
    }else if(document.fullscreenElement&&document.exitFullscreen){
      await document.exitFullscreen();
    }else{
      show('Il browser non consente lo schermo intero. Gioca in verticale.');
    }
  }catch(_){show('Schermo intero non disponibile. Il gioco resta utilizzabile in verticale.');}
});
document.addEventListener('fullscreenchange',()=>{
  $('fullscreenBtn').textContent=document.fullscreenElement?'⤢':'⛶';
  $('fullscreenBtn').setAttribute('aria-label',document.fullscreenElement?'Esci da schermo intero':'Schermo intero verticale');
});
if(portraitBlocked.addEventListener){
  portraitBlocked.addEventListener('change',()=>{last=0;refresh();});
}
$('saveBtn').addEventListener('click',()=>show(game.save()?'Partita salvata.':'Salvataggio locale non disponibile.'));
$('newBtn').addEventListener('click',()=>{
  if(!confirm('Creare un nuovo territorio? Il salvataggio esistente verrà sostituito.'))return;
  game=new Strategy(Math.floor(Math.random()*1000000));scene.center(27,24);selected=null;cancelConstruction();activateTab('people');
  game.save();show('Nuova partita iniziata.');
});
$('mobilizeBtn').addEventListener('click',()=>{
  const p=game.people.find(p=>p.inside);
  if(!p){show('Nessun residente disponibile.');return;}
  if(game.mobilize(p)){focusPerson(p);show(p.name+' è uscito dal villaggio.');}
});
$('idleBtn').addEventListener('click',()=>{
  const p=game.people.find(p=>!p.inside&&!p.task);
  if(p){focusPerson(p);show('Selezionato: '+p.name+'.');}
  else show('Non ci sono abitanti liberi fuori dal villaggio.');
});
$('selectedDetails').addEventListener('click',e=>{
  const cmd=e.target.closest('[data-command]')?.dataset.command;
  if(!cmd)return;
  const p=selectedPerson();if(!p)return;
  if(cmd==='mobilize'){
    if(game.mobilize(p)){focusPerson(p);show(p.name+' è uscito.');}
  }else if(cmd==='home'){
    game.assign(p,'home',p.homeId);show(p.name+' torna nel villaggio.');
  }else if(cmd==='stop'){
    game.cancel(p);show('Ordine annullato.');
  }else if(cmd==='train'){
    if(p.soldier){game.demobilize(p);show(p.name+' è tornato civile.');}
    else{game.train(p);show(p.name+' è stato mobilitato.');}
  }
  refresh();
});
$('peopleList').addEventListener('click',e=>{
  const id=e.target.closest('[data-person]')?.dataset.person;
  if(id){focusPerson(game.person(id));activateTab('people');}
});
$('factionsList').addEventListener('click',e=>{
  const gift=e.target.closest('[data-gift]'),annex=e.target.closest('[data-annex]');
  if(gift){
    const result=game.gift(Number(gift.dataset.gift));
    show(result.ok?'Dono consegnato. Relazioni: '+result.relation+'.':result.error);
    if(result.ok)game.save();refresh();
  }
  if(annex){
    const result=game.annex(Number(annex.dataset.annex));
    show(result.ok?'La comunità alleata si è unita al tuo popolo.':result.error);
    if(result.ok)game.save();refresh();
  }
});
$('helpBtn').addEventListener('click',()=>$('helpDialog').showModal());
window.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&placement)cancelConstruction();
  if(e.key===' '&&e.target===document.body){e.preventDefault();game.paused=!game.paused;refresh();}
  if(e.key==='s'&&e.ctrlKey){e.preventDefault();game.save();show('Partita salvata.');}
});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){game.paused=true;game.save();}
  else {last=0;refresh();}
});
window.addEventListener('pagehide',()=>game.save());
function frame(stamp){
  if(!last)last=stamp;
  const dt=Math.min((stamp-last)/1000,.05);last=stamp;
  // Do not progress the simulation while a touchscreen is in landscape.
  // The media-query overlay requires the player to return to portrait.
  if(!portraitBlocked.matches){
    game.update(dt);
    scene.draw(game,selected,placement);
  }
  if(stamp-lastUI>350){refresh();lastUI=stamp;}
  if(stamp-lastSave>20000){game.save();lastSave=stamp;}
  requestAnimationFrame(frame);
}
activateTab('people');
requestAnimationFrame(frame);
