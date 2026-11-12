import test from 'node:test';
import assert from 'node:assert/strict';
import {reportScrollState,scrollReports,installReportToolbar} from '../../playtest/report-toolbar.js';
test('navigation bounds are clamped at both edges',()=>{
 assert.deepEqual(reportScrollState({scrollWidth:500,clientWidth:200,scrollLeft:-3}),{backward:false,forward:true});
 assert.deepEqual(reportScrollState({scrollWidth:500,clientWidth:200,scrollLeft:300}),{backward:true,forward:false});
 assert.deepEqual(reportScrollState({scrollWidth:100,clientWidth:200,scrollLeft:0}),{backward:false,forward:false});
});
test('scrolls to next clipped report and previous clipped report',()=>{
 let selected='';
 const button=(name,left,right)=>({getBoundingClientRect:()=>({left,right}),scrollIntoView:()=>{selected=name;}});
 const items=[button('a',0,60),button('b',60,120),button('c',120,180)];
 const container={querySelectorAll:()=>items,getBoundingClientRect:()=>({left:0,right:100})};
 scrollReports(container,1);assert.equal(selected,'b');
 scrollReports(container,-1);assert.equal(selected,'','no button clipped at left edge');
});
test('installer updates arrow disabled state and cleans up listeners',()=>{
 const listeners=new Map();
 const element=()=>({disabled:false,addEventListener:(k,f)=>listeners.set(k,f),removeEventListener:(k)=>listeners.delete(k)});
 const container={...element(),scrollWidth:300,clientWidth:100,scrollLeft:0,querySelectorAll:()=>[]};
 const back=element(),forward=element();
 const cleanup=installReportToolbar(container,back,forward);
 assert.equal(back.disabled,true);assert.equal(forward.disabled,false);
 container.scrollLeft=200;listeners.get('scroll')();assert.equal(back.disabled,false);assert.equal(forward.disabled,true);
 cleanup();assert.equal(listeners.size,0);
});
