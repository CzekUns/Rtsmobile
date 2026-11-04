/* Experimental Construction Worker build orders. Not verified 7KAA parity. GPL-2.0-only. */
import {FIRMS,range} from '../rules.js';
import {issuePlaytestOrder,staticBlocked} from './path-routes.js';
const validBuilder=u=>u?.owner===1&&u.skillId===1&&Number(u.skillLevel)>=20;
const overlaps=(a,b)=>a.x<b.x+b.size&&a.x+a.size>b.x&&a.y<b.y+b.size&&a.y+a.size>b.y;
export function reserveBuildSite(game,unitId,kind,x,y){
 const u=game.get(unitId),rule=FIRMS[kind];
 if(!validBuilder(u)||!game.units.includes(u))return {ok:false,msg:'Serve un Construction Worker addestrato.'};
 // A builder may own only one active site; reject before changing route or cash.
 if(u.buildSiteId||game.buildSites?.some(s=>s.builderId===unitId))return {ok:false,msg:'Costruttore già assegnato a un cantiere.'};
 if(!rule)return {ok:false,msg:'Edificio sconosciuto.'};
 x=Math.floor(x);y=Math.floor(y);
 const site={x,y,size:rule.size};
 if(game.cash<rule.cost)return {ok:false,msg:'Monete insufficienti.'};
 if(game.occupied(x,y,rule.size)||game.buildSites?.some(s=>overlaps(s,site)))return {ok:false,msg:'Terreno già occupato o prenotato.'};
 if(!game.ownTowns().some(t=>range(site,t)<13))return {ok:false,msg:'Troppo lontano da un villaggio.'};
 if(kind==='mine'&&!game.hasHills(x,y,rule.size))return {ok:false,msg:'La miniera richiede colline.'};
 const exits=[];
 for(let tx=x-1;tx<=x+rule.size;tx++)for(let ty=y-1;ty<=y+rule.size;ty++){
  if(tx!==x-1&&tx!==x+rule.size&&ty!==y-1&&ty!==y+rule.size)continue;
  if(!staticBlocked(game,tx,ty)&&!game.units.some(v=>v!==u&&Math.round(v.x)===tx&&Math.round(v.y)===ty))
   exits.push({x:tx,y:ty});
 }
 exits.sort((a,b)=>Math.hypot(u.x-a.x,u.y-a.y)-Math.hypot(u.x-b.x,u.y-b.y)||a.y-b.y||a.x-b.x);
 let result;
 for(const tile of exits){
  result=issuePlaytestOrder(game,unitId,tile.x,tile.y);
  if(result.ok)break;
 }
 if(!result?.ok)return {ok:false,msg:'Nessun ingresso raggiungibile per il cantiere.'};
 game.buildSites??=[];
 const id='site-'+unitId+'-'+game.day+'-'+game.buildSites.length;
 game.buildSites.push({...site,id,kind,builderId:unitId,owner:1,progressDays:0,requiredDays:5,phase:'travel'});
 game.cash-=rule.cost;
 u.buildSiteId=id;
 return {ok:true,msg:'Cantiere prenotato: il costruttore è in marcia.',siteId:id};
}
export function advanceBuildSites(game){
 if(!Array.isArray(game.buildSites))return [];
 const finished=[];
 for(const site of game.buildSites){
  const u=game.get(site.builderId);
  if(!validBuilder(u)||!game.units.includes(u))continue;
  // A v1 save can contain a live site but omit the unit backlink. Restore it
  // from the authoritative site record without changing identity or progress.
  // A conflicting backlink must never be silently overwritten.
  if(u.buildSiteId&&u.buildSiteId!==site.id)continue;
  if(!u.buildSiteId)u.buildSiteId=site.id;
  if(site.phase==='travel'){
   if(u.route?.length||u.target)continue;
   const dx=Math.max(site.x-u.x,0,u.x-(site.x+site.size-1));
   const dy=Math.max(site.y-u.y,0,u.y-(site.y+site.size-1));
   if(Math.max(dx,dy)>1.5)continue;
   site.phase='building';
  }
  if(site.phase!=='building')continue;
  // Work requires the same living builder to remain at the site. A saved
  // construction phase must not progress while the builder walks elsewhere.
  const dx=Math.max(site.x-u.x,0,u.x-(site.x+site.size-1));
  const dy=Math.max(site.y-u.y,0,u.y-(site.y+site.size-1));
  if(u.route?.length||u.target||Math.max(dx,dy)>1.5)continue;
  site.progressDays++;
  if(site.progressDays<site.requiredDays)continue;
  // Reserve the same footprint until completion. Keep the builder alive outside the firm.
  // Temporarily return escrow for the legacy build validator; its debit consumes it again.
  const escrow=FIRMS[site.kind].cost;
  game.cash+=escrow;
  const firm=game.build(site.kind,site.x,site.y);
  if(!firm.ok){game.cash-=escrow;site.progressDays=site.requiredDays-1;continue;}
  u.buildSiteId=null;finished.push(site.id);
 }
 game.buildSites=game.buildSites.filter(s=>!finished.includes(s.id));
 return finished;
}
