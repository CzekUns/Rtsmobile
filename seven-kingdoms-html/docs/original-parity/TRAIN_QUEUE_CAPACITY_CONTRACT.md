# Training queue capacity — isolated original rule

**Issue:** #34; **stream:** SKH-106 integration; **scope:** pure queue append adapter, no runtime wiring.

Source: `the3dfxdude/7kaa@14e6fdfba9481af4dc3a54722614a608776e20bc`, `include/OTOWN.h` (`MAX_TRAIN_QUEUE=10`), `src/OTOWNIF.cpp` (`Town::add_queue` lines 2122–2138).

`appendOriginalTrainQueue({queue,activeTraining,skillId,raceId,amount})` returns `{queue,added}`, without modifying inputs. It implements `queueSpace = 10 - train_queue_count - (train_unit_recno>0)` and `enqueueAmount = MIN(queueSpace, amount)`. Queue entries retain individual race/skill identifiers and order. Inputs are validated at the adapter boundary (the original C++ uses assertions rather than JS exceptions).

**Deliberately absent:** `process_queue()` may start the first trainee immediately and remove entries from the queue, skipping invalid race candidates; `recruit()` spends resources and changes town population; `finish_train()` sets skills and releases a unit after elapsed game days. Those original operations are not reproduced here, so a queue of nine entries with one active trainee is **not** a complete training implementation. Do not wire this into the public demo until Towns PR #15, eligibility PR #46, and original clock contracts have been reviewed.

**Acceptance:** five Node tests for capacity, active trainee reservation, race/skill preservation, full queue and invalid inputs; CI must pass. No new save fields, no WebAssembly, no change to `main` or `?playtest=1`.
