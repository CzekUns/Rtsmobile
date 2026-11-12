/**
 * Isolated 7KAA training queue capacity adapter.
 * Reference: the3dfxdude/7kaa@14e6fdfba9481af4dc3a54722614a608776e20bc
 * include/OTOWN.h MAX_TRAIN_QUEUE; src/OTOWNIF.cpp Town::add_queue (2122-2138).
 * This only reproduces add_queue's bounded append. It does NOT start training,
 * spend cash, or alter a town; process_queue/recruit remain separate work.
 */
export const ORIGINAL_MAX_TRAIN_QUEUE = 10;

/**
 * @param {{queue: {skillId:number,raceId:number}[], activeTraining:boolean,
 *          skillId:number, raceId:number, amount:number}} args
 * @returns {{queue:{skillId:number,raceId:number}[], added:number}}
 */
export function appendOriginalTrainQueue({queue,activeTraining,skillId,raceId,amount}) {
  if (!Array.isArray(queue) || queue.length > ORIGINAL_MAX_TRAIN_QUEUE ||
      !queue.every(entry => entry && Number.isInteger(entry.skillId) && Number.isInteger(entry.raceId)) ||
      !Number.isInteger(amount) || amount < 0 ||
      !Number.isInteger(skillId) || skillId <= 0 ||
      !Number.isInteger(raceId) || raceId <= 0) {
    throw new RangeError('Invalid 7KAA training queue input');
  }
  const room = Math.max(0, ORIGINAL_MAX_TRAIN_QUEUE - queue.length - (activeTraining ? 1 : 0));
  const added = Math.min(room, amount);
  return {queue: [...queue, ...Array.from({length:added}, () => ({skillId,raceId}))], added};
}
