# PARITY-MINIMAP-2026-11-11-CONSTRUCTION-SITES

- **ID:** SKH-106 / minimap construction footprints
- **Original source:** `the3dfxdude/7kaa` (original minimap construction-site iconography not yet pinned or visually compared). No original asset is copied.
- **HTML source:** `seven-kingdoms-html/view.js` `draw()` already displays `constructionSites` with `status==='walking'` using outline `#f4cb63`; `drawMini()` previously omitted these pending footprints.
- **Objective difference:** the main view shows the future building footprint while the minimap shows only towns, completed/under-construction firms, and units. The strategic view therefore omits pending construction destinations.
- **Implemented:** `drawMini()` renders a clipped outline for pending sites using existing `minimapFootprint` and the main-view construction color. No new palette, bitmap, game rule, asset decoder, touch control, or save format.
- **Commits:** `23e2d519` implementation, `3e51e839` regression tests.
- **Tests:** `tests/ui/minimap-construction-sites.test.js` covers visible pending site, status filter, edge clipping, missing legacy site list. Node test execution and Chromium 1×/2× unavailable in the runner (GitHub DNS resolution failure); CI pending independent check.
- **State:** **DA CORREGGERE** for original graphic parity; implementation published, visual and runtime validation not yet certified.
- **Next dependency:** original minimap symbol/palette reference and screenshot comparison; reconcile PR #106 with other minimap PRs before merge.
