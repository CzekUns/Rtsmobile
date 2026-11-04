import test from 'node:test';
import assert from 'node:assert/strict';
import {reserveBuildSite,advanceBuildSites} from '../playtest/build-sites.js';
import {FIRMS} from '../rules.js';
function setup(){
 const u={id:'u1',owner:1,kind:'peasant',skillId:1,skillLevel:20,x:10,y:10,route:[],target:null};
 const g={seed:73429,day:1,cash:1000,units:[u],firms:[],towns:[{id:'t1',x:9,y:9,size:1,owner:1}],
  buildSites:[],get(id){return this.units.find(u=>u.id===id)},
  ownTowns(){return this.towns},occupied(){return false},hasHills(){return true},
  note(){},build(kind,x,y){if(this.cash<FIRMS[kind].cost)return {ok:false};this.cash-=FIRMS[kind].cost;const firm={kind,x,y};this.firms.push(firm);return {ok:true,firm}}};
 return {g,u};
}
test('non-builder cannot reserve or spend',()=>{
 const {g,u}=setup();u.skillId=0;
 const result=reserveBuildSite(g,u.id,'market',12,12);
 assert.equal(result.ok,false);assert.equal(g.cash,1000);assert.equal(g.buildSites.length,0);
});
test('reserved site consumes cost once and finishes after five daily updates',()=>{
 const {g,u}=setup();u.x=11;u.y=12;
 const result=reserveBuildSite(g,u.id,'market',12,12);
 assert.equal(result.ok,true,result.msg);
 assert.equal(g.cash,1000-FIRMS.market.cost);
 assert.equal(g.firms.length,0);
 u.route=[];u.target=null;u.x=11;u.y=12;
 for(let i=0;i<4;i++){advanceBuildSites(g);assert.equal(g.firms.length,0);}
 advanceBuildSites(g);
 assert.equal(g.firms.length,1);
 assert.equal(g.cash,1000-FIRMS.market.cost);
 assert.equal(g.buildSites.length,0);
 assert.equal(g.units[0],u);
});
test('unfinished site is JSON serializable without losing builder reference',()=>{
 const {g,u}=setup();u.x=11;u.y=12;
 assert.equal(reserveBuildSite(g,u.id,'market',12,12).ok,true);
 const saved=JSON.parse(JSON.stringify({units:g.units,buildSites:g.buildSites}));
 assert.equal(saved.buildSites[0].builderId,'u1');
 assert.equal(saved.units[0].buildSiteId,saved.buildSites[0].id);
});

test('one builder cannot reserve two sites or spend twice, including stale restored unit state',()=>{
 const {g,u}=setup();u.x=11;u.y=12;
 const first=reserveBuildSite(g,u.id,'market',12,12);
 assert.equal(first.ok,true,first.msg);
 const afterFirst=g.cash;
 const routeAfterFirst=JSON.stringify({route:u.route,target:u.target});
 const second=reserveBuildSite(g,u.id,'market',18,12);
 assert.equal(second.ok,false);
 assert.equal(g.cash,afterFirst);
 assert.equal(g.buildSites.length,1);
 assert.equal(JSON.stringify({route:u.route,target:u.target}),routeAfterFirst);
 u.buildSiteId=null; // Simulate a restored unit with a missing backlink.
 assert.equal(reserveBuildSite(g,u.id,'market',18,12).ok,false);
 assert.equal(g.cash,afterFirst);
 assert.equal(g.buildSites.length,1);
});
