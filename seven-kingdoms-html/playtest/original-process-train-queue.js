/**
 * Pure selection step of 7KAA Town::process_queue, not a training simulator.
 * Source: the3dfxdude/7kaa@14e6fdfba9481af4dc3a54722614a608776e20bc
 * src/OTOWNIF.cpp:2082-2117.
 *
 * The original discards the invalid queue prefix when it finds a trainable
 * entry, then invokes recruit(skillId,raceId,COMMAND_AUTO). We return that
 * request instead of creating a unit or mutating the town.
 */
export function selectOriginalQueuedTrainee({queue,joblessPopulation,canTrain}) {
  if (!Array.isArray(queue) || queue.length > 10 ||
      !queue.every(e => e && Number.isInteger(e.skillId) && e.skillId > 0 &&
        Number.isInteger(e.raceId) && e.raceId > 0) ||
      !Number.isInteger(joblessPopulation) || joblessPopulation < 0 ||
      typeof canTrain !== 'function') {
    throw new RangeError('Invalid original training queue state');
  }
  if (queue.length === 0 || joblessPopulation === 0) {
    return {queue:queue.map(e=>({...e})),request:null,discarded:0};
  }
  for (let i=0;i<queue.length;i++) {
    if (canTrain(queue[i].raceId)) {
      return {
        queue:queue.slice(i+1).map(e=>({...e})),
        request:{skillId:queue[i].skillId,raceId:queue[i].raceId},
        discarded:i,
      };
    }
  }
  return {queue:queue.map(e=>({...e})),request:null,discarded:0};
}
