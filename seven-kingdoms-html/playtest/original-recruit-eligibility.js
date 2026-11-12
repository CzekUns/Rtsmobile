/*
 * Seven Kingdoms: Ancient Adversaries — isolated recruitment eligibility adapter.
 * Source: the3dfxdude/7kaa@14e6fdfba9481af4dc3a54722614a608776e20bc
 * src/OTOWN.cpp Town::can_recruit (4068-4094), Town::can_train (4098-4106)
 * include/OTOWN.h MIN_RECRUIT_LOYALTY=30, TRAIN_SKILL_COST=30.
 * NOT wired into the demo's SevenGame.recruit; no save schema changes.
 */
export const ORIGINAL_MIN_RECRUIT_LOYALTY = 30;
export const ORIGINAL_TRAIN_SKILL_COST = 30;

/**
 * Mirrors Town::can_recruit's boolean decision for a SPECIFIC race.
 * Caller must provide recruitableRacePop computed by the original race/spy
 * algorithm; loyaltyDecrease is the non-mutating recruit_dec_loyalty result.
 * This is a decision adapter, not a full town population simulation.
 */
export function canRecruitOriginal({
  hasLinkedOwnCamp, hasLinkedEnemyCamp, recruitableRacePop,
  raceLoyalty, aiTown = false, nationRecno = 0, loyaltyDecrease = 0
}) {
  if (!hasLinkedOwnCamp && hasLinkedEnemyCamp) return false;
  if (!(recruitableRacePop > 0)) return false;
  const minimum = ORIGINAL_MIN_RECRUIT_LOYALTY +
    (aiTown && nationRecno ? 3 + loyaltyDecrease : 0);
  return raceLoyalty >= minimum;
}

/**
 * Mirrors Town::can_train's eligibility only. Upstream uses strict cash > 30,
 * not >= 30. Training duration, skill assignment and queue are separate work.
 */
export function canTrainOriginal({hasLinkedOwnCamp, joblessRacePop, nationCash}) {
  return Boolean(hasLinkedOwnCamp && joblessRacePop > 0 &&
    nationCash > ORIGINAL_TRAIN_SKILL_COST);
}
