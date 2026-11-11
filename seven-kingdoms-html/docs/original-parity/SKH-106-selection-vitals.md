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
