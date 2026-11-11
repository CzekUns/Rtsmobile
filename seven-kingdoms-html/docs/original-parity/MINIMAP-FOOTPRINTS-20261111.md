# SKH-106 — MINIMAP-FOOTPRINTS-20261111

Status: **DA VERIFICARE** (code published; Node/Chromium and CI not yet certified).

Source of coordinates: current HTML `view.js` world renderer (`townDraw`, `firmDraw`, `unitDraw`), `rules.js` WORLD_W/WORLD_H and NATIONS. This change does not claim equivalence to the original 7KAA bitmap artwork.

Observed difference: minimap town/firm markers used a hard-coded +1 tile offset and fixed marker dimensions, regardless of each entity's real footprint. Units were absent. The world renderer uses exact entity x/y and settlement/firm size.

Implementation: draw settlement and firm markers from their true tile origin and footprint; render unit markers at their current floating-point world positions; preserve existing nation colors and camera overlay. No new bitmaps or guessed colors. No changes to Asset #13, mobile touch controls, HUD or simulation.

Regression: `tests/integration/minimap-footprints.test.js` checks positions, dimensions, and owner colors. Run `npm --prefix seven-kingdoms-html test` and `npm --prefix seven-kingdoms-html run check`. Visual checks at 1x/2x and Android landscape remain required. CI and deploy unverified at writing.

Next: verify original minimap symbols/palette against licensed upstream assets; review concurrent minimap PRs #104 and others before merge.
