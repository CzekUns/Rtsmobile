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

// OTOWN.cpp Town::next_day: every day, all four accumulated penalties decay by one.
export function decayPenalties(t) {
  check(t);
  const out=clone(t);
  for(const key of ["accumulatedCollectTaxPenalty","accumulatedRewardPenalty","accumulatedRecruitPenalty","accumulatedEnemyGrantPenalty"]){
    if((out[key]??0)>0)out[key]--;
  }
  return result(out,true,null);
}
// OTOWN.cpp Town::collect_yearly_tax: January 1, no loyalty reduction.
export function collectYearlyTax(t,{month,day}={}) {
  check(t);
  if(!t.nationId||month!==1||day!==1)return result(t,false,"not-yearly-tax-day");
  return result(t,true,null,{cashDelta:townPopulation(t)*TOWN_CONSTANTS.TAX_PER_PERSON,effects:[{type:"yearly-tax"}]});
}
// OTOWN.cpp Town::process_food. Rates are supplied by upstream constant adapter;
// absent verified constants, fail closed rather than using fabricated values.
export function processFood(t,{peasantFoodYearProduction,personFoodYearConsumption}={}) {
  check(t);
  if(!t.nationId)return {ok:false,reason:"independent-town",nextTown:t,foodProduced:0,foodConsumed:0,foodDelta:0,effects:[]};
  if(!Number.isFinite(peasantFoodYearProduction)||!Number.isFinite(personFoodYearConsumption)||peasantFoodYearProduction<0||personFoodYearConsumption<0)
    throw new RangeError("Original food production and consumption constants required");
  const produced=joblessPopulation(t)*peasantFoodYearProduction/365;
  const consumed=townPopulation(t)*personFoodYearConsumption/365;
  return {ok:true,nextTown:t,foodProduced:produced,foodConsumed:consumed,foodDelta:produced-consumed,effects:[{type:"nation-food-production",amount:produced},{type:"nation-food-consumption",amount:consumed}]};
}
// OTOWN.cpp Town::update_camp_link: AI auto-enables links, human own camp links
// remain under player control. Only an enabled camp WITH overseer counts.
export function updateCampLinks(t,{camps=[],isHumanNation=false}={}) {
  check(t);
  const out=clone(t),links=camps.map(c=>{
    if(!c.isCamp)return {...c};
    const isHumanOwn=Boolean(t.nationId&&isHumanNation&&c.nationId===t.nationId);
    return {...c,enabled:isHumanOwn?Boolean(c.enabled):true};
  });
  out.hasLinkedOwnCamp=links.some(c=>c.isCamp&&c.enabled&&c.hasOverseer&&c.nationId===t.nationId);
  out.hasLinkedEnemyCamp=links.some(c=>c.isCamp&&c.enabled&&c.hasOverseer&&c.nationId!==t.nationId);
  return result(out,true,null,{effects:[{type:"camp-links-updated",links}]});
}
// OTOWN.cpp Town::camp_influence, C++ truncation toward zero at each division.
export function campInfluence({leadership,reputation,sameRulerRace=false}={}) {
  if(!Number.isFinite(leadership)||!Number.isFinite(reputation))throw new RangeError("Missing camp influence inputs");
  let influence=Math.trunc(leadership*2/3);
  if(sameRulerRace)influence+=Math.trunc(influence/3);
  influence+=Math.trunc(reputation/2);
  return Math.min(100,influence);
}
// OTOWN.cpp Town::update_target_resistance: ONLY commander race + commander's nation;
// strongest eligible camp wins. Caller supplies computed influence.
export function updateTargetResistance(t,{camps=[],nationCount}={}) {
  check(t);
  if(t.nationId)return result(t,false,"not-independent");
  if(!townPopulation(t)||!camps.length)return result(t,true,null);
  if(!integer(nationCount)||nationCount===0)throw new RangeError("nationCount required");
  const out=clone(t);
  for(const r of out.races)r.targetResistance=Array(nationCount).fill(-1);
  if(t.rebelId)return result(out,true,null);
  for(const c of camps){
    if(!c.isCamp||!c.enabled||!c.hasOverseer)continue;
    const r=out.races[c.commanderRaceId-1],idx=c.nationId-1;
    if(!r||idx<0||idx>=nationCount||!Number.isFinite(c.influence))throw new RangeError("Invalid camp");
    const target=100-c.influence;
    if(target<0)throw new RangeError("Camp influence exceeds 100");
    if(r.targetResistance[idx]===-1||target<r.targetResistance[idx])r.targetResistance[idx]=target;
  }
  return result(out,true,null);
}
// OTOWN.cpp Town::update_target_loyalty: harmony, employment, reputation, commander
// influence and quality of life. All external cultural inputs are explicit.
export function updateTargetLoyalty(t,{raceHarmony=[],reputation,kingRaceId,camps=[],qualityOfLife=50,enableQualityOfLife=true,sameRace=(a,b)=>a===b}={}) {
  check(t);if(!t.nationId)return result(t,false,"independent-town");
  if(!Number.isFinite(reputation)||!Number.isFinite(kingRaceId))throw new RangeError("Missing nation inputs");
  const out=clone(t);
  for(let i=0;i<out.races.length;i++){
    const r=out.races[i];if(!r.population)continue;
    if(!Number.isFinite(raceHarmony[i]))throw new RangeError("Missing race harmony");
    let target=Math.trunc(raceHarmony[i]/3)+Math.trunc(reputation/4);
    target+=30-Math.trunc(30*r.jobless/r.population);
    if(sameRace(i+1,kingRaceId))target+=10;
    r.targetLoyalty=clamp(target);
  }
  for(const c of camps){
    if(!c.isCamp||!c.enabled||!c.hasOverseer)continue;
    if(!Number.isFinite(c.leadership)||!Number.isFinite(c.commanderRaceId)||!Number.isFinite(c.nationRaceId))throw new RangeError("Missing commander inputs");
    const base=Math.trunc(c.leadership/3)+(c.isKing?20:0);
    for(let i=0;i<out.races.length;i++){
      const r=out.races[i];if(!r.population)continue;
      const inf=base+(c.commanderRaceId===i+1?8:0)+(c.nationRaceId===i+1?8:0);
      if(c.nationId===t.nationId)r.targetLoyalty=Math.min(100,r.targetLoyalty+inf);
      else if(c.commanderRaceId===i+1)r.targetLoyalty=Math.max(0,r.targetLoyalty-inf);
    }
  }
  const qol=enableQualityOfLife?Math.trunc((qualityOfLife-50)/3):0;
  for(const r of out.races)if(r.population&&r.targetLoyalty>30)
    r.targetLoyalty=Math.min(100,Math.max(30,r.targetLoyalty+qol));
  return result(out,true,null);
}
// OTOWNIF.cpp Town::recruit: explicit and side-effect-free training / spy plans.
// External adapter owns unit creation, spy mobilization, queue timing and placement.
export function planRecruit(t,raceId,{skillId=-1,canPlaceUnit=false,randomRoll=0,fixRecruitDecLoyalty=false}={}) {
  check(t);
  if(!t.nationId)return result(t,false,"independent-town");
  if(skillId>=1&&t.trainingRaceId)return result(t,false,"training-in-progress");
  const count=recruitableRacePop(t,raceId,{recruitSpy:true});
  if(!count)return result(t,false,"no-recruitable-population");
  if(!Number.isInteger(randomRoll)||randomRoll<0||randomRoll>=count)throw new RangeError("randomRoll must match misc.random(recruitableCount)");
  if(!canPlaceUnit)return result(t,false,"no-unit-placement");
  const r=t.races[raceId-1],shouldTrainSpy=r.spies>=randomRoll+1;
  if(shouldTrainSpy)return result(t,false,"spy-selection-required",{effects:[{type:"spy-mobilization-required",raceId,skillId}]});
  if(r.jobless-r.spies-(t.trainingRaceId===raceId?1:0)<=0)return result(t,false,"no-ordinary-recruit");
  if(skillId===-1)return recruitUnskilled(t,raceId,{canPlaceUnit:true,fixRecruitDecLoyalty});
  const out=clone(t);out.trainingRaceId=raceId;
  const cashDelta=skillId>0?-TOWN_CONSTANTS.TRAIN_SKILL_COST:0;
  return result(out,true,null,{cashDelta,effects:[{type:"training-unit-pending",raceId,skillId,days:5}]});
}
// Transitional adapter from scalar prototype. No invented population distribution:
// caller must provide exact racial counts; conversion refuses ambiguous layouts.
export function migrateScalarTown(s,{raceId,races}={}) {
  if(!s||!Array.isArray(races)||!races.length||!integer(raceId)||raceId<1)throw new RangeError("Explicit race mapping required");
  const pop=s.population??s.pop,jobless=s.joblessPopulation??s.jobless;
  if(!integer(pop)||!integer(jobless)||jobless>pop)throw new RangeError("Invalid scalar totals");
  const mapped=races.map((r,i)=>({population:r.population??0,jobless:r.jobless??0,spies:r.spies??0,loyalty:r.loyalty??(i+1===raceId?s.loyalty:undefined),targetLoyalty:r.targetLoyalty??(i+1===raceId?s.targetLoyalty:undefined),growth:r.growth??0}));
  const town={nationId:s.nationId??s.owner??0,hasLinkedOwnCamp:!!s.hasLinkedOwnCamp,hasLinkedEnemyCamp:!!s.hasLinkedEnemyCamp,races:mapped};
  if(townPopulation(town)!==pop||joblessPopulation(town)!==jobless||!validateTown(town))throw new RangeError("Scalar totals do not match race allocation");
  return town;
}
