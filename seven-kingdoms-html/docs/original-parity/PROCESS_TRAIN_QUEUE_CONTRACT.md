# Original training queue: process_queue selection adapter

**Issue:** #34 · **Stream:** SKH-106 integration · **Status:** isolated pure candidate, not wired to runtime.

Reference: [7KAA OTOWNIF.cpp lines 2082–2117](https://github.com/the3dfxdude/7kaa/blob/14e6fdfba9481af4dc3a54722614a608776e20bc/src/OTOWNIF.cpp#L2082-L2117).

`selectOriginalQueuedTrainee({queue,joblessPopulation,canTrain})` implements the **selection portion** of `Town::process_queue`: empty queue or no jobless population => no action; otherwise scan from oldest, find first race allowed by `can_train(raceId)`, discard it and the preceding untrainable prefix, return the remaining suffix and the `{skillId,raceId}` request for `recruit(...,COMMAND_AUTO)`. If no entry qualifies, retain the queue. No input mutation. Eligibility is injected so the Towns agent retains ownership of `can_train` (#33/#46).

**Not implemented:** actual `recruit`, cash charge, population mutation, unit instantiation, elapsed training, cancellation, queue append (#47), UI, or save migration. The C++ also invokes `process_queue` when `add_queue` sees no active trainee; do not wire this independently before integrating queue capacity and Towns contracts. The original code has additional side effects on `recruit` and town deletion; this pure function intentionally does not reproduce them.

**Acceptance:** `node --test tests/original-process-train-queue.test.mjs`, `npm test`, `npm run check` (from seven-kingdoms-html). This is not parity certified until compared to the exact original build.
