# PARITY-2026-11-11-ORDERS-FOCUS

- **ID:** SKH-106 / collapsed orders keyboard accessibility.
- **Fonte HTML:** `game.js` in `main` at `933b5f938cffe3c854009f06ed7c2862f2547da5`; `setOrdersVisible` only set `aria-hidden`, leaving hidden descendants keyboard-focusable. Compact-mode query was evaluated only at startup.
- **Fonte originale:** No claim of original 7KAA UI fidelity; this is a mobile adaptation behavior fix. Original graphics and assets unchanged.
- **Correzione:** `inert` mirrors collapsed state, focus returns to the visible ORDINI toggle when collapsing, media-query changes resynchronize compact layout. Manual toggle remains available.
- **Test:** `node --test tests/orders-sidebar-focus.test.js`; `npm test` and `npm run check` required by CI. Browser/Android focus and 1×/2× visual QA remain pending.
- **Stato:** DA CORREGGERE until CI and browser QA. No deploy claim.
- **Dipendenza successiva:** faithful HUD assets, coordinated with draft PR #13 and classic HUD PR #16; do not merge those drafts.
