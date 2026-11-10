# PARITY-MINIMAP-2026-11-10-VIEWPORT-CLIP

**Component:** minimap camera viewport outline, `seven-kingdoms-html/view.js` `WorldView.drawMini()`.

**Original reference:** `the3dfxdude/7kaa` (7KAA GPLv2 C++). Original minimap frame/viewport pixels and source implementation **not yet verified**; this patch is an objective HTML viewport rendering correction, **not certified graphic parity**. No asset imported.

**HTML before:** camera outline drawn with `strokeRect((cx-vw/2)*dx,(cy-vh/2)*dy,vw*dx,vh*dy)`, so when the camera is centered on an edge, the outline extends outside the minimap canvas and is partially invisible.

**HTML after:** `clipMinimapViewport()` intersects the camera's world-tile rectangle with the world bounds before scaling it to minimap pixels. No change to map camera position, minimap clicks, game rules, mobile fullscreen layout, MOD/joystick, or selection.

**Verification:** four pure Node tests: center, top-left, bottom-right, and viewport larger than map. Executed in isolated Node 22.16.0 with 4/4 PASS before publication. Full repository suite, browser 1x/2x screenshots, GitHub CI, original parity, and deployment remain to be independently verified.

**Status:** HTML fix implemented on branch; original graphic parity **DA CORREGGERE / non certificata**.

**Next:** inspect the original minimap frame/markers with versioned upstream source and screenshot; then integrate licensed graphics through the existing Asset pipeline without touching draft PR #13.
