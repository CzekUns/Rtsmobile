# Plancia a tre livelli — scheletro, artwork porzionato e interazioni

**Decisione richiesta dall'utente il 5 novembre 2026:** definire completamente la città in vettoriale senza dettagli grafici, dividerla in gruppi coerenti, produrre immagini ImageGen per ciascuna porzione su geometria già fissata, sovrapporre illustrazioni all'esatto scheletro e rendere ogni edificio cliccabile/illuminabile separatamente, distinguendo tetto, facciate, strada e cortili. La telecamera deve permettere avvicinamenti forti senza perdere nitidezza. I sistemi NPC/IA restano in pausa.

## Layer 1 — geometria autoritativa

- `board-world.js`: 454 poligoni di lotti e 21 strade, seed 1860; la mappa misura 2700×2100 unità mondo.
- `block-continuity.js`: raggruppa i vicini in 117 file edilizie contigue con 337 raccordi.
- `board-skeleton.js`: costruisce **454 schede di hitbox**: poligono a terra, tetto proiettato alla quota `b.z`, quattro pareti, lato `street` (`poly[0]→poly[1]`), `left/right/rear`, porta e uso grafico residenziale/attività/decorazione. Il picking restituisce oggetto, lato colpito e strada, NON si basa sul bounding box di un PNG. Le categorie sono **soltanto metadati visivi**; non modificano gameplay o produzione oro.
- Le hitbox e le coordinate non cambiano con zoom, PNG o selezioni.

## Layer 2 — grafica completa per gruppi

- `board-skeleton.js`: 117 **chunk visuali** con ID stabile `block-N`, lista dei propri lotti e rettangolo proiettato di ritaglio. I dati dei 117 chunk e i tre slot arte sono in [assets/chunk-index.json](assets/chunk-index.json); gli slot attualmente `null` perché nessun PNG seamless per gruppo è stato ancora prodotto e approvato.
- `board-chunks.js`: registro di immagini **reali** per `base`/`detail`/`ultra` (LOD); il renderer seleziona in automatico la risoluzione appropriata allo zoom, con fallback solo quando la risorsa esiste. Ogni chunk disegnato sostituisce visualmente il gruppo di palazzi, mantenendo tutte le hitbox singole. Non scaricare immagini il cui percorso non è stato verificato.
- Primo campione: `block-2` su Cross Street, sei lotti [2,3,4,9,10,11]. La guida SVG trasparente ufficiale è [assets/guides/cross-street-block-2-skeleton.svg](assets/guides/cross-street-block-2-skeleton.svg), che contiene ogni parete/tetto distinto, il fronte evidenziato e gli ID lotti. `assets/pilot-cross-street.json` registra punti d'aggancio e dimensioni.
- Nel frattempo resta la preview precedente con i sei prototipi Canvas ad alta risoluzione e le giunzioni; NON è un nuovo asset ImageGen seamless. Il raster di un blocco **non** può essere considerato posizionato correttamente soltanto perché gli angoli sono giusti: bisogna verificarne contorni effettivi e corrispondenza pixel/hitbox con screenshot e correzione manuale se ImageGen sposta tetti/porte.

## Layer 3 — selezione, luce, segnalini e strade

- Il renderer `board-preview.js` usa `QOBoardSkeleton.pick`: click sul tetto o su una parete visibile restituisce il singolo lotto, non l'intero gruppo. Nessun rettangolo grossolano che catturi edifici vicini.
- Il volume selezionato viene evidenziato con overlay traslucido sulle sue sole pareti visibili e sul tetto; la fascia verso strada ha highlight distinto. In caso di click su carreggiata viene evidenziato il tracciato stradale.
- Comando **SCHELETRO**: vista tecnica direttamente sul gioco con lotti, muri, fronti stradali, porte e ID; **SEGNALINI** mostra `⌂` residenziale / `◆` attività (solo a zoom leggibile); **GUIDA SVG** esporta il gruppo selezionato in vettoriale per produzione artistica.
- HUD e gesti originali rimangono separati: niente trascinamento della pagina quando la telecamera si muove.

## Zoom ravvicinato e qualità effettiva

Zoom della preview da `0.58×` a `7.5×`. Le hitbox/forme vettoriali rimangono matematicamente nitide. I sei moduli pilota sono prerenderizzati a 8×, gli altri fallback vettoriali vengono disegnati direttamente quando si raggiunge uno zoom alto; gli asset ImageGen originali hanno una risoluzione finita, e **non si deve promettere assenza di perdita oltre il dettaglio sorgente**. Il futuro artwork seamless userà tre versioni: `base` quartiere lontano, `detail` fronte strada, `ultra` ravvicinamento. Per l'ultra LOD, se un'intera fila di 6 palazzi non raggiunge abbastanza pixel, servono sotto-sezioni ad alta risoluzione registrate alla stessa geometria, NON upscaling indiscriminato.

La proporzione della proiezione resta `screenX=(x-y)*0.76`, `screenY=(x+y)*0.38`, dunque 2:1 senza fuga prospettica. Gli ImageGen devono ricevere guide con **prospettiva fissa e scala esatta**, non soltanto un prompt di stile.

## Priorità ancora APERTE
1. Usare la guida `block-2` per produrre **una sola immagine seamless del gruppo di sei case**, con trasparenza e senza testo, e almeno un LOD ravvicinato. Non generare nuove case singole senza collegamento geometrico.
2. Confrontare la posizione di ciascuna finestra/facciata con le hitbox reali; correggere maschere e, se necessario, scomporre l'immagine in layer di occlusione pur mantenendo la continuità illustrativa.
3. Integrare immagini nel registro `QOChunkArt.register` **soltanto dopo upload verificato** e collegare lo schema `assets/chunk-index.json` ai file reali; l'indice attuale non scarica file inesistenti.
4. Provare zoom/pan/multitouch nel browser Android landscape e desktop; screenshot reale a 1×, 3× e 7.5× con confronto alla golden.
5. Estendere a 117 chunk, lavorando per lotti e strade, finché non esiste più l'effetto figurine.

**Questa fase implementa il telaio e l'interazione; NON è il restyling illustrativo completo.** Non anticipare lo sviluppo NPC.
