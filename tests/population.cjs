const assert=require('node:assert/strict');
const make=require('./harness.cjs');
let count=0;
function test(name,fn){fn();console.log('PASS',name);count++;}
function setup(){const e=make(),g=e.g;g.newGame(321);g.raiders=[];g.animals=[];g.nextRaidDay=1e6;for(const t of g.world.tiles){t.biome='grass';t.z=0;}e.b=e.run("(()=>{const b=new Building('house',45,45,0,true);game.buildings.push(b);game.ensureInventories();return b})()");return e;}
function settle(e){e.g.enterResident(e.g.units[0],e.b);e.g.enterResident(e.g.units[1],e.b);}
test('housing counts only living completed owned buildings, people count all locations',()=>{
 const e=setup(),g=e.g;settle(e);g.mobilizePerson(g.units[1].id);assert.equal(g.populationInfo().count,5);assert.equal(g.populationCap(),10);e.b.health=0;assert.equal(g.populationCap(),5);e.b.health=100;e.b.progress=.2;assert.equal(g.populationCap(),5);e.b.progress=1;e.b.owner=1;assert.equal(g.populationCap(),5);
});
test('empty districts never generate people from elapsed time',()=>{
 const e=setup();e.b.birthDays=999;for(let i=0;i<170;i++)e.g.buildingDay(e.b);assert.equal(e.g.units.length,5);assert.equal(e.b.birthDays,0);assert.match(e.g.admissionBlocker(e.b),/residenti/);
});
test('arrival requires residents, time, housing and food, creates exactly one housed identity',()=>{
 const e=setup(),g=e.g;settle(e);const before=g.stock.food;for(let i=0;i<149;i++)g.buildingDay(e.b);assert.equal(g.units.length,5);g.buildingDay(e.b);assert.equal(g.units.length,6);assert.equal(new Set(g.units.map(u=>u.id)).size,6);assert.equal(g.units[5].location.settlementId,e.b.id);assert(e.b.residents.includes(g.units[5].id));assert.equal(before-g.stock.food,18);assert.equal(e.b.birthDays,0);assert(g.save());assert(g.load());assert.equal(g.units.length,6);
});
test('lack of food resets progress; remote stocks and grain cannot fund growth',()=>{
 const e=setup(),g=e.g;settle(e);g.stock.food=0;g.stock.bread=0;g.stock.grain=100;e.b.inventory.items.food=30;e.b.birthDays=149;g.buildingDay(e.b);assert.equal(g.units.length,5);assert.equal(e.b.birthDays,0);assert.equal(e.b.inventory.items.food,30);
});
test('monthly food consumption includes residents and mobilized, not beds or dead people',()=>{
 const e=setup(),g=e.g;settle(e);g.mobilizePerson(g.units[1].id);g.units[4].health=0;g.stock.food=10;g.stock.bread=2;g.totalDays=29;g.advanceDay();assert.equal(g.stock.bread,0);assert.equal(g.stock.food,8);assert.equal(g.populationInfo().meal,4);assert(g.save());assert(g.load());g.advanceDay();assert.equal(g.stock.food,8);
});
test('food reserved for transport cannot be consumed; shortage remains visible',()=>{
 const e=setup(),g=e.g,base=g.buildings.find(b=>b.type==='base'),u=g.units[2];g.stock.food=5;u.task={type:'haul',source:base.id,destination:e.b.id,good:'food',phase:'source',amount:5};g.totalDays=29;g.advanceDay();assert.equal(g.stock.food,5);assert.match(e.byId.message.textContent,/0\/5 razioni/);assert.equal(g.units.length,5);
});
test('full district rejects admission and overcrowding never deletes residents',()=>{
 const e=setup(),g=e.g;for(const u of g.units)g.enterResident(u,e.b);e.b.birthDays=149;g.buildingDay(e.b);assert.equal(g.units.length,5);assert.equal(e.b.birthDays,0);g.buildings.find(b=>b.type==='base').health=0;e.b.health=0;assert.equal(g.populationInfo().overcrowded,5);assert.equal(g.units.length,5);
});
test('current progress survives reload; old v5 timer resets without changing original save',()=>{
 const e=setup(),g=e.g;settle(e);e.b.birthDays=80;assert(g.save());assert(g.load());assert.equal(g.buildings.find(b=>b.id===e.b.id).birthDays,80);
 const d=JSON.parse(JSON.stringify(g.snapshot()));delete d.populationRules;d.buildings.find(b=>b.id===e.b.id).birthDays=999;const raw=JSON.stringify(d);e.storage.set('terra-italica-save-v5',raw);assert(g.load());assert.equal(g.buildings.find(b=>b.id===e.b.id).birthDays,0);assert.equal(e.storage.get('terra-italica-save-v5'),raw);
});
test('community shows housing, next consumption and district requirements',()=>{
 const e=setup();e.g.renderCommunity();assert.match(e.byId.populationSummary.textContent,/Popolazione 5 · Alloggi 10/);assert.match(e.byId.populationSummary.textContent,/5 razioni ogni 30/);assert.match(e.byId.populationDistricts.innerHTML,/Servono 2 residenti/);
});
console.log(`${count} population regressions passed.`);
