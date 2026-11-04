import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ORIGINAL_MIN_RECRUIT_LOYALTY, ORIGINAL_TRAIN_SKILL_COST,
  canRecruitOriginal, canTrainOriginal
} from '../playtest/original-recruit-eligibility.js';

// 7KAA reference pinned in playtest/original-recruit-eligibility.js.
// These are independent source-based fixtures, NOT tests of SevenGame.recruit.
const recruit = {hasLinkedOwnCamp:true,hasLinkedEnemyCamp:false,
  recruitableRacePop:4,raceLoyalty:30};

test('7KAA human recruitment threshold is 30 inclusive for selected race',()=>{
  assert.equal(ORIGINAL_MIN_RECRUIT_LOYALTY,30);
  assert.equal(canRecruitOriginal(recruit),true);
  assert.equal(canRecruitOriginal({...recruit,raceLoyalty:29}),false);
  assert.equal(canRecruitOriginal({...recruit,raceLoyalty:31}),true);
});
test('7KAA enemy-linked camp blocks recruitment unless an own camp is linked',()=>{
  assert.equal(canRecruitOriginal({...recruit,hasLinkedOwnCamp:false,hasLinkedEnemyCamp:true}),false);
  assert.equal(canRecruitOriginal({...recruit,hasLinkedOwnCamp:true,hasLinkedEnemyCamp:true}),true);
  assert.equal(canRecruitOriginal({...recruit,hasLinkedOwnCamp:false,hasLinkedEnemyCamp:false}),true);
});
test('7KAA only recruits race with positive recruitable population',()=>{
  assert.equal(canRecruitOriginal({...recruit,recruitableRacePop:0}),false);
  assert.equal(canRecruitOriginal({...recruit,recruitableRacePop:-1}),false);
});
test('7KAA AI recruitment requires 30 + 3 + prospective loyalty decrease',()=>{
  const ai={...recruit,aiTown:true,nationRecno:2,loyaltyDecrease:6};
  assert.equal(canRecruitOriginal({...ai,raceLoyalty:38}),false);
  assert.equal(canRecruitOriginal({...ai,raceLoyalty:39}),true);
  assert.equal(canRecruitOriginal({...ai,aiTown:false,raceLoyalty:30}),true);
  assert.equal(canRecruitOriginal({...ai,nationRecno:0,raceLoyalty:30}),true);
});
test('7KAA training requires linked own camp, race jobless and cash strictly > 30',()=>{
  assert.equal(ORIGINAL_TRAIN_SKILL_COST,30);
  const t={hasLinkedOwnCamp:true,joblessRacePop:2,nationCash:31};
  assert.equal(canTrainOriginal(t),true);
  assert.equal(canTrainOriginal({...t,nationCash:30}),false);
  assert.equal(canTrainOriginal({...t,joblessRacePop:0}),false);
  assert.equal(canTrainOriginal({...t,hasLinkedOwnCamp:false}),false);
});
