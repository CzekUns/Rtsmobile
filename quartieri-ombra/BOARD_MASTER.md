# PLANCIA DEFINITIVA — FIVE POINTS DISTRICT, NEW YORK circa 1860

## Prima implementazione del mondo esteso — 2026-11-04

**Artefatti pubblicati su main:** `board-world.js`, `board-preview.html`, `board-preview.css`, `board-preview.js`, `tests/board-world.test.cjs`. Modello mondo 2700×2100, nove settori popolati, 21 vie, 454 costruzioni su lotti separati, 212 decorazioni con sorgenti dati autonome. Visualizzazione tramite Canvas 2D e cache LRU di sprite per palazzo; controlli della camera, minimappa e UI dedicata. Il vecchio gameplay resta raggiungibile da `index.html`, con un pulsante verso l'anteprima.

**Accettazione:** ancora NO. Le strade sono dati originali e coerenti ma non ripercorrono con precisione certificata la pianta di Perris; il rendering prerenderizzato è una versione iniziale vettoriale senza tutti i materiali della golden image. Non usare l'assenza di sovrapposizioni o i conteggi degli edifici come prova di fedeltà visiva. **Nessuno screenshot del browser è stato eseguito** in questo turno.

**Prossimi lavori vincolanti:** 1) prima verifica reale desktop+Android della preview; 2) confronto cattura screenshot con la golden image e individuazione degli scarti; 3) produrre/prerenderizzare sprite originali di alta qualità e texture/luce coerente, integrandoli al posto dei vettori temporanei, preservando dati/camera/footprint; 4) allineare il crocevia e le strade alla cartografia storica, senza compromettere i 9 settori; 5) ottenere approvazione dell'utente prima di riaprire la fase NPC.


**Stato: riferimento visivo esplicitamente APPROVATO dall'utente in chat il 2026-11-04. Priorità massima assoluta.**
**Scope attuale: SOLO PLANCIA (scenario, mappa, resa visiva, navigazione visuale e asset ambientali).**
**Non sviluppare né modificare logiche NPC/pathfinding/IA/combattimento in questa fase**, salvo correzione minima bloccante che impedisca di vedere/provare la plancia. Il gameplay precedente può restare congelato. Anche se occorre sostituire radicalmente il renderer, si deve arrivare alla plancia proposta; non tentare di imporre lo stile tecnico attuale all'immagine target.

## LA REFERENCE VISIVA CHE VINCE SU TUTTE LE PRECEDENTI
L'utente ha approvato con «Ok perfetto ... questo imagegen rispecchia esattamente quello che volevo» l'immagine appena generata *DISTRETTO FIVE POINTS — NEW YORK c.1860*, che mostra una veduta ortografica isometrica dall'alto di un grande quartiere urbano ottocentesco.

- **Originale ad alta risoluzione (1672×941)**: file allegato all'attuale conversazione ChatGPT `distretto_five_points_new_york_1860.png` (generato con imagegen, 2026-11-04). Questo originale NON è stato caricato in GitHub: l'agente non deve dichiararlo presente nella repo.
- **Anteprima reale, ridotta (160×90)**: `assets/references/approved_five_points_board_preview.webp`, caricata in GitHub (commit `9edfb96c43111495fe5354bb9206e222e3a6c31c`). È un promemoria della **composizione**, NON un asset di gioco né abbastanza nitido da riprodurre i dettagli. Quando possibile recuperare il PNG originale dalla conversazione e caricarlo, esplicitamente come reference esclusa dal runtime.
- I documenti `ART_DIRECTION.md` e `VISUAL_ACCEPTANCE.md` restano validi, ma **per l'estetica della plancia, qualunque contrasto si risolve a favore di questa nuova reference approvata**. Non usare le prime key art cinematografiche, non tornare a una griglia regolare e non accontentarsi della procedurale Canvas attuale.

## Cosa deve corrispondere esattamente nel linguaggio visuale
- **Isometria vera 2:1**, inquadratura obliqua alta RTS, masse dei palazzi esatte in prospettiva, edifici estremamente densi, con tetti visibili e facciate su più lati. Colpo d'occhio da gioco tattico PC fine anni 1990-inizio 2000, dettagli prerenderizzati 2D, niente città di volumetti generici.
- **Incrocio storico a cinque sbocchi** nel cuore della scena, vie non rettilinee, asimmetrie, isolati trapezoidali/triangolari, curvature e slarghi, stradine strette, accessi laterali e cortili sul retro. Mappa viva ma riconoscibile da lontano, non disposizione geometrica `5×3`.
- **Edilizia a muro continuo**: case popolari e tenements 2–5 piani, magazzini, botteghe con tende, taverne, stalle e opifici bassi; facciate disallineate, differenze di quota, tetti consumati, comignoli, travi, panni stesi, insegne dipinte ORIGINALI. Botteghe lungo i fronti commerciali; edifici più poveri nei vicoli.
- **Manto urbano**: fango, acciottolato rotto, rotaie/solchi di carri, pozzanghere, bordi irregolari, muratura di mattoni rossobruni, grigio carbone, coperture antracite; qualche carro con cavallo, sacchi, barili, casse, lampioni ambra, lanterne e pochi gruppi di persone su scala corretta.
- **Luce e colore**: prevalenza di marroni fumosi e carbone, fiammelle ambra punteggiate, finestre illuminate discretamente, nebbia/fumo tenue. Alta densità di dettaglio, ma unità e click ancora leggibili.
- **Micro-controllo territoriale**: piccoli indicatori di presidio/controllo leggibili (bandiere rosse/blu, cerchi discreti), sovrapposti in UI separata. Le etichette “Capture Building” e titoli presenti sul concept sono SOLO annotazioni illustrative e NON vanno cotte nel terreno; HUD e minimappa restano separati.
- **Proporzioni**: edifici più alti di circa 8–15 volte la figura umana in scena; le costruzioni non devono sembrare piccole case di un gestionale e i personaggi non devono occupare metà strada.

## La mappa deve essere MOLTO PIÙ GRANDE dell'immagine approvata
**L'immagine originale è una finestra sul quartiere, NON l'intera mappa.** La nuova plancia deve coprire una città più estesa mantenendo **la stessa scala grafica e densità**, non ingrandendo/stretchando la fotografia né aggiungendo un bordo vuoto. Obiettivo di produzione iniziale: **almeno 2× ampiezza e 2× profondità di terreno esplorabile** rispetto alla scena mostrata, cioè circa 4× area utile; ambizione 3×3 settori con hub Five Points centrale. Le dimensioni definitive si misurano nel mondo, non nel numero di pixel di un'immagine.

- **Settore centrale 0,0**: reinterpretazione dell'incrocio a cinque punte visibile nel concept, con strade e catene di palazzi contigui. Preservare senso compositivo e proporzioni.
- **N/S/E/O e angoli**: quartieri aggiuntivi continui, senza duplicati, tagli netti, pattern ripetuti o strade che finiscono arbitrariamente; ciascuno con edifici vari ma identica estetica.
- Priorità di coerenza: le cinque strade si diramano e continuano fuori dalla finestra originale. Il campo visivo a zoom normale mostra **solo una porzione** del quartiere, come in un RTS con camera trascinabile e minimappa dell'intero distretto.
- Non distribuire gli edifici uniformemente ogni N pixel: lotti di ampiezza/angolo variabile, muri condivisi, corti e vicoli, passaggi commerciali e densità diversa fra zone.
- Tutti gli strati devono essere **dati/editabili, non un'immagine fissa**: almeno `terrain`, `roads`, `parcel footprints`, `architecture`, `props`, `effects`, `game overlays`, con depth sort coerente. Creare atlas/sprite singoli originali; non usare screenshot del film.
- La mappa storica Perris 1853 è l'ancora per gli assi e gli isolati; OpenStreetMap serve per orientamento e confronto con la città attuale, NON va presentato come rilievo del 1860. Se la fedeltà storica esatta contrasta con la lettura della scena, annotare la semplificazione.

## Lavoro consentito ADESSO (ordine)
1. Conservare il reference e predisporre layout esteso: asse delle 5 strade, zone urbanistiche e blocchi edilizi per settori. Prima la **sagoma dell'intero quartiere**, non le unità.
2. Preparare una **plancia completa e navigabile senza gameplay**, con spostamento camera, zoom, minimappa e visualizzazione landscape/fullscreen; se necessario creare una pagina `board-preview.html` isolata per mostrare lo scenario senza NPC.
3. Aggiungere asset grafici originali realmente separati: tetti, facciate, strade, cortili, oggetti, illuminazione; scene e silhouette devono essere all'altezza dell'immagine approvata, non semplici poligoni stilizzati.
4. Verificare in browser con screenshot **della build** (PC e telefono orizzontale, anche emulato se dichiarato), verificando scala, densità e continuità della mappa. Confronto side-by-side con l'immagine approvata.
5. Soltanto **quando la plancia sarà approvata dall'utente**, riprendere movimento NPC e meccaniche. Non modificare il modello economico o la IA per ottenere un'immagine più bella; separare la grafica dal gameplay.

## Test e criterio di accettazione: PLANCIA ALPHA
- [ ] All'apertura della preview/game si vede un quartiere **riconoscibile come la reference** al primo sguardo: densità di palazzi, materiali, illuminazione e grandezza degli edifici coerenti.
- [ ] Mappa almeno 2×2 rispetto alla finestra concept e scorribile senza buchi o cuciture visibili. Preferenza 3×3 settori collegati.
- [ ] Nessun clone evidente dei palazzi, strade che si prolungano realmente, assenza di strade a scacchiera.
- [ ] 15 edifici gameplay preesistenti possono convivere con **molti più edifici decorativi**, senza introdurre collisioni illegali. I numeri finali saranno decisi dopo la definizione della plancia.
- [ ] Elementi modulari separati, prospettiva e livello di profondità coerenti.
- [ ] Preview landscape fullscreen su Android e desktop, HUD fermo, camera drag/zoom/minimappa funzionanti.
- [ ] Screenshot reali della plancia confrontati con originale ChatGPT; esiti e differenze nel WORKLOG.

**Non segnare “COMPLETATO” né “PLANCIA APPROVATA” per un mockup generato o un file HTML che si apre:** la preview può essere temporaneamente una resa di riferimento, ma la plancia di gioco finale dev'essere modulare e utilizzabile. L'automazione oraria resta attiva fino ai criteri finali, salvo richiesta esplicita diversa.

## Nota su ulteriori proposte ImageGen
Dopo l'approvazione della reference originale, la conversazione può contenere altre immagini generated che mostrano espansioni o UI differenti. **Sono studi non approvati finché l'utente non li conferma espressamente**: non sostituiscono automaticamente il target identificato dal file originale `distretto_five_points_new_york_1860.png`. In particolare la miniatura caricata in `assets/references/` resta l'ancora compositiva della plancia approvata.
