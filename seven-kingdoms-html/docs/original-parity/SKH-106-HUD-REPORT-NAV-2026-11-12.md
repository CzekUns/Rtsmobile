# SKH-106-HUD-REPORT-NAV — 2026-11-12

**Status: DA VERIFICARE (visuale e CI).**

## Scope and objective
The fullscreen HTML HUD has nine report actions in a horizontally overflowing strip. In narrow landscape widths, some report buttons require touch scrolling to become reachable. PR #109 adds previous/next navigation, keyboard arrow focus traversal and scroll state feedback. This is a functional improvement of the existing HUD, **not** pixel-faithful reproduction of original bitmap controls.

## Sources and limits
- HTML baseline: `seven-kingdoms-html/index.html` (`.reports` with nine `data-report` buttons), `style.css` (overflow-x:auto), `game.js` (report dialogs and F1–F9).
- Original reference candidate: `the3dfxdude/7kaa` C++ commit `14e6fdfba9481af4dc3a54722614a608776e20bc`; original HUD screenshots and source coordinates **not measured** in this run.
- No original bitmap, palette or archive assets introduced; draft Asset PR #13 untouched.

## Changes (PR #109)
- `playtest/report-toolbar.js`: scroll bounds, clipped-button navigation, ArrowLeft/ArrowRight and Home/End traversal of all nine reports, resize/scroll and dynamic-label updates, cleanup.
- `index.html`, `game.js`, `style.css`: report strip arrows and responsive integration.
- `tests/integration/report-toolbar.test.js`: bounds, clipped-button selection, complete keyboard traversal, focus/scroll and listener cleanup.
- Follow-up commits `b4a4040` (keyboard and dynamic changes), `790d468` (tests).

## Validation
- Tests authored and pushed. Local npm suite/Chromium unavailable because this runtime cannot resolve github.com for git clone; CI on latest HEAD must be checked.
- Chromium 1×/2×, Android landscape, original 800×600 comparison, deploy: **not verified**.
- Controls preserved: fullscreen map, adaptive sidebar, left COMANDI / MOD / joystick and multi-selection.
- Follow-up: verify authentic original HUD geometry and licensed assets for texture, icon and frame parity; check arrow crowding at 1×/2× and narrow Android landscape.
