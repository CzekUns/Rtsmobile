# SKH-106 — Atlas draw success / demo-link fallback (2026-11-12)

**Componente:** rendering terreno, comportamento di fallback delle connessioni dimostrative.

**Fonte HTML:** `seven-kingdoms-html/view.js` (`WorldView.draw`, `tileDraw`, `drawDemoLinks`); `playtest/original-terrain.js` (`OriginalTerrainPreview.isReady/drawTile`). **Fonte originale:** `the3dfxdude/7kaa` come riferimento generale del terreno; le linee tratteggiate della demo non sono dichiarate strade autentiche.

**Differenza oggettiva:** `isReady()` verifica dimensioni e stato dell'immagine, ma `drawTile()` può restituire `false` dopo un errore Canvas. Prima, la disponibilità apparente dell'atlante nascondeva i collegamenti dimostrativi anche se nessuna tessera originale era stata disegnata.

**Intervento:** `WorldView.draw` azzera il contatore per frame; `tileDraw` conta i disegni originali riusciti; `drawDemoLinks` mantiene i collegamenti solo se tutte le tessere visibili sono ricadute nel fallback procedurale. In presenza di almeno una tessera originale, le linee artificiali restano nascoste. Conservata la chiamata isolata al metodo per test e compatibilità.

**Test:** `tests/integration/terrain-draw-success.test.js` copre atlante pronto ma disegno fallito, successo completo e successo parziale. I test sono pubblicati ma esecuzione Node/Chromium e confronto visivo 1×/2× non certificati in questa sessione.

**Stato:** DA CORREGGERE / DA VERIFICARE — intervento implementato nel branch della PR #110; il terreno resta una preview, senza parità delle coste, strade e transizioni originali. Nessuna modifica agli asset della draft PR #13.

**Prossima dipendenza:** verificare screenshot del renderer originale e disponibilità delle transizioni costiere negli asset autorizzati prima di sostituire i placeholder.
