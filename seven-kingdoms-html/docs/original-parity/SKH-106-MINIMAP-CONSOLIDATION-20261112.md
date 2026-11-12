# SKH-106 — Consolidamento minimappa 2026-11-12

Stato: implementazione HTML in attesa di CI e review; **non parità grafica certificata 7KAA**.

## PR aperte assorbite logicamente (mai fare merge duplicato)
- #111: risoluzione terreno al singolo tile (elimina campionamento 2×2 e bleed).
- #106: marcatori delle vere impronte e unità, sagoma di cantiere, ritaglio del riquadro e cache.
- #99: trascinamento touch/mouse con puntatore posseduto e limiti della mappa.
- #98: riquadro telecamera visibile ai bordi.
- #100: rapporto 184:137 (sulla HUD attuale esisteva già la regola `.sidebar #minimap`, ma la regola base era incongruente).
- #104: navigazione con focus, frecce/Home e protezione delle scorciatoie modificate.

Il nuovo file `playtest/minimap-system.js` consolida **le funzionalità**, non copia automaticamente le PR precedenti. Non tocca la pipeline Assets e non cambia la simulazione.

## Precisazione delle scelte
- Terreno miniatura colorato dalla classificazione demo `rules.js::terrain` e da `COLORS[type][0]`, non da una palette originale garantita. Tessera per tessera, senza il precedente campionamento 2×2. Il raster viene disegnato una sola volta per seed e dimensioni con offscreen Canvas; marker, unità e riquadro vengono ridisegnati ad ogni frame.
- `createCanvas` è iniettato e, senza canvas offscreen o con `drawImage` fallita, la generazione disegna direttamente sulla minimappa. Il cache si invalida su seed e dimensioni cambiati.
- I marker di villaggi ed edifici impiegano le vere dimensioni `x,y,size` e vengono ritagliati al bordo; unità e cantieri attendibili sono visualizzati separatamente.
- Riquadro camera ritagliato al bordo del mondo e inset dello stroke; movimenti del mondo e ordini sono immutati.
- Pointer: solo pulsante primario mouse o touch; un solo pointer catturato per volta, drag e cancellation robusti, limitazione alle coordinate della minimappa.
- Tastiera: focus minimappa, frecce/Home, senza intercettare Alt/Ctrl/Meta/Shift/composizione. Non è attestato che il Seven Kingdoms originale avesse queste scorciatoie.
- CSS: `touch-action:none` necessario per trascinamento e rapporto nativo delle immagini; JS/CSS con cache bust 16/8. Vecchi test statici di cache aggiornati per non imporre un numero specifico.

## Gate
- `npm --prefix seven-kingdoms-html test`, `npm --prefix seven-kingdoms-html run check`, GitHub Actions sull'HEAD finale: **da controllare**.
- Test Node eseguono raster 76×66, pixel coverage, invalidazione cache, fallback, overlay dinamici, puntatori, keyboard, clip.
- Confronto pixel 1×/2× con screenshot 7KAA, profiling fisico Android landscape e reale deploy Pages **non certificati prima della pubblicazione**.
- Prima del merge verificare che nessun'altra PR cambiata nel frattempo riscriva `view.js`, `game.js`, `style.css` o `index.html`; verificare conflitti con l'agente ricorrente.

## Riferimenti
- Repository: `CzekUns/Rtsmobile/seven-kingdoms-html/`, frontend `view.js` e `rules.js`.
- Riferimento esterno di *parità futura*: `the3dfxdude/7kaa` GPLv2, `src/OWORLD.cpp` e `src/OTERRAIN.cpp`; questo PR non dichiara una corrispondenza con renderer C++.
- Immagini originali attualmente integrate: PNG NORMAN e 32 texture pure da PR #88/#90, non modificate.
