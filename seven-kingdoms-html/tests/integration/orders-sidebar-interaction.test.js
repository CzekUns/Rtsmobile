import test from 'node:test';
import assert from 'node:assert/strict';
import {installOrdersSidebar} from '../../playtest/orders-sidebar.js';

function fixture(compact=false){
 const handlers=new Map(), attrs=new Map(), classes=new Set();
 const toggle={textContent:'',focusCount:0,focus(){this.focusCount++},setAttribute(k,v){attrs.set('toggle:'+k,v)},
  addEventListener(k,fn){handlers.set('toggle:'+k,fn)},removeEventListener(k){handlers.delete('toggle:'+k)}};
 const sidebar={inert:false,setAttribute(k,v){attrs.set('sidebar:'+k,v)},contains(el){return el?.inside===true}};
 const stage={classList:{toggle(k,on){if(on)classes.add(k);else classes.delete(k)},contains:k=>classes.has(k)}};
 const media={matches:compact,addEventListener(k,fn){handlers.set('media:'+k,fn)},removeEventListener(k){handlers.delete('media:'+k)}};
 let focused=null;
 return {toggle,sidebar,stage,media,handlers,attrs,classes,setFocused:v=>focused=v,
  install:()=>installOrdersSidebar({toggle,sidebar,stage,media,activeElement:()=>focused})};
}
test('ORDINI collapses on coarse landscape, hides from keyboard and screen readers',()=>{
 const f=fixture(true),ctl=f.install();
 assert.equal(f.sidebar.inert,true);
 assert.equal(f.attrs.get('sidebar:aria-hidden'),'true');
 assert.equal(f.attrs.get('toggle:aria-expanded'),'false');
 assert.equal(f.classes.has('panel-collapsed'),true);
 f.handlers.get('toggle:click')();
 assert.equal(f.sidebar.inert,false);
 assert.equal(f.attrs.get('sidebar:aria-hidden'),'false');
 assert.equal(f.attrs.get('toggle:aria-expanded'),'true');
 ctl.dispose();assert.equal(f.handlers.size,0);
});
test('ORDINI restores focus before hiding a focused sidebar control',()=>{
 const f=fixture(false),ctl=f.install();
 f.setFocused({inside:true});
 f.handlers.get('toggle:click')();
 assert.equal(f.toggle.focusCount,1);
 assert.equal(f.sidebar.inert,true);
 ctl.dispose();
});
test('ORDINI reacts to viewport changes without stale aria state',()=>{
 const f=fixture(false),ctl=f.install();
 f.media.matches=true;f.handlers.get('media:change')();
 assert.equal(f.sidebar.inert,true);
 f.media.matches=false;f.handlers.get('media:change')();
 assert.equal(f.sidebar.inert,false);
 assert.equal(f.attrs.get('toggle:aria-expanded'),'true');
 ctl.dispose();
});
