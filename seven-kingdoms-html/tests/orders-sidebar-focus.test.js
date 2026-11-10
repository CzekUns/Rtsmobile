import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8');
const start=source.indexOf("const compactOrders=window.matchMedia(");
const end=source.indexOf("function status(message)",start);
assert.ok(start>=0&&end>start,'orders controller must be present');

function harness(compact=false){
 const elements=new Map();
 function element(id){
  if(!elements.has(id))elements.set(id,{
   attributes:{},classList:{values:new Set(),toggle(k,on){on?this.values.add(k):this.values.delete(k);}},
   setAttribute(k,v){this.attributes[k]=v;},contains(node){return node?.parent===id;},
   focus(){document.activeElement=this;},addEventListener(event,cb){this[event]=cb;}
  });
  return elements.get(id);
 }
 const document={activeElement:null};
 const media={matches:compact,addEventListener(event,cb){this[event]=cb;}};
 const context={window:{matchMedia(){return media;}},document,$:element};
 vm.runInNewContext(source.slice(start,end),context);
 return {element,document,media};
}
test('collapsed orders are inert, hidden, and excluded from focus',()=>{
 const h=harness(true),sidebar=h.element('orderSidebar'),toggle=h.element('sidebarToggle');
 assert.equal(sidebar.inert,true);
 assert.equal(sidebar.attributes['aria-hidden'],'true');
 assert.equal(toggle.attributes['aria-expanded'],'false');
 toggle.click();
 assert.equal(sidebar.inert,false);
 assert.equal(sidebar.attributes['aria-hidden'],'false');
 assert.equal(toggle.attributes['aria-expanded'],'true');
 h.document.activeElement={parent:'orderSidebar'};
 toggle.click();
 assert.equal(h.document.activeElement,toggle);
 assert.equal(sidebar.inert,true);
});
test('compact viewport changes update visibility and keyboard access',()=>{
 const h=harness(false),sidebar=h.element('orderSidebar');
 assert.equal(sidebar.inert,false);
 h.media.matches=true;h.media.change();
 assert.equal(sidebar.inert,true);
 h.media.matches=false;h.media.change();
 assert.equal(sidebar.inert,false);
});
