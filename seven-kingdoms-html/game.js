/* Seven Kingdoms HTML Edition — browser runtime and controls.
 * Game rules live in rules.js, drawing in view.js. GPL-2.0-only.
 */
import {SevenGame,NATIONS,FIRMS,WORLD_W,WORLD_H} from './rules.js';
import {WorldView} from './view.js';
const $=id=>document.getElementById(id);
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let game=SevenGame.load()||new SevenGame();
const view=new WorldView($('world'),$('minimap'));
let selection=game.towns.find(t=>t.owner===1)?.id||null;
let report='towns',placing=null,ghost=null,newsUntil=0,last=0,lastPanel=0,lastSave=0;
let input=null,gesture=null;const pointers=new Map();
const portrait=window.matchMedia('(orientation: portrait)');
function resizeStage(){
 const scale=Math.min(window.innerWidth/800,window.innerHeight/600);
 $('stage').style.transform='translate(-50%,-50%) scale('+Math.max(.1,scale)+')';
}
resizeStage();window.addEventListener('resize',resizeStage);
window.addEventListener('orientationchange',resizeStage);
function status(message){
 $('ticker').textContent=message;newsUntil=Date.now()+6000;
}
function selected(){return game.get(selection);}
function select(id){
 if(id&&!game.get(id))return;
 selection=id;
 renderPanel();
}
function setReport(name){
 report=name;
 document.querySelectorAll('[data-report]').forEach(b=>b.classList.toggle('active',b.dataset.report===name));
 renderPanel();
}
function cash(n){return Math.floor(n).toLocaleString('it-IT');}
function season(){return ['Primavera','Estate','Autunno','Inverno'][Math.floor((game.day-1)/30)%4];}
function renderHud(){
 $('cash').textContent=cash(game.cash);
 $('food').textContent=cash(game.food);
 $('raw').textContent=cash(game.raw);
 $('goods').textContent=cash(game.goods);
 $('date').textContent=season()+' · G '+game.day;
 $('gameSpeed').textContent=game.paused?'PAUSA':'Velocità '+game.speed+'×';
 $('pauseBtn').textContent=game.paused?'▶':'Ⅱ';
 if(Date.now()>newsUntil&&game.events.length)$('ticker').textContent=game.events[0].text;
}
function btn(action,text,disabled=false){
 return '<button type="button" data-action="'+action+'"'+(disabled?' disabled':'')+'>'+esc(text)+'</button>';
}
function selectedContent(){
 const item=selected();
 if(!item)return {title:'Seven Kingdoms',meta:'HTML Edition',color:'#aaa',info:'Seleziona un elemento sulla mappa.',actions:''};
 const nation=NATIONS[item.owner]||NATIONS[0],color=nation.color;
 if(game.towns.includes(item)){
  const independent=item.owner===0;
  const info='Popolazione <strong>'+item.pop+'</strong> · Cultura '+esc(item.culture)+
    '<br>'+(independent?'Resistenza <strong>'+Math.floor(item.resistance)+'</strong>/100':
                   'Fedeltà <strong>'+Math.floor(item.loyalty)+'</strong>/100')+
    '<br>Regno: '+esc(nation.name);
  const actions=item.owner===1?[
    btn('recruit','Recluta',item.pop<=4||item.loyalty<27),
    btn('tax','Tasse',item.loyalty<38),
    btn('grant','Sussidio (60)',game.cash<60),
  ].join(''):independent?[
    btn('persuade','Influenza (100)',game.cash<100||!game.ownFirms().some(f=>f.kind==='fort'&&game.linked(f,item))),
    btn('annex','Unisci al regno',item.resistance>15)
  ].join(''):'';
  return {title:item.name,meta:'Villaggio · '+nation.name,color,info,actions};
 }
 if(game.firms.includes(item)){
  const rule=FIRMS[item.kind];
  return {
   title:rule.label,meta:'Edificio · '+nation.name,color,
   info:'Lavoratori <strong>'+item.workers+'</strong>/8'+
    '<br>Esperienza '+Math.floor(item.experience)+
    (item.kind==='fort'?'<br>Il forte influenza i villaggi collegati.':
      item.kind==='mine'?'<br>Produce minerali grezzi.':
      item.kind==='factory'?'<br>Trasforma minerali in prodotti.':
      item.kind==='market'?'<br>Vende prodotti per denaro.':'')+
    '<br>'+(game.linked(item,game.nearestTown(item))?'Collegato a un villaggio':'Nessun villaggio collegato'),
   actions:item.owner===1?btn('dismiss','Fai uscire lavoratore',item.workers===0):''
  };
 }
 if(game.units.includes(item)){
  return {
   title:item.kind==='soldier'?'Soldato':'Abitante',
   meta:nation.name+' · Livello '+item.level,color,
   info:'Salute '+item.hp+'/100 · Addestramento '+Math.floor(item.training)+
    '<br>'+(item.target?'In marcia':'Pronto per gli ordini')+
    '<br>Tocca il terreno per spostare questa unità. Tocca una struttura per assegnarla.',
   actions:item.owner===1?btn('stop','Ferma',!item.target):''
  };
 }
 return {title:'Selezione',meta:'',color,info:'',actions:''};
}
function reportContent(){
 const toButton=t=>'<button type="button" class="report-item" data-select="'+t.id+'">'+
   esc(t.name)+'<small>'+esc(NATIONS[t.owner]?.name||'Indipendenti')+' · '+t.pop+' abitanti</small></button>';
 const firmButton=f=>'<button type="button" class="report-item" data-select="'+f.id+'">'+
   esc(FIRMS[f.kind].label)+'<small>Operai '+f.workers+' · '+esc(NATIONS[f.owner]?.name||'Indipendenti')+'</small></button>';
 switch(report){
  case 'kingdoms':return ['Regni',
   NATIONS.slice(1).map(n=>{
    const pop=game.towns.filter(t=>t.owner===n.id).reduce((s,t)=>s+t.pop,0);
    return '<div class="card"><b style="color:'+n.color+'">'+esc(n.name)+'</b><p>Villaggi '+game.towns.filter(t=>t.owner===n.id).length+' · Popolazione '+pop+'</p></div>';
   }).join('')+'<div class="card"><b>Indipendenti</b><p>'+game.towns.filter(t=>t.owner===0).length+' villaggi neutrali.</p></div>'];
  case 'towns':return ['Villaggi',game.towns.map(toButton).join('')];
  case 'economy':return ['Economia',
   '<div class="card"><b>Costruisci</b><p>Seleziona una struttura, quindi tocca il terreno vicino a un tuo villaggio.</p>'+
   Object.entries(FIRMS).map(([id,v])=>'<button type="button" class="report-item" data-build="'+id+'"'+
   (game.cash<v.cost?' disabled':'')+'>'+esc(v.label)+'<small>'+v.cost+' monete</small></button>').join('')+'</div>'+
   '<div class="card"><b>Produzione</b><p>Minerali '+Math.floor(game.raw)+' → Prodotti '+Math.floor(game.goods)+' → Denaro '+Math.floor(game.cash)+'</p></div>'+
   game.ownFirms().map(firmButton).join('')];
  case 'trade':return ['Commercio',
   '<div class="card"><b>Mercati</b><p>La prima filiera produttiva è operativa. Le carovane e le rotte commerciali sono ancora da riscrivere.</p></div>'+
   game.firms.filter(f=>f.kind==='market').map(firmButton).join('')];
  case 'military':return ['Militari',
   '<div class="card"><b>Soldati: '+game.units.filter(u=>u.owner===1&&u.kind==='soldier').length+
   '</b><p>Forti propri: '+game.ownFirms().filter(f=>f.kind==='fort').length+'</p><p>Gli assedi e i combattimenti appartengono alla fase successiva.</p></div>'+
   game.ownFirms().filter(f=>f.kind==='fort').map(firmButton).join('')];
  case 'tech':return ['Tecnologia',
   '<div class="card"><b>Conoscenza: '+Math.floor(game.knowledge)+
   '</b><p>La Torre della Scienza produce ricerca quando riceve lavoratori. Alberi tecnologici da integrare.</p></div>'+
   game.ownFirms().filter(f=>f.kind==='research').map(firmButton).join('')];
  case 'spies':return ['Spionaggio',
   '<div class="card"><b>Sistema previsto</b><p>Spie, infiltrazione, copertura e controspionaggio originali non ancora implementati.</p></div>'];
  case 'ranking':return ['Classifica',
   NATIONS.slice(1).map(n=>{
    const pop=game.towns.filter(t=>t.owner===n.id).reduce((a,t)=>a+t.pop,0);
    const firms=game.firms.filter(f=>f.owner===n.id).length;
    return '<div class="card"><b>'+esc(n.name)+'</b><p>Popolazione '+pop+' · Edifici '+firms+'</p></div>';
   }).join('')];
  case 'news':return ['Notizie',game.events.map(e=>'<div class="card"><small>Giorno '+e.day+'</small><p>'+esc(e.text)+'</p></div>').join('')];
 }
 return ['', ''];
}
function renderPanel(){
 const summary=selectedContent();
 $('selectionTitle').textContent=summary.title;
 $('selectionMeta').textContent=summary.meta;
 $('flag').style.background=summary.color;
 $('selectionInfo').innerHTML=summary.info;
 $('selectionActions').innerHTML=summary.actions;
 const [title,html]=reportContent();
 $('reportTitle').textContent=title.toUpperCase();
 if($('reportBody').innerHTML!==html)$('reportBody').innerHTML=html;
}
function runAction(action){
 const obj=selected();if(!obj)return;
 let r={ok:false,msg:'Ordine non valido.'};
 if(action==='recruit')r=game.recruit(obj.id);
 if(action==='tax')r=game.tax(obj.id);
 if(action==='grant')r=game.grant(obj.id);
 if(action==='persuade')r=game.persuade(obj.id);
 if(action==='annex')r=game.annex(obj.id);
 if(action==='dismiss')r=game.dismiss(obj.id);
 if(action==='stop'&&game.units.includes(obj)){obj.target=null;r={ok:true,msg:'Unità fermata.'}}
 status(r.msg);
 if(r.ok)game.save();
 if(r.unit)selection=r.unit.id;
 renderPanel();renderHud();
}
function buildMode(kind){
 if(!FIRMS[kind])return;
 placing=kind;ghost={kind,x:24,y:23};
 $('buildLabel').textContent='Costruisci: '+FIRMS[kind].label+' · tocca la mappa';
 $('buildBar').hidden=false;
 status('Indica il luogo del nuovo edificio.');
}
function cancelBuild(){placing=null;ghost=null;$('buildBar').hidden=true}
function mapClick(sx,sy,right=false){
 const p=view.worldAt(sx,sy);let x=p.x,y=p.y;
 if(placing){
  const result=game.build(placing,x,y);status(result.msg);
  if(result.ok){selection=result.firm.id;cancelBuild();game.save();renderPanel();}
  return;
 }
 const hit=view.pick(game,x,y),unit=selected();
 const canOrder=unit&&game.units.includes(unit)&&unit.owner===1;
 if(right&&canOrder){
  const r=game.order(unit.id,x,y);status(r.msg);renderPanel();return;
 }
 if(hit){
  const item=game.get(hit);
  if(canOrder&&item&&game.firms.includes(item)&&item.owner===1&&item.id!==unit.id){
   const r=game.order(unit.id,x,y);status(r.msg);
   if(r.ok&&r.unit)selection=r.unit.id;
   renderPanel();return;
  }
  select(hit);return;
 }
 if(canOrder){
  const r=game.order(unit.id,x,y);status(r.msg);renderPanel();return;
 }
 select(null);
}
function eventXY(e){
 const rect=$('world').getBoundingClientRect();
 return {x:(e.clientX-rect.left)*$('world').width/rect.width,
         y:(e.clientY-rect.top)*$('world').height/rect.height};
}
$('world').addEventListener('pointerdown',e=>{
 if(e.pointerType==='mouse'&&e.button>2)return;
 e.preventDefault();const p=eventXY(e);
 pointers.set(e.pointerId,p);
 try{$('world').setPointerCapture(e.pointerId)}catch(_){}
 if(pointers.size===1)input={id:e.pointerId,start:p,last:p,moved:false,right:e.button===2};
 if(pointers.size===2){
  const [a,b]=[...pointers.values()];
  gesture={dist:Math.hypot(a.x-b.x,a.y-b.y),zoom:view.zoom};input=null;
 }
});
$('world').addEventListener('pointermove',e=>{
 if(!pointers.has(e.pointerId))return;e.preventDefault();
 const p=eventXY(e);pointers.set(e.pointerId,p);
 if(pointers.size===2&&gesture){
  const [a,b]=[...pointers.values()];
  view.zoom=Math.max(.68,Math.min(2.5,gesture.zoom*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,gesture.dist)));
  return;
 }
 if(placing)ghost={kind:placing,x:Math.floor(view.worldAt(p.x,p.y).x),y:Math.floor(view.worldAt(p.x,p.y).y)};
 if(!input||input.id!==e.pointerId)return;
 if(Math.hypot(p.x-input.start.x,p.y-input.start.y)>7)input.moved=true;
 if(input.moved)view.moveCamera(p.x-input.last.x,p.y-input.last.y);
 input.last=p;
});
function endPointer(e,cancel=false){
 if(!pointers.has(e.pointerId))return;
 const p=eventXY(e);
 if(!cancel&&pointers.size===1&&input&&!input.moved)mapClick(p.x,p.y,input.right);
 pointers.delete(e.pointerId);input=null;if(pointers.size<2)gesture=null;
}
$('world').addEventListener('pointerup',e=>endPointer(e,false));
$('world').addEventListener('pointercancel',e=>endPointer(e,true));
$('world').addEventListener('contextmenu',e=>e.preventDefault());
$('world').addEventListener('wheel',e=>{e.preventDefault();view.scale(e.deltaY<0?1.12:1/1.12)},{passive:false});
$('minimap').addEventListener('pointerdown',e=>{
 const rect=e.currentTarget.getBoundingClientRect();
 view.center((e.clientX-rect.left)/rect.width*WORLD_W,(e.clientY-rect.top)/rect.height*WORLD_H);
});
document.addEventListener('click',e=>{
 const menu=e.target.closest('[data-menu]');
 const r=e.target.closest('[data-report]');
 const camera=e.target.closest('[data-camera]');
 const selectedButton=e.target.closest('[data-select]');
 const build=e.target.closest('[data-build]');
 const action=e.target.closest('[data-action]');
 if(r)setReport(r.dataset.report);
 if(selectedButton){
  const item=game.get(selectedButton.dataset.select);
  if(item){select(item.id);view.center(item.x+1.5,item.y+1.5);}
 }
 if(build)buildMode(build.dataset.build);
 if(action)runAction(action.dataset.action);
 if(camera){
  if(camera.dataset.camera==='plus')view.scale(1.2);
  if(camera.dataset.camera==='minus')view.scale(1/1.2);
  if(camera.dataset.camera==='center'){const t=game.ownTowns()[0];if(t)view.center(t.x+2,t.y+2);}
 }
 if(menu){
  if(menu.dataset.menu==='save')status(game.save()?'Partita salvata nel browser.':'Salvataggio non disponibile.');
  if(menu.dataset.menu==='new'&&confirm('Cominciare una nuova partita? Il salvataggio attuale verrà sostituito.')){
   game=new SevenGame(Math.floor(Math.random()*1000000));selection=game.ownTowns()[0]?.id||null;cancelBuild();view.center(27,27);game.save();setReport('towns');status('Nuova partita avviata.');
  }
  if(menu.dataset.menu==='help')$('helpDialog').showModal();
  if(menu.dataset.menu==='speed'){game.setSpeed(game.paused?1:game.speed===5?0:game.speed+1);renderHud();}
  if(menu.dataset.menu==='source')window.open('https://github.com/CzekUns/Rtsmobile/tree/main/seven-kingdoms-html/','_blank','noopener');
  $('gameMenu').hidden=true;$('menuBtn').setAttribute('aria-expanded','false');
 }
 if(!e.target.closest('.toptools')&&!$('gameMenu').hidden){
  $('gameMenu').hidden=true;$('menuBtn').setAttribute('aria-expanded','false');
 }
});
$('menuBtn').addEventListener('click',()=>{
 $('gameMenu').hidden=!$('gameMenu').hidden;
 $('menuBtn').setAttribute('aria-expanded',String(!$('gameMenu').hidden));
});
$('cancelBuild').addEventListener('click',cancelBuild);
$('pauseBtn').addEventListener('click',()=>{game.paused=!game.paused;renderHud()});
$('fullscreenBtn').addEventListener('click',async()=>{
 try{
  if(document.fullscreenElement){await document.exitFullscreen();try{screen.orientation?.unlock?.()}catch(_){}}
  else{
   await document.documentElement.requestFullscreen({navigationUI:'hide'});
   try{await screen.orientation?.lock?.('landscape')}catch(_){}
  }
 }catch(_){status('Il browser potrebbe non consentire lo schermo intero.')}
});
document.addEventListener('fullscreenchange',()=>{
 $('fullscreenBtn').textContent=document.fullscreenElement?'⤢':'⛶';resizeStage();
});
document.addEventListener('keydown',e=>{
 if(e.target instanceof HTMLInputElement)return;
 if(e.key==='Escape'){cancelBuild();$('gameMenu').hidden=true;return;}
 if(e.key===' '||e.key==='0'){e.preventDefault();game.paused=!game.paused;renderHud();return;}
 if(/^[1-5]$/.test(e.key)){game.setSpeed(Number(e.key));renderHud();return;}
 if(e.key.toLowerCase()==='s'&&!e.ctrlKey){e.preventDefault();status(game.save()?'Partita salvata.':'Errore di salvataggio.');return;}
 const reports=['kingdoms','towns','economy','trade','military','tech','spies','ranking','news'];
 const index=Number(e.key.slice(1));
 if(e.key.startsWith('F')&&index>=1&&index<=9){e.preventDefault();setReport(reports[index-1]);}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden){game.paused=true;game.save()}else{last=0;renderHud();}});
window.addEventListener('pagehide',()=>game.save());
function tick(t){
 if(!last)last=t;
 const dt=Math.min(.15,(t-last)/1000);last=t;
 if(!portrait.matches){game.update(dt);view.draw(game,selection,ghost);}
 if(t-lastPanel>400){renderPanel();renderHud();lastPanel=t}
 if(t-lastSave>20000){game.save();lastSave=t}
 requestAnimationFrame(tick);
}
renderPanel();renderHud();
if(!localStorage.getItem('seven-kingdoms-html-instructions-v1')){
 localStorage.setItem('seven-kingdoms-html-instructions-v1','1');
 try{$('helpDialog').showModal()}catch(_){}
}
requestAnimationFrame(tick);
