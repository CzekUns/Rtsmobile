# SKH-106-WORLD-LAYER-01 — World painter depth

Status: **DA VERIFICARE** (code published; visual comparison and CI not yet certified).

## Evidence and difference
HTML source: `seven-kingdoms-html/view.js` on main at `933b5f938cffe3c854009f06ed7c2862f2547da5`. Previously the painter rendered all towns, then all waiting sites, then all firms, then all units, regardless of map position. Consequently a unit north of a building could cover its southern foreground. This is an objective HTML layering difference; it does not establish parity with 7KAA source assets or screenshot geometry.

## Implementation
PR #108, branch `agent/skh-integration/world-depth-order`. `world-depth-order.js` orders renderables by southern world foot (y+size for buildings/sites; y for units), stable by prior category/insertion sequence on ties. `view.js` uses that ordering, retaining existing draw methods, mobile input and original-sprite preview hooks. No licensed asset imported and no Asset #13 changes.

## Tests and remaining gates
`tests/world-depth-order.test.js`: cross-category overlap, tie stability, missing collections and invalid coordinates. CI result pending. Required: Node tests, browser 1×/2× screenshots, comparison with original CzekUns/sevenkindomsmobile build, Android landscape, deploy verification. No original geometry or color fidelity claimed.

## Next dependency
Compare overlapping unit/building examples against dated original screenshots and correct anchor depth if sprite pivots differ from world foot; then address classic HUD frame and town/fort panels using verified assets.
