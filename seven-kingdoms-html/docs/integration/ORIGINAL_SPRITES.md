# SKH-106 — original 7KAA PNGs in native Canvas (stacked preview PR)

**Scopo:** mostrare nel runtime JavaScript nativo le due tavole PNG originali decodificate dalla corsia Assets SKH-101, senza alterare input e logica.

## Prova e rendering

- Le due anteprime originali sono attive per impostazione predefinita, `?sprites=1` le abilita esplicitamente e `?sprites=0` le disabilita. Il parametro si combina con `?playtest=1`. L'opzione disabilitata conserva tutti i disegni Canvas precedenti.
- Il browser carica le immagini PNG locali asincronamente. Mancanti o non valide: fallback grafico Canvas, nessuna eccezione durante il render.
- `NORMAN-M-1x.png`: 8 direzioni × 6 frame, celle trasparenti 96×112 con i veri offset dei frame SFRAME; direzione da spostamento effettivo, frame 0 da fermo/in pausa, campionamento nearest-neighbor.
- `BASE-NORMAN-phases-1x.png`: quattro pannelli 180×160, tre di costruzione e il quarto completato; avanzamento del cantiere dal `buildProgress` già nel modello.

## Mappatura della demo, volutamente limitata

- I soldati del *giocatore rosso* mostrano l'asset originale `NORMAN` **come proxy grafico**. La demo identifica ancora quei soldati come Greci; non sono stati aggiornati ID razza, professioni o regole.
- I forti del *giocatore rosso* mostrano `BASE:NORMAN` (**Seat of Power**) **come proxy grafico**; il forte demo è 3×3 tile contro l'edificio originale 4×4. Il solo disegno è scalato, le collisioni non cambiano.
- Gli altri regni, villaggi, edifici e unità usano gli sprite Canvas esistenti; nessun intero PNG è colorato arbitrariamente per simulare altre nazioni.
- I due sheet sono presi dal branch `agent/skh-assets/decoder` (PR #13), non da un download runtime remoto.

## Confini e verifiche

- File cambiati solo dalla corsia Integration: `view.js`, `game.js`, `playtest/original-sprites.js`, test e documentazione. Nessun codice delle altre corsie riscritto.
- COMANDI, MOD, levetta, selezione multipla, salvataggi, hitbox, zoom, HUD, ordini e movimento di gruppo restano instradati nei loro moduli originali.
- `OriginalSpritePreview.drawUnit/drawFirm` restituiscono `true` soltanto dopo il disegno di una PNG completamente caricata, altrimenti `false`.
- Controlli automatici: `npm --prefix seven-kingdoms-html test`; verifica manuale Android e screenshot della stessa scena in 7KAA **non ancora eseguiti**.
- Non impostare `visuallyVerified:true`; l'ancoraggio verticale, l'ordinamento dei layer e la sincronizzazione frame richiedono ancora confronto 7KAA.
- PR di integrazione **stacked su PR #13**, da fondere nell'ordine e solo dopo review; nessun merge automatico.

Riferimento grafico: `the3dfxdude/7kaa` commit `14e6fdfba9481af4dc3a54722614a608776e20bc`. Stato: **anteprima originale, parità visiva in gioco non ancora certificata**.
