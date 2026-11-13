/* Seven Kingdoms HTML Edition — browser runtime and controls.
 * Game rules live in rules.js, drawing in view.js. GPL-2.0-only.
 */
import {SevenGame,NATIONS,FIRMS,WORLD_W,WORLD_H,SAVE_KEY} from './rules.js';
import {createFrameAccumulator,accumulateFrame} from './core/clock.js';
import {issuePlaytestOrder,advancePlaytestRoutes} from './playtest/path-routes.js';
import {issueGroupMove} from './playtest/group-orders.js';
import {selectUnitsInBox,dragMode} from './playtest/rts-touch-core.js';
import {installMobileRtsControls} from './playtest/mobile-rts-controls.js';
import {syncFullscreenCanvas} from './playtest/fullscreen-layout.js';
import {issueWorkOrder,completeWorkArrivals} from './playtest/work-assignments.js';
import {issueBuildOrder,cancelBuildOrder,advanceConstruction,isBuilder,canBuildFirm} from './playtest/construction.js';
import {issueRepairOrder,cancelRepairOrder,advanceRepairs,canRepair} from './playtest/repairs.js';
import {WorldView} from './view.js?v=coast1';
import {selectionMeter} from './selection-meter.js';
import {installOrdersSidebar} from './playtest/orders-sidebar.js';
import {installMinimapNavigation} from './playtest/minimap-system.js';
import {installReportToolbar} from './playtest/report-toolbar.js';
import {SKILLS,skillLabel,workerRoleLabel,workerRaceLabel,ensureFirmPersonnel} from './playtest/personnel.js';
import {ensureTownRaces,selectedTownRace,recruitableTownPeople} from './playtest/town-races.js';
import {shouldIgnoreGlobalShortcut} from './playtest/keyboard-focus-guard.js';
const $=id=>document.getElementById(id);
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const query=new URLSearchParams(location.search);
const playtest=query.get('playtest')==='1';
const previewOriginalSprites=query.get('sprites')!=='0';
const saveKey=playtest?'seven-kingdoms-html-quick-playtest-v1':SAVE_KEY;
let fixedClock=createFrameAccumulator({tickUs:50000,maxFrameUs:250000});
let game=SevenGame.load(saveKey)||new SevenGame();
const view=new WorldView($('world'),$('minimap'),{previewOriginalSprites,previewOriginalCoasts:query.get('coasts')!=='0'});
installReportToolbar(document.querySelector('.reports'),$('reportsPrev'),$('reportsNext'));
let selection=game.towns.find(t=>t.owner===1)?.id||null;
let report=null,placing=null,placingBuilderId=null,builderMenuId=null,trainingMenuTownId=null,ghost=null,newsUntil=0,last=0,lastPanel=0,lastSave=0;
let input=null,gesture=null,selectionBox=null,groupUnitIds=[];const pointers=new Map();
const portrait=window.matchMedia('(orientation: portrait)');
const touchController=installMobileRtsControls({
 joystick:$('touchJoystick'),thumb:$('touchJoyThumb'),modifier:$('touchModifier'),
 toggle:$('touchControlsToggle'),
 onPan:(dx,dy)=>view.moveCamera(dx*(view.pixelRatio||1),dy*(view.pixelRatio||1))
});
function resizeStage(){
 const rect=$('world').getBoundingClientRect();
 if(rect.width>0&&rect.height>0)
  syncFullscreenCanvas(view,rect.width,rect.height,window.devicePixelRatio||1);
}
resizeStage();
window.addEventListener('resize',resizeStage);
window.addEventListener('orientationchange',resizeStage);
window.visualViewport?.addEventListener('resize',resizeStage);
if(typeof ResizeObserver!=='undefined')new ResizeObserver(resizeStage).observe($('world'));
installOrdersSidebar({
 sidebar:$('orderSidebar'),stage:$('stage'),toggle:$('sidebarToggle'),
 media:window.matchMedia('(max-width:1000px) and (pointer:coarse)')
});
function status(message){
 $('ticker').textContent=message;newsUntil=Date.now()+6000;
}
function selected(){return game.get(selection);}
function select(id){
 if(id&&!game.get(id))return;
 groupUnitIds=[];
 selection=id;
 closeReport();
 renderPanel();
}
function activeGroup(){
 groupUnitIds=groupUnitIds.filter(id=>{
  const u=game.get(id);
  return u&&game.units.includes(u)&&u.owner===1;
 });
 return groupUnitIds;
}
function selectGroup(ids){
 const units=[...new Set(ids)].filter(id=>{
  const u=game.get(id);
  return u&&game.units.includes(u)&&u.owner===1;
 });
 if(units.length<=1){select(units[0]||null);return;}
 groupUnitIds=units;selection=units[0];
 closeReport();renderPanel();
 status(units.length+' unità selezionate · tieni premuto MOD e tocca per spostarle.');
}
function closeReport(){
 if($('reportDialog').open)$('reportDialog').close();
 report=null;
 document.querySelectorAll('[data-report]').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false');});
}
function renderReport(){
 if(!report||!$('reportDialog').open)return;
 const [title,html]=reportContent();
 $('reportTitle').textContent=title.toUpperCase();
 if($('reportBody').innerHTML!==html)$('reportBody').innerHTML=html;
}
function setReport(name){
 report=name;
 document.querySelectorAll('[data-report]').forEach(b=>{const active=b.dataset.report===name;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
 if(!$('reportDialog').open)$('reportDialog').showModal();
 renderReport();
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
function workBtn(firm,unit){
 const reserved=game.units.filter(u=>u!==unit&&u.workTargetId===firm.id).length;
 const full=firm.workers+reserved>=8;
 const near=game.nearestTown(firm);
 const label=FIRMS[firm.kind].label+' · '+(near?near.name:'Mappa')+
  ' ('+firm.workers+'/8'+(reserved?' +'+reserved+' in arrivo':'')+')';
 return '<button type="button" data-work-firm="'+esc(firm.id)+'"'+(full?' disabled':'')+
  '>'+esc(label)+'</button>';
}
function selectedContent(){
 const group=activeGroup();
 if(group.length>1){
  const soldiers=group.filter(id=>game.get(id)?.kind==='soldier').length;
  return {
   title:'Gruppo di '+group.length,
   meta:'Unità selezionate · Greci',color:NATIONS[1].color,
   info:'Soldati <strong>'+soldiers+'</strong> · Abitanti <strong>'+(group.length-soldiers)+'</strong>'+
    '<br>MOD + tocco: muovi il gruppo in formazione.'+
    '<br>Trascina per cambiare selezione. Unità impegnate in cantieri o riparazioni restano ferme.',
   actions:btn('stop-group','Ferma tutte le unità')
  };
 }
 const item=selected();
 if(!item)return {title:'Seven Kingdoms',meta:'HTML Edition',color:'#aaa',info:'Seleziona un elemento sulla mappa.',actions:''};
 const nation=NATIONS[item.owner]||NATIONS[0],color=nation.color;
 if(game.towns.includes(item)){
  const independent=item.owner===0;
  const races=ensureTownRaces(item);
  const selectedRace=selectedTownRace(item);
  const available=selectedRace?recruitableTownPeople(item,selectedRace.raceId):0;
  const info='Popolazione <strong>'+item.pop+'</strong> · '+races.length+' etnie'+
    '<br>'+selectionMeter(independent?'Resistenza':'Fedeltà media',independent?item.resistance:item.loyalty)+
    '<br>Regno: '+esc(nation.name)+
    (selectedRace?'<br>Selezionata: <strong>'+esc(selectedRace.culture)+'</strong> · liberi '+available:'')+
    (item.trainingQueue?.length?'<br>In addestramento: '+item.trainingQueue.length+'/10':'');
  const ownFortLinked=game.ownFirms().some(f=>f.kind==='fort'&&game.linked(f,item));
  const raceButtons=races.filter(r=>r.population>0).map(r=>{
   const active=r.raceId===item.selectedRaceId;
   return '<button type="button" class="town-race-choice'+(active?' active':'')+'" data-town-race="'+esc(r.raceId)+'" aria-pressed="'+active+'">'+
    esc(r.culture)+' · '+r.population+' abitanti'+
    '<small>Disoccupati '+r.jobless+' · Fedeltà '+Math.floor(r.loyalty)+'</small>'+ 
    selectionMeter('Fedeltà '+r.culture,r.loyalty,100,{decorative:true})+'</button>';
  }).join('');
  const canRecruit=item.owner===1&&item.pop>4&&available>0&&selectedRace?.loyalty>=30;
  const canTrain=canRecruit&&ownFortLinked&&game.cash>=30&&(item.trainingQueue?.length||0)<10;
  const skillButtons=trainingMenuTownId===item.id?
   '<div class="worker-empty">Addestra '+esc(selectedRace?.culture||'')+' · 30 monete / 5 giorni ciascuno:</div>'+
   SKILLS.filter(s=>s.trainable).map(s=>
    '<button type="button" data-train-skill="'+s.id+'"'+(canTrain?'':' disabled')+'>'+
     esc(s.label)+' · 30</button>').join(''):'';
  const queueButtons=(item.trainingQueue||[]).map(q=>
   '<div class="train-queue-row"><small>G '+q.readyDay+' · '+esc(q.culture||'')+' · '+
   esc(SKILLS[q.skillId]?.label||'Specialista')+'</small>'+
   (item.owner===1?'<button type="button" data-cancel-training="'+esc(q.id)+'">Annulla</button>':'')+'</div>'
  ).join('');
  const actions=item.owner===1?[
   '<div class="worker-empty">Scegli la popolazione:</div>',raceButtons,
   btn('recruit','Recluta '+(selectedRace?.culture||''),!canRecruit),
   btn('train-menu',trainingMenuTownId===item.id?'Chiudi addestramento':'Addestra una professione',!canRecruit||!ownFortLinked),
   skillButtons,
   queueButtons?'<div class="worker-empty">Coda di formazione (massimo 10):</div>'+queueButtons:'',
   btn('tax','Tasse',item.loyalty<=10||!ownFortLinked),
   btn('grant','Sussidio ('+(item.pop*10)+')',game.cash<item.pop*10||!ownFortLinked)
  ].join(''):independent?[
   '<div class="worker-empty">Popolazioni:</div>',raceButtons,
   btn('persuade','Influenza (100)',game.cash<100||!game.ownFirms().some(f=>f.kind==='fort'&&game.linked(f,item))),
   btn('annex','Unisci al regno',item.resistance>15)
  ].join(''):'<div class="worker-empty">Popolazioni:</div>'+raceButtons;
  return {title:item.name,meta:'Villaggio · '+nation.name,color,info,actions};
 }
 if(game.firms.includes(item)){
  const rule=FIRMS[item.kind];
  const staff=ensureFirmPersonnel(item);
  const needsRepair=item.owner===1&&!item.underConstruction&&(item.hp??100)<(item.maxHp??100);
  const hasRepairer=game.units.some(u=>u.repairTargetId===item.id);
  const availableBuilder=game.units.some(u=>canRepair(u,item)&&!u.buildSiteId&&!u.workTargetId&&!u.repairTargetId);
  const repairAction=needsRepair?
   '<button type="button" data-repair-firm="'+esc(item.id)+'"'+
    (!availableBuilder||hasRepairer?' disabled':'')+'>'+
    (hasRepairer?'Riparazione in corso':'Manda un costruttore a riparare')+'</button>':'';
  const people=staff.map((person,i)=>{
   const who=person.name||('Lavoratore '+(i+1));
   const role=workerRoleLabel(person);
   const profile=person.legacyUnknown?'Abilità precedenti non documentate':
    skillLabel(person.skillId,person.skillLevel);
   const ethnicity=workerRaceLabel(person);
   return '<div class="worker-row"><strong>'+esc(who)+'</strong>'+
    '<small>'+esc(role)+' · '+esc(ethnicity)+'</small>'+
    '<small>'+esc(profile)+'</small><small>ID '+esc(person.personId??person.id)+'</small>'+ 
    selectionMeter('Salute '+who,person.hp??100)+' '+ 
    (item.owner===1?'<button type="button" data-worker-exit="'+esc(person.id)+'">Fai uscire</button>':'')+
    '</div>';
  }).join('');
  return {
   title:rule.label,meta:'Edificio · '+nation.name,color,
   info:'Lavoratori <strong>'+staff.length+'</strong>/8'+
    '<br>'+selectionMeter('Integrità edificio',item.hp??100,item.maxHp??100)+
    (item.underConstruction?'<br>'+selectionMeter('In costruzione',item.buildProgress||0,1):'')+
    '<br>Esperienza '+Math.floor(item.experience)+
    (item.kind==='fort'?'<br>Il forte influenza i villaggi collegati.':
      item.kind==='mine'?'<br>Produce minerali grezzi.':
      item.kind==='factory'?'<br>Trasforma minerali in prodotti.':
      item.kind==='market'?'<br>Vende prodotti per denaro.':'')+
    '<br>'+(game.linked(item,game.nearestTown(item))?'Collegato a un villaggio':'Nessun villaggio collegato'),
   actions:repairAction+(people||'<div class="worker-empty">Nessun lavoratore in questo edificio.</div>')
  };
 }
 if(game.units.includes(item)){
  const assignedTo=item.workTargetId&&game.get(item.workTargetId);
  const eligible=game.ownFirms().filter(f=>item.kind==='peasant'||f.kind==='fort');
  eligible.sort((a,b)=>Math.hypot(item.x-a.x,item.y-a.y)-
    Math.hypot(item.x-b.x,item.y-b.y));
  const jobActions=eligible.map(f=>workBtn(f,item)).join('');
  const buildButtons=builderMenuId===item.id&&isBuilder(item)?
   '<div class="worker-empty">Scegli il tipo da costruire:</div>'+
   Object.entries(FIRMS).filter(([kind])=>canBuildFirm(item,kind)).map(([kind,config])=>
    '<button type="button" data-builder-kind="'+esc(kind)+'"'+
    (game.cash<config.cost?' disabled':'')+'>'+esc(config.label)+' · '+config.cost+' monete</button>'
   ).join(''):'';
  const activeSite=(game.constructionSites||[]).find(s=>s.builderId===item.id);
  const activeRepair=item.repairTargetId&&game.get(item.repairTargetId);
  const repairOptions=item.skillId===1?
   game.ownFirms().filter(f=>canRepair(item,f)).map(f=>
    '<button type="button" data-repair-firm="'+esc(f.id)+'">'+
     'Ripara '+esc(FIRMS[f.kind].label)+' ('+Math.floor(f.hp??100)+'/'+(f.maxHp??100)+' HP)</button>'
   ).join(''):'';
  return {
   title:item.kind==='soldier'?'Soldato':'Abitante',
   meta:nation.name+' · Livello '+item.level,color,
   info:selectionMeter('Salute unità',item.hp??100,100)+' · '+esc(item.culture||'Etnia non registrata')+
    '<br>Abilità '+esc(skillLabel(item.skillId,item.skillLevel,item.legacyUnknown))+
    ' · Combattimento '+Math.floor(item.combatLevel||0)+
    '<br>ID '+esc(item.personId??item.id)+
    '<br>'+(activeRepair?'Riparazione '+esc(FIRMS[activeRepair.kind]?.label||activeRepair.kind)+
      ' · '+selectionMeter('Integrità riparazione',activeRepair.hp??100,activeRepair.maxHp??100):
     activeSite?'Cantiere '+esc(FIRMS[activeSite.kind]?.label||activeSite.kind)+
      ' · '+(activeSite.status==='walking'?'In marcia':selectionMeter('Avanzamento cantiere',activeSite.progress??0,1)):
     assignedTo?'In viaggio verso '+esc(FIRMS[assignedTo.kind]?.label||'edificio'):
           item.target?'In marcia':'Pronto per gli ordini')+
    '<br>Su smartphone usa MOD + tocco per spostarti, oppure scegli un edificio qui sotto. L\'abitante entrerà solo dopo aver raggiunto l\'ingresso.',
   actions:item.owner===1?[
    btn('move','Sposta: MOD + tocco'),
    btn('stop','Ferma / annulla ordine',!item.target&&!item.workTargetId&&!item.buildSiteId&&!item.repairTargetId),
    isBuilder(item)?btn('builder-menu','Costruisci · scegli edificio'):null,
    buildButtons,
    repairOptions,
    jobActions
   ].filter(Boolean).join(''):''
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
   '<div class="card"><b>Costruisci</b><p>Seleziona prima un costruttore o uno specialista: ogni professione può erigere solo strutture compatibili.</p>'+
   Object.entries(FIRMS).map(([id,v])=>'<button type="button" class="report-item" data-build="'+id+'"'+
   (game.cash<v.cost||!canBuildFirm(selected(),id)?' disabled':'')+'>'+esc(v.label)+'<small>'+v.cost+' monete</small></button>').join('')+'</div>'+
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
 if($('selectionActions').innerHTML!==summary.actions)$('selectionActions').innerHTML=summary.actions;
 renderReport();
}
function runAction(action){
 if(action==='stop-group'){
  const ids=activeGroup();
  if(ids.length<=1)return;
  for(const id of ids){
   const unit=game.get(id);
   if(!unit)continue;
   cancelBuildOrder(game,id);cancelRepairOrder(game,id);
   unit.route=[];unit.target=null;unit.workTargetId=null;
  }
  status('Gruppo fermato: '+ids.length+' unità.');
  game.save(saveKey);renderPanel();renderHud();return;
 }
 const obj=selected();if(!obj)return;
 let r={ok:false,msg:'Ordine non valido.'};
 if(action==='recruit')r=game.recruit(obj.id,obj.selectedRaceId);
 if(action==='train-menu'&&game.towns.includes(obj)){
  trainingMenuTownId=trainingMenuTownId===obj.id?null:obj.id;
  status('Scegli una professione e poi osserva la coda.');
  renderPanel();return;
 }
 if(action==='builder-menu'&&game.units.includes(obj)&&isBuilder(obj)){
  builderMenuId=builderMenuId===obj.id?null:obj.id;
  status('Seleziona un edificio da costruire.');
  renderPanel();return;
 }
 if(action==='tax')r=game.tax(obj.id);
 if(action==='grant')r=game.grant(obj.id);
 if(action==='persuade')r=game.persuade(obj.id);
 if(action==='annex')r=game.annex(obj.id);
 if(action==='dismiss')r=game.dismiss(obj.id);
 if(action==='move'&&game.units.includes(obj))r={ok:true,msg:'Su smartphone: tieni premuto MOD e tocca il terreno. Sul PC: tasto destro.'};
 if(action==='stop'&&game.units.includes(obj)){
  const cancelled=cancelBuildOrder(game,obj.id);
  const cancelledRepair=cancelRepairOrder(game,obj.id);
  obj.target=null;obj.route=[];obj.workTargetId=null;
  r=cancelled.ok?cancelled:cancelledRepair.ok?cancelledRepair:{ok:true,msg:'Ordine annullato. Unità fermata.'};
 }
 status(r.msg);
 if(r.ok)game.save(saveKey);
 if(r.unit)selection=r.unit.id;
 renderPanel();renderHud();
}
function buildMode(kind){
 if(!FIRMS[kind])return;
 const builder=selected();
 if(!builder||!game.units.includes(builder)||!isBuilder(builder)){
  status('Seleziona un Costruttore o uno specialista che sappia costruire.');
  return;
 }
 if(!canBuildFirm(builder,kind)){
  status('Questa professione non può costruire '+FIRMS[kind].label+'.');
  return;
 }
 if(builder.buildSiteId){
  status('Questo costruttore ha già un ordine. Usa Ferma per annullare.');
  return;
 }
 placing=kind;placingBuilderId=builder.id;builderMenuId=null;
 ghost={kind,x:Math.floor(builder.x+2),y:Math.floor(builder.y+2)};
 $('buildLabel').textContent=FIRMS[kind].label+' · tocca una posizione valida';
 $('buildBar').hidden=false;
 status('Indica il luogo del cantiere sulla mappa.');
}
function cancelBuild(){placing=null;placingBuilderId=null;ghost=null;$('buildBar').hidden=true}
function sendOrder(unitId,x,y){
 const unit=game.get(unitId);
 if(unit?.buildSiteId||unit?.repairTargetId)return {ok:false,msg:'Costruzione o riparazione attiva. Usa Ferma prima di cambiare ordine.'};
 const firm=game.firms.find(f=>x>=f.x&&x<f.x+f.size&&y>=f.y&&y<f.y+f.size);
 if(firm)return issueWorkOrder(game,unitId,firm.id);
 const result=playtest?issuePlaytestOrder(game,unitId,x,y):game.order(unitId,x,y);
 if(result.ok){
  const u=game.get(unitId);
  if(u){
   u.workTargetId=null;
   if(!playtest)u.route=[];
  }
 }
 return result;
}
function handleConstructionEvents(events){
 for(const event of events){
  status(event.msg);
  if(event.type==='completed'&&event.autoAssigned&&selection===event.builderId)
   selection=event.firmId;
 }
}
function finishWorkOrders(){
 if(game.paused)return;
 const results=completeWorkArrivals(game);
 for(const result of results){
  if(result.ok&&selection===result.unitId)selection=result.firmId;
  status(result.msg);
 }
 if(results.length){renderPanel();game.save(saveKey);}
}
function mapClick(sx,sy,right=false,{touch=false}={}){
 const p=view.worldAt(sx,sy);let x=p.x,y=p.y;
 if(placing){
  if(right){cancelBuild();status('Posizionamento annullato con MOD.');return;}
  const result=issueBuildOrder(game,placingBuilderId,placing,x,y);
  status(result.msg);
  if(result.ok){cancelBuild();game.save(saveKey);renderPanel();renderHud();}
  return;
 }
 const hit=view.pick(game,x,y),unit=selected();
 const canOrder=unit&&game.units.includes(unit)&&unit.owner===1;
 if(right&&activeGroup().length>1){
  const result=issueGroupMove(game,groupUnitIds,x,y);
  status(result.msg);
  if(result.ok)game.save(saveKey);
  renderPanel();return;
 }
 if(right&&canOrder){
  const r=sendOrder(unit.id,x,y);status(r.msg);renderPanel();return;
 }
 if(hit){
  const item=game.get(hit);
  if(!touch&&canOrder&&item&&game.firms.includes(item)&&item.owner===1&&item.id!==unit.id){
   const r=sendOrder(unit.id,x,y);status(r.msg);
   if(r.ok&&r.unit)selection=r.unit.id;
   renderPanel();return;
  }
  select(hit);return;
 }
 if(!touch&&canOrder){
  const r=sendOrder(unit.id,x,y);status(r.msg);renderPanel();return;
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
 if(pointers.size===1){
  const touch=e.pointerType!=='mouse',right=e.button===2||(touch&&touchController.modifierHeld());
  input={id:e.pointerId,start:p,last:p,moved:false,right,touch,
   mode:dragMode({placing:!!placing,modifier:right,button:e.button})};
 }
 if(pointers.size===2){
  const [a,b]=[...pointers.values()];
  gesture={dist:Math.hypot(a.x-b.x,a.y-b.y),zoom:view.zoom};input=null;selectionBox=null;
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
 if(Math.hypot(p.x-input.start.x,p.y-input.start.y)>9)input.moved=true;
 if(input.moved){
  if(input.mode==='box')selectionBox={start:input.start,end:p};
  else if(input.mode==='pan')view.moveCamera(p.x-input.last.x,p.y-input.last.y);
 }
 input.last=p;
});
function endPointer(e,cancel=false){
 if(!pointers.has(e.pointerId))return;
 const p=eventXY(e);
 if(!cancel&&pointers.size===1&&input){
  if(!input.moved)mapClick(p.x,p.y,input.right,{touch:input.touch});
  else if(input.mode==='box'){
   const ids=selectUnitsInBox(game.units,input.start,p,u=>view.screen(u.x,u.y));
   selectGroup(ids);
   if(!ids.length)status('Nessuna tua unità nel riquadro.');
  }else if(input.mode==='placement'&&!input.right)
   mapClick(p.x,p.y,false,{touch:input.touch});
 }
 pointers.delete(e.pointerId);input=null;selectionBox=null;
 if(pointers.size<2)gesture=null;
}
$('world').addEventListener('pointerup',e=>endPointer(e,false));
$('world').addEventListener('pointercancel',e=>endPointer(e,true));
$('world').addEventListener('contextmenu',e=>e.preventDefault());
$('world').addEventListener('wheel',e=>{e.preventDefault();view.scale(e.deltaY<0?1.12:1/1.12)},{passive:false});
// Mouse/touch drag and focused keyboard navigation share the same camera.
installMinimapNavigation($('minimap'),view,WORLD_W,WORLD_H);
document.addEventListener('click',e=>{
 const menu=e.target.closest('[data-menu]');
 const r=e.target.closest('[data-report]');
 const camera=e.target.closest('[data-camera]');
 const selectedButton=e.target.closest('[data-select]');
 const build=e.target.closest('[data-build]');
 const action=e.target.closest('[data-action]');
 const work=e.target.closest('[data-work-firm]');
 const workerExit=e.target.closest('[data-worker-exit]');
 const repairFirm=e.target.closest('[data-repair-firm]');
 const builderChoice=e.target.closest('[data-builder-kind]');
 const townRace=e.target.closest('[data-town-race]');
 const trainSkill=e.target.closest('[data-train-skill]');
 const cancelTraining=e.target.closest('[data-cancel-training]');
 if(r)setReport(r.dataset.report);
 if(selectedButton){
  const item=game.get(selectedButton.dataset.select);
  if(item){select(item.id);view.center(item.x+1.5,item.y+1.5);}
 }
 if(build){closeReport();buildMode(build.dataset.build);}
 if(builderChoice)buildMode(builderChoice.dataset.builderKind);
 if(townRace){
  const town=selected();
  if(town&&game.towns.includes(town)){
   ensureTownRaces(town);
   if(town.races.some(r=>r.raceId===townRace.dataset.townRace)){
    town.selectedRaceId=townRace.dataset.townRace;
    game.save(saveKey);renderPanel();
   }
  }
 }
 if(trainSkill){
  const town=selected();
  if(town&&game.towns.includes(town)){
   const result=game.trainSkill(town.id,town.selectedRaceId,Number(trainSkill.dataset.trainSkill));
   status(result.msg);
   if(result.ok)game.save(saveKey);
   renderPanel();renderHud();
  }
 }
 if(cancelTraining){
  const town=selected();
  if(town&&game.towns.includes(town)){
   const result=game.cancelTraining(town.id,cancelTraining.dataset.cancelTraining);
   status(result.msg);
   if(result.ok)game.save(saveKey);
   renderPanel();renderHud();
  }
 }
 if(action)runAction(action.dataset.action);
 if(repairFirm){
  const firm=game.get(repairFirm.dataset.repairFirm),current=selected();
  if(firm&&game.firms.includes(firm)){
   const choices=game.units.filter(u=>canRepair(u,firm)&&
    !u.buildSiteId&&!u.workTargetId&&!u.repairTargetId);
   choices.sort((a,b)=>Math.hypot(a.x-firm.x,a.y-firm.y)-
    Math.hypot(b.x-firm.x,b.y-firm.y));
   const builder=game.units.includes(current)&&canRepair(current,firm)?current:choices[0];
   const result=builder?issueRepairOrder(game,builder.id,firm.id):
    {ok:false,msg:'Nessun costruttore libero: reclutane uno dal villaggio.'};
   status(result.msg);
   if(result.ok){selection=builder.id;game.save(saveKey);}
   renderPanel();renderHud();
  }
 }
 if(workerExit){
  const item=selected();
  if(item&&game.firms.includes(item)){
   const result=game.dismiss(item.id,workerExit.dataset.workerExit);
   status(result.msg);
   if(result.ok&&result.unit){selection=result.unit.id;game.save(saveKey);}
   renderPanel();renderHud();
  }
 }
 if(work){
  const u=selected();
  if(u&&game.units.includes(u)){
   const result=issueWorkOrder(game,u.id,work.dataset.workFirm);
   status(result.msg);
   if(result.ok)game.save(saveKey);
   renderPanel();renderHud();
  }
 }
 if(camera){
  if(camera.dataset.camera==='plus')view.scale(1.2);
  if(camera.dataset.camera==='minus')view.scale(1/1.2);
  if(camera.dataset.camera==='center'){const t=game.ownTowns()[0];if(t)view.center(t.x+2,t.y+2);}
  if(camera.dataset.camera==='normans'){const t=game.towns.find(t=>t.owner===2);if(t){view.center(t.x+1,t.y+1);status('Eboracum · regno normanno');}}
 }
 if(menu){
  if(menu.dataset.menu==='save')status(game.save(saveKey)?'Partita salvata nel browser.':'Salvataggio non disponibile.');
  if(menu.dataset.menu==='new'&&confirm('Cominciare una nuova partita? Il salvataggio attuale verrà sostituito.')){
   game=new SevenGame(Math.floor(Math.random()*1000000));selection=game.ownTowns()[0]?.id||null;groupUnitIds=[];selectionBox=null;trainingMenuTownId=null;cancelBuild();view.center(27,27);game.save(saveKey);closeReport();renderPanel();status('Nuova partita avviata.');
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
$('reportDialog').addEventListener('close',()=>{
 report=null;
 document.querySelectorAll('[data-report]').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false');});
});
$('closeReport').addEventListener('click',closeReport);
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
 if(e.key==='Escape'){
  if(!$('helpDialog').open&&!$('reportDialog').open){cancelBuild();$('gameMenu').hidden=true;$('menuBtn').setAttribute('aria-expanded','false');}
  return;
 }
 if(shouldIgnoreGlobalShortcut(e.target,$('helpDialog').open||$('reportDialog').open))return;
 if(e.key===' '||e.key==='0'){e.preventDefault();game.paused=!game.paused;renderHud();return;}
 if(/^[1-5]$/.test(e.key)){game.setSpeed(Number(e.key));renderHud();return;}
 if(e.key.toLowerCase()==='s'&&!e.ctrlKey){e.preventDefault();status(game.save(saveKey)?'Partita salvata.':'Errore di salvataggio.');return;}
 const reports=['kingdoms','towns','economy','trade','military','tech','spies','ranking','news'];
 const index=Number(e.key.slice(1));
 if(e.key.startsWith('F')&&index>=1&&index<=9){e.preventDefault();setReport(reports[index-1]);}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden){game.paused=true;game.save(saveKey)}else{last=0;renderHud();}});
window.addEventListener('pagehide',()=>game.save(saveKey));
function tick(t){
 if(!last)last=t;
 const rawDt=Math.max(0,(t-last)/1000);last=t;
 if(!portrait.matches){
  if(playtest){
   const frame=accumulateFrame(fixedClock,Math.max(0,Math.round(rawDt*1e6)),game.paused);
   fixedClock=frame.accumulator;
   for(let i=0;i<frame.ticks;i++){
    game.update(.05,{moveUnits:false});
    advancePlaytestRoutes(game,.05*game.speed);
    finishWorkOrders();
    handleConstructionEvents(advanceConstruction(game,.05*game.speed));
    handleConstructionEvents(advanceRepairs(game));
   }
  }else{
   const seconds=Math.min(.15,rawDt);
   game.update(seconds);
   const travel=seconds*game.speed;
   const chunks=Math.max(1,Math.ceil(travel/.25));
   for(let i=0;i<chunks;i++)advancePlaytestRoutes(game,travel/chunks);
   finishWorkOrders();
   handleConstructionEvents(advanceConstruction(game,travel));
   handleConstructionEvents(advanceRepairs(game));
  }
  view.draw(game,selection,ghost,groupUnitIds,selectionBox,t);
 }
 if(t-lastPanel>400){renderPanel();renderHud();lastPanel=t}
 if(t-lastSave>20000){game.save(saveKey);lastSave=t}
 requestAnimationFrame(tick);
}
renderPanel();renderHud();
if(playtest)status('MODALITÀ TEST · percorsi attorno ad acqua ed edifici · salvataggio separato.');
if(previewOriginalSprites)status('ASSET ORIGINALI · Normanni blu a Eboracum; premi N per raggiungerli. Costa SG originale in anteprima su terreno demo; altri biomi e vegetazione da convertire.');
if(!localStorage.getItem('seven-kingdoms-html-instructions-v1')){
 localStorage.setItem('seven-kingdoms-html-instructions-v1','1');
 try{$('helpDialog').showModal()}catch(_){}
}
requestAnimationFrame(tick);
