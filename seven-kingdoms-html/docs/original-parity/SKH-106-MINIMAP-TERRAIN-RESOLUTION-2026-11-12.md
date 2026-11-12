# SKH-106-MINIMAP-TERRAIN-RESOLUTION — 2026-11-12

Status: **DA VERIFICARE** (code published; browser 1×/2×, Node CI and original visual parity pending).

## Source and objective difference
HTML baseline: `seven-kingdoms-html/view.js`, `WorldView.drawMini` on main before this branch. It sampled `terrain(seed,x,y)` once per 2×2 world tiles and painted a rectangle with an extra 0.6 canvas pixels on both axes. Thus adjacent terrain types could be suppressed and the sample could bleed over neighboring tile colors. `rules.js` defines the current HTML world as 76×66 tiles. This change renders each of those cells independently using the **existing** HTML palette and terrain classifier. It does **not** assert that this synthetic map, its colors, or its terrain transitions match original 7KAA.

Authoritative original comparison still required: `the3dfxdude/7kaa` world/minimap rendering and dated screenshot of original `CzekUns/sevenkindomsmobile`. No original bitmap or unverified asset was imported.

## Implementation
- `view.js`: sample each world tile, draw at `(x*dx,y*dy,dx,dy)`, no intentional overlap.
- `tests/integration/minimap-terrain-resolution.test.js`: checks every tile's position and size, separate colors at real coast/terrain boundaries, complete canvas extent with a nonstandard aspect ratio.
- Commits: `eddf5ddedeea455bb85d56935c4580ddfb76fd87`, `2fc5dffb091e424863762385ae62771a87dd44d8`.

## Verification and limits
Tests are committed but **not executed** in this environment: GitHub DNS from the local container is unavailable. GitHub Actions, Chromium 1×/2×, Android, screenshot comparison and deployment are not certified. Performance changes from 1,254 to 5,016 tile rectangles per minimap redraw (76×66 world), and must be assessed on Android before merging.

No edits to Asset draft PR #13 or mobile controls. This PR modifies only minimap terrain painting; other open minimap PRs (#98–#106) require conflict review before merge.

Next: verify this map's 1×/2× coastline edges and mobile performance, then replace synthetic minimap colors/terrain only after authoritative source and licensed assets are verified.
