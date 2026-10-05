// Terra Italica SVG profession-token renderer.
(() => {
  'use strict';
  if(typeof Game==='undefined')return;
  const load=src=>{const img=new Image();img.src=src;return img;};
  const SPRITES={
    raider:load('./assets/p16/units/unit_raider_p16.png?v=24'),
    sheep:load('./assets/p16/animals/animal_sheep_p16.png?v=24'),wolf:load('./assets/p16/animals/animal_wolf_p16.png?v=24'),
    wood:load('./assets/p16/resources/resource_tree_p16.png?v=24'),stone:load('./assets/p16/resources/resource_stone_p16.png?v=24'),iron:load('./assets/p16/resources/resource_iron_p16.png?v=24'),food:load('./assets/p16/resources/resource_berry_p16.png?v=24'),
    house:load('./assets/p16/buildings/building_house_p16.png?v=24'),farm:load('./assets/p16/buildings/building_farm_p16.png?v=24'),warehouse:load('./assets/p16/buildings/building_warehouse_p16.png?v=24'),tower:load('./assets/p16/buildings/building_tower_p16.png?v=24'),palisade:load('./assets/p16/buildings/building_palisade_p16.png?v=24'),mill:load('./assets/p16/buildings/building_mill_p16.png?v=54'),
    selection:load('./assets/p16/ui/ui_selection_marker_p16.png?v=54')
  };
  window.TERRA_P16_SPRITES=SPRITES;
  const TOKEN_NAMES=['libero','taglialegna','minatore','contadino','costruttore','trasportatore','mugnaio','fornaio','allevatore','mobilitato'];
  const tokenTemplates=new Map(),tokenImages=new Map(),tokenFetches=new Map();
  const tokenUrl=name=>'./assets/tokens/professions/'+name+'.svg?v=62';
  function preloadToken(name){if(tokenTemplates.has(name)||tokenFetches.has(name))return;const p=fetch(tokenUrl(name),{cache:'force-cache'}).then(r=>{if(!r.ok)throw new Error(name);return r.text();}).then(t=>tokenTemplates.set(name,t)).catch(()=>null).finally(()=>tokenFetches.delete(name));tokenFetches.set(name,p);}
  TOKEN_NAMES.forEach(preloadToken);
  const ANIMAL_TOKEN_NAMES=['sheep_alive','sheep_dead','sheep_skeleton','goat_alive','goat_dead','goat_skeleton','cow_alive','cow_dead','cow_skeleton','wolf_alive','wolf_dead','wolf_skeleton'];
  const ANIMAL_TOKENS=Object.fromEntries(ANIMAL_TOKEN_NAMES.map(name=>[name,load('./assets/tokens/animals/'+name+'.svg?v=99')]));
  window.TERRA_ANIMAL_TOKENS=ANIMAL_TOKENS;
  const RESOURCE_TILE_NAMES=['forest_full_hex','forest_medium_hex','forest_low_hex','forest_empty_hex','berries_full_hex','berries_medium_hex','berries_low_hex','berries_empty_hex','stone_up_full_tri','stone_up_low_tri','stone_down_full_tri','stone_down_low_tri','ore_up_full_tri','ore_up_low_tri','ore_down_full_tri','ore_down_low_tri'];
  const RESOURCE_TILES=Object.fromEntries(RESOURCE_TILE_NAMES.map(name=>[name,load('./assets/terrain/resources/'+name+'.svg?v=101')]));
  window.TERRA_RESOURCE_TILES=RESOURCE_TILES;
  const factionStyle=owner=>window.terraFactionStyle?window.terraFactionStyle(owner):{color:'#B4442B'};
  function tokenImage(name,owner){const key=name+':'+owner;if(tokenImages.has(key))return tokenImages.get(key);const source=tokenTemplates.get(name);if(!source){preloadToken(name);return null;}const themed=source.split('#B4442B').join(factionStyle(owner).color),img=new Image();img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(themed);tokenImages.set(key,img);return img;}
  function gatherProfession(game,u,task){let type=u.inventory?.type||null;if(task?.target){const node=game.findById(game.world.resources,task.target);if(node?.type)type=node.type;}if(type==='wood')return'taglialegna';if(type==='stone'||type==='iron')return'minatore';if(['food','grain','barley','grapes','olives'].includes(type))return'contadino';return'libero';}
  function professionForUnit(game,u){if(u.mobilized||u.task?.type==='attack'||u.state==='combat')return'mobilitato';const t=u.task;if(!t)return'libero';switch(t.type){case'gather':return gatherProfession(game,u,t);case'return':return t.after?.type==='gather'?gatherProfession(game,u,t.after):(u.inventory?.amount?'trasportatore':'libero');case'farm':return'contadino';case'build':case'repair':return'costruttore';case'haul':case'caravan':return'trasportatore';case'production':{if(t.profession==='mugnaio'||t.profession==='fornaio')return t.profession;const b=game.findById(game.buildings,t.target);return b?.type==='mill'?'mugnaio':b?.type==='bakery'?'fornaio':'libero';}case'livestock':case'tame':return'allevatore';default:return'libero';}}
  window.TERRA_UNIT_TOKENS=Object.freeze({names:TOKEN_NAMES,professionForUnit});
  const previousPose=new WeakMap(),horizontalPose=new WeakMap(),OCTANT=Math.PI/4;
  const ready=img=>!!(img&&img.complete&&img.naturalWidth>0);
  function horizontalFacing(entity){const prev=horizontalPose.get(entity);let dx=0;if(prev)dx=entity.x-prev.x;if(Math.abs(dx)<.001&&Number.isFinite(entity.vx))dx=entity.vx;if(Math.abs(dx)<.001&&entity.path?.length){const n=entity.path[0];dx=(n.x??entity.x)-entity.x;}if(Math.abs(dx)<.001&&Number.isFinite(entity.tx))dx=entity.tx-entity.x;let facing=prev?.facing??1;if(dx>.001)facing=-1;else if(dx<-.001)facing=1;horizontalPose.set(entity,{x:entity.x,y:entity.y,facing});return facing;}
  function directionAngle(entity){const prev=previousPose.get(entity);let dx=0,dy=0;if(prev){dx=entity.x-prev.x;dy=entity.y-prev.y;}if(Math.hypot(dx,dy)<.001&&Number.isFinite(entity.vx)&&Number.isFinite(entity.vy)){dx=entity.vx;dy=entity.vy;}if(Math.hypot(dx,dy)<.001&&entity.path?.length){const n=entity.path[0];dx=(n.x??entity.x)-entity.x;dy=(n.y??entity.y)-entity.y;}if(Math.hypot(dx,dy)<.001&&Number.isFinite(entity.tx)&&Number.isFinite(entity.ty)){dx=entity.tx-entity.x;dy=entity.ty-entity.y;}let angle=prev?.angle??0;if(Math.hypot(dx,dy)>=.001){const raw=Math.atan2(dy,dx)-Math.PI/2;angle=Math.round(raw/OCTANT)*OCTANT;}previousPose.set(entity,{x:entity.x,y:entity.y,angle});return angle;}
  function drawCentered(ctx,img,x,y,w,h,angle=0,smooth=false,flipX=1){if(!ready(img))return false;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(flipX,1);ctx.imageSmoothingEnabled=smooth;ctx.drawImage(img,-w/2,-h/2,w,h);ctx.restore();return true;}
  const oldDrawResource=Game.prototype.drawResource,oldDrawHuman=Game.prototype.drawHuman,oldDrawAnimal=Game.prototype.drawAnimal,oldDrawBuilding=Game.prototype.drawBuilding,oldSelectionRing=Game.prototype.selectionRing;
  Game.prototype.selectionRing=function(x,y,r){const img=SPRITES.selection;if(!drawCentered(this.ctx,img,x,y,r*2,r*2))oldSelectionRing.call(this,x,y,r);};
  Game.prototype.drawResource=function(r){
    if(r.cleared)return;
    const z=this.camera.zoom,ratio=r.max>0?r.amount/r.max:0,ctx=this.ctx;

    // One node = one marker. Renewable nodes are hexes with their own depletion state.
    if(r.type==='wood'||r.type==='food'){
      const state=ratio<=0?'empty':ratio>.66?'full':ratio>.33?'medium':'low';
      const key=(r.type==='wood'?'forest_':'berries_')+state+'_hex';
      const img=RESOURCE_TILES[key],p=this.worldToScreen(r.x*TILE,r.y*TILE);
      const size=TILE*1.03*z;
      if(!drawCentered(ctx,img,p.x,p.y,size,size,0,true))return oldDrawResource.call(this,r);
      // The source forest SVG has a baked rust-colored frame. Paint only that visible frame
      // at render time so the internal tree artwork remains untouched.
      const hw=size/2,hh=size/2;
      const pts=[
        [p.x,p.y-hh*.994],
        [p.x+hw*.993,p.y-hh*.5],
        [p.x+hw*.993,p.y+hh*.5],
        [p.x,p.y+hh*.994],
        [p.x-hw*.993,p.y+hh*.5],
        [p.x-hw*.993,p.y-hh*.5]
      ];
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(pts[0][0],pts[0][1]);
      for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);
      ctx.closePath();
      ctx.strokeStyle='#705c33';
      ctx.lineWidth=Math.max(2.6*z,2);
      ctx.lineJoin='round';
      ctx.stroke();
      ctx.restore();
      return;
    }

    // Stone and ore are not multi-piece icons: every triangle is a real resource node.
    if(r.type==='stone'||r.type==='iron'){
      if(r.amount<=0)return;
      const state=ratio>.42?'full':'low';
      const orientation=r.orientation||(((Math.round(r.x*100)+Math.round(r.y*100))&1)?'down':'up');
      const key=(r.type==='iron'?'ore_':'stone_')+orientation+'_'+state+'_tri';
      const img=RESOURCE_TILES[key],p=this.worldToScreen(r.x*TILE,r.y*TILE);
      const width=TILE*z,height=TILE*z;
      if(!drawCentered(ctx,img,p.x,p.y,width,height,0,true))return oldDrawResource.call(this,r);
      return;
    }

    oldDrawResource.call(this,r);
  };
  Game.prototype.drawHuman=function(u,hostile){const p=this.worldToScreen(u.x*TILE,u.y*TILE),z=this.camera.zoom*(hostile?1:.64),ctx=this.ctx,profession=hostile?null:professionForUnit(this,u),img=hostile?SPRITES.raider:tokenImage(profession,u.owner),dims=hostile?[28,32]:[42,42];if(!ready(img))return oldDrawHuman.call(this,u,hostile);ctx.save();ctx.fillStyle='#00000045';ctx.beginPath();ctx.ellipse(p.x,p.y+(hostile?7:16)*z,(hostile?6:9)*z,(hostile?2.4:3)*z,0,0,Math.PI*2);ctx.fill();ctx.restore();drawCentered(ctx,img,p.x,p.y,dims[0]*z,dims[1]*z,hostile?directionAngle(u):0,!hostile,hostile?1:horizontalFacing(u));if(!hostile&&(u.selected||this.groupSelection?.some(x=>x.id===u.id)||this.selected?.id===u.id))this.selectionRing(p.x,p.y,23*z);if((u.health/u.maxHealth)<.65){ctx.fillStyle='#171717';ctx.fillRect(p.x-12*z,p.y-27*z,24*z,2*z);ctx.fillStyle=hostile?'#a94c43':factionStyle(u.owner).color;ctx.fillRect(p.x-12*z,p.y-27*z,24*z*(u.health/u.maxHealth),2*z);}};
  Game.prototype.drawAnimal=function(a){
    const p=this.worldToScreen(a.x*TILE,a.y*TILE),z=this.camera.zoom,state=a.visualState||a.carcassState||(a.health<=0?'dead':'alive'),key=a.type+'_'+state,img=ANIMAL_TOKENS[key]||(a.type==='wolf'?SPRITES.wolf:SPRITES.sheep),token=!!ANIMAL_TOKENS[key];
    const size=token?(a.type==='cow'?30:27)*.64:(a.type==='wolf'?27:25);
    if(!drawCentered(this.ctx,img,p.x,p.y,size*z,(token?size:(a.type==='wolf'?20:19))*z,0,token,horizontalFacing(a)))return oldDrawAnimal.call(this,a);
    if(this.selected?.id===a.id)this.selectionRing(p.x,p.y,(token?15*.64:11)*z);
  };
  Game.prototype.drawBuilding=function(b){const img=SPRITES[b.type];if(!b.built||!ready(img))return oldDrawBuilding.call(this,b);const p=this.worldToScreen(b.x*TILE,b.y*TILE),z=this.camera.zoom,dims={house:[64,66],farm:[64,68],warehouse:[68,62],tower:[42,78],palisade:[54,20],mill:[64,76]}[b.type];if(!dims)return oldDrawBuilding.call(this,b);const ctx=this.ctx;ctx.save();ctx.fillStyle='#0000003f';ctx.beginPath();ctx.ellipse(p.x,p.y+(b.type==='tower'?14:10)*z,Math.max(8,dims[0]*.28)*z,Math.max(3,dims[1]*.07)*z,0,0,Math.PI*2);ctx.fill();ctx.restore();drawCentered(ctx,img,p.x,p.y,dims[0]*z,dims[1]*z);if(this.selected?.id===b.id)this.selectionRing(p.x,p.y,Math.max(15,dims[0]*.28)*z);if(b.health<b.maxHealth){const ratio=Math.max(0,b.health/b.maxHealth),barW=Math.min(32,dims[0]*.55)*z,barY=p.y-(dims[1]*.5+5)*z;ctx.fillStyle='#171717';ctx.fillRect(p.x-barW/2,barY,barW,3*z);ctx.fillStyle='#70835d';ctx.fillRect(p.x-barW/2,barY,barW*ratio,3*z);}};
})();
