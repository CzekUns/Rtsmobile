/* Original modular Five Points-inspired board preview; NOT a historical survey.
   World coordinates and sector layout are independent of gameplay/NPC systems. */
(()=>{'use strict';
const canvas=document.querySelector('#view'),ctx=canvas.getContext('2d'),mini=document.querySelector('#mini'),mc=mini.getContext('2d');
const WORLD=2700,CENTER=WORLD/2,SEED=1860,roads=[],houses=[],props=[];
let cam={x:CENTER,y:CENTER,zoom:.88},vw=1,vh=1,dpr=1,drag=null,pointers=new Map(),pinch=null;
function hash(a,b,c=0){let n=Math.imul(a+SEED,374761393)^Math.imul(b+71,668265263)^Math.imul(c+13,224682251);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const iso=(x,y)=>({x:(x-y)*.5,y:(x+y)*.25});
const uniso=(x,y)=>({x:x+2*y,y:2*y-x});
function poly(points,fill,stroke){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke()}}
function path(pts,color,width){ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke()}
function at(x,y){return iso(x,y)}
function diamond(x,y,w,d){return [at(x,y),at(x+w,y),at(x+w,y+d),at(x,y+d)]}
const palette=['#57453c','#62483d','#4e403a','#6c5142','#58463d','#745947','#4d4742','#655044'];
// Five branching arterial corridors, each continued to world boundary. Artist's layout, not Perris tracing.
const rays=[[-1,-.20],[-.48,-1],[.57,-1],[1,.18],[.12,1]];
for(let i=0;i<5;i++){const [dx,dy]=rays[i],len=1900;roads.push({width:90+i%2*14,points:[{x:CENTER,y:CENTER},{x:CENTER+dx*470+dy*36,y:CENTER+dy*470-dx*36},{x:CENTER+dx*960-dy*40,y:CENTER+dy*960+dx*40},{x:CENTER+dx*len,y:CENTER+dy*len}]})}
// Additional connected bent streets; no regular street grid.
for(let i=0;i<5;i++){let a=rays[i],b=rays[(i+1)%5];for(let r=480;r<1800;r+=430){roads.push({width:27+hash(i,r)*20,points:[{x:CENTER+a[0]*r,y:CENTER+a[1]*r},{x:CENTER+(a[0]+b[0])*r*.55+35*Math.sin(i+r),y:CENTER+(a[1]+b[1])*r*.55},{x:CENTER+b[0]*r,y:CENTER+b[1]*r}]})}}
function segdist(px,py,a,b){let vx=b.x-a.x,vy=b.y-a.y,t=clamp(((px-a.x)*vx+(py-a.y)*vy)/(vx*vx+vy*vy||1),0,1);return Math.hypot(px-a.x-t*vx,py-a.y-t*vy)}
function roadDistance(x,y){let best=Infinity;for(const r of roads)for(let j=1;j<r.points.length;j++)best=Math.min(best,segdist(x,y,r.points[j-1],r.points[j])-r.width*.5);return best}
function fits(x,y,w,d){const pts=[[x,y],[x+w,y],[x,y+d],[x+w,y+d],[x+w*.5,y+d*.5]];return pts.every(([a,b])=>a>20&&b>20&&a<WORLD-20&&b<WORLD-20&&roadDistance(a,b)>9)}
// 9 contiguous production sectors, varied lot sizes and frontages.
for(let sy=0;sy<3;sy++)for(let sx=0;sx<3;sx++){let sector=sy*3+sx;
for(let row=0;row<13;row++)for(let col=0;col<13;col++){
const rx=hash(col,row,sector),ry=hash(row,col,sector+37);
let x=sx*900+col*69+rx*14-9,y=sy*900+row*69+ry*15-9;
let w=49+Math.floor(hash(col,row,sector+2)*17),d=43+Math.floor(hash(col,row,sector+3)*19);
if(!fits(x-3,y-3,w+6,d+6))continue;
let kind=hash(col,row,sector+4),floors=kind>.89?2:kind>.28?3+Math.floor(hash(col,row,sector+5)*3):2;
houses.push({x,y,w,d,h:26+floors*21,floors,kind,shade:Math.floor(hash(col,row,sector+6)*palette.length),seed:Math.floor(hash(col,row,sector+7)*1000),sector});
if(hash(col,row,sector+8)>.68)props.push({x:x+w+6,y:y+d+5,kind:hash(col,row,sector+9)>.6?'lamp':'barrel'});
}}
houses.sort((a,b)=>(a.x+a.y+a.w+a.d)-(b.x+b.y+b.w+b.d));
props.sort((a,b)=>(a.x+a.y)-(b.x+b.y));
function building(b){let p=diamond(b.x,b.y,b.w,b.d),h=b.h;let up=p.map(q=>({x:q.x,y:q.y-h}));let base=palette[b.shade];
poly([p[1],p[2],up[2],up[1]],base,'#28231f');poly([p[2],p[3],up[3],up[2]],'#40352f','#251f1c');
for(let floor=0;floor<b.floors;floor++){let yy=-(floor*21+12);
for(let side of [[p[1],p[2]],[p[2],p[3]]]){let [a,z]=side;for(let n=1;n<=2;n++){let t=n/3,xx=a.x+(z.x-a.x)*t,cy=a.y+(z.y-a.y)*t+yy;ctx.fillStyle=(hash(b.seed,n,floor)>.7?'#b18a4c':'#191d1c');ctx.fillRect(xx-2.5,cy-6,5,7);ctx.fillStyle='#26211d';ctx.fillRect(xx-3,cy+1,6,2)}}}
if(b.kind>.55){let edge=[p[1],p[2]],a=edge[0],z=edge[1];ctx.strokeStyle='#947454';ctx.lineWidth=3;path([{x:a.x,y:a.y-12},{x:z.x,y:z.y-12}],'#8e684b',3)}
poly(up,'#343330','#1c1b1a');poly([up[0],up[1],{x:(up[1].x+up[2].x)/2,y:(up[1].y+up[2].y)/2-5},{x:(up[0].x+up[3].x)/2,y:(up[0].y+up[3].y)/2-5}],'#51443c','#28231e');
let ch=up[0];ctx.fillStyle='#352c28';ctx.fillRect(ch.x+12,ch.y-14,7,17);ctx.fillStyle='#201d1a';ctx.fillRect(ch.x+11,ch.y-15,9,3);
}
function prop(p){let a=at(p.x,p.y);if(p.kind==='lamp'){ctx.strokeStyle='#302a24';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(a.x,a.y-27);ctx.stroke();ctx.fillStyle='#d4a45c';ctx.fillRect(a.x-3,a.y-32,6,7)}else{ctx.fillStyle='#403027';ctx.fillRect(a.x-4,a.y-7,8,7);ctx.strokeStyle='#92724e';ctx.strokeRect(a.x-4,a.y-7,8,7)}}
function terrain(){poly(diamond(0,0,WORLD,WORLD),'#38332d');for(let x=0;x<WORLD;x+=64)for(let y=0;y<WORLD;y+=64){let v=hash(x,y);if(v>.48){poly(diamond(x+v*5,y,57,57),v>.84?'#403a32':'#39342e')}}}
function street(r){let pts=r.points.map(p=>at(p.x,p.y));path(pts,'#272722',r.width*.64);path(pts,'#615748',r.width*.54);path(pts,'#706352',r.width*.39);path(pts,'#4c453a',1.2)}
function render(){const box=canvas.getBoundingClientRect();if(box.width!==vw||box.height!==vh){vw=box.width;vh=box.height;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(vw*dpr);canvas.height=Math.round(vh*dpr)}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#171411';ctx.fillRect(0,0,vw,vh);
let c=iso(cam.x,cam.y);ctx.translate(vw/2-c.x*cam.zoom,vh/2-c.y*cam.zoom);ctx.scale(cam.zoom,cam.zoom);
terrain();roads.forEach(street);
const scene=[...houses.map(b=>({z:b.x+b.y+b.w+b.d,b,fn:()=>building(b)})),...props.map(p=>({z:p.x+p.y,p,fn:()=>prop(p)}))].sort((a,b)=>a.z-b.z);for(const item of scene){let q=item.b?at(item.b.x,item.b.y):item.p?at(item.p.x,item.p.y):null;if(q){let sx=(q.x-c.x)*cam.zoom+vw/2,sy=(q.y-c.y)*cam.zoom+vh/2;if(sx < -240||sx>vw+240||sy < -260||sy>vh+260)continue}item.fn();}
ctx.setTransform(dpr,0,0,dpr,0,0);drawMini();}
function drawMini(){mc.fillStyle='#25231e';mc.fillRect(0,0,296,122);const s=.041;mc.save();mc.translate(148,61);mc.scale(s,s*.5);mc.translate(-CENTER,-CENTER);mc.strokeStyle='#87745c';for(const r of roads){mc.beginPath();r.points.forEach((p,i)=>i?mc.lineTo(p.x,p.y):mc.moveTo(p.x,p.y));mc.lineWidth=r.width;mc.stroke()}mc.fillStyle='#574438';for(const b of houses)mc.fillRect(b.x,b.y,b.w,b.d);mc.restore();mc.strokeStyle='#e1ba77';mc.lineWidth=2;mc.strokeRect(148+(cam.x-CENTER)*s-vw/(cam.zoom*20),61+(cam.y-CENTER)*s*.5-vh/(cam.zoom*20),vw/(cam.zoom*10),vh/(cam.zoom*10))}
function screenWorld(x,y){let c=iso(cam.x,cam.y),p=uniso((x-vw/2)/cam.zoom+c.x,(y-vh/2)/cam.zoom+c.y);return p}
function move(dx,dy){let p=uniso(dx/cam.zoom,dy/cam.zoom);cam.x=clamp(cam.x-p.x,0,WORLD);cam.y=clamp(cam.y-p.y,0,WORLD)}
function zoom(f,x=vw/2,y=vh/2){let before=screenWorld(x,y);cam.zoom=clamp(cam.zoom*f,.42,2.6);let after=screenWorld(x,y);cam.x=clamp(cam.x+before.x-after.x,0,WORLD);cam.y=clamp(cam.y+before.y-after.y,0,WORLD)}
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});pinch=null});
canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;let old=pointers.get(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1)move(e.clientX-old.x,e.clientY-old.y);else if(pointers.size===2){let a=[...pointers.values()],dist=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),mx=(a[0].x+a[1].x)/2,my=(a[0].y+a[1].y)/2;if(pinch){move(mx-pinch.mx,my-pinch.my);zoom(dist/pinch.dist,mx-canvas.getBoundingClientRect().left,my-canvas.getBoundingClientRect().top)}pinch={dist,mx,my}}render()});
function release(e){pointers.delete(e.pointerId);pinch=null}canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
canvas.addEventListener('wheel',e=>{e.preventDefault();let r=canvas.getBoundingClientRect();zoom(e.deltaY<0?1.13:.88,e.clientX-r.left,e.clientY-r.top);render()},{passive:false});
mini.addEventListener('pointerdown',e=>{let r=mini.getBoundingClientRect();cam.x=clamp(CENTER+((e.clientX-r.left)/r.width-.5)*WORLD*2,0,WORLD);cam.y=clamp(CENTER+((e.clientY-r.top)/r.height-.5)*WORLD*2,0,WORLD);render()});
document.querySelector('#reset').onclick=()=>{cam={x:CENTER,y:CENTER,zoom:.88};render()};
document.querySelector('#full').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else{await document.documentElement.requestFullscreen();if(screen.orientation?.lock)try{await screen.orientation.lock('landscape')}catch{}}}catch(e){console.warn('Fullscreen unavailable',e)}render()};
window.addEventListener('resize',render);render();
window.__boardPreview={houses,roads,props,iso,uniso,render,cam};
})();