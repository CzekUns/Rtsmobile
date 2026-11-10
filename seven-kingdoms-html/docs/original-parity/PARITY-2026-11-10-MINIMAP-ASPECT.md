# PARITY-2026-11-10-MINIMAP-ASPECT

Status: DA CORREGGERE (HTML distortion fixed in PR; original graphic parity not certified).

## Reproducible HTML evidence
- `index.html`: minimap canvas intrinsic bitmap **184 × 137** (ratio 1.34306569).
- `style.css` on main: CSS **172 × 135** (ratio 1.27407407).
- The browser stretched the rendered bitmap nonuniformly, so circular/diagonal features and viewport outlines could be distorted.
- Fix: keep CSS width 172px, let height follow intrinsic ratio (`height:auto;aspect-ratio:184/137`, approximately 128.1px).
- This leaves pointer coordinates in the existing bounding-rect normalization unchanged; the minimap remains inside its 178 × 142 wrapper.

## Reference and limitations
- Original comparison source: `the3dfxdude/7kaa` (reference project; original bitmap dimensions and bezel geometry not verified in this run).
- This is an objective HTML canvas display correction, not a claim of pixel parity with original Seven Kingdoms.
- No original assets, palette, pipeline, mobile MOD/joystick or selection logic changed.
- PR #99 owns pointer drag; do not merge without reviewing any overlapping minimap CSS changes.

## Verification
- Node regression test: `tests/ui/minimap-aspect-ratio.test.js` checks intrinsic dimensions and CSS ratio.
- Full npm suite, CI, 1×/2× browser screenshots and Android touch test: pending independent execution.
- Commits: `a9474d7` (CSS), `febd144` (regression test).
