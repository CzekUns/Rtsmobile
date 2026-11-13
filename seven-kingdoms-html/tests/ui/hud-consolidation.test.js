import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {installOrdersSidebar} from '../../playtest/orders-sidebar.js';
const source=readFileSync(new URL('../../game.js',import.meta.url),'utf8');
test('report pressed state synchronized on open and close',()=>{
 assert.match(source,/setAttribute\('aria-pressed',String\(active\)\)/);
 assert.equal((source.match(/setAttribute\('aria-pressed','false'\)/g)||[]).length,2);
});
test('collapsed ORDINI sidebar is inert and focus returns to toggle',()=>{
 const attributes=new Map(),classes=new Set(),listeners=new Map();
 let active={inside:true},focusRestored=false;
 const sidebar={inert:false,contains:el=>el?.inside===true,setAttribute:(k,v)=>attributes.set('sidebar:'+k,v)};
 const stage={classList:{toggle:(k,v)=>v?classes.add(k):classes.delete(k),contains:k=>classes.has(k)}};
 const toggle={focus(){focusRestored=true;active=this;},setAttribute:(k,v)=>attributes.set('toggle:'+k,v),
  addEventListener:(k,cb)=>listeners.set('toggle:'+k,cb),removeEventListener:k=>listeners.delete('toggle:'+k)};
 const media={matches:true,addEventListener:(k,cb)=>listeners.set('media:'+k,cb),
  removeEventListener:k=>listeners.delete('media:'+k)};
 const controller=installOrdersSidebar({sidebar,stage,toggle,media,activeElement:()=>active});
 assert.equal(sidebar.inert,true);
 assert.equal(attributes.get('sidebar:aria-hidden'),'true');
 listeners.get('toggle:click')();
 assert.equal(sidebar.inert,false);
 listeners.get('toggle:click')();
 assert.equal(focusRestored,true);
 assert.equal(sidebar.inert,true);
 media.matches=false;listeners.get('media:change')();
 assert.equal(sidebar.inert,false);
 controller.dispose();
 assert.equal(listeners.size,0);
});
