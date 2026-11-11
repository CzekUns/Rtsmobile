# SKH-106-MINIMAP-PIXEL-CLIP — 2026-11-11

**Stato: DA VERIFICARE** (codice e test pubblicati; parità grafica originale e Android non certificati).

## Fonti e confronto
- HTML base: `seven-kingdoms-html/view.js`, `WorldView.drawMini` nel ramo `agent/skh-integration/minimap-footprints-20261111`.
- Riferimento di progetto: `the3dfxdude/7kaa`, sorgente originale GPL; questo intervento è una correzione geometrica dell'HTML, **non** una ricostruzione di simboli, colori o misure originali. Le bitmap e la palette originali richiedono ancora verifica della provenienza/licenza attraverso la corsia Asset #13.
- Differenze oggettive HTML: i marker precedenti usavano rettangoli con coordinate frazionarie non ritagliate, e la linea della camera veniva disegnata sul bordo esterno con metà spessore fuori canvas.

## Modifiche
- `minimap-geometry.js`: rettangoli dei footprint ritagliati sul mondo, allineati ai pixel e null per oggetti completamente esterni.
- `view.js`: villaggi, imprese e unità usano la stessa funzione; bordo telecamera interamente dentro canvas anche ai limiti della mappa.
- `tests/minimap-geometry.test.js`: casi per bordi, zoom, coordinate frazionarie, footprint e dimensioni invalide.
- Commit: `a937102`, `1d2eaa9`, `cad9aec`; PR #106.

## Verifiche e dipendenze
Test Node aggiunti ma esecuzione CI sul nuovo HEAD da verificare; confronto Chromium 1×/2×, Android e deploy **non verificati**. Nessun asset aggiunto o pipeline Asset #13 modificata. MOD fullscreen, COMANDI a sinistra, MOD+levetta e selezione multipla non toccate.

**Prossimo componente:** simboli e palette originali della minimappa, solo dopo asset con provenienza verificata; altrimenti schede villaggio/forte.
