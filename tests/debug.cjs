const assert=require('node:assert/strict');
const make=require('./harness.cjs');
let failed=0;
function test(name,fn){try{fn();console.log('PASS',name)}catch(e){failed++;console.error('FAIL',name,e.message)}}
function setup(){const e=make(),g=e.g;g.newGame(123);g.paused=false;g.animals=[];g.raiders=[];g.nextRaidDay=100000;for(const t of g.world.tiles){t.biome='grass';t.z=0;}return e;}
test('reserved wood cannot fund a road',()=>{const e=setup(),g=e.g,base=g.buildings.find(b=>b.type==='base');base.x=40.5;base.y=40.5;g.units[0].x=40.5;g.units[0].y=40.5;const dest=e.run("(()=>{const b=new Building('warehouse',44,40,0,true);game.buildings.push(b);game.ensureInventories();return b})()");g.stock.wood=1;g.assignHaul(g.units[0],base,dest,'wood',true);assert.equal(g.available(base,'wood'),0);g.placeBuild('road',42,42);assert(!g.world.tile(42,42).road);assert.equal(g.stock.wood,1)});
test('an existing path cannot cross a newly placed palisade',()=>{const e=setup(),g=e.g,u=g.units[0];u.x=40.5;u.y=40.5;u.path=[{x:41.5,y:40.5},{x:42.5,y:40.5}];e.run("game.buildings.push(new Building('palisade',41,40,0,true))");g.followPath(u,1,1.6);assert.equal(u.x,40.5);assert.equal(u.path.length,0)});
test('new orders do not leave old group highlight on a selected building',()=>{const e=setup(),g=e.g;g.groupSelection=[g.units[0],g.units[1]];g.selected=g.units[0];g.placeBuild('farm',42,42);let rings=0;g.selectionRing=()=>rings++;g.drawHuman(g.units[1],false);assert.equal(rings,0)});
test('restored game visibly pauses and Resume restarts physical movement',()=>{const e=setup(),g=e.g,u=g.units[0];u.x=40.5;u.y=40.5;g.assignMove(u,43,40);assert(g.save());assert(g.load());const loaded=g.units[0];assert(!e.byId.pauseNotice.classList.contains('hidden'));const x=loaded.x;g.update(.05);assert.equal(loaded.x,x);e.byId.resumeGame.onclick();assert.equal(g.paused,false);assert(e.byId.pauseNotice.classList.contains('hidden'));g.update(.05);assert(loaded.x>x)});
if(failed)process.exitCode=1;
