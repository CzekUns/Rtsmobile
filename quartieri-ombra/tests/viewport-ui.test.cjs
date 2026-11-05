"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const css=fs.readFileSync(path.join(root,"style.css"),"utf8");
const src=fs.readFileSync(path.join(root,"game.js"),"utf8");
function harness({width=740,height=315,dpr=2,portrait=false}={}){
 const elements={},events={},raf=[];
 function element(id){
  const el={id,width:id==="world"?1120:180,height:id==="world"?680:108,textContent:"",
    classList:{add(){},remove(){},toggle(){}},dataset:{},style:{},
    setAttribute(k,v){this[k]=v},addEventListener(k,handler){(events[id]??={})[k]=handler},
    setPointerCapture(){},getBoundingClientRect(){return {left:0,top:0,width:id==="world"?width:180,height:id==="world"?height:108}},
    getContext(){return new Proxy({}, {get:(_,k)=>()=>{}})}
  };elements[id]=el;return el;
 }
 for(const id of ["world","minimap","gold","men","land","consent","start","pause","help","instructions","close-help","hire","msg","sel-type","sel-name","sel-desc","sel-detail","fullscreen"])element(id);
 const diff=["easy","normal","hard"].map(level=>Object.assign(element(level),{dataset:{difficulty:level}}));
 const modes=["guard","tax","assault"].map(mode=>Object.assign(element(mode),{dataset:{mode},textContent:mode}));
 const document={
  getElementById:id=>elements[id],
  querySelector:selector=>selector===".battle"?{id:"battle"}:null,
  querySelectorAll:selector=>selector==="[data-difficulty]"?diff:selector==="[data-mode]"?modes:[],
  addEventListener:(k,fn)=>{(events.document??={})[k]=fn},
  documentElement:{requestFullscreen:async()=>{document.fullscreenElement=document.documentElement;events.document?.fullscreenchange?.()}},
  fullscreenElement:null,
  exitFullscreen:async()=>{document.fullscreenElement=null;events.document?.fullscreenchange?.()}
 };
 const sandbox={
  document,
  window:{devicePixelRatio:dpr,matchMedia:()=>({matches:portrait}),addEventListener:(k,fn)=>{(events.window??={})[k]=fn}},
  screen:{orientation:{lock:async()=>{}}},
  performance:{now:()=>0},
  Image:class {constructor(){this.complete=false;this.naturalWidth=0}},
  ResizeObserver:class{observe(){}},
  requestAnimationFrame:fn=>raf.push(fn),
  console
 };
 vm.runInNewContext(src,sandbox,{filename:"game.js",timeout:3500});
 return {elements,events,raf,diff,document};
}
test("landscape-only UI, fullscreen control and locked page exist",()=>{
 assert.match(html,/id="fullscreen"/);assert.match(html,/id="rotate-overlay"/);
 assert.match(css,/touch-action:none/);assert.match(css,/overflow:hidden/);
 assert.match(css,/@media\s*\(orientation:portrait\)/);
 assert.match(css,/\.battle canvas\s*\{width:100%;height:100%/);
});
test("viewport backing pixels and fullscreen toggle",async()=>{
 const a=harness();assert.equal(a.elements.world.width,1480);assert.equal(a.elements.world.height,630);
 await a.elements.fullscreen.onclick();assert.equal(a.elements.fullscreen["aria-pressed"],"true");
 await a.elements.fullscreen.onclick();assert.equal(a.elements.fullscreen["aria-pressed"],"false");
});
test("game still boots and pointer/camera listeners remain wired",()=>{
 const a=harness({width:860,height:390,dpr:1});
 a.diff[0].onclick();assert.equal(a.elements.land.textContent,"1 / 15");
 for(const name of ["pointerdown","pointermove","pointerup","pointercancel","wheel"])
   assert.equal(typeof a.events.world[name],"function");
 assert.equal(a.elements.world.width,860);assert.equal(a.elements.world.height,390);
});
test("portrait keeps the modal rotation gate and blocks simulation in update",()=>{
 const a=harness({portrait:true,width:390,height:800});
 a.diff[0].onclick();assert.equal(a.elements.land.textContent,"1 / 15");
 assert.match(src,/game\.paused\|\|isPortraitBlocked\(\)/);
 assert.equal(typeof a.raf[0],"function");
});
