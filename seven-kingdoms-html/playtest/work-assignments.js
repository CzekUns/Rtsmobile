/* Seven Kingdoms HTML — walking to work adapter.
 * Worker orders are provisional integration mechanics, not exact C++ 7KAA parity.
 * The person only becomes a building worker on physical arrival.
 * GPL-2.0-only.
 */
import {findPath} from '../systems/movement/index.js';
import {WORLD_W,WORLD_H} from '../rules.js';
import {staticBlocked} from './path-routes.js';

const tile = v => Math.round(v);
const within = (x,y) => x>=0 && y>=0 && x<WORLD_W && y<WORLD_H;
const isAtDoor = (unit,firm) => {
 const x=tile(unit.x),y=tile(unit.y);
 return x>=firm.x-1 && x<=firm.x+firm.size &&
        y>=firm.y-1 && y<=firm.y+firm.size &&
       (x<firm.x || x>=firm.x+firm.size || y<firm.y || y>=firm.y+firm.size);
};
const otherUnitAt=(game,id,x,y) =>
 game.units.some(u=>u.id!==id&&tile(u.x)===x&&tile(u.y)===y);

export function reachableWorkEntrances(game,unit,firm){
 if(!unit||!firm)return [];
 const start={x:tile(unit.x),y:tile(unit.y)};
 if(!within(start.x,start.y))return [];
 const blocked=(x,y)=>{
   if(x===start.x&&y===start.y)return false;
   return staticBlocked(game,x,y)||otherUnitAt(game,unit.id,x,y);
 };
 const choices=[];
 for(let y=firm.y-1;y<=firm.y+firm.size;y++)for(let x=firm.x-1;x<=firm.x+firm.size;x++){
   if(x>=firm.x&&x<firm.x+firm.size&&y>=firm.y&&y<firm.y+firm.size)continue;
   if(!within(x,y)||blocked(x,y))continue;
   const end={x,y};
   const path=findPath({
     width:WORLD_W,height:WORLD_H,start,goal:end,isBlocked:blocked,
     maxNodes:WORLD_W*WORLD_H
   });
   if(path.length)choices.push({end,path});
 }
 choices.sort((a,b)=>a.path.length-b.path.length||
   a.end.y-b.end.y||a.end.x-b.end.x);
 return choices;
}
export function issueWorkOrder(game,unitId,firmId){
 const unit=game.get(unitId),firm=game.get(firmId);
 if(!unit||!game.units.includes(unit)||unit.owner!==1 ||
    !['peasant','soldier'].includes(unit.kind))
   return {ok:false,msg:'Seleziona un abitante o soldato del tuo regno.'};
 if(unit.buildSiteId)
   return {ok:false,msg:'Costruttore occupato in un cantiere: annulla prima di assegnarlo.'};
 if(!firm||!game.firms.includes(firm)||firm.owner!==1)
   return {ok:false,msg:'Puoi assegnare lavoratori solo ai tuoi edifici.'};
 if(firm.underConstruction)
   return {ok:false,msg:'Il cantiere deve essere completato prima di ricevere lavoratori.'};
 if(unit.kind==='soldier'&&firm.kind!=='fort')
   return {ok:false,msg:'I soldati possono essere assegnati solo ai forti.'};
 const reserved=game.units.filter(u=>u!==unit&&u.workTargetId===firm.id).length;
 if(firm.workers+reserved>=8)
   return {ok:false,msg:'Edificio pieno o con tutti i posti già assegnati.'};
 const choices=reachableWorkEntrances(game,unit,firm);
 if(!choices.length)
   return {ok:false,msg:'Nessun ingresso raggiungibile per '+firm.kind+'.'};
 const {end,path}=choices[0];
 unit.route=path.slice(1);
 unit.target={...end};
 unit.workTargetId=firm.id;
 game.note('Ordine: raggiungere '+firm.kind+' e iniziare a lavorare.');
 return {ok:true,msg:'In marcia verso '+firm.kind+'.',destination:end,steps:unit.route.length};
}
export function completeWorkArrivals(game){
 const arrived=[];
 for(const unit of [...game.units]){
  if(!unit.workTargetId || !Array.isArray(unit.route) || unit.route.length)continue;
  const firm=game.get(unit.workTargetId);
  const id=unit.id,firmId=unit.workTargetId;
  if(!firm||!game.firms.includes(firm)||!isAtDoor(unit,firm)){
   unit.workTargetId=null;
   arrived.push({unitId:id,firmId,ok:false,msg:'Lavoro annullato: ingresso non più disponibile.'});
   continue;
  }
  const result=game.assign(id,firmId);
  if(!result.ok){unit.workTargetId=null;unit.target=null;}
  arrived.push({unitId:id,firmId,ok:result.ok,msg:result.msg});
 }
 return arrived;
}
