# SKH-106 · Minimap viewport clipping · 2026-11-11

**Component:** camera outline in `WorldView.drawMini` (PR #106 extension).

**HTML baseline:** `view.js` on branch `agent/skh-integration/minimap-footprints-20261111` prior to commit `009580c5`; the viewport rectangle could extend beyond the minimap when the camera was near the world boundary or zoomed out. `minimapAt` also contained an algebraically redundant canvas-width factor.

**Original source:** 7KAA `the3dfxdude/7kaa` remains the parity authority; no original screenshot or exact minimap frame measurements were obtained in this run. Clipping to the map is a correctness fix, **not** certified visual parity.

**Changes:** `009580c5` clips the camera outline to the visible minimap, and simplifies pointer-to-world coordinate mapping without changing its formula. Tests: `14519f52` and `73c33ff` add edge, zoom-out and pointer mapping coverage using the actual `WORLD_W/WORLD_H` constants. No asset files, nation colors or mobile control mappings changed.

**Verification:** test code committed; Node suite, browser 1×/2× and Android visual checks not executed in this run because the repository could not be cloned in the available container (DNS resolution failure). CI result for HEAD was not yet available when checked. No deploy claimed.

**State:** DA CORREGGERE / DA VERIFICARE. Next: execute Node suite and screenshot compare, then original minimap palette/symbol verification with licensed source assets.
