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

test('mixed legacy and skilled roster has consistent effective throughput without inventing skills',()=>{
 const game=new SevenGame();
 const f=game.firms.find(f=>f.kind==='mine'&&f.owner===1);
 assert.ok(f);
 const legacy={id:'legacy-1',personId:'legacy-1',legacyUnknown:true,hp:100};
 const skilled=worker(20);
 f.staff=[legacy,skilled];f.workers=2;f.underConstruction=false;f.sabotageLevel=0;
 const original=JSON.stringify(f.staff);
 assert.equal(game.firmProductivity(f),3.75); // (10 + 20)/8
 const before=game.raw;game.produce();
 assert.ok(Math.abs((game.raw-before)-0.6)<1e-8); // 3.75 * .8 * .20
 assert.equal(JSON.stringify(f.staff),original);
 assert.equal(f.staff[0].skillLevel,undefined);
 f.staff=[legacy,{...skilled,skillLevel:0}];f.workers=2;
 assert.ok(game.firmProductivity(f)>0);
});
test('legacy-only production and HUD index use the same fallback',()=>{
 const game=new SevenGame();
 const f=game.firms.find(f=>f.kind==='mine'&&f.owner===1);
 assert.ok(f);
 f.staff=[{id:'legacy-a',legacyUnknown:true,hp:100},{id:'legacy-b',legacyUnknown:true,hp:100}];
 f.workers=2;f.underConstruction=false;f.sabotageLevel=0;
 assert.equal(game.firmProductivity(f),2.5);
 const before=game.raw;game.produce();
 assert.ok(Math.abs((game.raw-before)-0.4)<1e-8);
});
