import test from 'node:test';
import assert from 'node:assert/strict';
import { collectTax,reward,processAuto,recruitableRacePop,recruitLoyaltyPenalty,recruitUnskilled,updateLoyalty,updateResistance,populationGrow,surrenderCandidate,independentSchedule,independentFirmLink,townPopulation,decayPenalties,collectYearlyTax,processFood,updateCampLinks,campInfluence,updateTargetResistance,updateTargetLoyalty,planRecruit,migrateScalarTown } from '../../systems/towns/index.js';
function town(overrides={}){return {nationId:1,hasLinkedOwnCamp:true,hasLinkedEnemyCamp:false,accumulatedCollectTaxPenalty:0,accumulatedRewardPenalty:0,accumulatedRecruitPenalty:0,races:[{population:20,jobless:12,spies:2,loyalty:50,targetLoyalty:70,growth:0},{population:10,jobless:5,spies:1,loyalty:95,targetLoyalty:50,growth:0}],...overrides};}
test('C++ collect_tax: 5 per head only if full drop; loyalty capped yields less income',()=>{
 const t=town(),x=collectTax(t);
 assert.equal(x.cashDelta,20*5+10*5);assert.equal(x.nextTown.races[0].loyalty,40);
 assert.equal(x.nextTown.races[1].loyalty,85);assert.equal(t.races[0].loyalty,50);
});
test('C++ collect_tax repeated: decrease 10,12,14,16,18,20,20',()=>{
 let t=town({races:[{population:5,jobless:5,spies:0,loyalty:100}]});
 const got=[];for(let i=0;i<7;i++){let x=collectTax(t);got.push(x.effects[0].loyaltyDecrease);t=x.nextTown}
 assert.deepEqual(got,[10,12,14,16,18,20,20]);
});
test('C++ reward diminishing: 10,8,6,4,3; cash is pop times ten',()=>{
 let t=town({races:[{population:2,jobless:2,spies:0,loyalty:0}]});let gains=[];
 for(let i=0;i<5;i++){let x=reward(t);gains.push(x.effects[0].loyaltyIncrease);assert.equal(x.cashDelta,-20);t=x.nextTown}
 assert.deepEqual(gains,[10,8,6,4,3]);
});
test('C++ own camp gate and independent gate',()=>{
 assert.equal(collectTax(town({hasLinkedOwnCamp:false})).reason,'no-linked-own-camp');
 assert.equal(reward(town({nationId:0})).reason,'independent-town');
});
test('C++ auto tax gates on accumulated penalty and loyalty; auto grant cash > 0',()=>{
 assert.equal(processAuto(town({accumulatedCollectTaxPenalty:10}),{autoCollectTaxLoyalty:50}).cashDelta,0);
 assert.equal(processAuto(town(),{autoCollectTaxLoyalty:50}).cashDelta>0,true);
 assert.equal(processAuto(town(),{autoGrantLoyalty:90,cash:0}).effects.length,0);
});
test('C++ recruitable race count includes training unit and optional spies',()=>{
 assert.equal(recruitableRacePop(town({trainingRaceId:1}),1),11);
 assert.equal(recruitableRacePop(town({trainingRaceId:1}),1,{recruitSpy:false}),9);
});
test('C++ recruit loyalty: float 60/pop cap 5, cumulative penalty and fixed ceil option',()=>{
 const t=town({races:[{population:30,jobless:30,spies:0,loyalty:50}]});
 assert.equal(recruitLoyaltyPenalty(t,1,{apply:false}).amount,2);
 const p=recruitLoyaltyPenalty(t,1);assert.equal(p.nextTown.races[0].loyalty,48);
 assert.equal(p.nextTown.accumulatedRecruitPenalty,5);
 assert.equal(recruitLoyaltyPenalty(p.nextTown,1,{apply:false,fixRecruitDecLoyalty:true}).amount,3);
});
test('recruit must not mutate when no placement, and can mobilize explicit ordinary peasant',()=>{
 const t=town();assert.equal(recruitUnskilled(t,1).reason,'no-unit-placement');
 const x=recruitUnskilled(t,1,{canPlaceUnit:true});assert.equal(x.ok,true);assert.equal(townPopulation(x.nextTown),29);
 assert.equal(townPopulation(t),30);
});
test('C++ update_loyalty: /30 minimum 0.5 and enemy camp forbids increases',()=>{
 let x=updateLoyalty(town({hasLinkedOwnCamp:false,hasLinkedEnemyCamp:true}));
 assert.equal(x.nextTown.races[0].loyalty,50);assert.equal(x.nextTown.races[1].loyalty,93.5);
 x=updateLoyalty(town());assert.ok(Math.abs(x.nextTown.races[0].loyalty-(50+20/30))<1e-8);
});
test('C++ update_resistance only decreases and emits candidate at below 1',()=>{
 let t=town({nationId:0,races:[{population:10,jobless:10,spies:0,loyalty:0,resistance:[40,0.5],targetResistance:[10,-1]}]});
 const x=updateResistance(t,{activeNationIds:[1,2]});
 assert.equal(x.nextTown.races[0].resistance[0],39);
 assert.deepEqual(x.effects,[{type:'surrender-candidate',nationId:2}]);
});
test('C++ population_grow threshold strictly >100, independent growth slower',()=>{
 let t=town({races:[{population:50,jobless:50,spies:0,loyalty:50,growth:99}]});
 assert.equal(populationGrow(t,{qualityOfLife:100}).nextTown.races[0].population,50+1);
 assert.equal(populationGrow({...t,nationId:0}).nextTown.races[0].population,51);
 const atCap=town({races:[{population:60,jobless:60,spies:0,loyalty:50,growth:99}]});
 assert.equal(populationGrow(atCap).nextTown.races[0].population,60);
});
test('C++ surrender: 2/3 discontent, enemy camp overseer influence must beat average loyalty',()=>{
 const t=town({races:[{population:20,jobless:20,spies:0,loyalty:20}],hasLinkedOwnCamp:false,hasLinkedEnemyCamp:true});
 assert.equal(surrenderCandidate(t,{camps:[{enabled:true,isCamp:true,nationId:2,hasOverseer:true,influence:60}]}),2);
 assert.equal(surrenderCandidate({...t,hasLinkedOwnCamp:true},{camps:[{enabled:true,isCamp:true,nationId:2,hasOverseer:true,influence:60}]}),null);
});
test('C++ independent thinker date phases and firm links threshold',()=>{
 const t=town({nationId:0});
 assert.deepEqual(independentSchedule(t,{gameDate:60,townId:0}),['set-links','unit-join-nation']);
 assert.equal(independentFirmLink(t,{isCamp:true}),null);
 assert.equal(independentFirmLink(t,{firmNationId:2,averageResistance:50}),true);
 assert.equal(independentFirmLink(t,{firmNationId:2,averageResistance:51}),false);
});

test('SKH-108 C++ next_day decays four penalties by exactly one, never below zero',()=>{
 const t=town({accumulatedCollectTaxPenalty:10,accumulatedRewardPenalty:1,accumulatedRecruitPenalty:0,accumulatedEnemyGrantPenalty:3});
 const x=decayPenalties(t);
 assert.deepEqual([x.nextTown.accumulatedCollectTaxPenalty,x.nextTown.accumulatedRewardPenalty,x.nextTown.accumulatedRecruitPenalty,x.nextTown.accumulatedEnemyGrantPenalty],[9,0,0,2]);
 assert.equal(t.accumulatedCollectTaxPenalty,10);
});
test('SKH-108 annual tax only on January 1 and no loyalty effect',()=>{
 const t=town();const x=collectYearlyTax(t,{month:1,day:1});
 assert.equal(x.cashDelta,150);assert.equal(x.nextTown,t);
 assert.equal(collectYearlyTax(t,{month:1,day:2}).ok,false);
});
test('SKH-108 food effects use annual constants over 365, no fictional starvation',()=>{
 const t=town();const x=processFood(t,{peasantFoodYearProduction:365,personFoodYearConsumption:365});
 assert.equal(x.foodProduced,17);assert.equal(x.foodConsumed,30);assert.equal(x.foodDelta,-13);
 assert.equal(processFood({...t,nationId:0},{peasantFoodYearProduction:365,personFoodYearConsumption:365}).ok,false);
});
test('SKH-108 camp links require overseer and enabled link; human own camp stays disabled',()=>{
 const t=town({hasLinkedOwnCamp:false});const c=[{isCamp:true,nationId:1,hasOverseer:true,enabled:false},{isCamp:true,nationId:2,hasOverseer:false,enabled:true}];
 const h=updateCampLinks(t,{camps:c,isHumanNation:true});
 assert.equal(h.nextTown.hasLinkedOwnCamp,false);assert.equal(h.nextTown.hasLinkedEnemyCamp,false);
 const ai=updateCampLinks(t,{camps:c,isHumanNation:false});
 assert.equal(ai.nextTown.hasLinkedOwnCamp,true);
 assert.equal(c[0].enabled,false);
});
test('SKH-108 camp influence truncates after each operation',()=>{
 assert.equal(campInfluence({leadership:60,reputation:20,sameRulerRace:true}),63);
 assert.equal(campInfluence({leadership:150,reputation:100,sameRulerRace:true}),100);
});
test('SKH-108 strongest camp sets resistance target for its commander race and nation',()=>{
 const t=town({nationId:0,races:[{population:10,jobless:10,spies:0,loyalty:0,resistance:[70,80],targetResistance:[-1,-1]},{population:10,jobless:10,spies:0,loyalty:0,resistance:[80,90],targetResistance:[-1,-1]}]});
 const x=updateTargetResistance(t,{nationCount:2,camps:[{isCamp:true,enabled:true,hasOverseer:true,nationId:1,commanderRaceId:2,influence:45},{isCamp:true,enabled:true,hasOverseer:true,nationId:1,commanderRaceId:2,influence:70},{isCamp:true,enabled:false,hasOverseer:true,nationId:2,commanderRaceId:1,influence:99}]});
 assert.deepEqual(x.nextTown.races[1].targetResistance,[30,-1]);
 assert.deepEqual(x.nextTown.races[0].targetResistance,[-1,-1]);
});
test('SKH-108 race target loyalty includes harmony/reputation/employment, friendly and hostile camps, QOL',()=>{
 const t=town({races:[{population:10,jobless:0,spies:0,loyalty:70},{population:10,jobless:10,spies:0,loyalty:50}]});
 const x=updateTargetLoyalty(t,{raceHarmony:[60,90],reputation:20,kingRaceId:1,enableQualityOfLife:false,camps:[{isCamp:true,enabled:true,hasOverseer:true,nationId:1,leadership:60,commanderRaceId:1,nationRaceId:1,isKing:false},{isCamp:true,enabled:true,hasOverseer:true,nationId:2,leadership:30,commanderRaceId:2,nationRaceId:2,isKing:false}]});
 assert.deepEqual(x.nextTown.races.map(r=>r.targetLoyalty),[100,29]);
});
test('SKH-108 recruitment plan distinguishes spy, queue, training and world adapter',()=>{
 const t=town();const spy=planRecruit(t,1,{randomRoll:0,canPlaceUnit:true});
 assert.equal(spy.reason,'spy-selection-required');assert.equal(spy.effects[0].type,'spy-mobilization-required');
 assert.equal(planRecruit(t,1,{randomRoll:2}).reason,'no-unit-placement');
 const trained=planRecruit(t,1,{skillId:2,randomRoll:2,canPlaceUnit:true});
 assert.equal(trained.nextTown.trainingRaceId,1);assert.equal(trained.cashDelta,-30);
 assert.equal(trained.effects[0].days,5);
 assert.equal(planRecruit({...t,trainingRaceId:2},1,{skillId:2,randomRoll:2,canPlaceUnit:true}).reason,'training-in-progress');
});
test('SKH-108 migration refuses guessed distribution and retains mixed populations',()=>{
 const s={population:10,joblessPopulation:6,loyalty:45,nationId:1};
 assert.throws(()=>migrateScalarTown(s,{raceId:1,races:[{population:8,jobless:6,loyalty:45}]}));
 const x=migrateScalarTown(s,{raceId:1,races:[{population:7,jobless:4,loyalty:45},{population:3,jobless:2,loyalty:50}]});
 assert.equal(townPopulation(x),10);assert.equal(x.races[1].population,3);
});
