/* Seven Kingdoms HTML — Construction Worker building repairs.
 * Original reference: 7kaa src/OFIRM.cpp Firm::process_repair()
 * (cash nonnegative, builder, no attack, once per 1..5 days for skill 20..100,
 *  1 HP per repair date; 6 days at skill 0).
 * Adapter: mobile worker approaches a reachable perimeter tile instead of
 * entering the building, because this JS demo has no native builder_recno.
 * This is not full original 7KAA combat/building parity. GPL-2.0-only.
 */
import {reachableWorkEntrances} from './work-assignments.js';

export const canRepair=(unit,firm)=>
 !!unit&&!!firm&&unit.owner===1&&firm.owner===1&&unit.kind==='peasant'&&
 unit.skillId===1&&!firm.underConstruction&&
 (firm.hp??100)>0&&(firm.hp??100)<(firm.maxHp??100);

const touches=(unit,firm)=>{
 const x=Math.round(unit.x),y=Math.round(unit.y);
 return x>=firm.x-1&&x<=firm.x+firm.size&&
  y>=firm.y-1&&y<=firm.y+firm.size&&
  (x<firm.x||x>=firm.x+firm.size||y<firm.y||y>=firm.y+firm.size);
};
export function issueRepairOrder(game,unitId,firmId){
 const unit=game.get(unitId),firm=game.get(firmId);
 if(!unit||!game.units.includes(unit)||!firm||!game.firms.includes(firm))
  return {ok:false,msg:'Costruttore o edificio non valido.'};
 if(!canRepair(unit,firm))
  return {ok:false,msg:'Serve un Costruttore e un tuo edificio danneggiato.'};
 if(unit.buildSiteId||unit.workTargetId||unit.repairTargetId)
  return {ok:false,msg:'Il costruttore ha già un incarico: premere Ferma per annullarlo.'};
 if(game.units.some(u=>u!==unit&&u.repairTargetId===firmId))
  return {ok:false,msg:'Un altro costruttore sta già riparando questo edificio.'};
 const choices=reachableWorkEntrances(game,unit,firm);
 if(!choices.length)return {ok:false,msg:'L’edificio non ha un ingresso raggiungibile.'};
 const choice=choices[0];
 unit.route=choice.path.slice(1);
 unit.target=unit.route.length?{...choice.end}:null;
 unit.repairTargetId=firm.id;
 game.note('Il costruttore raggiunge '+firm.kind+' per ripararlo.');
 return {ok:true,msg:'Costruttore in marcia per la riparazione.',unit,firm};
}
export function cancelRepairOrder(game,unitId){
 const u=game.get(unitId);
 if(!u?.repairTargetId)return {ok:false,msg:'Nessuna riparazione in corso.'};
 u.repairTargetId=null;u.route=[];u.target=null;
 game.note('Riparazione annullata.');
 return {ok:true,msg:'Riparazione annullata.'};
}
export function advanceRepairs(game){
 if(game.paused)return [];
 const events=[];
 for(const unit of game.units){
  if(!unit.repairTargetId)continue;
  const firm=game.get(unit.repairTargetId);
  if(!firm||!game.firms.includes(firm)||firm.owner!==unit.owner||firm.underConstruction){
   unit.repairTargetId=null;events.push({type:'error',msg:'Riparazione interrotta: edificio non disponibile.'});continue;
  }
  if(unit.route?.length||unit.target||!touches(unit,firm))continue;
  if(game.cash<0||game.day<=(firm.lastAttackedDay??-Infinity)+1)continue;
  const maxHp=firm.maxHp??100;
  if((firm.hp??maxHp)>=maxHp){
   unit.repairTargetId=null;continue;
  }
  const skill=Math.max(0,Math.min(100,Math.floor(unit.skillLevel??0)));
  const interval=Math.floor((100-skill)/20)+1;
  const firmNumeric=Number(String(firm.id).replace(/^\D+/,''))||0;
  if(firmNumeric%interval!==game.day%interval||firm.lastRepairAppliedDay===game.day)continue;
  firm.lastRepairAppliedDay=game.day;
  firm.hp=Math.min(maxHp,(firm.hp??maxHp)+1);
  if(firm.hp>=maxHp){
   unit.repairTargetId=null;
   game.note('Riparazione di '+firm.kind+' completata.');
   events.push({type:'completed',firmId:firm.id,unitId:unit.id,msg:'Riparazione completata: '+firm.kind+'.'});
  }else events.push({type:'progress',firmId:firm.id,unitId:unit.id,msg:'Riparazione '+firm.kind+': '+firm.hp+'/'+maxHp+' HP.'});
 }
 return events;
}
