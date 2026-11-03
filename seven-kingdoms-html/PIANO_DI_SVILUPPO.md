# PIANO DI SVILUPPO — Seven Kingdoms HTML Edition

> **Piano maestro v1.0 · 3 novembre 2026 · Repository: `CzekUns/Rtsmobile` · Directory: `seven-kingdoms-html/`.**
>
> **MISSIONE:** riscrivere progressivamente **Seven Kingdoms: Ancient Adversaries (7KAA)** in HTML/CSS/JavaScript nativo, SENZA riutilizzare il motore di Ver Sacrum e SENZA WebAssembly nel runtime finale. Prima fedeltà al gioco originale, poi le mod e le migliorie richieste.
>
> **Questo documento è una pianificazione, non l'indicazione che i lavori futuri siano già stati eseguiti o programmati automaticamente.** Il codice della prima demo esiste, ma la conversione completa è ancora lontana. Le date sono **stime** di lavoro, da ricalibrare dopo F00–F02 e a ogni gate.

## 0. Come si legge e come va aggiornato

- **P0** = necessario per una versione originale realmente giocabile; **P1** = importante per completezza e qualità; **P2** = miglioramento successivo.
- **Stato:** `[x]` verificato/terminato; `[~]` esiste solo una demo o una parte, NON equivale alla parità; `[ ]` da fare; `[!]` blocco o verifica necessaria.
- **Gate G0–G12:** una fase è "conclusa" soltanto quando tutte le prove dichiarate sono passate, inclusa la prova visiva degli sprite quando applicabile.
- **Dipendenze:** F01 precede la sostituzione della grafica; F03 precede logiche che usano pathfinding e mappe grandi; F04 e F05 precedono AI e guerre credibili; F10 è il cancello che impedisce alle mod di alterare la base originale.
- **Unità di programmazione:** tranche di 2 settimane; revisione e ricalibrazione dopo ogni gate. Assunzione puramente organizzativa: uno sviluppatore principale, AI come assistenza e supporto grafico su richiesta. Il volume del porting può richiedere sensibilmente più tempo; NON è una consegna garantita.
- **Priorità di verifica:** prima confronto con il codice e la build originale, poi con la versione MOD. Se i due si discostano, documentare e distinguere **originale**, **mod** e **scelta nuova**.
- **Attività corrente consigliata:** F00 + preparazione F01. Non aggiungere funzioni casuali a `rules.js` prima di avere la specifica sorgente e i test di confronto.

## 1. Stato reale alla data del piano

### Disponibile nella demo JavaScript

- [~] Schermata orizzontale 800×600 con mappa grande a sinistra, minimappa a destra, barra risorse e rapporti; la somiglianza geometrica **non** implica ancora parità pixel-perfect.
- [~] Moduli `rules.js`, `view.js`, `game.js` totalmente JS e separati da `ver-sacrum-7k/`.
- [~] Scenario dimostrativo con due regni e villaggi indipendenti; camera, tocco, zoom e comandi.
- [~] Tasse, sussidi, reclutamento, fedeltà e alimentazione: **alcune costanti/formule vengono dal sorgente 7KAA**; modello demografico, condizioni e molte azioni restano semplificati.
- [~] Sei tipi di edifici e filiera aggregata miniera→fabbrica→mercato: **non** è l'economia originale 7KAA.
- [~] Salvataggio locale autonomo, test iniziali e `PORTING_MAP.md`.
- [ ] Sprite, terreni, interfacce, suoni e scenario completo originali integrati in HTML.
- [ ] Combattimento, assedi, pathfinding, IA reale, spie, diplomazia completa, carovane, salvataggi compatibili con 7KAA e tutte le civiltà.
- [!] Verificare sul dispositivo reale layout, fullscreen, UI orizzontale e performance; i test sintattici non sono un collaudo mobile.

### Fonte di verità e separazione

1. **Seven Kingdoms originale:** sorgenti GPLv2 del progetto 7kfans / 7kaa, versione di riferimento corrispondente alla build già in uso. Individuare e fissare **commit e versione esatti** nel gate G0.
2. **Seven Kingdoms browser WebAssembly:** `CzekUns/sevenkindomsmobile`, ramo principale e `mod/`. Va usato come **testimone funzionante**, non spacciato per il motore JS.
3. **Questa nuova riscrittura:** `CzekUns/Rtsmobile/seven-kingdoms-html/`; futura repo autonoma possibile senza cambiare le regole.
4. **Ver Sacrum:** altro gioco; non incorporare sue entità, economy o sprite nel port.
5. **Licenze:** il codice e i dati originali sono indicati come GPLv2 nella repository di riferimento; verificare singolo pacchetto e fonte. **Musica distinta** (`COPYING-Music.txt`) e **marchio Seven Kingdoms** di Enlight: non supporre che tutto sia libero da vincoli.

## 2. Calendario di lavoro proposto

**Inizio amministrativo:** lunedì 9 novembre 2026. Le scadenze seguenti sono **finestre orientative** (orizzonte fino all'autunno 2028, incertezza alta), non lavori pianificati in esecuzione automatica. Se aumenta il numero di collaboratori, ricalcolare solo dopo un audit concreto della capacità del team.

| Fase | Finestra proposta | Prio | Obiettivo | Deliverable | Verifica d'uscita |
|---|---|---|---|---|---|
| F00 | 09 nov 2026 – 22 nov 2026 | P0 | Audit, baseline e architettura | Inventario 7KAA; screenshot di riferimento; test e licenze; definire engine separato | G0: scenario base documentato e test eseguibili |
| F01 | 23 nov 2026 – 20 dic 2026 | P0 | Asset pipeline e dati originali | Decodifica risorse/SPR; manifest atlas; nation/unit/firm IDs; viewer animazioni | G1: rendering di una unità e un villaggio ORIGINALI con frame reali |
| F02 | 21 dic 2026 – 31 gen 2027 | P0 | Interfaccia e input Seven Kingdoms | HUD 800×600 fedele; pannelli; ordini mouse/touch; minimappa; menu/salva | G2: stessi comandi principali dell'originale, desktop e Android landscape |
| F03 | 01 feb 2027 – 28 mar 2027 | P0 | Mondo, mappa, salvataggi e determinismo | Mappe, terreno, ostacoli, coordinate, generazione, eventi, save versionati | G3: mappa riproducibile e partita ricaricabile senza cambiare stato |
| F04 | 29 mar 2027 – 23 mag 2027 | P0 | Villaggi, razze, popolazione e forti | Etnie, fedeltà, resistenza, tasse, sussidi, reclutamento, formazione, collegamenti | G4: scenari villaggio/forte confrontati con build originale |
| F05 | 24 mag 2027 – 18 lug 2027 | P0 | Edifici ed economia locale | Mine, factory, market, produzione e scorte fisiche, collegamenti, carovane | G5: ciclo completo materia prima→prodotto→vendita realmente trasportato |
| F06 | 19 lug 2027 – 26 set 2027 | P0 | Unità, pathfinding e combattimento | Squadre, 8 direzioni, ostacoli, attacchi, difese, catture, assedi, formazione | G6: battaglia deterministica confrontata su scenario originale |
| F07 | 27 set 2027 – 05 dic 2027 | P0 | Regni, diplomazia, spie e AI | Relazioni, trattati, reputazione, spionaggio, IA economica e militare | G7: partita di 2 regni autonomi fino a condizione di vittoria/sconfitta |
| F08 | 06 dic 2027 – 13 feb 2028 | P1 | Ricerca, popoli, unità speciali, scenari | Tecnologia, capacità speciali, dei, Fryhtan, eventi, scenari/tutorial | G8: contenuti originali giocabili con asset originali corretti |
| F09 | 14 feb 2028 – 09 apr 2028 | P1 | Completamento asset originali e rifinitura | Atlas, animazioni, UI, effetti, audio autorizzato, coerenza e accessibilità | G9: asset originali indicizzati, senza placeholder sui sistemi base |
| F10 | 10 apr 2028 – 04 giu 2028 | P0 | Parità 7KAA, beta e stabilizzazione | Confronto partita, bilanciamento originale, regressioni, salvataggi, performance | G10: release core 1.0 accettata contro matrice di parità |
| F11 | 05 giu 2028 – 27 ago 2028 | P1 | Migrazione MOD già richiesta | Otto nuovi popoli, professioni persistenti, università, metropoli, nuovi edifici/merci | G11: MOD su toggle separato; versione originale non regressa |
| F12 | 28 ago 2028 – 05 nov 2028 | P1 | Migliorie mobili, polishing e release | Notifiche, code, mappa 400×400, joystick, UI responsive, QA sprite, rilascio | G12: build HTML stabile e documentata; mobile verificato |

### Rilasci e decisioni di prodotto

| Release | Gate | Valore reale per chi gioca |
|---|---|---|
| **0.1 tecnica** | G0–G1 | Carica dati/asset originali con motore JS, senza simulare Seven Kingdoms con placeholder |
| **0.2 vertical slice** | G2–G4 | Villaggio, reclutamento, forte e fedeltà con UI e calcoli confrontabili |
| **0.4 economica** | G5 | Miniere, mercati, fabbriche e carovane attive |
| **0.6 militare** | G6 | Campagna tattica locale, ordini e battaglie |
| **0.8 strategica** | G7–G9 | Regni autonomi, diplomazia, scenario e contenuti grafici originali |
| **1.0 Core Classic** | G10 | Set originale disponibile e sottoposto a confronto, prima delle mod |
| **1.1 Classic + MOD** | G11 | Estensioni richieste selezionabili, senza rompere il Core |
| **1.2 Mobile+** | G12 | Esperienza Android orizzontale, controlli e notifiche mature |

**Regola anti-deriva:** una demo con caselle, soldatini stilizzati o un'interfaccia simile non viene registrata come "Seven Kingdoms portato". Per ogni funzione servono riferimento C++, test e prova in gioco.

## 3. Backlog tecnico dettagliato

### F00 — Analisi e fondamenta, P0

- [ ] F00-01: fissare il commit/tag **esatto** dei sorgenti e la build WebAssembly usata nel confronto; creare registro versione + licenze.
- [ ] F00-02: inventariare C++ e archivi con tabella ID: nazioni, razze, unità, strutture, merci, abilità, comandi e condizioni di vittoria.
- [ ] F00-03: registrare screenshot/video **di proprietà del progetto** di menu principale, nuova partita, HUD, rapporto di città, forte, mercato, battaglia e schermate di diplomazia; PC e smartphone.
- [ ] F00-04: predisporre suite `node --test` + confronto visivo Browser/Playwright + workflow CI; separare unit/integration/e2e/performance.
- [ ] F00-05: creare esempi di partite di controllo con seed, risorse e sequenza di azioni replicabili; risultati del C++ come baseline.
- [ ] F00-06: verificare i test JS correnti e il loro limite: **passare un test inventato non prova la parità con l'originale**.
- [ ] F00-07: decidere struttura file: `core/`, `systems/`, `data/`, `assets/`, `ui/`, `tools/`, `tests/`. Smontare `rules.js` monolitico soltanto in refactor controllato.
- [ ] F00-08: documentare bug/decisioni con ID, commit, screenshot prima/dopo e stato, senza confondere core e mod.

### F01 — Importazione dati e asset, P0

- [ ] F01-01: verificare licenza e fonte dei pacchetti `SPRITE`, `RESOURCE`, `IMAGE`, `ENCYC`, audio e musica.
- [ ] F01-02: sviluppare/importare decoder per indici `ResourceIdx`, `STD.SET`, DBF `SPRITE`/`SACTION`/`SFRAME`, palette, trasparenze, mirror e punti di origine; fonti `ORESX.cpp`, `OSPRTRES.cpp`, `OSFRMRES.cpp`, `ODB.cpp`.
- [ ] F01-03: tool CLI di estrazione ripetibile: file originali → atlas + manifest JSON + checksum + anteprime GIF/WebP. Niente OCR.
- [ ] F01-04: definire dimensioni, pivot a terra, crop e collision mask per ogni sprite, non solo `image-width/height`.
- [ ] F01-05: prova di conversione completa per **una unità classica e un villaggio classico** con otto orientamenti/mirror, animazioni e colore di nazione corretto.
- [ ] F01-06: confronto a scale 1×/2× con il gioco originale, trasparenza e palette, niente bordi/ombre fantasmi.
- [ ] F01-07: generare inventario machine-readable degli asset importati e di quelli mancanti; mai attribuire numeri stimati ai frame senza leggere i dati.

### F02 — UI e controllo originale, P0

- [ ] F02-01: riprodurre esattamente proporzioni, bottoni, font, tab e posizioni a schermo del riferimento 800×600, **non una UI reinterpretata Ver Sacrum**.
- [ ] F02-02: HUD: regni, villaggi, economia, scambi, militari, tecnologia, spie, ranking, news; risorse e calendario originali.
- [ ] F02-03: pannello contestuale destra: città/edificio/unità con pulsanti specifici e accesso ai rapporti nativi.
- [ ] F02-04: click sx selezione, dx ordini, selezione multipla/riquadro, drag camera, edge scroll, scorciatoie tastiera coerenti.
- [ ] F02-05: mobile **orizzontale obbligatorio**; fullscreen ⛶ visibile; fallback se il browser nega orientation lock; gestione safe-area/notch e viewport Android.
- [ ] F02-06: smartphone: tasto **MOD** per simulare destro, drag di selezione, drag per collocazione edifici, pinch, zoom-reset e joystick mobile se necessario.
- [ ] F02-07: minimappa con 1×–4× separato dallo zoom della scena, panoramica e tocco di centratura; riferirsi ai controlli già implementati nel port WASM.
- [ ] F02-08: messaggi eventi più leggibili su mobile (righe ingrandite, tap intera riga), cronologia e pulsante "Vai all'evento".
- [ ] F02-09: accessibilità di tasti, HUD e indicatori selezionati, test 640×360, 800×360, 915×412 e 1280×720; nessun pannello tagliato.

### F03 — Mondo, regole di simulazione e salvataggi, P0

- [ ] F03-01: tile, biomi, acqua, coste, montagne, alberi, depositi, dimensioni oggetti, costruzioni e passabilità dal C++ originale.
- [ ] F03-02: mappa iniziale, generatore, seed deterministico, relazioni spaziali, confini e layer di collisione.
- [ ] F03-03: turni/tempo, scheduler degli eventi, code, tick coerente, pausa, velocità e limite anti-spike quando si torna in foreground.
- [ ] F03-04: identificativi persistenti, ownership, lifecycle, spawn/despawn e ordini; nessun ID riutilizzato dopo reload.
- [ ] F03-05: schema salvataggio versionato, migrazioni, export/import JSON, backup e recupero dei dati corrotti.
- [ ] F03-06: test 1.000+ tick, pausa/salvataggio/riapertura, seed ripetibile e determinismo con tempi di esecuzione variabili.
- [ ] F03-07: mappe 400×400 **solo come estensione**, in funzione dopo che le mappe base sono corrette.

### F04 — Città, razze, fedeltà, forte, P0

- [ ] F04-01: sostituire modello "un villaggio = una cultura" con popolazione multi-etnica, lavoratori, disoccupati e spie.
- [ ] F04-02: popolazione per razza, immigrazione, crescita, fame, capacità e rigenerazione.
- [ ] F04-03: **portare esattamente** `Town::collect_tax`, `reward`, `recruit` e relativi controlli, penalità e decay; attualmente solo avvio parziale.
- [ ] F04-04: fedeltà e resistenza per cultura, target loyalty, ripercussioni dei forti propri e nemici, rivolta, indipendenza e resa.
- [ ] F04-05: forti/camp originali: comandante, addestramento, morale, lavoratori, trasferimento e controllo villaggi.
- [ ] F04-06: reclutamento, uscita e ritorno unità con e senza skill, costo e validazione dello spazio intorno alla città.
- [ ] F04-07: AI dei neutrali e città miste, soglie vere dal C++; niente annessione "paga 100 e premi Unisci" se l'originale non la prevede.
- [ ] F04-08: test di parità per dieci scenari: tassazione ripetuta, sussidio, carestia, reclutamento, forte collegato, perdita forte, città mista, conquista, rivolta, salvataggio.

### F05 — Edifici e logistica/economia, P0

- [ ] F05-01: catalogo completo edifici ORIGINALI da `OFIRM*`; ingombri, costs, prerequisiti, stato di costruzione e distruzione.
- [ ] F05-02: costruzione progressiva con **costruttore fisicamente presente**, attraversamento valido, collisioni, finish event e animazione fasi.
- [ ] F05-03: miniere con giacimento, riserva esauribile, produttività, `stock_qty` e qualità dell'estrazione.
- [ ] F05-04: fabbriche e mercato con **inventari separati per merce**, limitazioni, prezzi, salari e capienze.
- [ ] F05-05: connessioni miniera–fabbrica–mercato–città originali, trasporto fisico; NON simulare magazzini globali istantanei.
- [ ] F05-06: carovane, rotte, carico/scarico, merci e carenza scorte.
- [ ] F05-07: locande, ricercatori, War Factory, porti e commercio navale quando presenti nel set originale verificato.
- [ ] F05-08: grafica di proprietà/colore di fazione uniforme per tutti gli edifici e le fasi di costruzione.
- [ ] F05-09: cicli E2E con edifici saturi, risorse mancanti, code sospese, distruzione, occupazione lavoratori e riavvio.

### F06 — Unità, combattimenti e guerra, P0

- [ ] F06-01: mappa attraversabile con ostacoli, passaggi stretti, riserva celle e pathfinding per unità e gruppi.
- [ ] F06-02: nessuna sovrapposizione fra unità o attraversamento illegale di edifici/terreno.
- [ ] F06-03: ordini originale: move, attack, defend, stop, patrol/guard dove previsti, gruppi, selezione, ripristino dopo reload.
- [ ] F06-04: animazione sprite 8 direzioni e timing M/GM/A1/A2/D/G/S, specchiamenti e ombre coerenti.
- [ ] F06-05: statistiche, XP, livello, leader/commander, armi, morale, danno, attacco ravvicinato/distanza, morte.
- [ ] F06-06: castelli/forti, assedi, catture, distruzioni, ritirata e difesa; formula originale.
- [ ] F06-07: unità ostili, mostri originali e casi marginali (ordine impossibile, bersaglio perso, animazione simultanea).
- [ ] F06-08: prove visive e numeriche su battaglie riproducibili C++/JS.

### F07 — Diplomazia, spionaggio e intelligenza artificiale, P0

- [ ] F07-01: rapporti fra regni, trattati, stato pace/guerra, contatti, messaggistica e accordi con esiti originali.
- [ ] F07-02: rapporti con popolazioni indipendenti, acquisizioni/influenza basate sul gioco originale.
- [ ] F07-03: agenti segreti: inserimento, dissimulazione, controspionaggio, azioni e rischio.
- [ ] F07-04: IA avversaria: priorità economiche, espansione, produzione, fortificazione, guerra, tregua, attacco e difesa.
- [ ] F07-05: eventi/messaggi con coordinate esatte e navigazione "vai a": mai inventare che una coda è terminata.
- [ ] F07-06: condizioni di vittoria/sconfitta e avvio/chiusura partita.
- [ ] F07-07: test 1 vs 1 e 1 vs multi con IA che gioca autonomamente senza stallo.

### F08–F10 — Completezza del gioco originale e collaudo

- [ ] F08-01: ricerca e albero tech originale, prerequisiti e progressione.
- [ ] F08-02: tutte le **nazioni/culture originali effettivamente presenti nei dati**, stili edifici, soldati, nomi e differenze.
- [ ] F08-03: unità speciali, divinità, Fryhtan e costruzioni/azioni pertinenti alla versione originale.
- [ ] F08-04: tutorial, scenari, parametri di nuova partita, bilanciamento, audio con provenienza lecita.
- [ ] F09-01: rimuovere i placeholder grafici soltanto dopo approvazione del sostituto per ogni gruppo.
- [ ] F09-02: controlli pixel-perfect, overlay dell'UI, colori di nazione, layering, ombre, step animazioni.
- [ ] F09-03: performance smartphone e browser, ricaricamento rapido, cache asset separata, salvataggi affidabili.
- [ ] F10-01: suite di **parità originale**: stesso input/scenario → stessa decisione di regole ed esito entro le tolleranze documentate.
- [ ] F10-02: QA giocata lunga, escalation performance, nessuna regressione nei salvataggi; changelog/versione.
- [ ] F10-03: dichiarare "Core Classic 1.0" solo dopo checklist 100% dei sistemi base e licenze validate.

## 4. Estensioni già desiderate — SOLO DOPO la fedeltà Core

**Branch/feature flag `classic` / `expanded`**: il gioco originale deve restare giocabile senza portarsi dietro le mod. Migrazione dei salvataggi separata; test regressione per ogni estensione. Provenienza delle richieste: `CzekUns/sevenkindomsmobile/README.md` e documenti della MOD.

### F11 — Mod funzionali, P1

- [ ] M11-01: **persone persistenti**: nome individuale, identità, abilità e professioni acquisite conservate durante ingresso/uscita dai villaggi.
- [ ] M11-02: lista "People with a name" nel villaggio, selezione, uscita individuale, interfaccia mobile adeguata.
- [ ] M11-03: **rinomina** di villaggi e unità (con salvataggio), attacco/difesa visibili.
- [ ] M11-04: **Grande Mercato 4×4**, 6 merci, scorte maggiorate e UI per tutte le merci.
- [ ] M11-05: **Università**: professore con skill ricerca più alta, studenti, addestramento, uscita e competenze; menu ricerca come Tower of Science.
- [ ] M11-06: **Mulino**: contadini con abilità Farming; crescita dei villaggi collegati +50% dopo confronto con MOD.
- [ ] M11-07: **Metropoli**: prerequisito tecnologico, costo 1.000 monete, capienza fino a 100, edificio residenziale → palazzo cultura-specifico.
- [ ] M11-08: **Falegnameria** boschiva, **Saline** costiere, materiali **legno/pietra/sale** e regole di disponibilità.
- [ ] M11-09: produzione in due stadi: Factory per semilavorati (lingotti, assi, argilla raffinata ecc.), **Fonderia** e **Vasellame** per manufatti.
- [ ] M11-10: **Casa stregata**: reclutamento Fryhtan, assegnazione al regno e addestramento nei dintorni.
- [ ] M11-11: **Seat of Power**: sacerdote che cura le unità ferite vicine.
- [ ] M11-12: nuovi edifici con **tinte di fazione complete e coerenti**, incluso tetto/parti distinte, senza alterare palette e leggibilità.
- [ ] M11-13: **otto nazionalità aggiuntive MOD**: Romani, Celti, Sanniti, Etruschi, Mongoli, Iberi, Babilonesi, Cartaginesi. Unità, abitati, nomi, troni/Seat of Power, divinità.
- [ ] M11-14: opzione **400×400** con numero di villaggi e covi proporzionato e verifica memoria/FPS; non usare la mappa grande come default finché il mobile non regge.

### F12 — Qualità della vita e mobile, P1–P2

- [ ] M12-01: avvisi grandi e leggibili: entrata nuovo regno, proposte diplomatiche, esiti, completamenti, cronologia navigabile.
- [ ] M12-02: eventi **construction-complete**, **production-queue-empty**, **training-queue-empty** emessi dal motore JS ai punti giusti; deduplicazione per ID, nessun falso positivo su annulla/sospendi/distruggi.
- [ ] M12-03: quando utile, notifiche locali/browser; **push a browser chiuso richiede infrastruttura e consenso**, non è garantito da GitHub Pages statico.
- [ ] M12-04: touch: MOD hold, joystick ai margini, pinza, drag corretto, zoom minimappa 1×–4×, reset zoom mappa, fullscreen orizzontale.
- [ ] M12-05: pannello e messaggi più grandi, target touch adeguati ma **senza stravolgere il layout originale**.
- [ ] M12-06: impostazioni prestazioni/qualità, sound toggle, export/import partita, telemetria locale solo opt-in.
- [ ] M12-07: AI e UX da valutare DOPO beta: autoassegnazioni facoltative, code lavoro, ordini multipli, tooltips, scorciatoie migliorate.
- [ ] M12-08: ordine di produzione e addestramento multi-elemento, conferma visiva e notifica di fine coda.

## 5. Registro asset grafici, suoni e strumenti da produrre

**Regola di produzione:** prima recuperare/convertire i file originali GPL corretti, poi **creare da zero solo ciò che manca**, riguarda le nuove MOD o è difettoso. Niente raster finto-SVG: per sprite pixel art usare frame PNG/WebP; per l'interfaccia, SVG nativi sono appropriati. Non generare sprite nuovi solo perché esistono dei segnaposto.

### Asset base, originali da inventariare e convertire

| ID | Asset | Azione | Priorità | Output verificabile | Pronto |
|---|---|---|---|---|---|
| A01 | Palette, indici, metadati, colori nazione | Convertire da file originali, mantenere ID | P0 / F01 | `assets/manifest.json` + palette/metadata | [ ] |
| A02 | Terreni: erba, bosco, acqua, coste, alture, rocce | Estrarre e costruire atlas terreno | P0 / F01–F03 | Atlas tile + autotiling + seam test | [ ] |
| A03 | Decori: alberi, giacimenti, ombre, animazioni ambientali | Estrarre, separare layer e collisioni | P0 / F01–F03 | Sprite con pivot + maschere | [ ] |
| A04 | Villaggi per ciascuna cultura originale, edifici interni e tetti | Estrarre varianti, condizioni e colori regno | P0 / F01–F04 | Sheet per cultura, anteprima e teste tint | [ ] |
| A05 | Unità originali civili e militari | Frame autentici per S/M/GM/G/A1/A2/D | P0 / F01–F06 | Atlas direzioni + pivots + preview | [ ] |
| A06 | Strutture classiche: forte, mercato, miniera, factory, inn, ricerca, war factory, porto ecc. | Verificare set originale e importare | P0 / F01–F05 | Atlas firm/variant/stato e colore nazione | [ ] |
| A07 | Carovane, navi, merci e icone dei carichi | Importare con animazioni e UI inventari | P0 / F05 | Atlas + icone + test logistica | [ ] |
| A08 | UI classica: barre, pulsanti, finestre, cursori, font e icone | Ricostruire nel rispetto delle licenze | P0 / F02–F09 | Schermate confronto 800×600, asset originali | [ ] |
| A09 | Effetti: colpi, frecce, morte, polvere, fumo, costruzione | Estrarre o riprodurre in JS dove equivalente | P0 / F05–F09 | FX atlas, sequenze e QA | [ ] |
| A10 | Dei e creature Fryhtan originali | Inventario e conversione in fase contenuti | P1 / F08–F09 | Sprite e animazioni originali | [ ] |
| A11 | Suoni, musiche, voce/avvisi | Verificare licenze separate, nessun caricamento cieco | P1 / F08–F09 | Registro licenze, file autorizzati, fallback muto | [ ] |
| A12 | Thumb/anteprime, help grafico, miniature cataloghi | Realizzare screenshot dal gioco e guide | P1 / F09–F12 | Manuale visivo, catalogo dei componenti | [ ] |

**Per ogni asset:** `asset_id`, `source_repo`, `source_path`, `source_commit`, `license`, `original_frame_count`, `distinct_frames`, `directions`, `pivot`, `offset`, `palette`, `target_path`, `conversion_tool`, `qa_status`. La quantità effettiva va calcolata dall'inventario, non ipotizzata.

### Asset MOD da creare o correggere

| ID | Asset / richiesta | Prio | Produzione prevista | Accettazione |
|---|---|---|---|---|
| AM01 | Otto **soldati delle nuove civiltà** | P1, F11 | Confronto stile originali, 8 orientamenti logici; cicli M e GM corretti | Non confondere frame dichiarati con pose realmente distinte |
| AM02 | Camminate oblique delle otto civiltà | P1, F11–F12 | Revisionare NE/SE/SW/NW, preferire specchiamento previsto dal motore ove corretto | Metodo approvato `seven-kingdoms-oblique-walk`; gate visivo GIF |
| AM03 | Restauro camminata classica M/GM | P1 | I sei frame delle nuove unità non devono rimanere A–B–C–C–B–A per tutte le direzioni | Ciclo originale fluido o approvato, senza pausa artificiale |
| AM04 | **Romani** come unità campione per diagonali | P1 | Recuperare GIF e confronto approvati; isolare gambe, traslare/ruotare senza deformare | Gamba esterna sempre davanti, nessun residuo sotto tunica |
| AM05 | Mongoli vista Est E/D2 e tutti direzione SE/D3 | P1 | Verifica 3/4 vs profilo, inversione delle gambe, NON alterare NW/D7 approvata | QA direzione per direzione in-game |
| AM06 | Otto case/culture addizionali | P1, F11 | Abitati, edifici, tetti e varianti di fazione | Colori uniformi e nessuna parte lasciata neutra per errore |
| AM07 | Otto Seat of Power + relativi dei | P1, F11 | Confrontare pacchetti MOD già presenti; integrare/ritoccare solo difetti | Animazioni, ombre, palette e dimensioni coerenti |
| AM08 | Palazzo metropoli e abitazioni 100 pop | P1, F11 | Set architetture specifiche per cultura e sostituzione grafica | Modello visivo dopo ricerca e upgrade |
| AM09 | Università, mulino, Grande Mercato 4×4 | P1, F11 | Stato costruzione, operativo e tint per civiltà | Texture/palette colorata bene in ogni variante |
| AM10 | Falegnameria, Saline, Fonderia, Vasellame, Casa stregata | P1, F11 | Sprite, animazione costruzione, produzione e prodotto finito | Ingombro, differenze regionali, palette |
| AM11 | Merci nuove: legno/pietra/sale/lingotti/assi/argilla/vasi/armi | P1, F11 | Icone UI, merci nei mercati, carichi carovane e inventari | Leggibili a risoluzione mobile |
| AM12 | Avvisi UI: costruito/finita coda/proposta diplomatica | P1, F12 | Icone eventi, notifiche, posizioni cliccabili | Identità, data e luogo dell'evento non inventati |
| AM13 | Comandi mobile (MOD, joystick, +/- minimappa, fullscreen, reset) | P1, F12 | Icone native/HTML adatte a touch e safe area | Non coprire interazione e canvas |
| AM14 | Ombre di contatto e offset di tutte le nuove unità | P1, F11–F12 | Omissioni/offset corretti, test rotazione/cammino | Niente scatti, piedi fluttuanti o trasparenze corrotte |

#### Regola grafica VINCOLANTE per i diagonali

1. Rileggere **`CzekUns/sevenkindomsmobile/skills/seven-kingdoms-oblique-walk/SKILL.md`** prima di lavorare su M/GM.
2. Conservare il busto, la tunica, armi/scudo e palette; mascherare separatamente due gambe, **senza scalarle**; eliminarne ogni residuo sotto l'orlo.
3. Traslare/ruotare le gambe rigide; inserire passo centrale; la **gamba esterna rimane SEMPRE sopra l'interna**, anche quando cambia quella avanzata.
4. Rispettare pivot e punto a terra; non trascinare l'ombra con il piede; preservare specchiamento originale; nessun artefatto.
5. La demo GIF approvata a 8 pose **NON** è automaticamente una animazione SFRAME valida a 6: adattare le pose e chiedere/registrare un nuovo controllo.
6. Ogni direzione deve consegnare `F01...FNN.png`, `preview.gif`, `preview-slow.gif`, `poses-A-center-B.png`, `masks-front-back.png` e `QA.md`; solo dopo integrazione e prova reale.
7. L'audit del 27/10/2026 segnala 6 frame M/GM per direzione delle 8 unità ma **solo 3 immagini distinte**: `docs/audit-nuovi-sprite-2026-10-27.md` nella repo originale. Gli attacchi e le morti non sono da rifare senza un'anomalia dimostrata.
8. Conservare NW già giudicata corretta finché un nuovo confronto non provi altro; per i Mongoli verificare separatamente E/D2. Non replicare alla cieca la correzione romana sugli altri corpi.

## 6. Matrice di collaudo (verifica obbligatoria per milestone)

| Test / caso | Aspettativa | Esecuzione |
|---|---|---|
| T01 — Ripartenza | ricarica riproduce seed, popolazione, costruzioni, ordini e code | Automated + browser |
| T02 — Tasse/sussidi | stessi calcoli, limitazioni e penalità del C++ su casi standard e ripetuti | JS unit + comparazione 7kaa |
| T03 — Popolazione multi-razziale | reclutamento, crescita, fedeltà e resistenza per etnia coincidono | Parità + scenario |
| T04 — Forte e villaggi | legami, addestramento, difesa e influenza senza scorciatoie | Integration + visuale |
| T05 — Filiera | minerale prodotto → trasportato → trasformato → venduto, quantità conservative | Integration |
| T06 — Pathfinding | unità non si compenetrano né passano negli ostacoli; nessun blocco permanente | E2E |
| T07 — Battaglia | HP, danno, attacco, cattura/ritirata secondo scenario deterministico | Parità 7kaa |
| T08 — AI | regno rivale compra, costruisce, difende e attacca senza crash | Soak test |
| T09 — UI 800×600 | componenti allineati e feedback come riferimento originale | Screenshot manuale |
| T10 — Touch Android landscape | selezione, MOD, riquadro, joystick, minimappa, pinch, fullscreen, zero overflow | Test dispositivo reale |
| T11 — Sprite | 8 direzioni logiche, frame corretti, occlusioni, pivot, ombre e tint | Atlas audit + GIF lenta + in-game |
| T12 — Economia 400×400 | stabilità memoria/camera, no congelamenti e ordini funzionanti | Profilo prestazioni |
| T13 — Notifiche | un evento reale produce una notifica; annulla non produce "completato" | Unit/E2E |
| T14 — Licenze | attribuzioni, provenienza, codec, audio e marchio verificati | Review documentale |
| T15 — Core vs MOD | la MOD non modifica il bilanciamento o asset del Core spento | Regressione |

**Soglie di qualità da validare in F00 sul dispositivo reale:** obiettivo iniziale 30 fps su telefono Android medio, niente blocchi input prolungati, canvas scalabile e memoria stabile dopo 30 minuti. Non dichiarare "ottimizzato" senza misurazioni.

## 7. Architettura obiettivo e regole di modifica

```text
seven-kingdoms-html/
├── index.html / style.css / game.js / rules.js / view.js  # fase attuale
├── README.md
├── PIANO_DI_SVILUPPO.md                                  # questo documento
├── PORTING_MAP.md                                        # mappa sorgenti C++ → JS
├── COPYING.txt
├── core/                 # tick, evento, seed, IDs, save / migration
├── systems/              # nation, town, firm, unit, battle, trade, spies, AI, tech
├── data/                 # dati originali convertiti con provenienza
├── assets/
│   ├── source-manifest.json
│   ├── originals/        # solo dopo controllo licenze e conversione
│   ├── mods/             # asset aggiuntivi con stato e review
│   └── previews/         # sheet, GIF, QA, manuale
├── tools/                # estrattori di sprite e generatori atlas
├── ui/                   # report, input, HUD e touch (opzionale dopo refactor)
└── tests/                # unit, integration, screenshots, parity, perf
```

- Separare **regole** da UI e rendering. Un evento deve avere ID, timestamp/giorno, tipo, dati completi e locazione mondo quando necessario.
- Nuovi sistemi devono essere modulari; preferire test prima di committare. Non manipolare direttamente un'immagine per simulare una regola di gameplay.
- Conservare file sorgente generativi e provenance dell'asset; niente "ho creato lo sprite" senza file effettivo e screenshot del test.
- Non comprimere il codice a tal punto da impedire ai collaboratori di capire cosa cambiare.
- PR piccole e tematiche; non riscrivere altri sistemi durante un fix artistico. Test previsti in CI e prova manuale su browser.
- Salvataggi `classic` e `expanded` esplicitamente versionati, con backup/migrazione; niente sovrascritture incompatibili.
- La richiesta **"identico a Seven Kingdoms"** si riferisce alla versione classica come riferimento prioritario; modifiche successive devono essere scelte consapevoli e isolabili.

## 8. Dipendenze, rischi e decisioni aperte

| Rischio | Impatto | Azione |
|---|---|---|
| Conversione degli archivi 7kaa sottostimata | Alto | Spike A01/A05 in F01, conteggi effettivi, proof-of-concept |
| Differenza tra dati classici e `mod/` | Alto | Manifest/versioni separati, confronto hash e ID |
| Sorgente C++ e build WASM non perfettamente allineati | Alto | Fissare commit e varianti al gate G0 |
| Numeri economici approssimati del prototipo | Alto | Portare formule C++ e scrivere test paritari prima del bilanciamento |
| Asset nuovi con frame duplicati | Alto | QA manuale + hash pose + GIF 1× e lenta |
| Colori edifici parziali, tetti e trasparenze | Alto | Test tint su ogni fazione e fase |
| Simulazione su mappa 400×400 su smartphone | Alto | Profilazione, chunking e LOD, attivare solo dopo baseline |
| Browser limita fullscreen e lock orientamento | Medio | Fallback manuale + PWA installabile, senza promesse impossibili |
| Audio/musica o marchio non coperti dalla GPL dei dati | Alto | Registro licenze separato, fonti autorizzate |
| Conservazione salvataggi fra grandi refactor | Alto | Test migrazione e backup/export per tutte le release |
| Divergenza verso Ver Sacrum | Critico | Sorgenti e criteri di accettazione sempre riferiti a 7KAA |

**Decisioni da verificare nel primo sprint, non inventare:** elenco esatto delle nazionalità classiche; sprite e ID realmente presenti; gestire compatibilità dei vecchi salvataggi C++ (opzione futura, non promessa); package/legal della musica; test PWA Android; volume di ore/risorse effettivamente disponibili.

## 9. Lavoro immediato: checklist della prossima tranche

- [ ] **NOW-01 P0:** fissare gli snapshot del sorgente 7kaa, della build WASM originale e della MOD con commit/licenza.
- [ ] **NOW-02 P0:** comparazione reale dell'interfaccia 800×600: screenshot e overlay, segnare cosa non coincide.
- [ ] **NOW-03 P0:** catalogare asset originali; selezionare 1 unità e 1 villaggio con sorgenti certi.
- [ ] **NOW-04 P0:** prototipo decoder e piccolo atlas originale, senza rifare tutto in pixel art temporanea.
- [ ] **NOW-05 P0:** test di parità per tasse, grant, cibo e recluta con almeno 3 livelli di penalità e stati-limite.
- [ ] **NOW-06 P0:** aprire una checklist QA mobile per paesaggio/fullscreen/input e testare su Android reale.
- [ ] **NOW-07 P0:** eseguire `node --test` in CI ad ogni commit; fissare o correggere i test non affidabili.
- [ ] **NOW-08 P1:** creare indice `asset_id / path / status / note`, e riportare quale nuova unità richiede nuovi frame.
- [ ] **NOW-09 P1:** ottenere la reference GIF romana approvata prima di qualsiasi intervento artistico su M/GM oblique.

## 10. Registro di avanzamento

| Data | Stato | Variazione |
|---|---|---|
| 2026-11-03 | Piano creato | Avvio programma, separazione Core/MOD, registro asset, gate e calendario indicativo |
| — | — | Aggiornare questa riga al completamento di ogni fase o review bisettimanale |

**Regola finale:** quando un collaboratore entra nel progetto legge **prima questo piano, poi `PORTING_MAP.md`, poi il C++ di riferimento**. La prima domanda non è "quale nuovo gioco creare?", ma **"quale modulo di Seven Kingdoms portiamo e con quali prove di equivalenza?"**.
