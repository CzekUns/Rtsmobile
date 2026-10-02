const test=require('node:test'),assert=require('node:assert/strict'),make=require('./harness.cjs');
const ev=(pointerId,x,y)=>({pointerId,clientX:x,clientY:y,preventDefault(){},stopPropagation(){}});
test('free tap orders, free drag pans; MOD tap selects and MOD drag boxes',()=>{
  const {g,byId}=make();let select=0,order=0;
  g.rtsLeftTap=()=>select++;g.rtsContextTap=()=>order++;
  g.pointerDown(ev(1,180,250));g.pointerUp(ev(1,180,250));assert.equal(order,1);assert.equal(select,0);
  const x=g.camera.x;g.pointerDown(ev(2,180,250));g.pointerMove(ev(2,220,250));g.pointerUp(ev(2,220,250));assert(g.camera.x<x);assert.equal(order,1);
  byId.touchModifier.listeners.pointerdown[0](ev(99,0,0));
  g.pointerDown(ev(3,180,250));g.pointerUp(ev(3,180,250));assert.equal(select,1);assert.equal(order,1);
  const camera=g.camera.x;g.pointerDown(ev(4,180,250));g.pointerMove(ev(4,220,300));assert(g.rtsSelectionBox.active);assert.equal(g.camera.x,camera);g.pointerUp(ev(4,220,300));assert.equal(order,1);
});
test('free tap respects explicit orders before contextual delivery',()=>{
  const {g}=make();let tool=0,context=0;g.rtsLeftTap=()=>tool++;g.rtsContextTap=()=>context++;
  for(const mode of ['orderMode']){g[mode]='test';g.pointerDown(ev(1,180,250));g.pointerUp(ev(1,180,250));g[mode]=null;}
  assert.equal(tool,1);assert.equal(context,0);
});
test('incursions disabled by default, including scheduled spawning',()=>{
  const {g}=make();assert.equal(g.raidsEnabled,false);g.spawnRaid();assert.equal(g.raiders.length,0);
  g.nextRaidDay=g.totalDays;g.advanceDay();assert.equal(g.raiders.length,0);assert.equal(g.raidLevel,0);
});
test('saved raiders are removed and their attack orders cleared without changing camps or cargo',()=>{
  const {g}=make();g.raidsEnabled=true;g.spawnRaid();const u=g.units[0];g.assignAttack(u,g.raiders[0]);u.inventory={type:'wood',amount:3,cap:14};const camps=g.warCamps.map(c=>c.id);assert(g.save());
  g.raidsEnabled=false;assert(g.load());assert.equal(g.raiders.length,0);assert.equal(g.units[0].task,null);assert.equal(g.units[0].inventory.amount,3);assert.deepEqual(g.warCamps.map(c=>c.id),camps);
  g.spawnRaid();assert.equal(g.raiders.length,0);
});

