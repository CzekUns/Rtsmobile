# PARITY-MINIMAP-2026-11-10-VIEWPORT-CLIP

**Component:** minimap camera viewport outline, `seven-kingdoms-html/view.js` `WorldView.drawMini()`.

**Original reference:** `the3dfxdude/7kaa` (7KAA GPLv2 C++). Original minimap frame/viewport pixels and source implementation **not yet verified**; this patch is an objective HTML viewport rendering correction, **not certified graphic parity**. No asset imported.

**HTML before:** camera outline drawn with `strokeRect((cx-vw/2)*dx,(cy-vh/2)*dy,vw*dx,vh*dy)`, so when the camera is centered on an edge, the outline extends outside the minimap canvas and is partially invisible.

**HTML after:** `clipMinimapViewport()` intersects the camera's world-tile rectangle with the world bounds before scaling it to minimap pixels. No change to map camera position, minimap clicks, game rules, mobile fullscreen layout, MOD/joystick, or selection.

**Verification:** four pure Node tests: center, top-left, bottom-right, and viewport larger than map. Executed in isolated Node 22.16.0 with 4/4 PASS before publication. Full repository suite, browser 1x/2x screenshots, GitHub CI, original parity, and deployment remain to be independently verified.

**Status:** HTML fix implemented on branch; original graphic parity **DA CORREGGERE / non certificata**.

**Next:** inspect the original minimap frame/markers with versioned upstream source and screenshot; then integrate licensed graphics through the existing Asset pipeline without touching draft PR #13.

## Follow-up: stroke clipping at canvas boundaries (2026-11-10)

**HTML observation:** Canvas 2D `strokeRect` centers its line on the rectangle path. Even after world-coordinate clipping, a rectangle with `x=0` or `y=0` loses half its stroke at the bitmap boundary; the same happens on right/bottom edges.

**Implemented:** `insetMinimapStroke()` bounds the path by half the stroke width in minimap pixel coordinates, preserving the original HTML outline color and camera behavior. `WorldView.drawMini()` uses the bounded geometry. No imported assets or speculative original colors.

**Test:** isolated Node.js 22.16.0 run: 6/6 PASS (four existing clipping cases, two new stroke boundary/interior cases). The local run executed equivalent helper/test text; full repo suite, browser screenshot 1x/2x, CI, original visual comparison, and deploy are **not verified**. Status: HTML fix on PR #98, **DA CORREGGERE** for certified original graphic parity.
