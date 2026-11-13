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

## 2026-11-13 — Browser runner attempt after CI green

- **Starting checkpoint HEAD:** `73282f13e86dfa296d0d4715fc67b9095f38b5c3`.
- **Exact HEAD CI:** [GitHub Actions #43355583011](https://github.com/CzekUns/Rtsmobile/actions/runs/43355583011) completed **success** on that SHA (connector returned workflow status and conclusion). This is automated Node/syntax/ownership evidence only.
- **Alternate browser path attempted:** reproduced the exact `playtest/orders-sidebar.js` controller in an isolated local DOM harness with six assertions (initial compact state, expansion, focus restoration, desktop/mobile media changes, disposal), then invoked `chromium --headless --no-sandbox --disable-gpu --disable-dev-shm-usage --virtual-time-budget=3000 --dump-dom file:///tmp/skh-browser/test.html`. The local command **timed out after 25 seconds**, so **no browser PASS** is claimed. This was an isolated adapter harness, not the entire game.
- **Checkout remains blocked:** `git ls-remote https://github.com/CzekUns/Rtsmobile.git HEAD` returned `Could not resolve host: github.com`. Full npm suite locally and live-game Chromium/Android regression were **not run**. No code changes, merge, or Pages release in this execution.
- **Single next step:** establish a working Chromium/browser runner against the actual PR #115 build, verify ORDINI/HUD, fullscreen, MOD+joystick and save/load interactions, and fix any observed regression before removing draft status.

## 2026-11-13 — Browser QA runner added to existing PR #115

- **Starting checkpoint HEAD:** `f8fa4041a6e2188ec60f52850a2bf403f047b0fb`.
- **New code commits:** `f909512` (real DOM browser smoke page), `8b9099b` (bounded HTTP+Chrome launcher), `6031231` (CI Chrome step). **Code HEAD before this checkpoint:** `6031231bb4b2be922efaf77ce5d3d39afc5b5a91`.
- **Files:** `tests/browser/hud-smoke.html`, `tests/browser/run-hud-smoke.mjs`, `.github/workflows/seven-kingdoms-html-ci.yml`.
- **Actual improvement:** CI now attempts a real browser test of the game iframe served over HTTP. Assertions cover ORDINI toggle/ARIA/inert, report opening/closing, COMANDI expansion/collapse and required HUD controls. This replaces repeating the stalled isolated Chrome harness.
- **CI:** immediate workflow lookup for code HEAD `6031231` returned `workflow_runs: []` (may not yet be indexed). **No PASS claimed.** No local npm or Android run, no merge or Pages deployment.
- **Known risks:** Chrome binary availability on ubuntu-latest, iframe startup timing, report dialog initialization; any failure must be inspected from the actual workflow log. Full MOD+joystick, save/load and fullscreen interaction still require further QA.
- **Single next step:** **Inspect GitHub Actions for HEAD `6031231` / this checkpoint HEAD; if browser smoke fails, repair the precise failing browser/runner condition on PR #115, rerun until green.** Do not merge on an unverified browser gate.


## 2026-11-13 — Chromium gate verified; broadened game interaction smoke

- **Starting checkpoint HEAD:** `ada88cefdcac5fa61b01089bce9265bad26deb0d`.
- **CI on that exact HEAD:** [GitHub Actions #43368790405](https://github.com/CzekUns/Rtsmobile/actions/runs/43368790405) completed **SUCCESS**. Job `JS tests & stream scope` and steps `Syntax checks for native JS`, `Node unit tests (recursively discovered)`, `Chromium HUD interaction smoke`, `Enforce ownership on agent branches only` each completed SUCCESS. This is a real HTTP-served Chromium smoke, not Android/manual parity evidence.
- **New code commit:** `70f42910197fc3bf0ab2eb6e6d897ddb1e643b29`, modifying `tests/browser/hud-smoke.html` only. Extended the live iframe browser smoke with game date render, pause/resume click, keyboard `s` save feedback, and game-menu expand/collapse state. The existing ORDINI, reports and COMANDI assertions remain. No game logic altered.
- **New code HEAD CI:** workflow lookup immediately after commit returned `workflow_runs: []`; **NOT VERIFIED** for `70f4291`. Local npm/browser and Android **NOT RUN**. No merge, no Pages deployment. PR #115 remains draft.
- **Single next step:** inspect CI for `70f4291` or the resulting checkpoint HEAD, fix any failing browser smoke assertion in PR #115, and only after green assess remaining MOD+joystick/save-load/fullscreen QA before removing draft status.

## 2026-11-13 — Repair failing Chromium keyboard save gate

- **Starting checkpoint HEAD:** `6198c2b5f5b540167de42e0b6cd3233ea2512b9d`.
- **Exact HEAD CI failure:** [Actions #43376203651](https://github.com/CzekUns/Rtsmobile/actions/runs/43376203651), job `JS tests & stream scope`: syntax SUCCESS, Node SUCCESS (212 pass / 0 fail / 2 skip), Chromium HUD interaction smoke FAILURE, ownership skipped. Log: `Browser smoke: FAIL: keyboard save did not report a result`.
- **Root cause:** the first-launch instructions dialog is opened by `game.js`, and the global shortcut handler deliberately ignores keys while help/report dialogs are open. The expanded smoke dispatched `s` without first closing that modal. The test had assumed keyboard shortcuts work over an active modal.
- **Fix commit:** `3c56a413ebfd2f84dc8e841b78b57b582c161b4f`, `tests/browser/hud-smoke.html`: close first-launch help dialog (when open), focus the game document body and dispatch cancelable keydown before asserting save status. This preserves intended modal shortcut guard rather than changing game behavior.
- **Verification:** failure identified from actual GitHub Actions job log. New HEAD CI **not yet verified** at commit time; local npm and Android **NOT RUN**. No merge, no Pages deployment.
- **Single next step:** inspect GitHub Actions on the new checkpoint HEAD, repair any remaining Chromium assertion failure in PR #115, then extend browser coverage to fullscreen/MOD+joystick and save-load before ready-for-review/merge.
