import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceBuildSites} from '../playtest/build-sites.js';

test('construction pauses when builder walks away and resumes after return',()=>{
 const builder={id:'u1',owner:1,skillId:1,skillLevel:20,x:11,y:10,route:[],target:null,buildSiteId:'site-1'};
 const site={id:'site-1',builderId:'u1',kind:'market',owner:1,x:10,y:10,size:3,phase:'building',progressDays:1,requiredDays:5};
 const game={units:[builder],buildSites:[site],get:id=>id==='u1'?builder:null};
 builder.target={x:25,y:25};
 assert.deepEqual(advanceBuildSites(game),[]);
 assert.equal(site.progressDays,1);
 builder.target=null;builder.x=25;builder.y=25;
 advanceBuildSites(game);
 assert.equal(site.progressDays,1);
 builder.x=11;builder.y=10;
 builder.route=[{x:12,y:10}];
 advanceBuildSites(game);
 assert.equal(site.progressDays,1);
 builder.route=[];
 advanceBuildSites(game);
 assert.equal(site.progressDays,2);
});
