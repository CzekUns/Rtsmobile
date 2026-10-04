// Units may pass through one another while moving; stationary actors keep distinct resting positions.
(() => {
'use strict';
const living=g=>[...g.units.filter(u=>u.health>0&&u.location?.kind==='world'),...g.animals.filter(a=>a.health>0),...g.raiders.filter(r=>r.health>0)];
const clear=(g,p,ignore=null)=>living(g).every(e=>e===ignore||Math.hypot(e.x-p.x,e.y-p.y)>=.78);
Game.prototype.actorPositionClear=function(p,ignore=null){return clear(this,p,ignore)};
const follow=Game.prototype.followPath;
Game.prototype.followPath=function(e,dt,speed){
 // Villagers can cross other actors while travelling. Animals/raiders still keep live separation.
 if(e instanceof Unit)return follow.call(this,e,dt,speed);
 if(!e.path?.length)return follow.call(this,e,dt,speed);
 const next=e.path[0],dx=next.x-e.x,dy=next.y-e.y,d=Math.hypot(dx,dy)||1,step=Math.min(d,speed*dt),p={x:e.x+dx/d*step,y:e.y+dy/d*step};
 if(!clear(this,p,e))return;
 return follow.call(this,e,dt,speed);
};
Game.prototype.settleUnitPosition=function(u){
 if(!(u instanceof Unit)||u.health<=0||u.location?.kind!=='world'||clear(this,u,u))return true;
 const origin={x:u.x,y:u.y};
 // No teleporting: only a short local bounce, kept close enough to shared work targets.
 for(const radius of [.35,.6,.85]){
  for(let i=0;i<16;i++){
   const a=i/16*Math.PI*2,p={x:origin.x+Math.cos(a)*radius,y:origin.y+Math.sin(a)*radius};
   if(!this.movementClear?.(origin,p))continue;
   if(!clear(this,p,u))continue;
   u.x=p.x;u.y=p.y;u.tx=p.x;u.ty=p.y;
   return true;
  }
 }
 return false;
};
const animalClear=Game.prototype.animalTerrainClear;
Game.prototype.animalTerrainClear=function(p){return animalClear.call(this,p)&&clear(this,p);};
Game.prototype.farmWander=function(u,b){
 const c=TERRA_CROPS[b.crop]||TERRA_CROPS.grain,r=VER_SACRUM_VILLAGE.bounds({...b,crop:u.task?.crop||b.crop});
 const candidates=[];for(let y=r.top;y<r.bottom;y++)for(let x=r.left;x<r.right;x++){const p={x:x+.5,y:y+.5};if(this.world.walkable(x,y,1,null,this.buildings)&&clear(this,p,u))candidates.push(p)}
 if(!candidates.length)return false;
 const p=candidates[Math.floor((this.rng?.next?.()||Math.random())*candidates.length)];const path=this.findPath(u.x,u.y,Math.floor(p.x),Math.floor(p.y),1);
 if(Math.hypot(u.x-p.x,u.y-p.y)<.15){u.farmWanderTimer=2+((this.rng?.next?.()||Math.random())*4);return true;}
 if(path.length){u.path=path;u.state='moving';u.task.phase='onFarm';u.task.wanderTarget={x:p.x,y:p.y};return true;}
 return false;
};
const update=Game.prototype.updateUnit;
Game.prototype.updateUnit=function(u,dt){
 if(u.state==='farming'){
  const b=this.findById(this.buildings,u.task?.target);
  if(b?.alive){u.farmWanderTimer=(u.farmWanderTimer??2)-dt;if(u.farmWanderTimer<=0)this.farmWander(u,b);}
 }
 update.call(this,u,dt);
 if(u.state==='farming'&&u.farmWanderTimer===undefined)u.farmWanderTimer=2;
};
const arrive=Game.prototype.onUnitArrive;
Game.prototype.onUnitArrive=function(u){
 if(u.task?.type==='farm'&&u.task.phase==='onFarm'){
  u.state='farming';u.farmWanderTimer=2+((this.rng?.next?.()||Math.random())*4);this.settleUnitPosition(u);return;
 }
 const result=arrive.call(this,u);
 if(u.state!=='moving'&&!u.path?.length)this.settleUnitPosition(u);
 return result;
};
})();
