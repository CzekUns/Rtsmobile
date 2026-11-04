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
 const defs=Array.from({length:TOTAL},(_,i)=>({id:i,x:100+(i%5)*210,y:125+Math.floor(i/5)*174,w:115,h:76,type:i%3===1?"prod":"res",name:["Casa del Corvo","Officina del Ferro","Case dei Molini","Conceria Vecchia","Casa del Porto","Alloggi dei Carrettieri","Mercato del Sale","Casa dei Vetrai","Magazzino del Carbone","Dormitori Grigi","Casa delle Lanterne","Filanda del Ponte","Alloggi dell'Argine","Fonderia di Molo","Casa della Bruma"][i]}));
 let game=null,choice="guard",nextUnitId=1,last=performance.now(),fpsAccumulator=0,noticeTimer=0;
 const camera={zoom:1,offsetX:0,offsetY:0};
 const pointerPositions=new Map();let dragStart=null,pinchDistance=null;
 function constrainCamera(){const visibleW=W/camera.zoom,visibleH=H/camera.zoom;camera.offsetX=clamp(camera.offsetX,0,Math.max(0,W-visibleW));camera.offsetY=clamp(camera.offsetY,0,Math.max(0,H-visibleH))}
 function screenPoint(e){const r=canvas.getBoundingClientRect();const scale=Math.min(r.width/W,r.height/H);const dx=(r.width-W*scale)/2,dy=(r.height-H*scale)/2;return {x:(e.clientX-r.left-dx)/scale,y:(e.clientY-r.top-dy)/scale}}
 function worldPoint(p){return {x:camera.offsetX+p.x/camera.zoom,y:camera.offsetY+p.y/camera.zoom}}
 function zoomAt(factor,p){const before=worldPoint(p);camera.zoom=clamp(camera.zoom*factor,1,2.6);camera.offsetX=before.x-p.x/camera.zoom;camera.offsetY=before.y-p.y/camera.zoom;constrainCamera()}
 function owned(side){return game.buildings.filter(b=>b.owner===side)}
 function approval(side){let a=owned(side);return a.length?Math.round(a.reduce((s,b)=>s+(b.loyalty*side),0)/a.length):0}
 function report(t){$("msg").textContent=t;noticeTimer=5}
 function makeBuilding(d,side){return {...d,loyalty:side*75,owner:side,stock:0,recruit:rnd(12,24),damage:0}}
 function init(level){
   const n=level==="hard"?4:level==="normal"?2:1;
   camera.zoom=1;camera.offsetX=0;camera.offsetY=0;
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
  const j=game.units.length%4;
  const spots=[{x:b.x+b.w/2,y:b.y+b.h+22},{x:b.x-22,y:b.y+b.h/2},{x:b.x+b.w+22,y:b.y+b.h/2},{x:b.x+b.w/2,y:b.y-20}],s=spots[j];
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
  if(!game||game.over||game.paused)return;
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
 function drawScene(){
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,W,H);
  ctx.setTransform(camera.zoom,0,0,camera.zoom,-camera.offsetX*camera.zoom,-camera.offsetY*camera.zoom);
  ctx.fillStyle="#292725";ctx.fillRect(0,0,W,H);
  for(let y=0;y<H;y+=35)for(let x=0;x<W;x+=35){
   let v=Math.sin(x*.29+y*.19)*14;ctx.fillStyle="rgba(6,6,5,"+(.07+Math.abs(v)/250)+")";ctx.fillRect(x+2,y+2,32,32);
  }
  ctx.fillStyle="#474037";for(let i=0;i<4;i++){ctx.fillRect(0,95+i*173,W,55);ctx.fillRect(40+i*211,0,58,H)}
  ctx.strokeStyle="#5d5445";ctx.lineWidth=1;for(let x=0;x<W;x+=22){for(let y=0;y<H;y+=22){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+12,y);ctx.stroke()}}
  for(let i=0;i<50;i++){let x=(i*197+71)%W,y=(i*193+34)%H;ctx.fillStyle="#292f2d";ctx.beginPath();ctx.ellipse(x,y,9,3,-.2,0,Math.PI*2);ctx.fill()}
  let sorted=[...game.buildings].sort((a,b)=>a.y-b.y);
  for(const b of sorted)drawBuilding(b);
  for(const u of [...game.units].sort((a,b)=>a.y-b.y))drawUnit(u);
  if(game.selected&&game.selected.kind==="building"){const b=game.buildings[game.selected.id];ctx.strokeStyle="#e3c57b";ctx.lineWidth=3;ctx.strokeRect(b.x-5,b.y-5,b.w+10,b.h+10)}
  if(game.selected&&game.selected.kind==="unit"){let u=game.units.find(x=>x.id===game.selected.id);if(u){ctx.strokeStyle="#e3c57b";ctx.beginPath();ctx.ellipse(u.x,u.y+4,17,7,0,0,7);ctx.stroke();if(u.type==="g"){ctx.strokeStyle="#e3c57b55";ctx.lineWidth=1;ctx.beginPath();ctx.arc(u.x,u.y,137+u.level*16,0,7);ctx.stroke()}}}
  drawMini();ctx.setTransform(1,0,0,1,0,0);
 }
 function drawBuilding(b){
  const x=b.x,y=b.y,w=b.w,h=b.h,col=b.owner===PLAYER?"#6992b6":b.owner===ENEMY?"#a45452":"#91877b";
  ctx.fillStyle="#14111188";ctx.fillRect(x+8,y+20,w+10,h+28);
  ctx.strokeStyle=col;ctx.lineWidth=2;ctx.strokeRect(x-3,y-3,w+6,h+6);
  ctx.fillStyle="#4a352d";ctx.fillRect(x,y+12,w,h-12);
  ctx.fillStyle=b.type==="prod"?"#463d37":"#55433b";ctx.fillRect(x+5,y+20,w-10,h-24);
  ctx.fillStyle="#1f1e1e";ctx.beginPath();ctx.moveTo(x-10,y+14);ctx.lineTo(x+27,y-22);ctx.lineTo(x+w-14,y-22);ctx.lineTo(x+w+9,y+14);ctx.closePath();ctx.fill();
  ctx.strokeStyle="#61534b";ctx.stroke();
  ctx.strokeStyle="#2f2928";for(let k=0;k<8;k++){ctx.beginPath();ctx.moveTo(x+9+k*13,y+9);ctx.lineTo(x+25+k*11,y-16);ctx.stroke()}
  for(let j=0;j<3;j++){let xx=x+14+j*35;ctx.fillStyle="#1a1818";ctx.fillRect(xx,y+29,16,21);ctx.fillStyle="#b78a4c";ctx.fillRect(xx+3,y+32,10,15);ctx.strokeStyle="#2a2725";ctx.strokeRect(xx+3,y+32,10,15)}
  ctx.fillStyle="#19191a";ctx.fillRect(x+w/2-10,y+h-28,20,26);
  if(b.type==="prod"){ctx.fillStyle="#36302d";ctx.fillRect(x+w-23,y-37,13,26);ctx.fillStyle="#77706d50";ctx.beginPath();ctx.ellipse(x+w-18,y-42,8,5,0,0,7);ctx.fill()}
  if(b.type==="res")paintAsset(imageAssets.residence,x-5,y-54,w+10,h+55);
  ctx.fillStyle="#171616de";ctx.fillRect(x-7,y-53,w+14,32);
  ctx.fillStyle=col;ctx.font="bold 11px Georgia";ctx.textAlign="center";ctx.fillText((b.owner===PLAYER?"◆ ":b.owner===ENEMY?"✕ ":"◇ ")+b.name,x+w/2,y-39);
  ctx.fillStyle="#60534b";ctx.fillRect(x+3,y-29,w-6,6);
  ctx.fillStyle=col;let portion=clamp((b.loyalty+100)/200,0,1);ctx.fillRect(x+3,y-29,(w-6)*portion,6);
  ctx.fillStyle="#e3d4bd";ctx.font="10px Georgia";ctx.fillText((b.type==="prod"?"◉ ":"⌂ ")+Math.round(b.loyalty)+" fed.",x+w/2,y-12);
 }
 function drawUnit(u){
  let c=u.side===PLAYER?"#8ab4da":"#c77673";
  ctx.fillStyle="#0008";ctx.beginPath();ctx.ellipse(u.x,u.y+7,9,4,0,0,7);ctx.fill();
  ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(u.x,u.y+3,10,5,0,0,7);ctx.fill();
  ctx.fillStyle=u.type==="merc"?"#6b4638":"#383b3f";ctx.fillRect(u.x-5,u.y-15,10,18);
  ctx.fillStyle="#c2a185";ctx.fillRect(u.x-3,u.y-22,6,7);
  ctx.fillStyle="#202022";ctx.fillRect(u.x-7,u.y-25,14,4);ctx.fillRect(u.x-4,u.y-29,8,6);
  ctx.strokeStyle=u.type==="merc"?"#bbb7ad":"#433329";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(u.x+5,u.y-15);ctx.lineTo(u.x+11,u.y+6);ctx.stroke();
  paintAsset(u.type==="merc"?imageAssets.mercenary:imageAssets.gendarme,u.x-13,u.y-45,26,53);
  ctx.fillStyle="#120d0d";ctx.fillRect(u.x-11,u.y-33,22,3);ctx.fillStyle="#7fa970";ctx.fillRect(u.x-11,u.y-33,22*clamp(u.hp/u.maxHp,0,1),3);
  if(u.level>1){ctx.fillStyle="#e4c88d";ctx.textAlign="center";ctx.font="10px Georgia";ctx.fillText(u.level,u.x,u.y-37)}
 }
 function drawMini(){
  mx.fillStyle="#161613";mx.fillRect(0,0,180,108);
  mx.fillStyle="#494137";for(let i=0;i<4;i++)mx.fillRect(0,15+i*27,180,6);
  for(const b of game.buildings){mx.fillStyle=b.owner===PLAYER?"#76a4c8":b.owner===ENEMY?"#c26b68":"#a0998f";mx.fillRect(b.x/W*180,b.y/H*108,Math.max(5,b.w/W*180),Math.max(4,b.h/H*108))}
  for(const u of game.units){mx.fillStyle=u.side===PLAYER?"#a9ddff":"#ff8f89";mx.fillRect(u.x/W*180,u.y/H*108,2,2)}
  mx.strokeStyle="#e8cb83";mx.lineWidth=1;mx.strokeRect(camera.offsetX/W*180,camera.offsetY/H*108,180/camera.zoom,108/camera.zoom);
 }
 function loop(now){let dt=Math.min(.05,(now-last)/1000);last=now;if(game){update(dt);drawScene()}requestAnimationFrame(loop)}
 requestAnimationFrame(loop);
})();
