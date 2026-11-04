import test from 'node:test';
import assert from 'node:assert/strict';
import {SevenGame} from '../rules.js';

const worker=(skillLevel,hp=100)=>({id:'w-'+skillLevel,personId:'p-'+skillLevel,skillId:3,skillLevel,hp,legacyUnknown:false});
test('original calc_productivity weighting: skill and HP divided by eight slots',()=>{
 const game=new SevenGame();const f=game.firms.find(f=>f.kind==='mine'&&f.owner===1);
 assert.ok(f);f.staff=[worker(40,100),worker(20,50)];f.workers=2;
 assert.equal(game.firmProductivity(f),6.25);
 f.sabotageLevel=2;assert.equal(game.firmProductivity(f),4.25);
 f.sabotageLevel=99;assert.equal(game.firmProductivity(f),0);
});
test('real skill affects mine output; unknown legacy slots preserve demo throughput',()=>{
 const game=new SevenGame();const f=game.firms.find(f=>f.kind==='mine'&&f.owner===1);
 assert.ok(f);f.staff=[worker(80)];f.workers=1;f.underConstruction=false;
 const before=game.raw;game.produce();assert.ok(game.raw>before);
 f.staff=[{...worker(80),legacyUnknown:true}];f.workers=1;
 const next=game.raw;game.produce();assert.ok(game.raw>next);
});
