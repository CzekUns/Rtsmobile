/* Seven Kingdoms — native JavaScript reconstruction, 7KAA-inspired.
 * GPL-2.0-only. This is a partial reimplementation, not 7kaa.wasm.
 * Core simulation: edit here, no compiler or WebAssembly required.
 */
import {ensureFirmPersonnel,staffFromUnit,releasedUnitAttributes} from './playtest/personnel.js';
export const WORLD_W=76,WORLD_H=66;
export const NATIONS=[
  {id:0,name:'Indipendenti',color:'#d3ba74'},
  {id:1,name:'Greci',color:'#c94741'},
  {id:2,name:'Normanni',color:'#5595da'}
];
export const FIRMS={
  fort:{label:'Forte',cost:400,size:3,description:'Allena soldati e rafforza la fedeltà dei villaggi vicini.'},
  mine:{label:'Miniera',cost:310,size:3,description:'Estrae minerali dalle colline.'},
  factory:{label:'Fabbrica',cost:280,size:3,description:'Trasforma minerali grezzi in prodotti.'},
  market:{label:'Mercato',cost:240,size:3,description:'Vende prodotti e genera entrate.'},
  research:{label:'Torre della Scienza',cost:360,size:3,description:'Permette di sviluppare tecnologie.'},
  inn:{label:'Locanda',cost:210,size:3,description:'Luogo di incontro, reclutamento e ospitalità.'}
};
export const SAVE_KEY='seven-kingdoms-html-native-v1';
// Exact starting constants from upstream 7KAA include/OTOWN.h and GAMEDEF.h.
// The simplified one-culture-per-town data model is still being ported.
export const RULE_CONSTANTS=Object.freeze({
 MAX_TOWN_POPULATION:60, TAX_PER_PERSON:5,
 COLLECT_TAX_LOYALTY_DECREASE:10,
 TOWN_REWARD_PER_PERSON:10,TOWN_REWARD_LOYALTY_INCREASE:10,
 PEASANT_FOOD_YEAR_PRODUCTION:30,PERSON_FOOD_YEAR_CONSUMPTION:10
});
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const rnd=(seed,x,y)=>{
 let h=((seed|0)^(x*374761393)^(y*668265263))|0;
 h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;
};
export function terrain(seed,x,y){
 const waterline=Math.sin(x*.16+seed*.01)+Math.sin(y*.13-x*.07)+Math.cos(y*.21+seed*.001);
 if(waterline>2.15)return 'water';
 const h=rnd(seed,Math.floor(x/2),Math.floor(y/2));
 if(h>.885)return 'hill';
 if(h>.66)return 'forest';
 if(h<.16)return 'dry';
 return 'grass';
}
export function range(a,b){return Math.hypot((a.x||0)-(b.x||0),(a.y||0)-(b.y||0));}
let nextId=1;
function entity(prefix,p){return {id:prefix+(nextId++),...p};}
export class SevenGame{
 constructor(seed=73429){
  this.version=1;this.seed=seed;this.day=1;this.elapsed=0;
  this.cash=1550;this.food=760;this.raw=0;this.goods=0;this.knowledge=0;
  this.speed=1;this.paused=false;this.unitTimer=0;this.dayTimer=0;
  this.events=[];this.towns=[];this.firms=[];this.units=[];
  this.createSkirmish();
  for(const firm of this.firms)ensureFirmPersonnel(firm);
 }
 static load(key=SAVE_KEY){
  try{
   const data=JSON.parse(localStorage.getItem(key)||'null');
   if(!data||data.version!==1)return null;
   const g=Object.create(SevenGame.prototype);
   Object.assign(g,data);g.events??=[];g.unitTimer??=0;g.dayTimer??=0;
   g.towns??=[];g.firms??=[];g.units??=[];g.paused=false;
   for(const firm of g.firms)ensureFirmPersonnel(firm);
   for(const town of g.towns){town.taxPenalty??=0;town.rewardPenalty??=0;town.recruitPenalty??=0;}
   const all=[...g.towns,...g.firms,...g.units];
   nextId=Math.max(1,...all.map(o=>Number(String(o.id).slice(1))||0))+1;
   return g;
  }catch(_){return null;}
 }
 save(key=SAVE_KEY){try{localStorage.setItem(key,JSON.stringify(this));return true}catch(_){return false}}
 note(message){this.events.unshift({day:this.day,text:message});this.events=this.events.slice(0,70);}
 createSkirmish(){
  const towns=[
   {name:'Corinto',owner:1,x:24,y:24,pop:42,loyalty:78,resistance:0,culture:'Greci'},
   {name:'Eboracum',owner:2,x:53,y:36,pop:43,loyalty:83,resistance:0,culture:'Normanni'},
   {name:'Selene',owner:0,x:37,y:17,pop:30,loyalty:0,resistance:65,culture:'Greci'},
   {name:'Naxos',owner:0,x:14,y:45,pop:22,loyalty:0,resistance:52,culture:'Greci'},
   {name:'Thasos',owner:0,x:57,y:13,pop:26,loyalty:0,resistance:71,culture:'Normanni'}
  ];
  towns.forEach(t=>this.towns.push(entity('t',{...t,size:4,growth:0,taxCounter:0,taxPenalty:0,rewardPenalty:0,recruitPenalty:0})));
  const add=(kind,owner,x,y,workers=0)=>this.firms.push(entity('f',{kind,owner,x,y,size:3,workers,experience:0,progress:0,stock:0}));
  add('fort',1,30,24,3);add('market',1,25,30,2);add('mine',1,18,27,2);
  add('fort',2,49,35,4);add('factory',2,55,41,3);
  for(const [x,y,kind] of [[29,21,'soldier'],[29,23,'soldier'],[22,29,'peasant'],[23,29,'peasant']])
   this.units.push(entity('u',{owner:1,x,y,kind,hp:100,level:1,target:null,training:kind==='soldier'?45:5}));
  for(const u of this.units){
   u.personId=u.id;u.culture=u.owner===1?'Greci':'Normanni';
   u.raceId=null; // Original 7KAA race IDs are not yet migrated into this demo.
   u.skillId=0;u.skillLevel=0;
   u.combatLevel=u.kind==='soldier'?Math.floor(u.training):0;
  }
  this.note('Un nuovo regno greco sorge presso Corinto.');
  this.note('I villaggi indipendenti sorvegliano i propri confini.');
 }
 get(id){return [...this.units,...this.towns,...this.firms].find(e=>e.id===id)||null;}
 ownTowns(){return this.towns.filter(t=>t.owner===1)}
 ownFirms(){return this.firms.filter(f=>f.owner===1)}
 occupied(x,y,size=1){
  if(x<0||y<0||x+size>WORLD_W||y+size>WORLD_H)return true;
  return [...this.towns,...this.firms].some(o=>x<o.x+o.size&&x+size>o.x&&y<o.y+o.size&&y+size>o.y);
 }
 nearestTown(firm,owner=firm.owner){
  return this.towns.filter(t=>t.owner===owner).sort((a,b)=>range(a,firm)-range(b,firm))[0]||null;
 }
 linked(firm,town){return !!town&&range({x:firm.x+1.5,y:firm.y+1.5},{x:town.x+2,y:town.y+2})<=11.8}
 recruit(townId){
  const t=this.get(townId);
  if(!t||t.owner!==1)return {ok:false,msg:'Questo non è un tuo villaggio.'};
  if(t.pop<=4)return {ok:false,msg:'Popolazione insufficiente.'};
  if(t.loyalty<27)return {ok:false,msg:'La fedeltà del villaggio è troppo bassa.'};
  // Upstream OTOWNIF.cpp Town::recruit_dec_loyalty, simplified to one ethnic group.
  const loyaltyDec=Math.min(10,Math.min(5,RULE_CONSTANTS.MAX_TOWN_POPULATION/t.pop)+(t.recruitPenalty||0)/5);
  t.recruitPenalty=(t.recruitPenalty||0)+5;
  t.pop--;t.loyalty=clamp(t.loyalty-loyaltyDec,0,100);
  const u=entity('u',{owner:1,x:t.x+t.size+1,y:t.y+1,kind:'peasant',hp:100,level:1,target:null,training:0});
  u.personId=u.id;u.culture=t.culture;u.raceId=null;
  u.skillId=0;u.skillLevel=0;u.combatLevel=0;
  this.units.push(u);this.note('Un abitante è stato reclutato a '+t.name+'.');
  return {ok:true,msg:'Abitante reclutato.',unit:u};
 }
 tax(townId){
  const t=this.get(townId);
  if(!t||t.owner!==1)return {ok:false,msg:'Non puoi riscuotere tasse qui.'};
  if(!this.ownFirms().some(f=>f.kind==='fort'&&this.linked(f,t)))return {ok:false,msg:'Occorre un forte amico collegato.'};
  if(t.loyalty<=RULE_CONSTANTS.COLLECT_TAX_LOYALTY_DECREASE)return {ok:false,msg:'Fedeltà troppo bassa per altre tasse.'};
  // Port of OTOWN.cpp Town::collect_tax: escalating levy penalty, bounded to +10.
  const decrease=Math.min(20,RULE_CONSTANTS.COLLECT_TAX_LOYALTY_DECREASE+(t.taxPenalty||0)/5);
  const before=t.loyalty;
  t.loyalty=clamp(before-decrease,0,100);
  const income=(before-t.loyalty)*t.pop*RULE_CONSTANTS.TAX_PER_PERSON/decrease;
  t.taxPenalty=(t.taxPenalty||0)+10;this.cash+=income;
  this.note(t.name+' ha versato '+Math.floor(income)+' monete di tasse.');
  return {ok:true,msg:'Riscosse '+Math.floor(income)+' monete.'};
 }
 grant(townId){
  const t=this.get(townId);
  if(!t||t.owner!==1)return {ok:false,msg:'Non è un tuo villaggio.'};
  if(!this.ownFirms().some(f=>f.kind==='fort'&&this.linked(f,t)))return {ok:false,msg:'Occorre un forte amico collegato.'};
  const cost=t.pop*RULE_CONSTANTS.TOWN_REWARD_PER_PERSON;
  if(this.cash<cost)return {ok:false,msg:'Occorrono '+cost+' monete.'};
  // Port of OTOWN.cpp Town::reward: repeated grants have diminishing effect.
  const bonus=Math.max(3,RULE_CONSTANTS.TOWN_REWARD_LOYALTY_INCREASE-(t.rewardPenalty||0)/5);
  t.rewardPenalty=(t.rewardPenalty||0)+10;
  this.cash-=cost;t.loyalty=clamp(t.loyalty+bonus,0,100);
  this.note('Concessi sussidi al villaggio '+t.name+' per '+cost+' monete.');
  return {ok:true,msg:'Fedeltà +'+bonus+' (costo '+cost+').'};
 }
 persuade(townId){
  const t=this.get(townId);
  if(!t||t.owner!==0)return {ok:false,msg:'Non è un villaggio indipendente.'};
  if(this.cash<100)return {ok:false,msg:'Occorrono 100 monete.'};
  if(!this.ownFirms().some(f=>f.kind==='fort'&&this.linked(f,t)))return {ok:false,msg:'Serve un forte collegato al villaggio.'};
  this.cash-=100;t.resistance=clamp(t.resistance-18,0,100);
  this.note('Diplomazia a '+t.name+': resistenza '+t.resistance+'.');
  return {ok:true,msg:'Resistenza ridotta a '+t.resistance+'.'};
 }
 annex(townId){
  const t=this.get(townId);
  if(!t||t.owner!==0)return {ok:false,msg:'Villaggio non indipendente.'};
  if(t.resistance>15)return {ok:false,msg:'La resistenza deve scendere a 15 o meno.'};
  t.owner=1;t.loyalty=50;t.resistance=0;
  this.note(t.name+' è entrata nel tuo regno.');
  return {ok:true,msg:t.name+' ora appartiene al tuo regno.'};
 }
 build(kind,x,y){
  const rule=FIRMS[kind];
  if(!rule)return {ok:false,msg:'Edificio inesistente.'};
  x=Math.floor(x);y=Math.floor(y);
  if(this.cash<rule.cost)return {ok:false,msg:'Non hai abbastanza monete.'};
  if(this.occupied(x,y,rule.size))return {ok:false,msg:'La zona è occupata.'};
  if(!this.ownTowns().some(t=>range({x,y},t)<13))return {ok:false,msg:'Costruisci vicino a un villaggio del tuo regno.'};
  if(kind==='mine'&&!this.hasHills(x,y,rule.size))return {ok:false,msg:'Una miniera richiede colline o minerali.'};
  const f=entity('f',{kind,owner:1,x,y,size:rule.size,workers:0,experience:0,progress:0,stock:0});
  this.cash-=rule.cost;this.firms.push(f);
  this.note(FIRMS[kind].label+' costruito. Assegna un lavoratore.');
  return {ok:true,msg:'Costruito: '+rule.label+'.',firm:f};
 }
 hasHills(x,y,s){
  for(let j=-2;j<s+2;j++)for(let i=-2;i<s+2;i++)if(terrain(this.seed,x+i,y+j)==='hill')return true;
  return false;
 }
 order(unitId,x,y){
  const u=this.get(unitId);
  if(!u||!u.kind||!['soldier','peasant'].includes(u.kind)||u.owner!==1)return {ok:false,msg:'Seleziona un soldato o un abitante.'};
  if(x<0||y<0||x>=WORLD_W||y>=WORLD_H)return {ok:false,msg:'Fuori dalla mappa.'};
  const destination={x:clamp(x,.5,WORLD_W-.5),y:clamp(y,.5,WORLD_H-.5)};
  const firm=this.firms.find(f=>destination.x>=f.x&&destination.x<f.x+f.size&&destination.y>=f.y&&destination.y<f.y+f.size);
  if(firm&&firm.owner===1)return this.assign(unitId,firm.id);
  u.target=destination;this.note('Unità in movimento.');
  return {ok:true,msg:'Ordine di spostamento.'};
 }
 assign(unitId,firmId){
  const u=this.get(unitId),f=this.get(firmId);
  if(!u||!f||!this.units.includes(u)||!this.firms.includes(f)||u.owner!==1||f.owner!==1)
   return {ok:false,msg:'Assegnazione non valida.'};
  ensureFirmPersonnel(f);
  if(f.staff.length>=8)return {ok:false,msg:'Edificio già al massimo di 8 lavoratori.'};
  const worker=staffFromUnit(f,u);
  f.staff.push(worker);f.workers=f.staff.length;
  this.units=this.units.filter(x=>x!==u);
  this.note('Un '+(u.kind==='soldier'?'soldato':'abitante')+' è stato assegnato a '+FIRMS[f.kind].label+'.');
  return {ok:true,msg:'Unità assegnata all’edificio.',worker};
 }
 dismiss(firmId,staffId=null){
  const f=this.get(firmId);
  if(!f||!this.firms.includes(f)||f.owner!==1)
   return {ok:false,msg:'Edificio non valido.'};
  ensureFirmPersonnel(f);
  if(!f.staff.length)return {ok:false,msg:'Nessun lavoratore da far uscire.'};
  const index=staffId===null?f.staff.length-1:f.staff.findIndex(p=>p.id===staffId);
  if(index<0)return {ok:false,msg:'Lavoratore non trovato.'};
  const [person]=f.staff.splice(index,1);
  f.workers=f.staff.length;
  const u=entity('u',{
   ...releasedUnitAttributes(person,f),x:f.x+f.size+1,y:f.y+1
  });
  this.units.push(u);
  this.note('Lavoratore '+person.id+' uscito da '+FIRMS[f.kind].label+'.');
  return {ok:true,msg:'Lavoratore uscito.',unit:u,worker:person};
 }
 setSpeed(n){if([0,1,2,3,4,5].includes(n)){this.paused=n===0;this.speed=n||1}}
 update(dt,{moveUnits=true}={}){
  if(this.paused)return;
  const step=clamp(dt,0,.15)*this.speed;
  this.elapsed+=step;
  // Legacy demo movement stays available outside the opt-in playtest.
  if(moveUnits)for(const u of this.units){
   // The work adapter owns walking to the building; never move twice in one frame.
   if(u.workTargetId)continue;
   if(!u.target)continue;
   const d=range(u,u.target);
   if(d<.05){u.target=null;continue;}
   const velocity=(u.kind==='soldier'?1.55:1.25)*step;
   if(d<=velocity){u.x=u.target.x;u.y=u.target.y;u.target=null;}
   else{u.x+=(u.target.x-u.x)*velocity/d;u.y+=(u.target.y-u.y)*velocity/d;}
  }
  this.unitTimer+=step;
  while(this.unitTimer>=1){this.unitTimer--;this.produce();}
  this.dayTimer+=step;
  while(this.dayTimer>=18){this.dayTimer-=18;this.advanceDay();}
 }
 produce(){
  for(const f of this.firms){
   if(!f.workers)continue;
   if(f.owner!==1)continue;
   if(!this.linked(f,this.nearestTown(f)))continue;
   if(f.kind==='mine'){this.raw+=f.workers*.20;f.progress=(f.progress+1)%8;}
   if(f.kind==='factory'&&this.raw>=.5){const qty=Math.min(this.raw,f.workers*.15);this.raw-=qty;this.goods+=qty;f.progress=(f.progress+1)%8;}
   if(f.kind==='market'&&this.goods>=.1){const qty=Math.min(this.goods,f.workers*.18);this.goods-=qty;this.cash+=qty*10;f.progress=(f.progress+1)%8;}
   if(f.kind==='research'){this.knowledge+=f.workers*.08;f.progress=(f.progress+1)%8;}
   if(f.kind==='fort')f.experience=clamp(f.experience+f.workers*.02,0,100);
  }
 }
 advanceDay(){
  this.day++;
  let people=this.towns.filter(t=>t.owner===1).reduce((sum,t)=>sum+t.pop,0);
  // 7KAA OTOWN.cpp Town::process_food: jobless peasants produce, all citizens eat.
  // In the current one-culture simplified model, linked workers approximate employment.
  let annualFoodBalance=0;
  for(const town of this.ownTowns()){
   const workers=this.ownFirms().filter(f=>this.linked(f,town)).reduce((s,f)=>s+f.workers,0);
   const jobless=Math.max(0,town.pop-workers);
   annualFoodBalance+=jobless*RULE_CONSTANTS.PEASANT_FOOD_YEAR_PRODUCTION-
     town.pop*RULE_CONSTANTS.PERSON_FOOD_YEAR_CONSUMPTION;
  }
  this.food=Math.max(0,this.food+annualFoodBalance/365);
  if(this.food===0){
   for(const t of this.ownTowns())t.loyalty=clamp(t.loyalty-2,0,100);
   this.note('Le scorte alimentari sono esaurite; cala la fedeltà.');
  }
  for(const t of this.towns){
   t.taxPenalty=Math.max(0,(t.taxPenalty||0)-1);
   t.rewardPenalty=Math.max(0,(t.rewardPenalty||0)-1);
   t.recruitPenalty=Math.max(0,(t.recruitPenalty||0)-1);
   if(t.owner===1&&this.food>0&&t.loyalty>50){
    t.growth+=(.10+t.loyalty/100*.14);
    if(t.growth>=1){t.pop++;t.growth--;}
   }else if(t.owner===0)t.resistance=clamp(t.resistance+.1,0,100);
  }
  if(this.day%12===0)this.note('Giorno '+this.day+': '+people+' abitanti, '+Math.floor(this.cash)+' monete.');
 }
}
