/* Group-move adapter for the reusable RTS touch system.
 * Formation goals are distinct and valid. A failure never teleports a unit,
 * and orders already in progress are left intact when no new path exists.
 * Combat/attacks and group staffing are not implemented yet.
 * GPL-2.0-only.
 */
import {WORLD_W,WORLD_H} from '../rules.js';
import {staticBlocked,issuePlaytestOrder} from './path-routes.js';
import {formationCells} from './rts-touch-core.js';
export function issueGroupMove(game,ids,x,y,{radius=9}={}){
 if(!game||!Array.isArray(ids)||!Number.isFinite(x)||!Number.isFinite(y)||
    x<0||y<0||x>=WORLD_W||y>=WORLD_H)
  return {ok:false,ordered:[],failed:[],msg:'Destinazione di gruppo non valida.'};
 const valid=[...new Set(ids)].map(id=>game.get(id)).filter(u=>
  u&&game.units.includes(u)&&u.owner===1);
 const reserved=new Set();
 const candidates=formationCells(x,y,WORLD_W,WORLD_H,{radius});
 const ordered=[],failed=[];
 for(const unit of valid){
  if(unit.buildSiteId||unit.repairTargetId||unit.workTargetId){
   failed.push(unit.id);continue;
  }
  let result=null,attempts=0;
  const maxAttempts=Math.max(36,Math.min(120,valid.length*14));
  for(const cell of candidates){
   const key=cell.x+','+cell.y;
   if(reserved.has(key)||staticBlocked(game,cell.x,cell.y))continue;
   if(game.units.some(u=>u!==unit&&Math.round(u.x)===cell.x&&Math.round(u.y)===cell.y))continue;
   if(++attempts>maxAttempts)break; // Prevent long synchronous A* stalls on blocked targets.
   result=issuePlaytestOrder(game,unit.id,cell.x,cell.y);
   if(!result.ok)continue;
   reserved.add(key);ordered.push(unit.id);break;
  }
  if(!result?.ok)failed.push(unit.id);
 }
 return {
  ok:ordered.length>0,ordered,failed,
  msg:ordered.length?
   'Gruppo in marcia: '+ordered.length+' unità'+(failed.length?' · '+failed.length+' senza percorso.':'.'):
   'Nessuna unità può raggiungere la destinazione.'
 };
}
