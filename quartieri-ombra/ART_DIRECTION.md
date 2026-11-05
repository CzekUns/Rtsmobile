## Esperimento non ancora approvato (6 novembre 2026)

La reference isometrica rimane vincolante per il gioco pubblicato; su richiesta dell'utente si sperimenta in una pagina autonoma una camera a quota lampione con geometria vettoriale 3D proiettata in SVG e zoom. Validare in particolare la rotazione a 255°, le facciate e il mobile prima di valutare la sostituzione della plancia. Evitare pattern generici ripetuti; costruire dettagli architettonici deterministici per facciata.

# Direzione artistica APPROVATA — Quartieri d'Ombra

## SUPREMAZIA NUOVA REFERENCE PLANCIA — 2026-11-04

**NUOVA APPROVAZIONE ESPLICITA E VINCOLANTE:** il concept ImageGen denominato *DISTRETTO FIVE POINTS — NEW YORK c.1860* (originale 1672×941 allegato nella chat) è stato dichiarato dall'utente «esattamente quello che volevo». **Per plancia/mappa/architettura questa immagine è ora la golden reference prioritaria, prevale su descrizioni precedenti in caso di conflitto**; resta valida l'intenzione RTS isometrico 1998–2003. Vedi [BOARD_MASTER.md](BOARD_MASTER.md) per target, scala, estensione 2×2 o meglio 3×3 settori, modalità di lavoro e test.

La reference è **una finestra sulla mappa**, NON tutta la mappa: città più grande, strade e edifici proseguono senza bordi o ripetizioni. Non limitarsi a inserire l'immagine come fondale; costruire strutture originali modulari, vista camera drag/zoom, profondità, mini-mappa. In questa fase **sospendere l'evoluzione degli NPC**, il loro pathfinding e le nuove meccaniche: priorità esclusiva al mondo visivo e alla preview della plancia. Miniatura verificabile in repo: `assets/references/approved_five_points_board_preview.webp` (160×90, **non** originale HQ). Non dichiarare di aver caricato l'originale in repo.


**Stato: APPROVATA dall'utente in chat ("Bingo") il 4 novembre 2026.**
Questa specifica è VINCOLANTE per gli agenti e il worker orario. In caso di divergenza visiva tra una proposta illustrativa e questa scheda, prevale questa scheda.

## Golden reference: schermata IN-GAME generata dopo richiesta "Più old style anni 90/2000"
La reference approvata è il concept di interfaccia isometrica RTS 2D della conversazione, con queste caratteristiche visibili:
- schermata gameplay principale in stile strategico PC tardi anni '90 / primi 2000; non poster, non cinema, non fotorealismo
- campo di gioco ambientato in un quartiere povero ottocentesco: casa/taverna con insegna, edifici ravvicinati, fango, mattoni e vicoli, personaggi molto piccoli e numerosi leggibili dall'alto
- sprite 2D a bassa risoluzione deliberata, pixel art dettagliata o prerender raster; edifici coerenti nella prospettiva isometrica, senza visioni cinematografiche ad altezza uomo
- interfaccia strategica 'vecchia scuola': barra superiore con oro, popolazione, fedeltà; minimappa in basso a sinistra; selezione gendarme con ritratto e statistiche in basso; pulsanti grandi con bordi metallo/legno in pannello inferiore
- segnalazione di controllo territoriale mediante contorni o aree trasparenti verdi/rosse/neutre; cerchi di selezione discreti attorno alle unità, bande riconoscibili
- anche una scheda di edifici residenziali/produttivi e unità (gendarme e mercenario), ma nello stile sprite del GIOCO, non illustrazioni da character sheet

## Cosa NON è stato approvato come grafica finale
- I primi key art cinematici, edifici isolati ad altissimo dettaglio e character sheet illustrati servivano solo per mood e idea del mondo; NON sono reference dello stile tecnico finale.
- Anche la successiva schermata con UI sofisticata e architettura semi-fotorealistica è stata corretta dall'utente: voleva un aspetto PIÙ OLD STYLE anni 90/2000.
- La prima build Canvas programmata nella cartella è un placeholder funzionale. NON è l'estetica definitiva.

## Parametri tecnici prescrittivi
- Prospettiva: isometrica ortografica coerente ~2:1 (o equivalente visivo senza prospettiva 3D), su base 2D sprite/tile.
- Scala: occupazione visiva prevalente del quartiere; gendarmi e mercenari piccoli rispetto alle case; non usare grossi personaggi in primo piano.
- Colore: carbone, marroni sporchi, ruggine, grigio nebbia, ambra lanterne; accent color territoriali limitati a overlay/selection/UI (verde e rosso scuri, grigio pietra neutrali).
- Texture: terreno fangoso, mattoni deteriorati, lastricato rotto, tegole invecchiate, legni consunti, fumo discreto. Luce morbida cupa; niente bloom moderno.
- Interfaccia: pannelli scuri a cornice classica, icone leggibili, testi ridotti, tipografia atmosferica ma fruibile a 720p e su Android; minimappa stabile e pannello contestuale selezione edifici/unità.
- Tecnica artistica: creare sprite/texture ORIGINALI per pezzi distinti, in atlas o file separati e con licenze tracciate, evitando ritagli indiscriminati dai mockup o immagini di film.

## Criterio di accettazione visiva (PASS/FAIL)
1. Uno screenshot preso dal gioco vero sembra a colpo d'occhio uno RTS PC uscito tra il 1998 e il 2003, non un gestionale HTML moderno o un diorama ultra-realistico.
2. Il quartiere riempie il campo di gioco, gli edifici sono compatti e gli uomini hanno scala chiaramente inferiore.
3. Un gendarme, un mercenario, un residenziale e un produttivo sono immediatamente riconoscibili.
4. Un pannello contestuale, una minimappa e indicatori di fedeltà/possesso esistono e sono leggibili; HUD coerente vecchia scuola.
5. La cupa atmosfera di sobborgo industriale ottocentesco è evidente; gameplay leggibile nonostante l'oscurità.
6. Asset riutilizzabili e sostituibili, non un'unica immagine statica che finge di essere il gioco.
7. Eseguire confronto screenshot reale/reference prima di marcare Fase 3 completata.

**Nota di tracciabilità:** il PNG originale della schermata approvata è allegato nella conversazione ChatGPT; NON è ancora caricato come file binario nella repository. Non dichiarare che lo screenshot sia presente su GitHub. I dettagli sopra sono la trascrizione vincolante del riferimento visivo.

## Reference fotografiche inviate dall'utente — 2026-11-04

Sono state mostrate tre schermate di risultati Google Immagini per «new york 1860», tra cui una fotografia ripubblicata da History101.NYC. Usarle **soltanto come guida a forme urbane generali** (facciate 3–5 piani, negozi al pianterreno, cornicioni, tende, vetrine, tram/carrozze, densità). Non sono fotografie verificate del quartiere Five Points, né è dimostrata la datazione esatta di ciascun risultato. Scene di Broadway e arterie ordinate non devono diventare automaticamente il modello di Five Points.

Questa raccolta integra ma NON sostituisce la golden reference RTS 1998–2003. La fonte topografica prioritaria resta William Perris (1853, vol. 3, plate 25), da confrontare anche con il materiale d'epoca locale. OSM attuale solo per l'orientamento geografico.

**Documento operativo dettagliato:** [VISUAL_RESEARCH.md](VISUAL_RESEARCH.md): fonti, cosa estrarre, cosa NON copiare, priorità della ricostruzione e licenze. Non importare immagini da Google né fotogrammi cinematografici come sprite senza diritti; gli asset devono essere originali.

