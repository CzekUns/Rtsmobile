# SKH-106-MINIMAP-TERRAIN-CACHE — 2026-11-11

**Stato: DA VERIFICARE (runtime modificato).** PR #106, branch `agent/skh-integration/minimap-footprints-20261111`.

## Fonti e differenza
- HTML precedente: `seven-kingdoms-html/view.js`, `WorldView.drawMini`, eseguiva 76×66 campionamenti di terreno e `fillRect` per ogni frame, anche con mondo/seed immutati.
- HTML attuale: `minimap-terrain.js` conserva il raster in un canvas separato e lo copia con `drawImage`; seed o dimensioni mutate rigenerano l'intero raster. Entità, cantieri e riquadro telecamera restano disegnati dinamicamente dopo la copia.
- Riferimento grafico: palette HTML `COLORS` e `hash` identici a `WorldView.tileDraw`. **Nessuna pretesa di palette originale**; confronto con 7KAA e bitmap originali non certificato. Fonte C++ generale: https://github.com/the3dfxdude/7kaa (codice GPL, asset da verificare separatamente).

## Modifiche e test
- `minimap-terrain.js`: cache per seed/risoluzione, fallback diretto quando manca il canvas offscreen, invalidazione esplicita.
- `view.js`: integrazione nel solo rendering del terreno; controlli mobile, pipeline asset e ordine dei marcatori invariati.
- `tests/minimap-terrain-cache.test.js`: ripetizione senza nuovo raster, seed/resize/invalidate, fallback, bordi di pixel frazionari.
- Commit: `866292f`, `427eb88`, `9cdee33`.
- Test automatici aggiunti; esecuzione Node locale e confronto visivo 1×/2× **non eseguiti** perché il container non risolve github.com. CI e deploy da controllare sul commit finale.

## Dipendenza successiva
Confronto visivo minimappa originale/HTML, profilo FPS Android e provenienza/licenza dei simboli originali. Non confondere l'ottimizzazione del renderer con parità grafica.
