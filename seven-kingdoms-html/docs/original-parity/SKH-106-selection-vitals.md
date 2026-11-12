# SKH-106 · Town and firm selection condition indicators

Status: **DA VERIFICARE** (2026-11-11).

## Sources
- 7KAA `the3dfxdude/7kaa/src/OTOWNIF.cpp`, `Town::disp_info`: town selection has distinct race and loyalty/resistance information.
- 7KAA `the3dfxdude/7kaa/src/OFIRMIF.cpp`, `Firm::disp_info_both` and `disp_worker_hit_points`: building information includes construction status and worker health.
- HTML baseline `seven-kingdoms-html/game.js` `selectedContent`, `renderPanel`; `style.css` selection pane.

## Objective differences
The HTML panel previously presented loyalty, resistance, firm HP and building progress as inline text only. This change adds compact numeric meters in the existing orders pane, keeping values visible in accessible text and preserving action handlers.

## Implementation
- `selection-meter.js`: bounded, escaped and accessible progressbar markup.
- `game.js`: town loyalty/resistance and firm integrity/construction progress wired into the selection view.
- `style.css`: visual bars based on **existing HTML HUD colors** (not claimed to be original bitmap colors).
- `tests/integration/selection-meter.test.js`: bounds, malformed save data and HTML escaping.

No changes to Asset pipeline #13, mobile joystick, selection gestures, save format or game rules.

## Verification
Tests added; local `npm test` blocked because the execution container cannot resolve github.com to clone the repository. GitHub CI, 1×/2× screenshots, Android and deploy pending. **Not certified original graphic parity**: bitmap layout, geometry and color references require authenticated screenshots / licensed asset pipeline.

## Next dependency
Compare town/fort screenshots from the original 7KAA build and replace provisional HUD visual treatment with verified original resources, coordinating with SKH-103 and SKH-101.

## Incremental panel details — 2026-11-11
- **ID:** SKH-106-DETAILS-01; **status:** DA VERIFICARE.
- **Reference:** 7KAA `src/OTOWNIF.cpp` town race loyalty; `src/OFIRMIF.cpp` worker hit points. HTML `game.js` selectedContent, `selection-meter.js`.
- **Objective HTML gap:** each town race was text-only for loyalty, and firm personnel displayed only a raw HP integer. Global town/firm indicators already existed in PR #107.
- **Implementation:** render bounded per-race loyalty and per-worker health meters directly within existing race-choice/worker rows. Preserve race selection, personnel exit buttons, IDs, existing nation colors, and mobile panel placement. No asset changes.
- **Commits:** `ab1cb2e6` implementation; `5aec0d6c` regression source/markup tests.
- **QA:** Node regression added, execution/CI and visual 1×/2×/Android still pending; original bitmap parity **not certified**. Worker health range assumes existing HTML 0–100 model, not an upstream C++ health formula.
- **Next dependency:** source-verified original panel frame/controls and screenshot comparison; coordinate with UI and Asset streams.

## Selected unit health and active work — 2026-11-12
- **ID:** SKH-106-UNIT-VITALS-02; **state:** DA VERIFICARE.
- **HTML reference:** `game.js` `selectedContent()` unit branch and `selection-meter.js`; upstream reference `the3dfxdude/7kaa/src/OFIRMIF.cpp` for firm HP/construction concepts. This is an HTML data-display correction; original bitmap parity is **not claimed**.
- **Objective HTML gap:** selected unit health was raw text, repair progress was raw firm HP text and active construction was an unbounded rounded percentage; town/firm meters in this PR already bounded values.
- **Implementation:** selected unit health, active repair integrity (using the actual target maximum), and active construction progress now reuse the bounded meter. Walking status and order buttons remain unchanged. No changes to mobile MOD, selection, asset pipeline, or save model.
- **Commits:** `e09243d` implementation; `d7be5e8` regression tests.
- **Verification:** source-level tests published; local suite blocked by github.com DNS resolution in execution container; CI, original/HTML 1x/2x screenshot, Android and deploy must be checked. **DA VERIFICARE** until CI and visual checks.
- **Next dependency:** licensed original UI frames/geometry for town/fort cards via Asset #13 and SKH-103; do not invent colors or sprite dimensions.
