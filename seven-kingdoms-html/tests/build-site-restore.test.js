import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceBuildSites} from '../playtest/build-sites.js';

test('restored site reconnects builder identity and resumes progress without resetting it',()=>{
 const saved=JSON.stringify({
  units:[{id:'u-17',personId:'person-17',owner:1,skillId:1,skillLevel:20,hp:72,x:11,y:10,route:[],target:null}],
  buildSites:[{id:'site-17',builderId:'u-17',kind:'market',owner:1,x:10,y:10,size:3,phase:'building',progressDays:2,requiredDays:5}]
 });
 const restored=JSON.parse(saved);
 restored.get=id=>restored.units.find(u=>u.id===id);
 const worker=restored.units[0],site=restored.buildSites[0];
 assert.deepEqual(advanceBuildSites(restored),[]);
 assert.equal(worker.buildSiteId,'site-17');
 assert.equal(worker.personId,'person-17');
 assert.equal(worker.hp,72);
 assert.equal(site.progressDays,3);
 assert.equal(restored.buildSites.length,1);
});

test('conflicting restored backlink prevents advancing or reassignment',()=>{
 const worker={id:'u-17',owner:1,skillId:1,skillLevel:20,x:11,y:10,route:[],target:null,buildSiteId:'other-site'};
 const site={id:'site-17',builderId:'u-17',kind:'market',owner:1,x:10,y:10,size:3,phase:'building',progressDays:2,requiredDays:5};
 const game={units:[worker],buildSites:[site],get:id=>id===worker.id?worker:null};
 assert.deepEqual(advanceBuildSites(game),[]);
 assert.equal(worker.buildSiteId,'other-site');
 assert.equal(site.progressDays,2);
});
