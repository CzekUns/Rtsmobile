# PARITY-2026-11-11-MINIMAP-KEYBOARD

- ID: SKH-106 / minimap keyboard navigation
- Original: the3dfxdude/7kaa, `src/OWORLD.cpp` (`World::detect` map input delegation); exact keyboard navigation in original **not established**.
- HTML baseline: `game.js` minimap handled `pointerdown` only; `index.html` canvas lacked tab focus.
- Difference: HTML-specific accessibility gap, **not a claim of pixel or control parity with 7KAA**.
- Implemented: focusable minimap, arrow keys moving camera by ten world tiles, Home centering world, bounds clamp. Existing pointer and mobile MOD/joystick unaffected.
- Tests: `tests/ui/minimap-keyboard.test.js` three Node cases; actual Node CI and browser/Android tests pending. Pure helper cases additionally evaluated in V8 during authoring.
- Asset provenance: no image assets used; draft #13 untouched.
- Conflict: open PR #99 edits minimap pointer handler; review adjacent hunk before merge.
- Status: DA CORREGGERE (await CI/browser and original comparison).
