# Checkpoint · SKH-HUD-001 — HUD consolidation

- **State:** IN_PROGRESS; PR [#115](https://github.com/CzekUns/Rtsmobile/pull/115) remains draft, not merged.
- **Branch:** `agent/skh-integration/hud-backlog-consolidation`
- **Latest code/docs HEAD before checkpoint:** `e2132ec4ac55a32f48f75e0f4584cc7891292ea0`.
- **Previous checkpoint HEAD:** `7d6232982e14c1edb6993f78e5db27dae0c437fa`.
- **Task:** consolidate #97, #101, #103, #105, #107 without overwriting existing mobile controls.

## Work carried forward

Earlier checkpoint integrated report button ARIA state (#97), keyboard focus guard (#101), ORDINI inert/focus behavior (#103) and responsive topbar CSS (#105). These remain in PR #115.

## This execution: #107 integration

Integrated the selection meters from #107 into the existing branch without replacing the already consolidated HUD logic:

- `selection-meter.js` from source #107: numeric bounds, HTML escaping, accessible progressbar and decorative nested race indicator.
- `game.js`: town loyalty/resistance, per-race loyalty, worker health, firm integrity/construction, selected unit health, repair integrity and site progress.
- `style.css`: selection meter track/fill/caption rules, retaining the responsive topbar.
- `tests/integration/selection-{details,meter,unit-vitals}.test.js`: source PR #107 regression tests.
- `docs/original-parity/SKH-106-selection-vitals.md`: original reference and known limitations.
- **Commits:** `5c7f7e6`, `8fe74f5`, `507afb3`, `88df373`, `645bf70`, `0293d5a`, `e2132ec`.
- **Source:** #107 HEAD `d7962a7`. Its old `game.js` and `style.css` were **not** copied wholesale: only selection-meter changes were applied to current #115 files.

## Verification and blocking evidence

- GitHub connector confirmed the seven commits on the assigned task branch and comparison against `main` `774c1e0da2895bddc0e98aff389044dbbea57076`.
- GitHub Actions lookup on code HEAD `e2132ec4ac55a32f48f75e0f4584cc7891292ea0` returned `workflow_runs: []` (PR-triggered runs only). **CI NOT VERIFIED**.
- Local command `git ls-remote https://github.com/CzekUns/Rtsmobile.git HEAD` failed with `Could not resolve host: github.com`. Full checkout and `npm --prefix seven-kingdoms-html test` / `run check` **NOT RUN**.
- Browser 1×/2×, Android landscape and Pages for this branch **NOT RUN**. No merge, no release, no original 7KAA parity claim.
- Integration source edits were checked for expected single-match replacements, but full runtime behavior and regressions remain unverified.

## 2026-11-13 — CI gate confirmed on exact integration HEAD

- **PR:** #115 (draft), **verified HEAD:** `2442c33378c51299d07cccb06249357667c63541`; main comparison base in PR: `774c1e0da2895bddc0e98aff389044dbbea57076`.
- **GitHub Actions:** [run 43334023821](https://github.com/CzekUns/Rtsmobile/actions/runs/43334023821) completed **success** on that exact SHA; job `JS tests & stream scope` completed **success**. Its steps `Syntax checks for native JS`, `Node unit tests (recursively discovered)`, and `Enforce ownership on agent branches only` each report **success**. This is the first verified combined CI gate for the five-source integration.
- **Local checkout:** `git ls-remote https://github.com/CzekUns/Rtsmobile.git HEAD` again failed `Could not resolve host: github.com`. Therefore separate local `npm --prefix seven-kingdoms-html test` and `npm --prefix seven-kingdoms-html run check` were **not run**; the CI jobs are verified, but do not assert the exact npm command names without the workflow log.
- **Visual/browser/mobile:** no executable Chromium/Android comparison of this branch obtained; fullscreen, MOD+joystick, drag, save/load, ORDINI focus and selection meters remain **manual/browser QA pending**.
- **Merge/Pages:** no merge; PR remains draft; no new Pages deployment.
- **This run's actual change:** resolved the previously unknown CI status through a successful workflow run; checkpoint updated only, no game code changes.

## Single next step

**Run a browser interaction regression of PR #115 on a viable checkout/runner (HUD reports, keyboard focus, ORDINI, responsive topbar, selection meters, fullscreen/MOD/joystick and save/load); fix any observed failures on this branch. Once compatibility is evidenced and CI remains green on the resulting HEAD, mark #115 ready and merge, then verify Pages.**

## 2026-11-13 — ORDINI interaction regression (continuation)

- **Starting branch HEAD:** `e11b26440a025d47306e54ab75e2ee9d2c6eb9b6`; no re-audit of old source PRs.
- **New code HEAD before checkpoint:** `5cf76a0040dfe0d58f4d1ea49561fbd08f158c65`.
- **Commits:** `4c5907b` (extracted `playtest/orders-sidebar.js`), `4a0144a` (added `tests/integration/orders-sidebar-interaction.test.js`), `5cf76a0` (wired adapter in `game.js`).
- **Actual code change:** replaced inline ORDINI controller with testable DOM adapter; preserved media query, collapsed class, ARIA expanded/hidden, `inert`, click and responsive change behavior. New interaction tests exercise initial compact state, click expansion, focus restoration on collapse, viewport transitions and listener cleanup.
- **Verification:** prior exact HEAD `e11b264` has CI SUCCESS [43340994200](https://github.com/CzekUns/Rtsmobile/actions/runs/43340994200). GitHub Actions was in progress for intermediate `4a0144a` ([43348773623](https://github.com/CzekUns/Rtsmobile/actions/runs/43348773623)); no PASS claim for the new code HEAD `5cf76a0` until its own run completes. Local `git ls-remote` returned `Could not resolve host: github.com`; local npm and Chromium/Android NOT RUN. No merge/Pages.
- **Single next step:** inspect GitHub Actions on the **latest checkpoint HEAD**; if red, repair the failing test/code in PR #115; if green, obtain browser interaction QA for ORDINI, report toolbar, keyboard focus, fullscreen/MOD+joystick and save/load, then review merge readiness.

## 2026-11-13 — Repair CI regression from ORDINI extraction

- **CI failure reproduced on HEAD `5cf76a0`:** [Actions 43348791559](https://github.com/CzekUns/Rtsmobile/actions/runs/43348791559), Node test step FAIL, 214 tests / 210 pass / 2 fail / 2 skip. Failed `tests/ui/hud-consolidation.test.js` (assumed inline `const compactOrders`) and `tests/fullscreen-layout.test.mjs` (assumed inline `setOrdersVisible`). These were brittle source assertions after extraction, not evidence of an ORDINI runtime defect.
- **Fix commits:** `6c4d48f` updates the HUD test to exercise the exported controller directly with fake DOM and focus behavior; `b216d37` updates fullscreen wiring assertion to the new adapter. Actual module/entrypoint implementation unchanged after `5cf76a0`.
- **Latest code HEAD before checkpoint:** `b216d370fa2c7939161ce4e00c4fa6d647bd75a9`. CI for this exact SHA must be checked; no PASS claimed yet. No browser/Android or Pages QA; no merge.
- **Single next step:** inspect the latest CI on this checkpoint HEAD and fix any remaining failed job. Only if green, perform interactive browser QA for ORDINI/HUD, fullscreen, MOD+joystick and save/load before making #115 non-draft.

## 2026-11-13 — Exact HEAD CI after ORDINI regression repair

- **Checkpoint branch HEAD before this update:** `df766c737b002b321e53ebb594bfea4bb98552d4` (code fix `b216d370fa2c7939161ce4e00c4fa6d647bd75a9`).
- **CI on exact checkpoint HEAD:** [GitHub Actions #43348908018](https://github.com/CzekUns/Rtsmobile/actions/runs/43348908018) completed **SUCCESS**. Job `JS tests & stream scope` (id `131634921077`) completed SUCCESS; steps `Syntax checks for native JS`, `Node unit tests (recursively discovered)`, and `Enforce ownership on agent branches only` each SUCCESS. This confirms the previously failed source-assumption tests were repaired on the integrated branch.
- **Earlier code SHA CI:** [#43348887631](https://github.com/CzekUns/Rtsmobile/actions/runs/43348887631) was **CANCELLED** (superseded by checkpoint HEAD), not a pass.
- **Local checkout retry:** `git ls-remote https://github.com/CzekUns/Rtsmobile.git HEAD` returned `Could not resolve host: github.com`; npm commands and Chromium browser QA **NOT RUN** locally. The GitHub Actions job covers its own native JS syntax and Node tests, not Android/browser interaction. No merge, no Pages release, no original parity claim.
- **This run:** verified the exact latest CI gate and the ORDINI adapter/test files on the task branch; no game code change or browser QA evidence was produced. PR #115 remains draft.

### Single next step

**Obtain a reproducible browser interaction run for PR #115** (ORDINI focus/ARIA, report toolbar, keyboard guards, fullscreen, left MOD+joystick and save/load) using a viable browser runner or restored checkout; fix any failing interaction on this same branch before marking the PR ready. Do not merge on Node-only evidence.
