import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canvasMetrics,syncFullscreenCanvas} from '../playtest/fullscreen-layout.js';
import {WorldView} from '../view.js';
import {installMobileRtsControls} from '../playtest/mobile-rts-controls.js';
const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('full viewport canvas metrics keep world geometry sharp on a high-DPI phone',()=>{
 assert.deepEqual(canvasMetrics(915,412,2),{
  width:1830,height:824,ratio:2,tileSize:48
 });
 assert.deepEqual(canvasMetrics(1280,720,3),{
  width:2560,height:1440,ratio:2,tileSize:48
 });
 assert.deepEqual(canvasMetrics(700,350,1),{
  width:700,height:350,ratio:1,tileSize:24
 });
});
test('changing orientation or screen size preserves world camera and screen/world hit coordinates',()=>{
 const canvas={width:612,height:528,getContext:()=>({})};
 const mini={width:184,height:137,getContext:()=>({})};
 const view=new WorldView(canvas,mini);
 const before={cx:view.cx,cy:view.cy,zoom:view.zoom};
 const first=syncFullscreenCanvas(view,915,412,2);
 const unit={x:24.5,y:26.25};
 const pt=view.screen(unit.x,unit.y),back=view.worldAt(pt.x,pt.y);
 assert.ok(Math.abs(back.x-unit.x)<1e-9&&Math.abs(back.y-unit.y)<1e-9);
 assert.equal(view.tile(),48);
 const second=syncFullscreenCanvas(view,412,915,2);
 assert.equal(first.width,1830);
 assert.equal(second.width,824);
 assert.equal(canvas.height,1830);
 assert.deepEqual({cx:view.cx,cy:view.cy,zoom:view.zoom},before);
 const pt2=view.screen(unit.x,unit.y),back2=view.worldAt(pt2.x,pt2.y);
 assert.ok(Math.abs(back2.x-unit.x)<1e-9&&Math.abs(back2.y-unit.y)<1e-9);
});
test('fullscreen HTML and HUD overlays are layered above the map, not cutting its viewport',()=>{
 const css=source('style.css'),html=source('index.html'),game=source('game.js');
 assert.ok(css.includes('#stage{')&&css.includes('position:fixed;inset:0;width:100%;height:100dvh'));
 assert.ok(css.includes('.playfield{position:absolute;inset:0;display:block;width:100%;height:100%'));
 assert.ok(css.includes('.land{position:absolute;inset:0;width:100%;height:100%'));
 assert.ok(css.includes('#world{display:block;width:100%;height:100%'));
 assert.ok(css.includes('.sidebar{')&&css.includes('position:absolute;z-index:21'));
 assert.ok(css.includes('#stage.panel-collapsed .sidebar'));
 assert.ok(html.includes('id="sidebarToggle"'));
 assert.ok(html.includes('id="orderSidebar"'));
 assert.ok(game.includes('syncFullscreenCanvas(view,rect.width,rect.height,window.devicePixelRatio||1)'));
 assert.ok(game.includes("new ResizeObserver(resizeStage).observe($('world'))"));
 assert.ok(game.includes("setOrdersVisible(!compactOrders.matches)"));
 assert.ok(game.includes("compactOrders.addEventListener('change'"));
 assert.ok(html.includes('style.css?v=6')&&html.includes('game.js?v=14'));
});
test('classic pop-out is accessible and starts collapsed, with controls on the lower left',()=>{
 const html=source('index.html'),css=source('style.css'),js=source('playtest/mobile-rts-controls.js');
 assert.ok(html.includes('id="touchControlsToggle"'));
 assert.ok(html.includes('aria-expanded="false" aria-controls="touchJoystick touchModifier"'));
 assert.ok(css.includes('#touchControlsToggle{')&&css.includes('border:4px ridge #c4b58f'));
 assert.ok(css.includes('#mobileRtsPad:not(.is-open) #touchJoystick'));
 assert.ok(css.includes('#mobileRtsPad.is-open #touchJoystick'));
 assert.ok(css.includes('#touchModifier{')&&css.includes('right:auto;top:auto;transform:none'));
 assert.ok(js.includes("root.classList.toggle('is-open',on)"));
 assert.ok(js.includes("toggle.addEventListener('click',()=>setMenuOpen"));
 assert.ok(js.includes("if(!on)reset()"));
});

test('touch control menu toggles on tap and releases held MOD before closing',()=>{
 const oldWindow=globalThis.window,oldDocument=globalThis.document;
 const oldRaf=globalThis.requestAnimationFrame,oldCaf=globalThis.cancelAnimationFrame;
 function fakeElement(){
  const listeners=new Map(),classes=new Set(),attributes=new Map();
  return {
   listeners,classes,attributes,
   classList:{toggle:(n,on)=>{if(on)classes.add(n);else classes.delete(n)},contains:n=>classes.has(n),remove:n=>classes.delete(n),add:n=>classes.add(n)},
   style:{},addEventListener:(n,fn)=>listeners.set(n,fn),
   setAttribute:(n,v)=>attributes.set(n,String(v)),
   getBoundingClientRect:()=>({left:0,top:0,width:100,height:100}),
   setPointerCapture(){},
   trigger:(name,event={})=>listeners.get(name)?.(event)
  };
 }
 const root=fakeElement(),joystick=fakeElement(),modifier=fakeElement(),
  thumb=fakeElement(),toggle=fakeElement();
 joystick.parentElement=root;
 globalThis.window={addEventListener(){}};
 globalThis.document={addEventListener(){},hidden:false};
 globalThis.requestAnimationFrame=()=>1;
 globalThis.cancelAnimationFrame=()=>{};
 try{
  const controls=installMobileRtsControls({joystick,thumb,modifier,toggle,onPan:()=>{}});
  assert.equal(toggle.attributes.get('aria-expanded'),'false');
  assert.equal(root.classes.has('is-open'),false);
  toggle.trigger('click');
  assert.equal(root.classes.has('is-open'),true);
  assert.equal(toggle.attributes.get('aria-expanded'),'true');
  modifier.trigger('pointerdown',{pointerId:8,preventDefault(){}});
  assert.equal(controls.modifierHeld(),true);
  toggle.trigger('click');
  assert.equal(root.classes.has('is-open'),false);
  assert.equal(toggle.attributes.get('aria-expanded'),'false');
  assert.equal(controls.modifierHeld(),false);
 }finally{
  globalThis.window=oldWindow;globalThis.document=oldDocument;
  globalThis.requestAnimationFrame=oldRaf;globalThis.cancelAnimationFrame=oldCaf;
 }
});
