# Checkpoint · SKH-HUD-001 — HUD consolidation

- **State:** IN_PROGRESS, branch only; no merge or Pages deployment.
- **Branch:** `agent/skh-integration/hud-backlog-consolidation`
- **Last code/test HEAD:** `ac6381b1ed1a6c40517c5bcec7dc864aa2276768` (checkpoint commit follows).
- **Source PRs:** #97, #101, #103, #105, #107.
- **Base:** main at branch creation 2026-11-12 (main state file last observed `413758a`; current base SHA not independently returned by create_branch).
- **Integration code:** `game.js` combines #97 report pressed state, #101 global keyboard focus guard and Escape modal semantics, #103 ORDINI inert/focus/media query. New `playtest/keyboard-focus-guard.js`, tests `tests/keyboard-focus-guard.test.js` and `tests/ui/hud-consolidation.test.js`. Updated existing `tests/fullscreen-layout.test.mjs` to reflect controller change.
- **Commits:** `6cf5f06` game.js, `e6ed2b4` guard, `02d76d5` guard tests, `34c0316` integration tests, `ac6381b` fullscreen test.
- **Unintegrated:** #105 responsive topbar CSS/HTML and #107 selection meters CSS/JS/tests. Do not close source PRs.
- **Collision matrix:** #97/#101/#103/#105/#107 all touch `game.js`; #105/#107 also touch `style.css`; #105 changes `index.html`. #97/#105 overlap report button state; use only one implementation. #101 Escape logic must supersede #97 simple Escape handler. #103 responsive controller changes existing fullscreen source assertion.
- **Tests:** NOT RUN. Attempted `git ls-remote https://github.com/CzekUns/Rtsmobile.git HEAD` in container; failed `Could not resolve host: github.com`. GitHub connector successfully wrote source and test commits. CI on combined HEAD: NOT VERIFIED. Browser 1x/2x, Android, Pages: NOT RUN.
- **Original fidelity:** These are HTML interaction corrections, not certified 7KAA bitmap parity. Existing assets preserved.
- **Single next step:** fetch current branch and source PR #105 diff; integrate its responsive topbar HTML/CSS into this same branch without duplicating report state, then integrate #107 selection meters, fix combined test failures and obtain CI HEAD before any merge.
