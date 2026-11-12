import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../../game.js',import.meta.url),'utf8');
test('report pressed state synchronized on open and close',()=>{
 assert.match(source,/setAttribute\('aria-pressed',String\(active\)\)/);
 assert.equal((source.match(/setAttribute\('aria-pressed','false'\)/g)||[]).length,2);
});
test('collapsed ORDINI sidebar is inert and focus returns to toggle',()=>{
 const start=source.indexOf('const compactOrders=window.matchMedia(');
 const end=source.indexOf('function status(message)',start);
 assert.ok(start>=0&&end>start);
 const els=new Map();
 const doc={activeElement:null};
 const element=id=>{
  if(!els.has(id))els.set(id,{attributes:{},classList:{set:new Set(),toggle(k,v){v?this.set.add(k):this.set.delete(k);},contains(k){return this.set.has(k);}},setAttribute(k,v){this.attributes[k]=v;},contains(n){return n?.parent===id;},focus(){doc.activeElement=this;},addEventListener(k,cb){this[k]=cb;}});
  return els.get(id);
 };
 const media={matches:true,addEventListener(k,cb){this[k]=cb;}};
 vm.runInNewContext(source.slice(start,end),{window:{matchMedia:()=>media},document:doc,$:element});
 assert.equal(element('orderSidebar').inert,true);
 element('sidebarToggle').click();
 assert.equal(element('orderSidebar').inert,false);
 doc.activeElement={parent:'orderSidebar'};
 element('sidebarToggle').click();
 assert.equal(doc.activeElement,element('sidebarToggle'));
 assert.equal(element('orderSidebar').inert,true);
 media.matches=false;media.change();
 assert.equal(element('orderSidebar').inert,false);
});
