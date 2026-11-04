/* Native JS integration: first playable Construction Worker vertical slice.
 * Original references: OUNITIF.cpp Build, OFIRMRES.cpp can_build,
 * OFIRM.cpp process_construction. Progress timing/lot policy are DEMO adapters,
 * not yet numeric 7KAA parity. GPL-2.0-only.
 */
import {findPath} from '../systems/movement/index.js';
import {WORLD_W,WORLD_H,FIRMS,terrain,range} from '../rules.js';
import {staticBlocked} from './path-routes.js';
const tile=n=>Math.round(n);
const valid=(x,y)=>x>=0&&y>=0&&x<WORLD_W&&y<WORLD_H;
const overlaps=(a,b)=>a.x<b.x+b.size&&a.x+a.size>b.x&&a.y<b.y+b.size&&a.y+a.size>b.y;
const touches=(u,s)=>{
 const x=tile(u.x),y=tile(u.y);
 return x>=s.x-1&&x<=s.x+s.size&&y>=s.y-1&&y<=s.y+s.size&&
  (x<s.x||x>=s.x+s.size||y<s.y||y>=s.y+s.size);
};
const other=(game,id,x,y)=>game.units.some(u=>u.id!==id&&tile(u.x)===x&&tile(u.y)===y);
export const isBuilder=u=>u&&u.owner===1&&(u.skillId===1||u.rank==='king');

/** Validate the entire footprint and reserve a reachable perimeter tile. */
export function issueBuildOrder(game,unitId,kind,x,y){
 const u=game.get(unitId),rule=FIRMS[kind];
 if(!u||!game.units.includes(u)||!isBuilder(u))
  return {ok:false,msg:'Occorre selezionare un costruttore addestrato.'};
 if(u.buildSiteId)return {ok:false,msg:'Questo costruttore ha già un cantiere. Usa Ferma per annullare.'};
 if(!rule)return {ok:false,msg:'Tipo di edificio sconosciuto.'};
 if(!Number.isFinite(x)||!Number.isFinite(y))return {ok:false,msg:'Coordinate non valide.'};
 x=Math.floor(x);y=Math.floor(y);
 const site={x,y,size:rule.size};
 if(!valid(x,y)||x+rule.size>WORLD_W||y+rule.size>WORLD_H||game.occupied(x,y,rule.size))
  return {ok:false,msg:'Terreno occupato o fuori dalla mappa.'};
 if(game.cash<rule.cost)return {ok:false,msg:'Monete insufficienti per il cantiere.'};
 if(!game.ownTowns().some(t=>range({x,y},t)<13))
  return {ok:false,msg:'Costruisci vicino a un tuo villaggio.'};
 if(kind==='mine'&&!game.hasHills(x,y,rule.size))
  return {ok:false,msg:'Nella demo, una miniera richiede colline.'};
 for(let j=y;j<y+rule.size;j++)for(let i=x;i<x+rule.size;i++)
  if(terrain(game.seed,i,j)==='water')
   return {ok:false,msg:'Non puoi costruire sopra l’acqua.'};
 game.constructionSites??=[];
 if(game.constructionSites.some(s=>overlaps(site,s)))
  return {ok:false,msg:'Terreno già prenotato da un altro cantiere.'};
 const start={x:tile(u.x),y:tile(u.y)};
 if(!valid(start.x,start.y))return {ok:false,msg:'Costruttore fuori dalla mappa.'};
 const blocked=(tx,ty)=>{
  if(tx===start.x&&ty===start.y)return false;
  return staticBlocked(game,tx,ty)||other(game,u.id,tx,ty)||
   (tx>=x&&tx<x+rule.size&&ty>=y&&ty<y+rule.size)||
   game.constructionSites.some(s=>tx>=s.x&&tx<s.x+s.size&&ty>=s.y&&ty<s.y+s.size);
 };
 const paths=[];
 for(let py=y-1;py<=y+rule.size;py++)for(let px=x-1;px<=x+rule.size;px++){
  if(px>=x&&px<x+rule.size&&py>=y&&py<y+rule.size)continue;
  if(!valid(px,py)||blocked(px,py))continue;
  const goal={x:px,y:py};
  const path=findPath({width:WORLD_W,height:WORLD_H,start,goal,isBlocked:blocked,maxNodes:WORLD_W*WORLD_H});
  if(path.length)paths.push({goal,path});
 }
 if(!paths.length)return {ok:false,msg:'Nessun ingresso raggiungibile attorno al cantiere.'};
 paths.sort((a,b)=>a.path.length-b.path.length||a.goal.y-b.goal.y||a.goal.x-b.goal.x);
 const chosen=paths[0];
 game.nextConstructionId=(game.nextConstructionId??0)+1;
 const id='site-'+game.nextConstructionId;
 game.cash-=rule.cost; // Reserve funds only after successful path and placement.
 const order={id,x,y,size:rule.size,kind,cost:rule.cost,builderId:u.id,
  status:'walking',firmId:null,progress:0,entrance:chosen.goal};
 game.constructionSites.push(order);
 u.route=chosen.path.slice(1);
 u.target=u.route.length?{...chosen.goal}:null;
 u.workTargetId=null;
 u.buildSiteId=id;
 game.note('Cantiere prenotato: '+rule.label+'. Il costruttore è in marcia.');
 return {ok:true,msg:'Costruttore in marcia verso il cantiere.',site:order};
}
export function cancelBuildOrder(game,unitId){
 const u=game.get(unitId),sites=game.constructionSites||[];
 const site=u&&sites.find(s=>s.builderId===u.id&&s.id===u.buildSiteId);
 if(!site)return {ok:false,msg:'Nessun cantiere attivo per questa unità.'};
 // Before construction starts funds are untouched by works; refund fully.
 if(site.status==='walking')game.cash+=site.cost;
 else if(site.firmId)game.firms=game.firms.filter(f=>f.id!==site.firmId);
 game.constructionSites=sites.filter(s=>s!==site);
 u.buildSiteId=null;u.route=[];u.target=null;
 game.note('Cantiere '+site.kind+' annullato.');
 return {ok:true,msg:site.status==='walking'?'Ordine annullato e costo restituito.':'Cantiere incompleto demolito (nessun rimborso nella demo).'};
}
/** Progress is intentionally provisional; exact original frame rate needs C++ parity. */
export function advanceConstruction(game,seconds){
 if(game.paused||!Number.isFinite(seconds)||seconds<=0)return [];
 const events=[];
 for(const site of [...(game.constructionSites||[])]){
  const unit=game.get(site.builderId);
  if(!unit||!game.units.includes(unit)){
   events.push({type:'error',siteId:site.id,msg:'Costruttore non disponibile.'});
   continue;
  }
  if(site.status==='walking'){
   if(!Array.isArray(unit.route)||unit.route.length||!touches(unit,site))continue;
   const result=game.build(site.kind,site.x,site.y,{prepaid:true,underConstruction:true});
   if(!result.ok){
    game.cash+=site.cost;
    game.constructionSites=game.constructionSites.filter(s=>s!==site);
    unit.buildSiteId=null;unit.target=null;unit.route=[];
    events.push({type:'error',siteId:site.id,msg:result.msg});continue;
   }
   site.status='building';site.firmId=result.firm.id;
   result.firm.builderId=unit.id;
   result.firm.buildProgress=0;
   result.firm.underConstruction=true;
   unit.target=null;unit.route=[];
   events.push({type:'started',siteId:site.id,firmId:result.firm.id,msg:'Cantiere avviato.'});
  }
  if(site.status!=='building')continue;
  const f=game.get(site.firmId);
  if(!f||!game.firms.includes(f)||!touches(unit,site))continue;
  const skill=Math.max(0,Math.floor(unit.skillLevel||0));
  // Shorter for this experimental vertical slice; not original C++ frame formula.
  site.progress=Math.min(1,site.progress+seconds*(1+skill/30)/20);
  f.buildProgress=site.progress;
  f.hp=Math.max(1,Math.floor(100*site.progress));
  unit.skillProgress=(unit.skillProgress||0)+seconds;
  if(unit.skillProgress>=45&&skill<100){
   unit.skillLevel=skill+1;unit.skillProgress-=45;
  }
  if(site.progress>=1){
   f.underConstruction=false;f.buildProgress=1;f.hp=100;f.builderId=null;
   unit.buildSiteId=null;unit.route=[];unit.target=null;
   game.constructionSites=game.constructionSites.filter(s=>s!==site);
   game.note('Costruzione completata: '+FIRMS[site.kind].label+'.');
   events.push({type:'completed',siteId:site.id,firmId:f.id,msg:'Costruzione completata: '+FIRMS[site.kind].label+'.'});
  }
 }
 return events;
}
