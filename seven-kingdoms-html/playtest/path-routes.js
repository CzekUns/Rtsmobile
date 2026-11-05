/*
 * Temporary, opt-in integration playtest for Seven Kingdoms HTML.
 * Uses the merged independent movement module to avoid straight lines
 * through water and structures. NOT original 7KAA movement parity.
 * GPL-2.0-only.
 */
import {findPath} from '../systems/movement/index.js';
import {WORLD_W,WORLD_H,terrain} from '../rules.js';

function tileOf(value){return Math.round(value);}
function blockByEntity(item,x,y){
  return x>=item.x && y>=item.y && x<item.x+item.size && y<item.y+item.size;
}
export function staticBlocked(game,x,y){
  if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=WORLD_W||y>=WORLD_H)return true;
  if(terrain(game.seed,x,y)==='water')return true;
  return game.towns.some(v=>blockByEntity(v,x,y))||game.firms.some(v=>blockByEntity(v,x,y));
}
function otherUnitAt(game,unitId,x,y){
  return game.units.some(v=>v.id!==unitId && tileOf(v.x)===x && tileOf(v.y)===y);
}
function nearestFree(game,unitId,goal,from){
  const blocked=(x,y)=>!(x===from.x&&y===from.y)&&(staticBlocked(game,x,y)||otherUnitAt(game,unitId,x,y));
  if(!blocked(goal.x,goal.y))return goal;
  // No attack or entry on buildings is implemented in this short playtest.
  return null;
}
export function issuePlaytestOrder(game,unitId,x,y){
  const u=game.get(unitId);
  if(!u||!game.units.includes(u)||u.owner!==1)
    return {ok:false,msg:'Seleziona una tua unità.'};
  if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>=WORLD_W||y>=WORLD_H)
    return {ok:false,msg:'Destinazione fuori dalla mappa.'};
  const firm=game.firms.find(f=>x>=f.x&&x<f.x+f.size&&y>=f.y&&y<f.y+f.size);
  if(firm&&firm.owner===1){
    u.route=[];u.target=null;
    return game.assign(unitId,firm.id); // Existing demo shortcut; not authentic physical assignment.
  }
  const start={x:tileOf(u.x),y:tileOf(u.y)};
  const clicked={x:Math.floor(x),y:Math.floor(y)};
  const goal=nearestFree(game,unitId,clicked,start);
  if(!goal)return {ok:false,msg:'Casella occupata o non attraversabile.'};
  const blocked=(tx,ty)=>{
    if(tx===start.x&&ty===start.y)return false; // Permit legacy starting tile even if invalid.
    return staticBlocked(game,tx,ty)||otherUnitAt(game,u.id,tx,ty);
  };
  const route=findPath({width:WORLD_W,height:WORLD_H,start,goal,isBlocked:blocked,maxNodes:WORLD_W*WORLD_H});
  if(!route.length)return {ok:false,msg:'Nessun percorso disponibile: ostacoli o acqua.'};
  u.route=route.slice(1);
  u.target=u.route.length?{x:goal.x,y:goal.y}:null;
  game.note(u.route.length?'Unità in marcia su un percorso verificato.':'Unità già sulla destinazione.');
  return {ok:true,msg:'Percorso di '+u.route.length+' caselle impostato.'};
}
export function advancePlaytestRoutes(game,seconds){
  if(game.paused||!Number.isFinite(seconds)||seconds<=0)return;
  for(const u of game.units){
    if(!Array.isArray(u.route)||u.route.length===0)continue;
    let remaining=Math.min(seconds,0.25)*(u.kind==='soldier'?1.55:1.25);
    let limit=4;
    while(remaining>0&&u.route.length&&limit-->0){
      const next=u.route[0];
      if(staticBlocked(game,next.x,next.y)||otherUnitAt(game,u.id,next.x,next.y))break;
      const dx=next.x-u.x,dy=next.y-u.y,distance=Math.hypot(dx,dy);
      if(distance<=remaining+1e-8){
        u.x=next.x;u.y=next.y;u.route.shift();remaining-=distance;
      }else{
        u.x+=dx/distance*remaining;u.y+=dy/distance*remaining;
        remaining=0;
      }
    }
    if(u.route.length===0)u.target=null;
  }
}
