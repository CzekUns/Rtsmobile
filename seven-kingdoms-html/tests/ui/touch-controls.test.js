import test from 'node:test';
import assert from 'node:assert/strict';
import {createClassicTouchControls} from '../../ui/classic/touch-controls.js';
function fakeNode(tag='div'){
  const listeners=new Map();
  return {tag,children:[],attributes:{},hidden:false,textContent:'',disabled:false,
    append(...nodes){this.children.push(...nodes);for(const n of nodes)n.parent=this},
    appendChild(n){this.append(n);return n},
    replaceChildren(...nodes){this.children=[...nodes];for(const n of nodes)n.parent=this},
    setAttribute(k,v){this.attributes[k]=v},getAttribute(k){return this.attributes[k]},
    addEventListener(k,fn){listeners.set(k,fn)},removeEventListener(k){listeners.delete(k)},
    click(){if(!this.disabled)listeners.get('click')?.({})},
    remove(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this)},
  };
}
test('touch palette builds real DOM 44px minimum control candidates and emits scoped HUD actions',()=>{
 const host=fakeNode(),calls=[];
 const model={selection:{actions:[{id:'tax',label:'Tax'},{id:'grant',label:'Subsidy',disabled:true}]}};
 const targets=[
  {id:'report',report:'kingdoms',rect:{x:2,y:2,w:53,h:19}},
  {id:'map-mode',mode:'terrain',rect:{x:620,y:4,w:42,h:36}},
  {id:'action',action:'tax',rect:{x:620,y:411,w:54,h:37}}
 ];
 const hud={getModel:()=>model,getTargets:()=>targets,dispatchPoint:(x,y)=>calls.push([x,y])};
 const palette=createClassicTouchControls(host,hud,{documentRef:{createElement:fakeNode}});
 assert.equal(host.children.length,1);
 const [toggle,panel]=host.children[0].children;
 assert.equal(panel.hidden,true);
 toggle.click();
 assert.equal(toggle.getAttribute('aria-expanded'),'true');
 assert.equal(panel.hidden,false);
 assert.equal(panel.children.length,3,'1 report, 1 map-mode and 1 action');
 panel.children.at(-1).click();
 assert.deepEqual(calls,[[647,429.5]]);
 palette.setOpen(false);
 assert.equal(panel.hidden,true);
 palette.dispose();
 assert.equal(host.children.length,0);
});
test('touch adapter rejects invalid mount and supports empty actions',()=>{
 assert.throws(()=>createClassicTouchControls(null,null),TypeError);
 const host=fakeNode();
 const palette=createClassicTouchControls(host,{
  getTargets:()=>[],getModel:()=>({selection:{actions:[]}}),dispatchPoint(){}},
  {documentRef:{createElement:fakeNode}});
 palette.setOpen(true);
 assert.equal(host.children[0].children[1].children.length,0);
 palette.dispose();
});
