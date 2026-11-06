# SKH-106 — original 7KAA PNGs in native Canvas (stacked preview PR)

**Scopo:** mostrare nel runtime JavaScript nativo le due tavole PNG originali decodificate dalla corsia Assets SKH-101, senza alterare input e logica.

## Prova e rendering

- Le due anteprime originali sono attive per impostazione predefinita, `?sprites=1` le abilita esplicitamente e `?sprites=0` le disabilita. Il parametro si combina con `?playtest=1`. L'opzione disabilitata conserva tutti i disegni Canvas precedenti.
- Il browser carica le immagini PNG locali asincronamente. Mancanti o non valide: fallback grafico Canvas, nessuna eccezione durante il render.
- `NORMAN-M-1x.png`: 8 direzioni × 6 frame, celle trasparenti 96×112 con i veri offset dei frame SFRAME; direzione da spostamento effettivo, frame 0 da fermo/in pausa, campionamento nearest-neighbor.
- `BASE-NORMAN-phases-1x.png`: quattro pannelli 180×160, tre di costruzione e il quarto completato; avanzamento del cantiere dal `buildProgress` già nel modello.

## Mappatura della demo, volutamente limitata

- Le unità normanne del regno blu usano lo sprite NORMAN con i colori blu originali (schema nazione 2); i soldati greci rossi usano il disegno provvisorio. I normanni rossi reclutati esplicitamente possono usare la versione rossa.
- Il forte blu dei Normanni mostra BASE:NORMAN (**Seat of Power**) **come proxy grafico**; la struttura originale è 4×4 tile contro il forte demo 3×3. Nessuna modifica alle collisioni.
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

## Norman nation colours e terreno originale puro

Lo sprite NORMAN è associato a cultura/raceId normanno; le tinte di nazione da schema 1 (A0–A3/C0–C3) sono rimappate esattamente a schema 2 blu (A4–A7/C4–C7), con i valori RGB dalla PAL_STD originale. Un salvataggio precedente privo di Normanni riceve due difensori a Eboracum tramite migrazione una tantum, senza cancellare l'avanzamento. Il bottone N centra Eboracum. Il terreno utilizza 32 tasselli originali 32×32, quattro famiglie S/G/F/D e otto slot ciascuna (un ripetuto per acqua), con manifest, PNG e converter CLI. Il mondo, le coste e la vegetazione sono ancora provvisori. L'opzione ?sprites=0 mantiene la grafica vecchia.
