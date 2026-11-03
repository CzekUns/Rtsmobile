// Seven Kingdoms: Ancient Adversaries town rules (GPL-2.0-or-later).
// Provenance: 7kaa src/OTOWN.cpp, src/OTOWNIF.cpp, src/OTOWNIND.cpp and include/OTOWN.h.
// Pure state transformations; never mutates the input or performs I/O.
export const TOWN_CONSTANTS = Object.freeze({
  MAX_TOWN_POPULATION:60, MIN_RECRUIT_LOYALTY:30,
  REBEL_LOYALTY:29, SURRENDER_LOYALTY:29,
  TAX_PER_PERSON:5, COLLECT_TAX_LOYALTY_DECREASE:10,
  TOWN_REWARD_PER_PERSON:10, TOWN_REWARD_LOYALTY_INCREASE:10,
  INDEPENDENT_LINK_RESISTANCE:50, TRAIN_SKILL_COST:30
});
const clamp=(v,lo=0,hi=100)=>Math.max(lo,Math.min(hi,v));
const clone=t=>({...t,races:t.races.map(r=>({...r,resistance:r.resistance ? [...r.resistance]:undefined,targetResistance:r.targetResistance ? [...r.targetResistance]:undefined}))});
const result=(town,ok,reason,other={})=>({ok,...(reason?{reason}:{}),nextTown:town,cashDelta:0,effects:[],...other});
const integer=(v)=>Number.isInteger(v)&&v>=0;
export function validateTown(t) {
  if(!t || !Array.isArray(t.races) || !integer(t.nationId)) return false;
  if(t.races.some(r=>!integer(r.population)||!integer(r.jobless)||!integer(r.spies??0)||r.jobless>r.population||r.spies>r.jobless||!Number.isFinite(r.loyalty)||r.loyalty<0||r.loyalty>100)) return false;
  return t.races.reduce((n,r)=>n+r.population,0)<=60;
}
export function townPopulation(t) {
  return t.races.reduce((a,r)=>a+r.population,0);
}
export function joblessPopulation(t) {
  return t.races.reduce((a,r)=>a+r.jobless,0);
}
export function averageLoyalty(t) {
  const pop=townPopulation(t);
  return pop ? t.races.reduce((a,r)=>a+r.loyalty*r.population,0)/pop : 0;
}
function check(t){if(!validateTown(t))throw new RangeError("Invalid town state");}
export function changeLoyalty(t,raceId,delta) {
  check(t);
  const out=clone(t),r=out.races[raceId-1];
  if(!r||!Number.isFinite(delta))throw new RangeError("Invalid race or delta");
  r.loyalty=clamp(r.loyalty+delta);
  return out;
}
// OTOWN.cpp Town::collect_tax: cumulative penalty + income scaled by ACTUAL loyalty lost.
export function collectTax(t) {
  check(t);
  if(!t.nationId)return result(t,false,"independent-town");
  if(!t.hasLinkedOwnCamp)return result(t,false,"no-linked-own-camp");
  const out=clone(t);
  const drop=Math.min(20,10+Math.trunc((out.accumulatedCollectTaxPenalty??0)/5));
  out.accumulatedCollectTaxPenalty=(out.accumulatedCollectTaxPenalty??0)+10;
  let cash=0;
  for(const r of out.races) {
    const before=r.loyalty;
    r.loyalty=clamp(before-drop);
    cash+=(before-r.loyalty)*r.population*5/drop;
  }
  return result(out,true,null,{cashDelta:cash,effects:[{type:"tax",loyaltyDecrease:drop},{type:"think-rebel-required"}]});
}
// OTOWN.cpp Town::reward: C++ does NOT gate manually on cash; auto-reward checks cash > 0.
export function reward(t) {
  check(t);
  if(!t.nationId)return result(t,false,"independent-town");
  if(!t.hasLinkedOwnCamp)return result(t,false,"no-linked-own-camp");
  const out=clone(t);
  const gain=Math.max(3,10-Math.trunc((out.accumulatedRewardPenalty??0)/5));
  out.accumulatedRewardPenalty=(out.accumulatedRewardPenalty??0)+10;
  for(const r of out.races)r.loyalty=clamp(r.loyalty+gain);
  return result(out,true,null,{cashDelta:-townPopulation(t)*10,effects:[{type:"reward",loyaltyIncrease:gain}]});
}
// OTOWN.cpp Town::process_auto. One auto action of each type may occur per call.
export function processAuto(t,{cash=0,autoCollectTaxLoyalty=0,autoGrantLoyalty=0}={}) {
  check(t);
  if(!t.hasLinkedOwnCamp||!t.nationId)return result(t,true,null);
  let out=t,delta=0,effects=[];
  if(autoCollectTaxLoyalty>0 && (out.accumulatedCollectTaxPenalty??0)===0 && averageLoyalty(out)>=autoCollectTaxLoyalty){
    const x=collectTax(out);out=x.nextTown;delta+=x.cashDelta;effects.push(...x.effects);
  }
  if(autoGrantLoyalty>0 && (out.accumulatedRewardPenalty??0)===0 && averageLoyalty(out)<autoGrantLoyalty && cash>0){
    const x=reward(out);out=x.nextTown;delta+=x.cashDelta;effects.push(...x.effects);
  }
  return result(out,true,null,{cashDelta:delta,effects});
}
// OTOWNIF.cpp Town::recruitable_race_pop. Training may already count among spies.
export function recruitableRacePop(t,raceId,{recruitSpy=true}={}) {
  check(t);
  const r=t.races[raceId-1];if(!r)throw new RangeError("Invalid race");
  let n=r.jobless-((t.trainingRaceId===raceId)?1:0);
  if(!recruitSpy){n-=r.spies;if(n===-1)n=0;}
  if(n<0)throw new RangeError("Inconsistent recruitment counts");
  return n;
}
// OTOWNIF.cpp Town::recruit_dec_loyalty. Uses float division and C++ truncation/ceil.
export function recruitLoyaltyPenalty(t,raceId,{apply=true,fixRecruitDecLoyalty=false}={}) {
  check(t);
  const r=t.races[raceId-1];if(!r||!r.population)throw new RangeError("Race empty");
  let decrease=Math.min(5,60/r.population);
  if(fixRecruitDecLoyalty || apply)decrease=Math.min(10,decrease+(t.accumulatedRecruitPenalty??0)/5);
  const amount=fixRecruitDecLoyalty?Math.ceil(decrease):Math.trunc(decrease);
  if(!apply)return {amount,rawDecrease:decrease,nextTown:t};
  const out=clone(t);
  out.races[raceId-1].loyalty=Math.max(0,r.loyalty-decrease);
  out.accumulatedRecruitPenalty=(out.accumulatedRecruitPenalty??0)+5;
  return {amount,rawDecrease:decrease,nextTown:out};
}
// Deterministic subset of recruitment: requires an explicit decision from map/spies adapter.
// OTOWNIF.cpp Town::recruit; training and spy-mobilization remain integration responsibilities.
export function recruitUnskilled(t,raceId,{canPlaceUnit=false,selectedSpy=false,fixRecruitDecLoyalty=false}={}) {
  check(t);
  if(!t.nationId)return result(t,false,"independent-town");
  if(!recruitableRacePop(t,raceId))return result(t,false,"no-recruitable-population");
  if(!canPlaceUnit)return result(t,false,"no-unit-placement");
  if(selectedSpy)return result(t,false,"spy-adapter-required");
  const out=clone(t),r=out.races[raceId-1];
  if(r.jobless-r.spies<=0)return result(t,false,"spy-selection-required");
  r.population--;r.jobless--;
  // C++ mobilize_town_people dec_pop first, then recruit_dec_loyalty on surviving race.
  if(r.population===0)return result(out,true,null,{effects:[{type:"unit-mobilized",raceId},{type:"town-abandoned"}]});
  const p=recruitLoyaltyPenalty(out,raceId,{fixRecruitDecLoyalty});
  return result(p.nextTown,true,null,{effects:[{type:"unit-mobilized",raceId},{type:"recruit-loyalty",amount:p.rawDecrease}]});
}
// OTOWN.cpp Town::update_loyalty, one update step, original /30 and minimum 0.5.
export function updateLoyalty(t) {
  check(t);if(!t.nationId)return result(t,true,null);
  const out=clone(t);
  for(const r of out.races){
    if(!r.population)continue;
    if(!Number.isFinite(r.targetLoyalty))throw new RangeError("Missing target loyalty");
    if(r.loyalty<r.targetLoyalty){
      if(!t.hasLinkedOwnCamp && t.hasLinkedEnemyCamp)continue;
      r.loyalty=clamp(r.loyalty+Math.max((r.targetLoyalty-r.loyalty)/30,0.5));
    }else if(r.loyalty>r.targetLoyalty)r.loyalty=clamp(r.loyalty-Math.max((r.loyalty-r.targetLoyalty)/30,0.5));
  }
  return result(out,true,null);
}
// OTOWN.cpp Town::update_resistance: only declines, target -1 is no influence.
export function updateResistance(t,{activeNationIds=[]}={}) {
  check(t);if(t.nationId)return result(t,false,"not-independent");
  const out=clone(t),effects=[];
  for(const r of out.races){
    if(!r.resistance||!r.targetResistance)throw new RangeError("Missing resistance arrays");
    for(const id of activeNationIds){
      const i=id-1;if(i<0||i>=r.resistance.length)throw new RangeError("Invalid nation");
      if(!r.population){r.resistance[i]=0;continue;}
      const target=r.targetResistance[i];
      if(target>=0&&r.resistance[i]>target)r.resistance[i]=Math.max(target,r.resistance[i]-Math.max(1,(r.resistance[i]-target)/30));
    }
  }
  for(const id of activeNationIds){
    if(out.races.every(r=>r.resistance[id-1]<1)){effects.push({type:"surrender-candidate",nationId:id});break;}
  }
  return result(out,true,null,{effects});
}
// OTOWN.cpp Town::population_grow. Caller must invoke at the original scheduler cadence.
export function populationGrow(t,{qualityOfLife=50}={}) {
  check(t);
  if(t.townDefenderCount>0||townPopulation(t)>=60)return result(t,true,null);
  const out=clone(t),effects=[];let total=townPopulation(t);
  for(let i=0;i<out.races.length&&total<60;i++){
    const r=out.races[i];
    const step=t.nationId?Math.trunc(r.population*(100+qualityOfLife)/100):r.population;
    r.growth=(r.growth??0)+step;
    while(r.growth>100&&total<60){r.growth-=100;r.population++;r.jobless++;total++;effects.push({type:"birth",raceId:i+1});}
  }
  return result(out,true,null,{effects});
}
// OTOWN.cpp Town::think_surrender: calculates the original candidate eligibility;
// camp_influence remains supplied by external military adapter.
export function surrenderCandidate(t,{camps=[],rebelMobileCount=0}={}) {
  check(t);
  if(!t.nationId||t.hasLinkedOwnCamp||!t.hasLinkedEnemyCamp||rebelMobileCount>0)return null;
  const discontent=t.races.reduce((s,r)=>s+(r.population>r.spies&&r.loyalty<=29?r.population:0),0);
  if(discontent<Math.trunc(townPopulation(t)*2/3))return null;
  let best=averageLoyalty(t),id=null;
  for(const c of camps)if(c.enabled&&c.isCamp&&c.nationId&&c.nationId!==t.nationId&&c.hasOverseer&&c.influence>best){best=c.influence;id=c.nationId;}
  return id;
}
// OTOWNIND.cpp independent decision scheduling and link toggles.
export function independentSchedule(t,{gameDate,townId}={}) {
  check(t);if(t.nationId||t.rebelId)return [];
  return [{event:"set-links",days:15},{event:"unit-join-nation",days:60},{event:"form-new-nation",days:365}]
    .filter(x=>gameDate%x.days===townId%x.days).map(x=>x.event);
}
export function independentFirmLink(t,{isCamp=false,firmNationId=0,averageResistance=100}={}) {
  check(t);
  if(t.nationId)return null;
  if(isCamp)return null; // Original AI does not toggle links to military camps.
  return firmNationId===0||averageResistance<=50;
}
