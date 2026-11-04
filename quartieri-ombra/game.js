"use strict";
(() => {
 const $=id=>document.getElementById(id),canvas=$("world"),ctx=canvas.getContext("2d"),mini=$("minimap"),mx=mini.getContext("2d");
 const W=1120,H=680,PLAYER=1,ENEMY=-1,NEUTRAL=0,COST=90,TOTAL=15;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rnd=(a,b)=>a+Math.random()*(b-a),distance=(a,b,c,d)=>Math.hypot(a-c,b-d);
 const imageAssets={};
 for(const [key,src] of Object.entries({
   residence:"./assets/buildings/residential_tenement_lowres.webp",
   gendarme:"./assets/units/gendarme_idle_lowres.webp",
   mercenary:"./assets/units/mercenary_idle_lowres.webp"
 })){const picture=new Image();picture.src=src;imageAssets[key]=picture}
 function paintAsset(image,x,y,w,h){
   if(!image||!image.complete||!image.naturalWidth)return false;
   ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(image,x,y,w,h);ctx.restore();return true;
 }
 // Gameplay abstraction inspired by Perris' 1853 Five Points map, not a cadastral tracing.
 // Irregular parcels flank diagonal streets; coordinates remain in the logical A* world.
 const parcels=[
   [10,240,92,74],[245,85,109,70],[400,70,98,78],[445,390,116,70],[750,75,105,78],
   [85,385,108,70],[290,250,96,76],[445,255,115,70],[654,247,104,75],[835,265,114,72],
   [85,477,105,76],[271,464,116,73],[465,482,101,72],[672,456,110,80],[875,479,109,74]
 ];
 const names=["Casa del Corvo","Officina del Ferro","Case dei Molini","Conceria Vecchia","Casa del Porto","Alloggi dei Carrettieri","Mercato del Sale","Casa dei Vetrai","Magazzino del Carbone","Dormitori Grigi","Casa delle Lanterne","Filanda del Ponte","Alloggi dell'Argine","Fonderia di Molo","Casa della Bruma"];
 const defs=parcels.map(([x,y,w,h],i)=>({id:i,x,y,w,h,type:i%3===1?"prod":"res",name:names[i]}));
 // Named lanes are artistic simplifications of the pre-Civic-Center street network.
 // Road geometry is independent from A* collision and is deliberately not a modern OSM import.
 const streets=[
   {name:"Orange Street",width:36,points:[[78,0],[160,160],[216,334],[258,680]]},
   {name:"Cross Street",width:32,points:[[0,361],[209,349],[425,361],[620,348],[1120,385]]},
   {name:"Anthony Street",width:37,points:[[0,208],[231,201],[437,180],[691,191],[1120,168]]},
   {name:"Little Water Street",width:27,points:[[602,0],[594,179],[585,357],[608,680]]},
   {name:"Mulberry Bend",width:30,points:[[946,0],[947,175],[1006,334],[1019,680]]}
 ];
 let game=null,choice="guard",nextUnitId=1,last=performance.now(),fpsAccumulator=0,noticeTimer=0;
 const camera={zoom:1,offsetX:0,offsetY:0};
 const pointerPositions=new Map();let dragStart=null,pinchDistance=null;
 // Resize the Canvas backing store to its physical viewport, then draw with a
 // uniform cover scale. The world never stretches when the phone rotates.
 function coverScale(){return Math.max(canvas.width/W,canvas.height/H)}
 function visibleWorld(){const scale=coverScale()*camera.zoom;return {w:canvas.width/scale,h:canvas.height/scale}}
 // Camera bounds are in PROJECTED pixels, not logical A* coordinates.
 // Include roofs and a small margin so the outermost buildings stay visible.
 const CAMERA_BOUNDS={left:170,top:-110,right:960,bottom:545};
 function clampAxis(value,lo,hi,span){
   const length=hi-lo;
   if(span>=length)return (lo+hi-span)/2;
   return clamp(value,lo,hi-span);
 }
 function constrainCamera(){
   const view=visibleWorld();
   camera.offsetX=clampAxis(camera.offsetX,CAMERA_BOUNDS.left,CAMERA_BOUNDS.right,view.w);
   camera.offsetY=clampAxis(camera.offsetY,CAMERA_BOUNDS.top,CAMERA_BOUNDS.bottom,view.h);
 }
 function resizeWorld(){
   const r=canvas.getBoundingClientRect();
   if(!r.width||!r.height)return;
   const dpr=Math.min(window.devicePixelRatio||1,2);
   const w=Math.max(1,Math.round(r.width*dpr)),h=Math.max(1,Math.round(r.height*dpr));
   if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;constrainCamera()}
 }
 function screenPoint(e){const r=canvas.getBoundingClientRect();const scale=coverScale();return {x:(e.clientX-r.left)*(canvas.width/r.width)/scale,y:(e.clientY-r.top)*(canvas.height/r.height)/scale}}
 function worldPoint(p){return isoInverse(camera.offsetX+p.x/camera.zoom,camera.offsetY+p.y/camera.zoom)}
 function zoomAt(factor,p){const before=worldPoint(p);camera.zoom=clamp(camera.zoom*factor,1,2.6);const projected=isoPoint(before.x,before.y);camera.offsetX=projected.x-p.x/camera.zoom;camera.offsetY=projected.y-p.y/camera.zoom;constrainCamera()}
 function owned(side){return game.buildings.filter(b=>b.owner===side)}
 function approval(side){let a=owned(side);return a.length?Math.round(a.reduce((s,b)=>s+(b.loyalty*side),0)/a.length):0}
 function report(t){$("msg").textContent=t;noticeTimer=5}
 function makeBuilding(d,side){return {...d,loyalty:side*75,owner:side,stock:0,recruit:rnd(12,24),damage:0}}
 function init(level){
   const n=level==="hard"?4:level==="normal"?2:1;
   camera.zoom=1;camera.offsetX=0;camera.offsetY=0;constrainCamera();
   game={level,buildings:defs.map((d,i)=>makeBuilding(d,i===0?1:i>=TOTAL-n?-1:0)),units:[],gold:{1:110,"-1":110},selected:null,order:"guard",time:0,paused:false,over:false,ai:1.2,aiPurchase:0};
   nextUnitId=1;spawn(PLAYER,"g",game.buildings[0]);
   owned(ENEMY).filter(b=>b.type==="res").forEach(b=>spawn(ENEMY,"g",b));
   if(!game.units.some(u=>u.side===ENEMY))spawn(ENEMY,"g",owned(ENEMY)[0]);
   $("start").classList.add("hidden");$("pause").textContent="Ⅱ";setMode("guard");
   report("Comincia la contesa. I gendarmi a presidio influiscono sui palazzi vicini.");
   refresh();
 }
 function spawn(side,type,b){
  if(game.units.filter(u=>u.side===side).length>=26)return null;
  // Spawn at a reachable exterior doorway, never inside an adjacent building.
  // The 20px A* cell center must also be free or the unit could be trapped.
  const j=game.units.length%4;
  const spots=[
   {x:b.x+b.w/2,y:b.y+b.h+22},{x:b.x-22,y:b.y+b.h/2},
   {x:b.x+b.w+22,y:b.y+b.h/2},{x:b.x+b.w/2,y:b.y-22}
  ];
  const valid=p=>p.x>=10&&p.y>=10&&p.x<W-10&&p.y<H-10
   &&!blocked(p.x,p.y)
   &&!blocked(Math.floor(p.x/CELL)*CELL+CELL/2,Math.floor(p.y/CELL)*CELL+CELL/2);
  const s=[...spots.slice(j),...spots.slice(0,j)].find(valid);
  if(!s)return null;
  const u={id:nextUnitId++,side,type,x:s.x,y:s.y,hp:type==="merc"?125:80,maxHp:type==="merc"?125:80,level:1,xp:0,path:[],mode:"guard",building:null,strike:0};
  game.units.push(u);return u;
 }
 function nearestBuildingSpot(u,b){
  let p=[{x:b.x-20,y:b.y+b.h/2},{x:b.x+b.w+20,y:b.y+b.h/2},{x:b.x+b.w/2,y:b.y-22},{x:b.x+b.w/2,y:b.y+b.h+22}];
  p.sort((a,z)=>distance(u.x,u.y,a.x,a.y)-distance(u.x,u.y,z.x,z.y));return p;
 }
 const CELL=20,COLS=Math.ceil(W/CELL),ROWS=Math.ceil(H/CELL);
 function blocked(x,y){return game.buildings.some(b=>x>b.x-10&&x<b.x+b.w+10&&y>b.y-10&&y<b.y+b.h+10)}
 function route(x,y,tx,ty){
  tx=clamp(tx,10,W-10);ty=clamp(ty,10,H-10);
  if(blocked(tx,ty))return null;
  // Le posizioni di spawn possono trovarsi sul bordo della collisione: il primo nodo resta percorribile.
  // Se la cella di arrivo è ostruita, il percorso non deve attraversare l’edificio.
  const endCellX=Math.floor(tx/CELL)*CELL+CELL/2,endCellY=Math.floor(ty/CELL)*CELL+CELL/2;
  if(blocked(endCellX,endCellY))return null;
  let start=Math.floor(y/CELL)*COLS+Math.floor(x/CELL),end=Math.floor(ty/CELL)*COLS+Math.floor(tx/CELL);
  const ox=i=>(i%COLS)*CELL+CELL/2,oy=i=>Math.floor(i/COLS)*CELL+CELL/2;
  const heuristic=i=>Math.abs(i%COLS-end%COLS)+Math.abs(Math.floor(i/COLS)-Math.floor(end/COLS));
  let q=[start],prev=new Int32Array(COLS*ROWS).fill(-1),cost=new Float64Array(COLS*ROWS).fill(Infinity),done=new Set();cost[start]=0;
  let iterations=0;
  while(q.length&&iterations++<6000){
   q.sort((a,b)=>cost[a]+heuristic(a)-cost[b]-heuristic(b));let c=q.shift();
   if(done.has(c))continue;done.add(c);
   if(c===end){let path=[];for(let k=end;k!==start&&k>=0;k=prev[k])path.push({x:ox(k),y:oy(k)});path.reverse();path.push({x:tx,y:ty});return path;}
   let cx=c%COLS,cy=Math.floor(c/COLS);
   for(let [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=COLS||ny>=ROWS)continue;
    const z=ny*COLS+nx;if(done.has(z)||(z!==start&&blocked(ox(z),oy(z))))continue;
    if(cost[c]+1<cost[z]){cost[z]=cost[c]+1;prev[z]=c;if(!q.includes(z))q.push(z)}
   }
  }
  return null;
 }
 function moveTo(u,x,y,mode="move",building=null){let p=route(u.x,u.y,x,y);if(!p)return false;u.path=p;u.mode=mode;u.building=building;return true}
 function sendTo(u,b,mode){for(const p of nearestBuildingSpot(u,b))if(moveTo(u,p.x,p.y,mode,b.id))return true;return false}
 function setMode(m){choice=m;document.querySelectorAll("[data-mode]").forEach(b=>b.classList.toggle("active",b.dataset.mode===m))}
 function update(dt){
  if(!game||game.over||game.paused||isPortraitBlocked())return;
  game.time+=dt;game.ai-=dt;game.aiPurchase-=dt;
  for(const u of game.units){
   if(u.path.length){
    let p=u.path[0],dx=p.x-u.x,dy=p.y-u.y,d=Math.hypot(dx,dy),travel=(u.type==="merc"?61:67)*dt;
    if(d<=travel+0.1){u.x=p.x;u.y=p.y;u.path.shift()}else{u.x+=dx/d*travel;u.y+=dy/d*travel}
   }
  }
  for(const u of game.units){if(u.type==="g"&&!u.path.length){u.xp+=dt*(u.mode==="guard"?.36:.12);if(u.xp>50*u.level&&u.level<4){u.level++;u.xp=0;if(u.side===PLAYER)report("Un gendarme sale al livello "+u.level+".")}}}
  for(const b of game.buildings){
   let pressure=0;
   for(const u of game.units){
    if(u.type!=="g"||u.path.length)continue;
    let x=clamp(u.x,b.x,b.x+b.w),y=clamp(u.y,b.y,b.y+b.h),d=distance(u.x,u.y,x,y),range=137+u.level*16;
    if(d>range)continue;
    let inf=(1.05+u.level*0.7)*Math.max(.15,1-d/(range+30));
    pressure+=u.side*inf*(u.mode==="tax"?.78:1);

   }
   if(pressure!==0)b.loyalty=clamp(b.loyalty+pressure*dt,-100,100);
   else if(b.owner===NEUTRAL)b.loyalty*=Math.max(0,1-dt*.012);
   else b.loyalty=clamp(b.loyalty+b.owner*dt*.11,-100,100);
   let old=b.owner;b.owner=b.loyalty>=35?PLAYER:b.loyalty<=-35?ENEMY:NEUTRAL;
   if(old!==b.owner){b.recruit=rnd(12,25);if(b.owner===PLAYER)report("Conquistato: "+b.name+".");else if(old===PLAYER)report("Hai perso: "+b.name+".")}
   if(b.owner!==NEUTRAL&&b.type==="prod"){
    b.stock=clamp(b.stock+dt*(1.8-b.damage*.01),0,110);
    for(const u of game.units)if(u.side===b.owner&&u.type==="g"&&u.mode==="tax"&&u.building===b.id&&!u.path.length&&distance(u.x,u.y,b.x+b.w/2,b.y+b.h/2)<120){
      let take=Math.min(b.stock,4*dt);b.stock-=take;game.gold[u.side]+=take;b.loyalty=clamp(b.loyalty-u.side*dt*.08,-100,100);
    }
   }
   if(b.owner!==NEUTRAL&&b.type==="res"){
    b.recruit-=dt;if(b.recruit<=0){
     b.recruit=rnd(13,26);
     let chance=clamp(.14+.004*(Math.abs(b.loyalty)+approval(b.owner)),.12,.8);
     if(Math.random()<chance&&game.units.filter(u=>u.side===b.owner&&u.type==="g").length<18){
      const recruit=spawn(b.owner,"g",b);
      if(recruit&&b.owner===PLAYER)report("Nuovo gendarme spontaneo da "+b.name+".");
     }
    }
   }
  }
  for(const u of game.units){
   if(u.path.length)continue;
   const enemies=game.units.filter(v=>v.side!==u.side&&v.hp>0&&distance(u.x,u.y,v.x,v.y)<30);
   if(enemies.length){
    let v=enemies[0];v.hp-=dt*(u.type==="merc"?16:7);
    if(v.hp<=0&&v.side===PLAYER)report("Un tuo uomo è caduto in uno scontro.");
   }else if(u.mode==="assault"&&u.building!==null){
    let b=game.buildings[u.building];
    if(b&&b.owner!==u.side&&distance(u.x,u.y,b.x+b.w/2,b.y+b.h/2)<150){
     b.loyalty=clamp(b.loyalty+u.side*dt*(u.type==="merc"?4.1:1.7),-100,100);b.damage=clamp(b.damage+dt*.07,0,40);
    }
   }
  }
  game.units=game.units.filter(u=>u.hp>0);
  if(game.ai<=0){game.ai=rnd(3,5);aiTurn()}
  if(game.time>10){
   if(owned(PLAYER).length===TOTAL){finish(true);return}
   if(owned(ENEMY).length===TOTAL||(!owned(PLAYER).length&&!game.units.some(u=>u.side===PLAYER))){finish(false);return}
  }
  fpsAccumulator+=dt;if(fpsAccumulator>.35){refresh();fpsAccumulator=0}
 }
 function aiTurn(){
  let aiUnits=game.units.filter(u=>u.side===ENEMY);
  if(owned(ENEMY).length&&game.gold[ENEMY]>=COST&&game.aiPurchase<=0){
    let mercCount=aiUnits.filter(u=>u.type==="merc").length;
    if(mercCount<Math.max(1,Math.floor(owned(ENEMY).length/2))){const hired=spawn(ENEMY,"merc",owned(ENEMY)[0]);if(hired){game.gold[ENEMY]-=COST;game.aiPurchase=16}}
  }
  let productive=owned(ENEMY).filter(b=>b.type==="prod"&&b.stock>15);
  aiUnits.forEach((u,i)=>{
   if(u.path.length||u.mode==="tax"&&productive.some(b=>b.id===u.building&&distance(u.x,u.y,b.x+b.w/2,b.y+b.h/2)<120))return;
   if(u.type==="g"&&productive.length&&i%4===0&&game.gold[ENEMY]<150){sendTo(u,productive[i%productive.length],"tax");return}
   let targets=game.buildings.filter(b=>b.owner!==ENEMY);
   if(!targets.length)return;
   targets.sort((a,b)=>{let score=t=>distance(u.x,u.y,t.x+t.w/2,t.y+t.h/2)+(t.owner===PLAYER?110:0);return score(a)-score(b)});
   let b=targets[i%Math.min(targets.length,3)];if(b)sendTo(u,b,u.type==="merc"?"assault":"guard");
  });
 }
 function finish(won){
  game.over=true;
  let dialog=document.createElement("div");dialog.className="modal";dialog.innerHTML='<div class="paper"><h1>'+ (won?"QUARTIERE CONQUISTATO":"IL CLAN È CADUTO")+'</h1><p>'+ (won?"La tua influenza domina l’intero territorio.":"Il quartiere è ormai nelle mani dei rivali.")+'</p><button id="again">Nuova partita</button></div>';
  document.body.appendChild(dialog);
  dialog.querySelector("button").onclick=()=>{dialog.remove();$("start").classList.remove("hidden")};
 }
 function isIn(b,x,y){return x>=b.x-4&&x<=b.x+b.w+4&&y>=b.y-4&&y<=b.y+b.h+4}
 function tap(x,y){
  if(!game||game.over||game.paused)return;
  const u=game.units.slice().reverse().find(t=>distance(t.x,t.y,x,y)<17);
  if(u&&u.side===PLAYER){game.selected={kind:"unit",id:u.id};refresh();return}
  const b=game.buildings.find(t=>isIn(t,x,y));
  if(b){
   if(game.selected&&game.selected.kind==="unit"){
     let su=game.units.find(t=>t.id===game.selected.id);
     if(su){
     if(choice==="tax"&&(su.type!=="g"||b.type!=="prod"||b.owner!==PLAYER)){report("Esazione: scegli un gendarme e un produttivo del tuo clan.");refresh();return}
     if(choice==="assault"&&b.owner===PLAYER){report("Non puoi assaltare un edificio alleato.");refresh();return}
     if(sendTo(su,b,choice)){report((choice==="tax"?"Riscuoti presso ":choice==="assault"?"Assalta ":"Presidia ")+b.name);refresh();return}
     report("Nessun percorso disponibile verso "+b.name+".");refresh();return;
   }
   }
   game.selected={kind:"building",id:b.id};refresh();return;
  }
  if(game.selected&&game.selected.kind==="unit"){
   let su=game.units.find(t=>t.id===game.selected.id);
   if(su){if(moveTo(su,x,y))report("Unità in movimento.");else report("Destinazione non raggiungibile.")}
  }else game.selected=null;
  refresh();
 }
 canvas.addEventListener("pointerdown",e=>{e.preventDefault();canvas.setPointerCapture(e.pointerId);const p=screenPoint(e);pointerPositions.set(e.pointerId,p);if(pointerPositions.size===1)dragStart={id:e.pointerId,start:p,last:p,moved:false};else{dragStart=null;const points=[...pointerPositions.values()];pinchDistance=distance(points[0].x,points[0].y,points[1].x,points[1].y)}});
 canvas.addEventListener("pointermove",e=>{if(!pointerPositions.has(e.pointerId))return;const p=screenPoint(e);pointerPositions.set(e.pointerId,p);if(pointerPositions.size>=2){const points=[...pointerPositions.values()],d=distance(points[0].x,points[0].y,points[1].x,points[1].y);if(pinchDistance&&d>0)zoomAt(d/pinchDistance,{x:(points[0].x+points[1].x)/2,y:(points[0].y+points[1].y)/2});pinchDistance=d;return}if(dragStart){const q=dragStart.last;if(distance(p.x,p.y,dragStart.start.x,dragStart.start.y)>9)dragStart.moved=true;if(dragStart.moved){camera.offsetX-=(p.x-q.x)/camera.zoom;camera.offsetY-=(p.y-q.y)/camera.zoom;constrainCamera()}dragStart.last=p}});
 function endPointer(e){if(!pointerPositions.has(e.pointerId))return;const p=screenPoint(e);if(dragStart&&dragStart.id===e.pointerId&&!dragStart.moved&&e.type==="pointerup"){const w=worldPoint(p);tap(w.x,w.y)}pointerPositions.delete(e.pointerId);dragStart=null;pinchDistance=null}
 canvas.addEventListener("pointerup",endPointer);canvas.addEventListener("pointercancel",endPointer);
 canvas.addEventListener("wheel",e=>{e.preventDefault();zoomAt(e.deltaY<0?1.12:1/1.12,screenPoint(e))},{passive:false});
 document.querySelectorAll("[data-difficulty]").forEach(b=>b.onclick=()=>init(b.dataset.difficulty));
 document.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>{setMode(b.dataset.mode);report("Ordine "+b.textContent.trim()+": scegli un edificio.");});
 $("hire").onclick=()=>{
  if(!game||game.over)return;
  let b=game.selected&&game.selected.kind==="building"?game.buildings[game.selected.id]:owned(PLAYER)[0];
  if(!b||b.owner!==PLAYER){report("Seleziona un edificio del tuo clan.");return}
  if(game.gold[PLAYER]<COST){report("Oro insufficiente: servono 90 monete.");return}
  game.gold[PLAYER]-=COST;let u=spawn(PLAYER,"merc",b);
  if(u){game.selected={kind:"unit",id:u.id};report("Mercenario assoldato.");}else{game.gold[PLAYER]+=COST;report("Numero massimo di uomini raggiunto.");}
  refresh();
 };
 $("pause").onclick=()=>{if(!game)return;game.paused=!game.paused;$("pause").textContent=game.paused?"▶":"Ⅱ";report(game.paused?"Partita in pausa.":"Partita ripresa.")};
 function isPortraitBlocked(){return window.matchMedia("(orientation: portrait) and (max-width: 900px)").matches}
 function syncFullscreenButton(){
   const active=!!document.fullscreenElement;
   const button=$("fullscreen");button.textContent=active?"⤢":"⛶";
   button.title=active?"Esci da schermo intero":"Schermo intero";
   button.setAttribute("aria-label",button.title);
   button.setAttribute("aria-pressed",String(active));
   resizeWorld();
 }
 $("fullscreen").onclick=async()=>{
   try{
     if(document.fullscreenElement){await document.exitFullscreen()}
     else if(document.documentElement.requestFullscreen){
       await document.documentElement.requestFullscreen({navigationUI:"hide"});
       if(screen.orientation&&typeof screen.orientation.lock==="function"){
         try{await screen.orientation.lock("landscape")}catch(_){/* Browsers can deny orientation lock. CSS gate remains. */}
       }
     }else report("Questo browser non supporta lo schermo intero. Puoi usare la modalità installata/PWA.");
   }catch(_){report("Schermo intero non consentito dal browser. Usa l'orientamento orizzontale.")}
   syncFullscreenButton();
 };
 document.addEventListener("fullscreenchange",syncFullscreenButton);
 window.addEventListener("resize",resizeWorld);
 window.addEventListener("orientationchange",resizeWorld);
 if(typeof ResizeObserver!=="undefined"){new ResizeObserver(resizeWorld).observe(document.querySelector(".battle"))}
 resizeWorld();
 $("help").onclick=()=>$("instructions").classList.remove("hidden");
 $("close-help").onclick=()=>$("instructions").classList.add("hidden");
 function refresh(){
  if(!game)return;
  $("gold").textContent=Math.floor(game.gold[PLAYER]);
  $("men").textContent=game.units.filter(u=>u.side===PLAYER).length;
  $("land").textContent=owned(PLAYER).length+" / "+TOTAL;
  $("consent").textContent=approval(PLAYER)+"%";
  const s=game.selected;let name="Quartiere",type="COMANDO",desc="Seleziona un edificio o un uomo. Presidiare un edificio ne influenza anche i vicini.",detail="";
  if(s&&s.kind==="building"){
   let b=game.buildings[s.id];type=b.type==="prod"?"PRODUTTIVO":"RESIDENZIALE";name=b.name;
   desc=(b.owner===PLAYER?"Tuo clan":b.owner===ENEMY?"Clan rivale":"Neutrale")+". "+(b.type==="prod"?"Produce oro, raccolto dagli esattori.":"Può generare gendarmi spontaneamente.");
   detail="Fedeltà: "+Math.round(b.loyalty)+" / 100 · Oro custodito: "+Math.floor(b.stock);
  }else if(s&&s.kind==="unit"){
   let u=game.units.find(t=>t.id===s.id);
   if(u){type=u.type==="merc"?"MERCENARIO":"GENDARME";name=u.type==="merc"?"Mercenario a soldo":"Gendarme del clan";desc="Salute "+Math.ceil(u.hp)+"/"+u.maxHp+" · Livello "+u.level+" · Ordine: "+u.mode;detail=u.type==="g"?"Influenza politica + esazione":"Combattente senza influenza";}
   else game.selected=null;
  }
  $("sel-type").textContent=type;$("sel-name").textContent=name;$("sel-desc").textContent=desc;$("sel-detail").textContent=detail;
 }

 // World coordinates remain authoritative for AI, pathfinding and influence.
 // Projection is a bijection: one logical ground position -> one screen point.
 const ISO={ox:W/2,oy:40,sx:.48,sy:.24};
 function isoPoint(x,y){return {x:ISO.ox+(x-y)*ISO.sx,y:ISO.oy+(x+y)*ISO.sy}}
 function isoInverse(x,y){const a=(x-ISO.ox)/ISO.sx,b=(y-ISO.oy)/ISO.sy;return {x:(a+b)/2,y:(b-a)/2}}
 function isoPoly(points,fill,stroke){
   ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();
   ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke()}
 }
 function isoFootprint(x,y,w,h){
   return [isoPoint(x,y),isoPoint(x+w,y),isoPoint(x+w,y+h),isoPoint(x,y+h)];
 }
 function isoTop(points,z){return points.map(p=>({x:p.x,y:p.y-z}))}
 function drawIsometricGround(){
   ctx.fillStyle="#292720";ctx.fillRect(0,0,W,H);
   const size=40;
   for(let y=0;y<H;y+=size)for(let x=0;x<W;x+=size){
     const hash=((Math.floor(x/size)*73856093)^(Math.floor(y/size)*19349663))>>>0;
     const shades=["#39352d","#3d382f","#342f29","#403a30"];
     isoPoly(isoFootprint(x,y,size,size),shades[hash%4],"#302d26");
     if(hash%5===0){const p=isoPoint(x+size*.5,y+size*.5);ctx.fillStyle="#292b24";ctx.beginPath();ctx.ellipse(p.x,p.y,7,2,0,0,Math.PI*2);ctx.fill()}
   }
   // Render tapered, skewed street strips in the same orthographic projection as the buildings.
   for(const lane of streets){
     const left=[],right=[];
     lane.points.forEach(([x,y],i)=>{
       const prev=lane.points[Math.max(0,i-1)],next=lane.points[Math.min(lane.points.length-1,i+1)];
       const dx=next[0]-prev[0],dy=next[1]-prev[1],len=Math.hypot(dx,dy)||1;
       const nx=-dy/len*lane.width/2,ny=dx/len*lane.width/2;
       left.push(isoPoint(x+nx,y+ny));right.push(isoPoint(x-nx,y-ny));
     });
     isoPoly([...left,...right.reverse()],"#4a4439","#36312b");
     // A narrow uneven center seam adds road texture without screen-space grid lines.
     ctx.strokeStyle="#60564a";ctx.lineWidth=1;ctx.beginPath();
     lane.points.forEach(([x,y],i)=>{const p=isoPoint(x,y);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)});
     ctx.stroke();
   }
 }
 function drawIsoBuilding(b){
   const p=isoFootprint(b.x,b.y,b.w,b.h),roof=isoTop(p,b.type==="prod"?56:48);
   const wall=b.type==="prod"?"#54443a":"#5c4538",edge="#29231f";
   isoPoly([p[1],p[2],roof[2],roof[1]],"#342d29",edge);
   isoPoly([p[2],p[3],roof[3],roof[2]],wall,edge);
   isoPoly([p[3],p[0],roof[0],roof[3]],"#43352d",edge);
   isoPoly(roof,b.type==="prod"?"#34312f":"#473833","#211f1e");
   const ridge=isoPoint(b.x+b.w*.5,b.y+b.h*.5);ctx.strokeStyle="#665249";ctx.lineWidth=1;
   ctx.beginPath();ctx.moveTo(roof[0].x,roof[0].y);ctx.lineTo(ridge.x,ridge.y-61);ctx.lineTo(roof[2].x,roof[2].y);ctx.stroke();
   // Small windows follow both visible faces rather than screen-aligned rectangles.
   for(const t of [.28,.68]){
     const a={x:roof[2].x+(roof[3].x-roof[2].x)*t,y:roof[2].y+(roof[3].y-roof[2].y)*t+19};
     ctx.fillStyle="#b08a52";ctx.fillRect(a.x-2,a.y,4,7);
   }
   if(b.type==="prod"){
     const chimney=isoPoint(b.x+b.w*.72,b.y+b.h*.3);
     ctx.fillStyle="#39312e";ctx.fillRect(chimney.x-4,chimney.y-75,8,29);
     ctx.fillStyle="#77716a66";ctx.beginPath();ctx.ellipse(chimney.x,chimney.y-80,8,4,0,0,7);ctx.fill();
   }
   const owner=b.owner===PLAYER?"#7fa9cb":b.owner===ENEMY?"#c17b73":"#a39b8d";
   isoPoly(p,"#00000000",owner);
   const anchor=isoPoint(b.x+b.w/2,b.y+b.h/2);
   ctx.textAlign="center";ctx.font="bold 10px Georgia";ctx.fillStyle="#0f0d0bdd";ctx.fillRect(anchor.x-56,anchor.y-95,112,17);
   ctx.fillStyle=owner;ctx.fillText(b.name,anchor.x,anchor.y-83);
   ctx.fillStyle="#262320";ctx.fillRect(anchor.x-35,anchor.y-75,70,4);
   ctx.fillStyle=owner;ctx.fillRect(anchor.x-35,anchor.y-75,70*clamp((b.loyalty+100)/200,0,1),4);
 }
 function drawIsoUnit(u){
   const p=isoPoint(u.x,u.y),color=u.side===PLAYER?"#8fb7d4":"#c67b73";
   ctx.fillStyle="#0008";ctx.beginPath();ctx.ellipse(p.x,p.y,8,4,0,0,7);ctx.fill();
   ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(p.x,p.y,7,3,0,0,7);ctx.fill();
   const sprite=u.type==="merc"?imageAssets.mercenary:imageAssets.gendarme;
   if(!paintAsset(sprite,p.x-11,p.y-32,22,33)){
     ctx.fillStyle=u.type==="merc"?"#5b4239":"#34393d";ctx.fillRect(p.x-4,p.y-22,8,19);
     ctx.fillStyle="#c5a48a";ctx.fillRect(p.x-3,p.y-28,6,7);
     ctx.fillStyle="#232121";ctx.fillRect(p.x-6,p.y-31,12,4);
   }
   ctx.fillStyle="#171411";ctx.fillRect(p.x-10,p.y-37,20,3);
   ctx.fillStyle="#83ae7e";ctx.fillRect(p.x-10,p.y-37,20*clamp(u.hp/u.maxHp,0,1),3);
 }
 function drawScene(){
   ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);
   const displayScale=coverScale()*camera.zoom;
   ctx.setTransform(displayScale,0,0,displayScale,-camera.offsetX*displayScale,-camera.offsetY*displayScale);
   drawIsometricGround();
   // Sort by projected feet, not by source-array order. This prevents units
   // behind buildings from appearing on top of roofs.
   const sprites=[
     ...game.buildings.map(b=>({depth:isoPoint(b.x+b.w,b.y+b.h).y,kind:"building",item:b})),
     ...game.units.map(u=>({depth:isoPoint(u.x,u.y).y,kind:"unit",item:u}))
   ].sort((a,b)=>a.depth-b.depth);
   for(const sprite of sprites)if(sprite.kind==="building")drawIsoBuilding(sprite.item);else drawIsoUnit(sprite.item);
   if(game.selected&&game.selected.kind==="building"){
     const b=game.buildings[game.selected.id];isoPoly(isoFootprint(b.x-5,b.y-5,b.w+10,b.h+10),"#00000000","#e3c57b");
   }
   if(game.selected&&game.selected.kind==="unit"){
     const u=game.units.find(v=>v.id===game.selected.id);
     if(u){const p=isoPoint(u.x,u.y);ctx.strokeStyle="#e3c57b";ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y,12,5,0,0,7);ctx.stroke();
       if(u.type==="g"){ctx.strokeStyle="#c7b17a55";ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(p.x,p.y,(137+u.level*16)*ISO.sx,(137+u.level*16)*ISO.sy,0,0,7);ctx.stroke()}
     }
   }
   drawMini();ctx.setTransform(1,0,0,1,0,0);
 }
 function drawMini(){
  const bounds=CAMERA_BOUNDS,scaleX=180/(bounds.right-bounds.left),scaleY=108/(bounds.bottom-bounds.top);
  const miniPoint=(x,y)=>({x:(x-bounds.left)*scaleX,y:(y-bounds.top)*scaleY});
  mx.fillStyle="#171713";mx.fillRect(0,0,180,108);
  // Draw the same historical street polylines as the battlefield, in projected space.
  for(const street of streets){
    mx.strokeStyle="#655c4b";mx.lineWidth=Math.max(1,street.width*.32*scaleX);
    mx.beginPath();street.points.forEach(([x,y],i)=>{const p=isoPoint(x,y),q=miniPoint(p.x,p.y);i?mx.lineTo(q.x,q.y):mx.moveTo(q.x,q.y)});mx.stroke();
  }
  for(const b of game.buildings){
    const center=isoPoint(b.x+b.w/2,b.y+b.h/2),p=miniPoint(center.x,center.y);
    mx.fillStyle=b.owner===PLAYER?"#76a4c8":b.owner===ENEMY?"#c26b68":"#a0998f";
    mx.fillRect(p.x-2.5,p.y-2,5,4);
  }
  for(const u of game.units){
    const p=isoPoint(u.x,u.y),q=miniPoint(p.x,p.y);
    mx.fillStyle=u.side===PLAYER?"#a9ddff":"#ff8f89";mx.fillRect(q.x-1,q.y-1,2,2);
  }
  const view=visibleWorld(),corner=miniPoint(camera.offsetX,camera.offsetY);
  mx.strokeStyle="#e8cb83";mx.lineWidth=1;
  mx.strokeRect(corner.x,corner.y,view.w*scaleX,view.h*scaleY);
 }
 function loop(now){let dt=Math.min(.05,(now-last)/1000);last=now;if(game){update(dt);drawScene()}requestAnimationFrame(loop)}
 requestAnimationFrame(loop);
})();
