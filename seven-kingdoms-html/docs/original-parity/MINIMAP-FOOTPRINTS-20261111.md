# SKH-106 — MINIMAP-FOOTPRINTS-20261111

Status: **DA VERIFICARE** (code published; Node/Chromium and CI not yet certified).

Source of coordinates: current HTML `view.js` world renderer (`townDraw`, `firmDraw`, `unitDraw`), `rules.js` WORLD_W/WORLD_H and NATIONS. This change does not claim equivalence to the original 7KAA bitmap artwork.

Observed difference: minimap town/firm markers used a hard-coded +1 tile offset and fixed marker dimensions, regardless of each entity's real footprint. Units were absent. The world renderer uses exact entity x/y and settlement/firm size.

Implementation: draw settlement and firm markers from their true tile origin and footprint; render unit markers at their current floating-point world positions; preserve existing nation colors and camera overlay. No new bitmaps or guessed colors. No changes to Asset #13, mobile touch controls, HUD or simulation.

Regression: `tests/integration/minimap-footprints.test.js` checks positions, dimensions, and owner colors. Run `npm --prefix seven-kingdoms-html test` and `npm --prefix seven-kingdoms-html run check`. Visual checks at 1x/2x and Android landscape remain required. CI and deploy unverified at writing.

Next: verify original minimap symbols/palette against licensed upstream assets; review concurrent minimap PRs #104 and others before merge.

## MINIMAP-TERRAIN-RESOLUTION-20261111 — DA VERIFICARE

- **Originale:** Seven Kingdoms 7KAA, fonte autorevole `the3dfxdude/7kaa`; campionamento e palette bitmap dell'originale non ancora certificati da screenshot/versione. Nessun asset originale copiato.
- **HTML precedente:** `view.js::drawMini` campionava una casella su quattro (`x+=2,y+=2`), replicandone il colore su 2×2; inoltre usava sempre la prima variante di colore, mentre `tileDraw` sceglie la variante tramite `hash(x,y,seed)`. Il terreno della minimappa poteva quindi differire dal terreno visualizzato.
- **Implementazione:** `d3a52c28` disegna ogni tile con lo stesso selettore di colore deterministico di `tileDraw` e bordi pixel interi contigui, mantenendo i marker/viewport già corretti nella PR #106. `39732030` aggiunge test per 76×66 tile, copertura senza fessure e parità del colore con la vista principale.
- **Verifica:** test Node aggiunti ma non eseguiti in questo ambiente (DNS GitHub non disponibile per clone); CI e confronto Chromium 1×/2× non ancora certificati. Stato **DA VERIFICARE**. Parità dei bitmap originali **BLOCCATA** in attesa di screenshot e asset con licenza verificata; questo intervento corregge coerenza interna della demo HTML.
- **Prossimo:** verificare CI/test e confronto visivo; quindi icone/palette originali da manifest asset autorizzato, senza modificare draft #13.
