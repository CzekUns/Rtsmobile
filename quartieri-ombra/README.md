## Comandi touch aggiornati — LAB WebGL (6 novembre 2026)

Nella pagina [street-webgl.html](street-webgl.html) una nuova **levetta analogica in basso a sinistra** sposta la telecamera e il punto osservato lungo le strade; il movimento è relativo alla direzione dello sguardo, non agli assi globali. Il joystick è indipendente dal canvas: usa il pollice sinistro per camminare nella mappa e un dito sulla parte destra dello schermo per ruotare. Pizzica sul canvas per lo zoom, oppure usa i cursori Quota e Zoom. Il joystick include zona morta, movimento proporzionale, cattura del puntatore e stop al rilascio. Il suo bordo inferiore segue l'altezza effettiva dell'HUD, anche quando i comandi vanno a capo. Il tasto 255° resta disponibile. I palazzi e la logica di gioco non sono stati modificati; mobile Android reale ancora da verificare.

## LAB WEBGL — camera ad altezza lampione (6 novembre 2026)

Nuova prova autonoma: [street-webgl.html](street-webgl.html). Il motore del gioco pubblicato non viene sostituito e gli asset ImageGen/SVG precedenti rimangono conservati. Il LAB WebGL usa **Three.js r187 (MIT, caricato con import map CDN bloccata a 0.187.0)** e il modello reale di `QOBoardWorld.generate(1860)`. I sei edifici di Cross Street hanno geometria esplicita da quattro vertici a terra e altezze reali; fino a 32 palazzi confinanti assicurano un test di occlusione realistico.

- La profondità usa il **depth buffer WebGL**, non il painter sorting dell'esperimento SVG: 255° non richiede un riordinamento manuale delle facciate.
- Telecamera prospettica quasi stradale (quota iniziale 27), drag per orbita, due dita/rotella per zoom, due dita/pulsante destro per spostarsi, slider quota/distanza, pulsanti +90° e **255°**.
- Raycasting di pareti/tetti per selezionare i lotti esatti; selezione evidenziata. Dettagli geometrici semplificati (finestre, cornici, ingressi, lampioni), disattivabili per separare struttura ed estetica.
- **Nessun asset 2D** disegnato nella nuova vista e nessuna modifica ai poligoni, a NPC/economia o alla plancia originale. LAB SVG storico ancora raggiungibile.
- Serve browser con WebGL2 e connessione al CDN per il caricamento della libreria; il LAB non è funzionante offline. La resa su Android reale e le prestazioni da smartphone non sono ancora certificate.

Questo è il test tecnico della telecamera e delle occlusioni, non un'anteprima grafica definitiva.

## LAB 3D · esperimento camera ad altezza lampione (6 novembre 2026)

Aprire `street-vector-camera.html` o il pulsante **LAB 3D** dalla plancia. Esperimento indipendente che utilizza i sei lotti veri di Cross Street (`2,3,4,9,10,11`) tramite `QOBoardWorld`, costruisce volumi, tetti e finestre vettoriali in 3D e li proietta in prospettiva con telecamera orbitale. Controlli: trascina per ruotare, pizzica/rotella per zoom, slider per quota e distanza, pulsante 90°. Asset ImageGen e gameplay precedenti **immutati**. Il rendering SVG è volutamente minimale e il painter sorting non sostituisce il depth buffer di un futuro renderer WebGL; è un test di visuale e interazione, non arte definitiva.

## Esperimento SVG 3D a quota lampione (6 novembre 2026)

Gli asset ImageGen e la plancia precedente sono **parcheggiati, non cancellati**. Il nuovo [laboratorio vettoriale](street-vector-lab.html) usa i lotti reali di `board-world.js` con camera prospettica a quota lampione (39 unità iniziali), rotazione a 360°, zoom, spostamento, selezione degli edifici e pulsante di prova **255°**. I palazzi e i dettagli delle facciate sono costruiti tramite geometria e SVG, non da raster. Nessun file del gioco esistente viene sostituito.

Questa pagina è **sperimentale**, non un risultato artistico approvato: il backface culling e il depth sorting limitano le sovrapposizioni errate, ma il solo ordinamento SVG per profondità non garantisce ogni possibile occlusione complessa. Restano verifiche browser/mobile e qualità dei dettagli architettonici.

## Correzione geometrica V2: margine della guida SVG

La guida di ImageGen `cross-street-block-2-skeleton.svg` esporta i vertici con **24 unità di margine extra** intorno a `chunk.frame`. Il primo tentativo posizionava il gruppo usando gli offset dell'SVG senza rimuovere quel margine, causando uno spostamento sistematico dell'asset. Nel nuovo `?artAudit=v2align` la posizione viene normalizzata correttamente al frame `block-2` e si applica soltanto una lieve correzione residua di prospettiva. `v2fit` resta invariata per il confronto e le hitbox del motore restano originali. È ancora una preview da approvare, non il sostituto definitivo degli edifici.

## Nuovo confronto visivo Cross Street: calibrazione progressiva

Lo screenshot di audit V2 ha mostrato che i tetti sono sfalsati in misura diversa lungo la fila. Il test `?artAudit=v2align` applica **solo alla macro-illustrazione diagnostica** una correzione affine progressiva, con il punto destro immobile; la geometria delle hitbox NON cambia. Usare `?artAudit=v2fit` per il prima e `?artAudit=v2align` per il dopo; `?artAudit=v2alignclean` nasconde gli overlay e `?artAudit=v2alignclip` prova il ritaglio per lotti. Non sono asset runtime definitivi; le pareti e i tetti centrali richiedono ulteriore verifica e, probabilmente, illustrazioni prodotte sui sei volumi separati.

## ImageGen: input vincolato alla vera geometria (2026-11-05)

Lo screenshot con linee azzurre sovrapposte a una bozza NON è una reference affidabile: l'asset nasce con angolo e fronti diversi. Prima di rigenerare il blocco Cross Street, **allegare materialmente a ImageGen** la [reference dei sei volumi](assets/guides/cross-street-block-2-imagegen-input.svg) (1332×1160, trasparente), e mantenere separata la [maschera alpha deterministica](assets/guides/cross-street-block-2-alpha-master.svg). Il motore decide ingombri, tetti, pareti, hitbox e strade; ImageGen si occupa solo dei materiali e dei dettagli. Procedura esatta: [workflow ImageGen](assets/guides/CROSS_STREET_IMAGEGEN_WORKFLOW.md).

Questa è una guida di produzione, **non** un nuovo asset art approvato. Nessun cambio al `chunk-index.json` finché non passa il confronto in browser.

# Quartieri d'Ombra — RTS di controllo territoriale

## Ripristino asset Cross Street nel test (?artAudit=1)

Correzione della regressione visiva: il link storico `board-preview.html?artAudit=1` deve mostrare **la vera immagine WebP di sei palazzi** (`assets/runtime/chunks/block-2-draft-audit.webp`), non sostituirla automaticamente con la guida SVG. L'asset resta una bozza **NON ALLINEATA / NON APPROVATA**, ma è indispensabile poterlo vedere per confrontare gli errori. In questa sola modalità diagnostica l'immagine è disegnata tutta intera anziché mascherata dalle sei silhouette non corrispondenti.

- `?artAudit=1`: PNG/WebP ImageGen esistente + guide e hitbox sopra.
- `?artAudit=clean`: stesso artwork originale, senza guide.
- `?artAudit=study` o `?artAudit=fixed`: studio SVG costruito sulle quote reali, per confronto delle geometrie.
- La vera produzione continua a usare la maschera per edificio per i **futuri asset conformi** allo scheletro.

I file originali e il catalogo di produzione non sono cambiati.

## Fix Cross Street: hitbox visibili e profondità dei macro-blocchi (5 novembre 2026)

La plancia disegna ora ciascun lotto contenuto in una macro-immagine tramite la sagoma volumetrica vettoriale del proprio edificio; la profondità viene ordinata **per edificio**, non più per intero blocco. I contorni di selezione e le guide diagnostiche vengono occultati dagli edifici realmente davanti. La modalità audit usa numeri sui tetti e nasconde inizialmente i segnalini per facilitare il controllo.

- `board-preview.html?artAudit=study` o `?artAudit=fixed`: test geometry-locked **con studio SVG**, non ancora art ImageGen finale.
- `board-preview.html?artAudit=1` o `?artAudit=draft`: immagine ImageGen **non allineata ma visibile per intero**, con overlay diagnostico.
- `board-preview.html?artAudit=clean`: stessa bozza non allineata, senza overlay di audit.

Il risultato richiede ancora screenshot desktop/Android e un macro-raster ImageGen realmente conforme allo scheletro: **nessuna promozione dell'asset non allineato in produzione**.

## Nuova architettura grafica: blueprint + immagini di isolati

La nuova versione separa **scheletro vettoriale e hitbox** (`board-skeleton.js`) dalla **grafica per gruppi di palazzi** (`board-chunks.js`). È possibile premere **SCHELETRO** per vedere i contorni esatti dei 454 lotti e i fronti strada; **SEGNALINI** per distinguere abitazioni da attività; **GUIDA SVG** per esportare la porzione selezionata e utilizzarla come reference di produzione artistica. Toccare un edificio evidenzia il suo tetto e le sue facciate, anche se in futuro più lotti useranno un'unica illustrazione. La strada è selezionabile separatamente. Lo zoom arriva a **7,5×** mantenendo le geometrie esatte.

Il catalogo [assets/chunk-index.json](assets/chunk-index.json) contiene 117 porzioni grafiche e i posti per tre risoluzioni (`base/detail/ultra`). Le immagini di gruppo non sono ancora state generate e validate, quindi gli slot restano vuoti e l'aspetto della preview è parzialmente vettoriale. L'anteprima ha già il codice per caricare automaticamente le versioni WebP che saranno davvero presenti nel catalogo e per preservare le hitbox indipendenti. Primo gruppo pronto per ImageGen: [guida tecnica Cross Street](assets/guides/cross-street-block-2-skeleton.svg), sei edifici continui. Istruzioni e limiti tecnici: [THREE_LAYER_MAP.md](THREE_LAYER_MAP.md).


## Blocchi edilizi continui — versione sperimentale

È in corso la correzione dell'effetto “figurine”: i palazzi vicini vengono riconosciuti come **file di edifici** anziché immagini isolate, con fronti rivolti alla stessa strada e raccordi di fondazione, tetto e muratura. Questa prima versione crea 337 connessioni geometriche tra lotti; lo sprite PNG viene agganciato alla facciata e applicato soltanto dove la prospettiva di origine è compatibile. Nelle altre angolazioni resta il vettoriale temporaneo.

La specifica dei nuovi moduli originali — `left/middle/right/corner`, basi, vicoli e orientamenti — è in [BLOCK_ASSET_SPEC.md](BLOCK_ASSET_SPEC.md). Restano da produrre e integrare asset realmente continui; le giunzioni attuali non certificano il risultato visivo senza screenshot. **Lavoro NPC ancora sospeso.**


## Plancia 3×3 — prima build realmente esplorabile

**Nuova anteprima:** [board-preview.html](board-preview.html) · URL prevista su Pages: https://czekuns.github.io/Rtsmobile/quartieri-ombra/board-preview.html

Il sistema disegna 9 settori continui (2700×2100), 21 strade e 454 edifici individuali con geometrie differenti, 212 props e cache di sprite Canvas separati. Non usa un unico fondale ImageGen. La camera si muove con il dito/mouse, due dita o rotella regolano lo zoom; minimappa cliccabile, selezione edificio, fullscreen e modalità orizzontale sono presenti. Il vecchio RTS è ancora apribile con il pulsante **ALPHA** senza modificare gli NPC.

**Stato:** versione tecnica iniziale, non ancora all'altezza dell'immagine approvata. Non è un rilievo cartografico fedele dei Five Points storici; tracciati/asset da perfezionare. Test V8 mock passati, ma non verificata nel browser pubblico o su Android reale. Serve valutazione della plancia prima di tornare alle meccaniche.


## Direzione definitiva della plancia

L'utente ha approvato il concept ImageGen *Five Points District — New York c.1860* come riferimento **esatto** della plancia. La mappa finale dovrà estendersi ben oltre la finestra mostrata (minimo 2×2, ambizione 3×3 settori continui), preservando scala, densità, case in mattoni, negozi, fango, lampioni, carrozze, tetti e incroci irregolari. Il lavoro NPC è **sospeso su richiesta dell'utente** fino all'approvazione della plancia, senza rimuovere il codice già prodotto. Specifica autoritativa: [BOARD_MASTER.md](BOARD_MASTER.md). Anteprima effettivamente conservata: [assets/references/approved_five_points_board_preview.webp](assets/references/approved_five_points_board_preview.webp). È una miniatura 160×90, non l'immagine originale.


**Titolo provvisorio.** Piccolo RTS HTML5 originale in una città industriale ottocentesca immaginaria. Estetica finale vincolante: strategico isometrico 2D, cupo, 1998–2003.

## Ricerca storico-grafica
La direzione grafica usa la New York dei Five Points attorno al 1853 come reference storica. Sono disponibili [VISUAL_RESEARCH.md](VISUAL_RESEARCH.md) (fonti, reference inviate dall'utente, architettura e licenze) e [ART_DIRECTION.md](ART_DIRECTION.md) (stile RTS 1998–2003 approvato). Gli edifici attuali sono ancora una semplificazione artistica e non una ricostruzione cartografica verificata.

## Gioco
Avvio diretto da `index.html` senza compilazione o dipendenze esterne. Scegli difficoltà, controlla il clan con un edificio residenziale e un gendarme. Le case producono reclute spontanee se fedeli; i produttivi accumulano oro da riscuotere con esattori; i mercenari sono acquistabili. Gendarmi fermi influenzano edifici vicini, con efficacia legata al livello e distanza; gli assalti sono una via alternativa.

## Controlli di visualizzazione
- **Smartphone:** ruota il dispositivo in orizzontale prima di iniziare; in verticale compare una schermata che blocca la partita.
- **Schermo intero:** tocca il pulsante `⛶` nella barra in alto. Il blocco hardware in orizzontale è richiesto quando consentito dal browser; su alcuni dispositivi non è disponibile.
- **Mappa:** trascina direttamente il campo di gioco per spostare la visuale, usa due dita per zoom. Il resto della UI (comandi, punteggio, minimappa) non deve più seguire il trascinamento.
- **Fisso nel display:** il gioco evita lo scorrimento del documento; la mappa occupa lo spazio che rimane tra barra alta e pannello comandi.
- **In attesa di collaudo:** compatibilità fullscreen/orientamento e overflow responsive su dispositivi Android reali.

## Pubblicazione prevista
https://czekuns.github.io/Rtsmobile/quartieri-ombra/

Il repository pubblica la root `main` tramite GitHub Pages. La URL è il percorso previsto, **non ancora verificato in browser** al primo upload.

## Stato
Build tecnica iniziale presente, non ancora collaudata né con asset definitivi. La grafica Canvas attuale è un placeholder programmato: **non equivale** al mockup isometrico anni 90/2000 approvato. La corrispondenza estetica resta un obiettivo prioritario di ROADMAP.md.

## Worker
Task orario separato: `6aeae2b713b0819184a4bc340c5a0ae6`; esecuzione ogni ora fino alla Definition of Done. Ogni sessione deve produrre lavoro reale verificato e annotato.

## Lavori isolati
**Unico path consentito:** `quartieri-ombra/`. Non alterare i giochi pubblicati alla root, in `ver-sacrum-7k/`, `seven-kingdoms-html/` né i workflow globali.

## Documenti
- `AGENTS.md` — regole obbligatorie per agenti/worker
- `SPEC.md` — meccaniche e direzione grafica approvate
- `ROADMAP.md` — milestone e criteri di conclusione
- `WORKLOG.md` — registro delle iterazioni
