import test from 'node:test';
import assert from 'node:assert/strict';
import {create7kaaRng,next7kaaRand,next7kaaRandom} from '../../core/7kaa-rng.js';
import {SEVEN_KAA_FRAMES_PER_DAY,is7kaaLeapYear,sevenKaaJulian,sevenKaaDayOfYear,
 sevenKaaFromJulian,create7kaaCalendar,next7kaaDay,create7kaaFrameState,step7kaaFrame} from '../../core/7kaa-time.js';
const sequence=[[22695478,346],[-2138921681,130],[-1427733316,10982],
 [71484141,1090],[-1383558894,11656],[-1681029957,7117]];
test('upstream Misc::rand fixed signed-int32 sequence',()=>{
 let r=create7kaaRng(1);
 for(const [seed,value] of sequence){const next=next7kaaRand(r);assert.deepEqual([next.rng.seed,next.value],[seed,value]);r=next.rng;}
 assert.deepEqual(next7kaaRand(create7kaaRng(0)),{rng:{seed:1},value:0});
});
test('Misc::random scales rather than modulos, consumes even a zero max',()=>{
 assert.deepEqual(next7kaaRandom(create7kaaRng(1),32767),{rng:{seed:22695478},value:345});
 assert.deepEqual(next7kaaRandom(create7kaaRng(1),0),{rng:{seed:22695478},value:0});
 assert.throws(()=>next7kaaRandom(create7kaaRng(1),32768),RangeError);
});
test('10000 RNG draws deterministic around a serialized checkpoint',()=>{
 const run=(r,n)=>{let checksum=0;for(let i=0;i<n;i++){const next=next7kaaRand(r);r=next.rng;checksum=(checksum+next.value)>>>0;}return {r,checksum};};
 const full=run(create7kaaRng(-1),10000),first=run(create7kaaRng(-1),3751);
 const last=run(JSON.parse(JSON.stringify(first.r)),6249);
 assert.deepEqual(full.r,last.r);assert.equal(full.checksum,(first.checksum+last.checksum)>>>0);
});
test('DateInfo Julian source fixtures and Gregorian leap rules',()=>{
 assert.equal(sevenKaaJulian(1000,6,1),2086454);
 assert.equal(sevenKaaJulian(1000,7,1),2086484);
 assert.equal(sevenKaaJulian(1001,1,1),2086668);
 assert.equal(sevenKaaJulian(2000,2,29),2451604);
 assert.equal(is7kaaLeapYear(1900),false);assert.equal(is7kaaLeapYear(2000),true);
 assert.equal(sevenKaaDayOfYear(2000,3,1),61);
 assert.throws(()=>sevenKaaJulian(1900,2,29),RangeError);
});
test('Julian date integer inverse at month/leap/century boundaries',()=>{
 for(const year of [1,1000,1001,1600,1700,1900,2000,2400,9999])
 for(let month=1;month<=12;month++){
  const julian=sevenKaaJulian(year,month,1);
  assert.deepEqual(sevenKaaFromJulian(julian),
   {year,month,day:1,dayOfYear:sevenKaaDayOfYear(year,month,1)});
 }
});
test('Info::next_day month/year boundaries and capped accounting day',()=>{
 let c=create7kaaCalendar();
 assert.deepEqual([c.gameDate,c.gameDay,c.gameMonth,c.gameYear],[2086454,1,6,1000]);
 for(let i=0;i<29;i++)c=next7kaaDay(c).calendar;
 assert.equal(c.gameDay,30);
 const n=next7kaaDay(c);assert.equal(n.monthChanged,true);
 assert.deepEqual([n.calendar.gameDay,n.calendar.gameMonth],[1,7]);
 const y=next7kaaDay(create7kaaCalendar({year:1000,month:12,day:31}));
 assert.equal(y.yearChanged,true);assert.equal(y.calendar.yearPassed,1);
 assert.deepEqual([y.calendar.gameYear,y.calendar.gameMonth,y.calendar.gameDay],[1001,1,1]);
});
test('Sys::process 10 frame constant, > threshold and sync every 3',()=>{
 assert.equal(SEVEN_KAA_FRAMES_PER_DAY,10);
 let state=create7kaaFrameState();
 for(let i=0;i<10;i++){const r=step7kaaFrame(state);state=r.state;assert.equal(r.dayBoundary,false);}
 assert.equal(state.calendar.gameDate,2086454);
 const r=step7kaaFrame(state);
 assert.equal(r.dayBoundary,true);assert.equal(r.state.dayFrameCount,0);
 assert.equal(r.state.calendar.gameDate,2086455);
});
test('10001 frame steps match resumed serialized simulation',()=>{
 const run=(s,n)=>{let days=0;for(let i=0;i<n;i++){const r=step7kaaFrame(s);s=r.state;days+=Number(r.dayBoundary);}return {s,days};};
 const full=run(create7kaaFrameState(),10001),first=run(create7kaaFrameState(),4512);
 const last=run(JSON.parse(JSON.stringify(first.s)),5489);
 assert.deepEqual(full.s,last.s);assert.equal(full.days,first.days+last.days);
});
