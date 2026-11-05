### 2026-11-05 — Diagnosi effettiva dello spostamento: 24 unità SVG
Calcolato con i moduli del motore: `QOBoardSkeleton` dà `block-2.frame={left:-51,top:608,width:285,height:242}`, ma `svgGuide` aggiunge un padding 24 ed esporta 333×290 con vertici relativi a `(-75,584)`. Il V2 usava `targetRect:[42.5,42.5,...]` direttamente dal file SVG rispetto al frame più stretto: l'arte era spostata di **+24,+24 unità del mondo**, pari a circa 40 pixel nello screenshot a zoom 1.65. In `v2align` corretto il punto di appoggio a `[18.5,18.5]`, ridotto lo shear residuo a 0.05 dopo una prova visiva locale; `v2fit` preserva il posizionamento precedente per confronto. Test aggiornato per accertare il mapping e l'isolamento delle hitbox. Non effettuato test browser reale.

### 2026-11-05 — Cross Street: correzione dell'errore progressivo nello screenshot utente
Osservato che il lotto più a sinistra in `?artAudit=v2fit` presentava tetto dipinto più basso rispetto al contorno vettoriale, mentre il tetto più a destra era sensibilmente più vicino alla sagoma. Creato test locale con sovrapposizione di artwork e silhouette e provata una deformazione affine in Y variabile con X (coefficiente 0.10): migliora il riscontro dei tetti di estremità, senza certificare i confini dei quattro lotti centrali. Implementato `mappingMode:"shear"` opt-in in `board-chunks.js`, con `ctx.save/restore`, vincoli sui parametri e origine fissa sull'estremità destra del chunk; nuovi URL `v2align`, `v2alignclean`, `v2alignclip`. Controllo sintassi JS PASS e smoke test di mapping su Canvas mock PASS. Nessun gameplay, PNG originale, guida SVG o manifest principale modificato. Non eseguito screenshot browser reale; non promuovere come asset finale.

### 2026-11-05 — Worker: studio illustrato a geometria bloccata
Commit `916eb871`: nuovo SVG illustrato per i soli lotti [2,3,4,9,10,11], costruito sulla guida autoritativa, con dettagli distribuiti tramite interpolazione bilineare sui piani delle pareti/tetto. Conservati source PNG e bozza audit WebP, non promossa alcuna immagine nel manifest. Verifica eseguita: lettura della guida GitHub e pubblicazione file tramite API GitHub. Non eseguiti screenshot browser Android/desktop, né verificata una nuova generazione ImageGen su reference; studio non conforme al requisito finale raster.

### 2026-11-05 — Corretto workflow artistico: reference → ImageGen → maschera, non il contrario
Dopo lo screenshot del fallimento, l'utente ha evidenziato che **ImageGen deve ricevere come input l'immagine dell'esatta geometria per cui l'asset è destinato**. Sono stati creati `assets/guides/cross-street-block-2-imagegen-input.svg` e `assets/guides/cross-street-block-2-alpha-master.svg`, con sei volumi del modello e origine condivisa 333×290 (raster target 1332×1160). Controllo diretto delle coordinate: i cinque path di tetto+facciate di ogni lotto coincidono esattamente con il master, sei su sei. Registrato il protocollo di produzione e un test automatico. Il tentativo ImageGen con l'overlay precedente ha prodotto ancora un mockup/diagramma e non ha passato l'accettazione: **non integrato nel gioco**. Asset esistenti e hitbox runtime non modificati.

### 2026-11-05 — Ripristinato asset grafico sparito dall'anteprima
Segnalazione utente: in `?artAudit=1` era scomparsa l'immagine di gruppo, rimpiazzata dallo studio SVG. Corretto il default dell'audit per tornare a caricare `block-2-draft-audit.webp`, applicando il rendering **non ritagliato solo alle bozze raster diagnostiche**: il prospetto disallineato non può essere reso coerente con le hitbox semplicemente mascherandolo, e va mostrato completamente per comparazione. `?artAudit=study` mantiene lo studio geometricamente allineato, mentre nelle condizioni di produzione restano le maschere per lotto. File WebP verificato nel repository via contenuto base64/header WebP, JS nuovo validato come sintassi. Non è stato effettuato uno screenshot browser; l'opera non è approvata come asset definitivo.

### 2026-11-05 — Correzione reale occlusioni e selezione per palazzo
L'utente ha mostrato il fallimento del test di sovrapposizione: linee ciano spostate rispetto alla bozza raster e difficoltà a leggere i tetti/volumi occlusi. Implementato `board-selection-overlay.js`: hull proiettato dei volumi, maschera per singolo lotto, ordinamento di profondità per-lotto dell'illustrazione condivisa, sottrazione progressiva dei volumi più vicini dall'highlight e dall'audit. `board-preview.js` e due pagine HTML collegati al nuovo modulo; `?artAudit=1` ora apre lo studio SVG agganciato alla geometria, `?artAudit=draft` preserva la vecchia bozza come diagnosi. Segnalini disattivati solo come default dell'audit. Test Node indipendenti del modulo: 3 PASS in esecuzione locale; parsing JS del renderer e modulo: PASS. **Non eseguiti screenshot browser / Android, quindi risultato visivo non dichiarato validato**. Originali ImageGen e manifest runtime non modificati. NPC/IA/economia intatti.

### 2026-11-05 22:00 — Comparatore di geometria visiva
Implementata opzione `board-preview.html?artAudit=study` (commit `4439e2c`, `c32aef8`) per vedere i sei edifici dello studio geometrico con coordinate di chunk non stirate. Resta disponibile `?artAudit=1` per confronto con il draft ImageGen errato. Controllo statico del codice e registrazione GitHub; **nessuno screenshot browser reale e nessun test Android eseguiti in questa esecuzione**. Non sono stati toccati NPC, economia o manifest asset.


### 2026-11-05 21:00 — Geometric visual study, no draft promotion
Created six-parcel geometry-locked illustrated SVG at `assets/guides/cross-street-block-2-geometry-locked-art-study.svg` (`0b49b6b`), derived from the authoritative roof/wall polygons with positive-slope street fronts. It is a separate **vector art study**, not the requested ImageGen PNG, and is not registered in runtime. Original unaligned draft, padded WebP and null chunk index untouched. No real browser/Android screenshots or test suite in this run; visual acceptance still blocked pending corrected macro-image and audit comparison. NPC/IA/pathfinding/economy untouched.

### 2026-11-05 20:48 — Dove applicare il gruppo di case ImageGen
Target tecnico: **Cross Street, chunk `block-2`, sei lotti cliccabili [2,3,4,9,10,11]**. L'immagine ImageGen appena generata rappresenta un fronte edilizio coerente, ma **l'orientamento del suo fronte non corrisponde alla pendenza delle sagome e dei tetti reali** in `assets/guides/cross-street-block-2-skeleton.svg`. Applicarla come texture di produzione ora causerebbe disallineamento con selezione e facciate. L'approccio corretto è conservarla come reference e pubblicare una prova isolata di sovrapposizione.

- **Backup verificato:** Google Drive https://drive.google.com/file/d/1k3kFifxSTf7T_51dLpCzGO6odU5Zsjpp/view e GitHub `assets/source/imagegen-2026-11-05/group_tenements_unaligned_draft.png`, commit `bd22c7b6`, blob Git `4482c60c6f0d6b118366733bc4f226ef1827e994`. File originale 1448×1086 PNG RGBA, 2.664.548 byte.
- **Materiale per prova:** `assets/runtime/chunks/block-2-draft-audit.webp` con proporzioni originali non deformate e padding trasparente 1332×1160, GitHub commit `add2cedc`, Google Drive file `11D4wSmfms1wHLUTgDJ1BkS2-ZDWLjASr`. Non è un redesign in prospettiva corretta.
- **Codice operativo:** `board-preview.js` committato in `5bf80a2` registra la bozza **soltanto** se URL contiene `?artAudit=1` o `?artAudit=clean`, centra la camera su `block-2`, sovrappone i veri profili tetto/facciate per evidenziare gli scarti, lascia hitbox individuali inalterate. Cache-busting aggiunto a `board-preview.html` e `board-1860.html`. Candidato documentato in `assets/chunk-candidates.json` `e1c220a`; manifest di produzione non alterato.
- **Prove eseguite in mock V8** su sorgenti scaricati da GitHub: attivazione da query, immagine registrata e effettivamente disegnata come chunk, canvas render, toast diagnostico, toggle SCHELETRO funzionante. **Nessuno screenshot live da Pages/Android**; non dichiarare superato il criterio di allineamento.

Prossimo passo vincolante: creare la nuova angolazione controllata dalla SVG di Cross Street, con un'unica illustrazione del gruppo e versioni ravvicinate; non deformare questa vecchia immagine né modificare geometry e NPC per farla entrare.


### 2026-11-05 — Implementazione scheletro completo + grafica per porzioni

**Ultimi raccordi della stessa implementazione:** commit `0dda842a` abilita il caricamento automatico dell'indice `assets/chunk-index.json` con verifica ID e numero/ordine lotti e soli URL locali WebP esistenti dopo upload; gli slot tutti null non generano richieste inesistenti. Commit `d765f029` rende davvero solo vettoriale il toggle SCHELETRO (terreno e strade geometrici senza texture). Test V8 ripetuto con mock di un intero blocco immagine disegnato: il click su tetto lotto 2 seleziona l'**Abitazione – Lotto 3** dentro quel medesimo blocco e illumina il volume; blueprint/zoom/esportazione SVG funzionano senza eccezioni. Test Node su checkout e screenshot browser/Android reali non ancora eseguiti.


La direzione corretta dall'utente è: (1) hitbox/scheletro isometrico autoritativo disegnato una sola volta, (2) nuova grafica da ImageGen **per gruppi**, allineata al blueprint per porzioni, (3) overlay di selezione e segnalini interattivi sopra l'immagine; zoom fino a osservare da vicino il fronte strada senza deformazioni prospettiche.

**Implementato e committato sulla main, senza toccare gameplay NPC:**
- `board-skeleton.js` (commit `1c14e509` e fix `eb0ad233`): per tutti i 454 lotti genera roof/ground/4 face polygons, porta, fronte street, distinzione residenziale/attività, chunk di appartenenza, picking tetto/parete/strada, export SVG preciso; le facciate sono state aggiunte anche alla guida SVG nel commit `d5d87a8`.
- `board-chunks.js` (`6eb224cc`, `c5200f95`) tiene i futuri macro-artwork separati dalla logica di selezione e gestisce tre versioni grafiche `base/detail/ultra` con fallback quando una manca; nessun file inesistente viene caricato. `assets/chunk-index.json` (`42c22b68`) documenta 117 chunk esatti per 454 lotti, LOD tutti null finché non saranno realmente prodotti e caricati.
- `board-preview.js` (`4a250ef7`, `15e0e908`, `aaf8b296`) integra 3 layer, modalità SCHELETRO, segnalini `⌂`/`◆`, click singolo edificio per tetto/parete, highlight del volume e lato strada, click strada, export SVG, zoom 0.58×–7.5×. Fallback vettoriale viene disegnato direttamente con zoom molto alto; i sei Canvas pilota Cross Street ora sono prerender 8× (`19fc8ada`) per evitare perdita evidente a 7.5×.
- `board-preview.html` e `board-1860.html` importano scheletro e registry prima del renderer, mostrano pulsanti SCHELETRO, SEGNALINI, GUIDA SVG e cache-busting coerente (`cab58bb`, `0ded36b`).
- Esportato il primo vero blueprint ImageGen-ready `assets/guides/cross-street-block-2-skeleton.svg`: tetti, muri, fronti e door pivot dei 6 lotti [2,3,4,9,10,11] (`935880c6`, `ff1796b7`), dimensione scheda 333×290 unità raster proiettate. Test permanenti in `tests/board-skeleton.test.cjs` (`10792de2`).
- Test dinamici **eseguiti su sorgenti GitHub appena fetchati** in V8 con DOM/Canvas simulato: mappa 454 lotti/117 chunk, picking tetto di lotto ID2, picking strada Five Points, boot renderer con un mock di macro-asset disegnato, selezione interna `Lotto 3` della stessa immagine, scheletro on/off, 15 zoom-in senza errore, esportazione SVG trigger, 7.5x disponibile. Il mock non è un browser reale e non valida l'aspetto grafico finale.
- Il worker orario è stato aggiornato con questo **nuovo contratto P0 prioritario**, che supera la precedente produzione di singoli PNG. L'architettura è documentata in [THREE_LAYER_MAP.md](THREE_LAYER_MAP.md).

**Da fare P0:** produzione ImageGen di un primo blocco edilizio unico Cross Street ***guidata dalla SVG reale***, ritaglio/alignment dei tetti e fronti senza traslazioni, asset base/detail/ultra registrati e verificati; screenshot di build reale PC e Android landscape. Il container di questo turno non può raggiungere raw.githubusercontent.com (DNS disabilitato), e il tool web non apre GitHub Pages, quindi **non** ho eseguito browser screenshot o suite Node su file checkout. Il restyling complessivo resta incompleto; nessun lavoro su NPC/IA/economia.


### 2026-11-05 20:00 — Primo fronte pilota Cross Street
Commit `e0f7c37`: aggiunto `cross-street-kit.js` con sei sprite trasparenti prerenderizzati su Canvas offscreen, uno per i lotti 2/3/4/9/10/11, basati su vertici e altezze reali. Commit `f11192d`: integrazione nel renderer prima dei PNG isolati; `db0ab55` e `b8872b8`: import nelle due anteprime. La cucitura condivisa esistente resta attiva. Verificato parsing V8 dei due script: PASS. **Non** eseguito browser reale, screenshot o Android. Questi sono moduli rasterizzati al runtime e NON sei WebP ImageGen né cinque raccordi raster finali: la produzione del kit definitivo e il QA visivo restano P0. Nessuna modifica NPC/pathfinding/IA/economia.

### 2026-11-05 — Correzione effetto figurine: isolati continui
L'utente ha segnalato che la prima integrazione PNG sembrava «palazzi appiccicati come figurine». È stato avviato un restyling **geometrico e di asset** anziché produrre ulteriori palazzi isolati. Non sono state modificate logiche NPC/IA/economia.

**Commit effettivi sulla main:**
- `44d270378614ae6e1416aac1ad4afa2905419dd5`: nuovo `block-continuity.js` indipendente, 337 giunzioni fra edifici vicini sul medesimo lato strada, 117 gruppi (105 multi-edificio), 170 giunzioni `shared` e 167 passaggi `passage`; classificazione degli angoli A/B e controlli che evitano fronte retro, strade diverse ed estremità duplicate.
- `d461c20711a6d9f349c26107ff6c6c981d2a3bec`: `board-preview.js` aggancia raster alla metà della vera facciata sul fronte strada, non al centro arbitrario del lotto; aggiunge basamenti comuni, fascia di raccordo in pietra/fango, muri comuni e tetti brevi oppure bassi muri sui passaggi. I raster solo compatibili con gli angoli rappresentati; per angoli privi di asset rimane il disegno isometrico di fallback, mai una rotazione 2D falsa.
- `10333af8b1e43b08fdc292563bccf1c7d5f32f8f`, `a8d4b3292290f29871f218d903de78334579a61f`: entrambe le pagine board caricano il modulo prima del renderer e forzano aggiornamento cache.
- `8bb8a7cab4825e918cc13772318460850731e02e`: test permanente `tests/block-continuity.test.cjs`. Documento [BLOCK_ASSET_SPEC.md](BLOCK_ASSET_SPEC.md): contratto asset puzzle e angolazioni di produzione.

**Verifiche eseguite:** V8 con codice GitHub appena fetch: 337 giunzioni senza disallineamenti >18 unità, senza strade incrociate, senza doppio utilizzo degli estremi, esecuzione ripetibile. Smoke mock DOM/Canvas: primo render PASS con 228 prerender creati, funzionano zoom, drag, selezione/tap e minimappa, senza errori JS; conteggio edifici 454. Sono prove mock/di geometria, **non** la suite Node su filesystem o verifica visiva reale.

**Prosecuzione della stessa iterazione — pilot asset**: per evitare di produrre 454 sprite incoerenti, è stato individuato il fronte sperimentale di **Cross Street, lotti 2–3–4–9–10–11**. Sono 6 edifici adiacenti tutti in azimut A (33,98°–39,43°), con 5 muri condivisi. Registrati pivot, coordinate del fronte, impronte e ruoli modulari in `assets/pilot-cross-street.json` (commit `2eb1a620`). Il renderer disegna ora i giunti **dopo entrambi gli edifici** in ordinamento profondità, per impedire che i PNG coprano la cucitura (commit `fc0972c`); nuovo test di regressione del settore e del sorting (commit `3782ea93`). Asset del kit del pilot ancora da generare e convalidare; nessun PNG nuovo dichiarato presente. Test browser reali e screenshot non disponibili in questa iterazione.

**Limiti:** l'integrazione dei raster conserva solo circa 150 posizioni con assi A/B potenzialmente compatibili, e per altri tipi/retro ancora meno: servono viste originali dedicate e kit di schiera left/middle/right/corner, oltre a texture/ombra coerenti. Le nuove giunzioni possono ancora richiedere correzioni di occlusione sui PNG. Non sono stati acquisiti screenshot da browser né Android reale, quindi non dichiarare risolto in maniera definitiva l'effetto figurine. Il worker orario è stato aggiornato per priorità assoluta CONTINUITÀ + KIT ASSET fino al restyling completo.


### 2026-11-05 16:00 — Primo passaggio raster ImageGen nella plancia
- Commit `a8b2f4adc56325709576718f35b015d33bcfe2fb`: caricamento di sei sorgenti PNG originali già presenti nel repository, selezione per tipologia e seed, rendering con proporzioni uniformi ancorato al suolo, fallback al precedente sprite vettoriale; nessuna modifica NPC/pathfinding/IA/economia. Cache bust della preview.
- Test eseguito: parsing V8 con `new Function` sul JavaScript aggiornato: PASS. **Non** eseguiti screenshot browser/Android, verifica effettiva delle trasparenze, orientamenti e test Node. In particolare la coerenza tra footprint e margini dell'immagine resta da collaudare.
- Successivo: ritaglio/normalizzazione WebP delle sorgenti, geometria per orientamenti, screenshot reali; poi terreno, carri, props e HUD. Plancia NON approvata.

### 2026-11-05 14:00 — Segnaletica mercatale e bug orientamento carri
Commit `e5f9fff593eedc46388e36c3546a60fd9e262fc1`: aggiunte piccole insegne in legno pendenti con emblemi diversi ai banchi mercatali; corretto `drawCart`, che usava `p.id` mentre i props hanno `seed` e non `id`, producendo un flip sempre uguale. Cambiato solo `board-preview.js`, non NPC/IA/economia. Controllo sintattico V8 del file letto nuovamente da GitHub: PASS, 38203 caratteri. Nessun screenshot browser, test Node o Android effettuato; la fedeltà visiva alla golden non è ancora verificata. Da testare in browser l'occlusione delle insegne.

### 2026-11-05 — Collocazione banchi commerciali
Commit `be52cb08636d1891a2128c906972c9d390fe4554`: corretto il punto d'ancoraggio dei banchi in `board-preview.js`, ora calcolato a partire dalla porta dell'edificio e dal vettore verso la strada; la precedente scelta di un vertice del lotto più 8 unità poteva sovrapporre banchi e facciate. Nessun file di gameplay modificato. GitHub connector ha confermato la scrittura; Chromium è disponibile nell'ambiente locale, ma la rete del container non risolve github.com e la preview pubblica non è accessibile dal browser web disponibile: impossibile acquisire screenshot della build reale in questa esecuzione. Non eseguiti test Node né prova Android. Da verificare la distanza dei banchi dalla carreggiata e il sorting visivo.

### 2026-11-05 — Iterazione plancia: scale esterne
Implementazione effettiva `e223ab3a`: scale e pianerottoli in ferro su facciate di alcuni edifici residenziali di almeno quattro piani; nessuna modifica a logiche NPC o economia. Il container dispone di Node v22.16.0, ma `curl` della preview GitHub Pages è fallito con `Could not resolve host`; nessuna cattura browser, test Android o suite Node effettuata. Verificare geometria e possibili occlusioni nella prossima prova visiva.

### 2026-11-05 10:00 — Iterazione visiva: stenditoi
Commit `c0827073`: aggiunti stenditoi sui tetti residenziali alti, con geometrie e colori deterministici per edificio; nessuna modifica a NPC/pathfinding/economia. Verifica: scrittura GitHub riuscita; nessun browser screenshot né test Node eseguito in questa esecuzione. Necessari controllo visivo e confronto con golden reference.

### 2026-11-05 — Differenziazione silhouette magazzini e stalle
Commit `ea3a9158a43a62f4fe0c6840bcf37f45121e9e85`: aggiornato `board-preview.js` con castelletto, puleggia, fune per magazzini e lanterna ventilata sul colmo delle stalle; componenti disegnati nel roof pass e memorizzati negli sprite prerenderizzati. Parsing del sorgente completo con `new Function` in V8: PASS (33.440 caratteri). Tentativo di clone GitHub nell'ambiente locale bloccato da DNS (`Could not resolve host: github.com`), quindi nessuna suite Node o screenshot reale; non certificare qualità visiva. Solo plancia, nessuna logica NPC/IA/economia toccata.

### 2026-11-05 — Iterazione drenaggio stradale
Commit `c232f8eba6b1482eb7c82d4d7fcb6a87f015ee8e`: `board-preview.js` aggiunge tombini in ferro con feritoie e bordi sconnessi lungo le strade, deterministici e ancorati alla mappa. Controllo sintattico V8 superato; nessun collaudo browser, screenshot Android o confronto visuale golden in questa esecuzione. NPC/IA/economia invariati.

### 2026-11-05 — Iterazione facciate (`d4c18b10`)
Aggiunti a `board-preview.js` marcapiani per piano, lesene di estremità, conci, cornici e ombre di gronda, con varianti deterministiche per edificio. Nessun file NPC o meccaniche modificato. Modifica pubblicata su main; test runtime Node/browser e screenshot Android non eseguiti in questo turno. La qualità comparativa con il riferimento ImageGen resta non verificata.

## 2026-11-05 05:00 — Patina architettonica
- Commit `5514e872f2dbfb4d7184eada272a6f1ea5b0d117`: nuovo pass di usura delle facciate (scrostature, fuliggine, fascia di sporco) con clipping alla geometria del muro e seme deterministico per edificio/lato. Nessuna modifica a NPC/pathfinding/economia.
- Controllo sintattico JavaScript via compilazione `new Function` superato prima del commit; nessuna prova Node, browser desktop, Android o screenshot. La resa estetica resta da validare sul sito pubblico.


## 2026-11-05 02:00 — Materiali stradali
- Commit `274b40495162b3d5b451a57767ebcde2ec02a4cb`: nuove chiazze d'acqua scure e sottili riflessi sulle strade, ancorati alle coordinate dei segmenti, senza cambiare topografia, camera, NPC o economia.
- Controllo statico della posizione di inserimento rispetto alle variabili `dx/dy/len` effettuato; NON eseguiti test Node, screenshot o Android in questo ambiente. Da collaudare sulla build Pages e confrontare con golden reference.
## 2026-11-04 — Deploy Pages B2 riuscito e regressione ripristinata
- Il run Actions `41926287816` su commit `b23d4b04` ha superato effettivamente **Deploy to GitHub Pages**, non solo il checkout/test.
- Artefatto distribuito scaricato e verificato in locale: contiene `board-1860.html`, collegamento aggiornato e script versionati. Prima suite completa Node: 40 PASS / 3 FAIL; i 3 FAIL erano test preesistenti con harness non più allineati: `W/H` non definiti nell'estrazione di `game.js` e ancoraggio di nome funzione obsoleto nella prova terreno isometrico.
- Riparati soltanto i tre **test harness**, senza modificare il codice del gioco o degli NPC; rieseguita suite Node completa su artefatto Pages con le 3 modifiche: **49/49 PASS**.
- Chromium/Playwright nel runtime rifiuta localhost e file:/// con `ERR_BLOCKED_BY_ADMINISTRATOR`: nessuno screenshot browser dichiarato superato. Prossimo passo: verifica in Chrome Android da utente e confronto reference.

## 2026-11-04 — Fix del blocco preview Android / deploy concorrenti
- Evidenza: due screenshot Chrome Android (23:20 e 23:22 CET) mostrano una vecchia versione con area mappa e minimappa nere, mentre `main` ospita già una pagina HTML diversa.
- Analisi Actions: run `41924861810` ha fallito *Deploy to GitHub Pages* con errore `in progress deployment` (conflitto deploy); run `41924847763` era verde ma il passaggio Deploy risultava `skipped`. Un check verde non prova la pubblicazione.
- Correzione in questa singola modifica: nuova URL pulita `board-1860.html` per uscire dalla cache della vecchia pagina, script con version tag `20261104-b2`, watchdog visibile sull'avvio e conferma di rendering solo al termine del primo frame e della minimappa; ingresso dal gioco aggiornato senza toccare NPC.
- La precedente suite V8 eseguita su `board-world.js`/`board-preview.js` ha confermato 454 edifici, frame e minimappa in un mock di Canvas; la suite Node dell'artefatto Actions ha superato 5/5 test `board-world.test.cjs`. Uno screenshot Chrome locale è stato tentato, ma il browser dell'ambiente risponde `ERR_BLOCKED_BY_ADMINISTRATOR` anche su localhost/file.
- **Pubblicazione effettiva da verificare sul job Pages e Chrome reale**; nessun test del telefono dell'utente simulato come superato. Nessuna modifica a workflow o ad altri giochi. Stato: plancia non approvata, sviluppo NPC sospeso.


## 2026-11-04 — Black screen reported on Android Chrome
- User screenshot shows legacy "FIVE POINTS · PLANCIA SPERIMENTALE" shell and blank map/minimap; current main `board-preview.html` instead has "FIVE POINTS · NEW YORK · 1860", a different HUD, indicating Pages may be serving stale content. This is observed evidence, not proof of root cause.
- Commit `f7cf7ed60d17af70911258cda12571f1c10beecf`: cache-bust board stylesheet and scripts; show an explicit JS/model-load error in the current preview instead of silently blanking.
- No live Pages/browser verification possible here. Need confirm actual deployed HTML matches main before treating this as fixed. No NPC/gameplay edits.

# Diario avanzamento

## 2026-11-04 — Plancia 3x3 navigabile (sviluppo diretto)
- Creato `board-world.js` (commit `e5463e2`) con layout originale **2700×2100**, 9 settori con **38–66 palazzi ciascuno**, 21 strade e 212 props su geometrie indipendenti. Al centro cinque bracci; i dati NON sono georeferenziati alla carta Perris, ma conservano l'obiettivo urbanistico di isolati irregolari.
- Creata `board-preview.html` e `board-preview.css` (commit `d1ee66b`, `7951c74`), HUD fisso, fullscreen, overlay portrait, minimappa, zoom. Creato `board-preview.js` (commit `70be029`) con scenario realmente renderizzato a layer/sprite indipendenti, strade, facciate di mattoni, tetti, negozi, tende, luci discrete e props SVG già presenti.
- Migliorato il rendering con **cache LRU di 320 sprite preregistrati per palazzo** (`9b399be`, `dc1eaea`): test dinamico simulato su codice GitHub, 228 sprite preparati al primo frame e **nessuna nuova rasterizzazione** dopo zoom in/out; chiamate grafiche scese da circa 175.250 a circa 3.500 per zoom nel mock. Non sono benchmark di FPS hardware.
- Aggiunto il collegamento `NUOVA PLANCIA` nella pagina del gioco senza modificare `game.js` (`8638768`, `7c06cdf`). La modalità tattica precedente rimane isolata e recuperabile.
- Creato `tests/board-world.test.cjs` (commit `d697afb`) con verifiche su mappa, proiezione 2:1, ripetibilità, assenza intersezioni e UI. In V8 ho eseguito le prove dinamiche sul vero sorgente pubblicato: **0 coppie di lotti sovrapposte su 454**, tutti i 9 settori popolati, generazione deterministica, mini-mappa e zoom/camera inizializzati in mock. Non ho eseguito la suite Node su checkout.
- **Non collaudato**: apertura pubblica su GitHub Pages (strumento web non riesce a caricare la URL), screenshot di browser desktop/mobile, somiglianza effettiva con ImageGen, navigazione hardware Android. Questa è una base funzionante in mock del renderer e una prima build del nuovo scenario, **non una plancia graficamente approvata**.


## 2026-11-04 — Plancia ImageGen approvata, nuova priorità assoluta
- Nuovo ordine diretto dell'utente: il lavoro su movimento e sistemi NPC è **sospeso per ora**. Prima la plancia. L'ultimo concept ImageGen `distretto_five_points_new_york_1860.png` (originale 1672×941) è il target grafico esatto: caseggiati densi, incrocio irregular Five Points, negozi, carri, fango, lampioni, palette bruna/ambra e vista isometrica. L'immagine è una finestra su una mappa più grande: almeno 2×2 area visibile equivalente, preferenza 3×3 settori.
- Caricata in GitHub la **miniatura autentica**, 160×90 WebP, `assets/references/approved_five_points_board_preview.webp` con blob git `69124aacabeb275a5f2194043281a56687e0d05f`; commit `9edfb96c43111495fe5354bb9206e222e3a6c31c`. Il PNG HQ NON è stato caricato; resta allegato alla conversazione.
- Creato il contratto grafico `BOARD_MASTER.md` (commit `dda7447c7081f8e27fcf24e7d693eee06a429daf`): composizione vincolante, estensione continua, layer/modularità, distinzione reference e runtime, preview isolata e criteri di accettazione. Aggiornati ART_DIRECTION, ROADMAP, SPEC, README, VISUAL_ACCEPTANCE e catalogo asset; il nuovo reference ha precedenza per la plancia.
- Prompt del worker orario aggiornato con nuova priorità: produrre modifiche di grafica **visibili**, non toccare NPC/pathfinding/IA salvo blocchi della preview, non dichiarare mappa finita con solo un'immagine statica; attendere approvazione plancia prima di riprendere il gameplay.
- Test disponibili: il contenuto della miniatura è stato validato dal suo SHA Git e la commit GitHub è stata confermata. Non è stata ancora realizzata la grande mappa modulare; nessun collaudo in browser di questa versione.


## 2026-11-04 — Esecuzione sollecitata, upgrade grafico tetti e arredo
- L'utente ha richiesto di sollecitare le esecuzioni fino a un livello visivamente accettabile. Creato `VISUAL_ACCEPTANCE.md` con criteri di ingresso, soglia intermedia e vincolo anti-report; aggiornato prompt del worker orario. L'automazione esistente rimane attiva.
- **Modifica runtime** `game.js` commit `0efddc78c7a7d83332239493b2d6f6d55150cce2`: 5 silhouette classificate (`shop`, `tenement`, `dwelling`, `warehouse`, `mill`); tetti a falde e piani, lucernari, parapetti e dettagli. Aggiunti riferimenti immagine agli SVG originali già presenti: barili, casse, lampioni, steccati e lanterne; 15 props posizionati ai margini dei palazzi e ordinati in isometria assieme alle unità.
- **Prove dinamiche eseguite su codice reale con V8**: parsing `game.js` valido, 5 tipologie diverse, 30 poligoni tetto validi e 0 valori non finiti; 15/15 posizioni decorative esterne ai footprint delle costruzioni. Eseguite verifiche di rendering dei 5 tipi di props su Canvas mock: senza coordinate errate.
- **Test persistente** `tests/streetscape-render.test.cjs` commit `a25c5d8ece57ef96936a88b4d630908d3123d2ad`: verifica decorazioni, silhouette, generazione geometrica.
- Limiti: nessuno screenshot reale, nessuna esecuzione Node persistente confermata, no collaudo touch/landscape su device; città NON ancora georeferenziata contro Perris 1853. Le caselle ALPHA VISIVAMENTE ACCETTABILE rimangono aperte. Prossime priorità: topografia storica e ricostruzione densa dei fronti, poi screenshot browser.


## 2026-11-04 — Reference fotografiche utente + facciate storiche originali
- L'utente ha inviato tre screenshot di ricerca immagini «new york 1860» per dare una direzione concreta all'architettura. Sono riferimenti VISIVI generici, datazione/ubicazione/diritti non certificati; **nessun screenshot è stato caricato nella repository**.
- Creato [VISUAL_RESEARCH.md](VISUAL_RESEARCH.md) con matrice delle fonti: Perris 1853 tavola 25, cartografia 1831, litografia Library of Congress 1859, studio archeologico NYC, OSM moderno come orientamento, clip Miramax solo come mood; estratti dettagli architettonici e requisiti di licenza.
- Modificato **codice runtime reale** `game.js`: funzione `faceQuad` e `drawPeriodFacade` con marcapiani, finestre e oscuramenti, botteghe, tende e ingressi in coordinate proiettate isometriche. Sostituite finestre poco caratterizzate precedenti. Commit codice `7499077ae88edfc6c200a6e47c878431881b5245`.
- Aggiunto `tests/period-facades.test.cjs` con verifiche di interpolazione, geometria dei 15 edifici e differenze botteghe/produttivi. Commit `7c27faf04bf486ecfee64db97991a5ef08c7cf5f`.
- Eseguito **test V8 dinamico reale** delle due funzioni estratte dal codice pubblicato: 15 edifici, 846 poligoni generati, 0 vertici non finiti, 3 facciate bottega; parsing completo `game.js` PASS. Test persistente Node e screenshot browser non ancora eseguiti.
- Aggiornati ART_DIRECTION, ROADMAP e README: qualità cartografica e grafica del quartiere è ora P0. Rimangono aperti tracciati GIS OSM+Perris verificati, sprite separati definitivi, densità edilizia accurata, confronti screenshot in-game/asset.
- Per il worker: proseguire da `VISUAL_RESEARCH.md`, NON confondere le foto generiche di Manhattan con i Five Points; il renderer continua a essere una resa preliminare, **non** dichiarare completezza grafica.


## 2026-11-04 15:00 — Primo terreno isometrico 2:1
- Riletti integralmente i sei documenti di progetto e assets/README.md; verificata main e stato del renderer: fondo ancora a strade cartesiane.
- Commit `2ac8ab49cc8ea190ce0760fb0504adc96f33568b`: nuovo `drawIsometricGround()` in game.js, tile diamante 2:1 con fango/lastricato e usura deterministica, al posto del fondo rettangolare. Nessun asset precedente sovrascritto.
- Commit `278957119454fc134edffafda8f1dffbe8e9d7d0`: aggiunto test persistente `tests/isometric-ground.test.cjs` per tile ratio, numero tile e determinismo.
- Verifica dinamica V8 sulla funzione reale: 462 fill, 459 stroke, delta del primo spigolo (+48,+24), PASS. Sintassi JS integrale PASS. Test Node persistente non eseguito; nessuna prova browser desktop/Android.
- **Non dichiarare isometria 100%:** il mondo di gioco (building/unit positions, picking, pathfinding, camera, minimappa) è ancora cartesiano. Prossimo step prioritario è la proiezione isometrica condivisa e inversa, senza rompere collisioni/ordini; poi layering e sprite/footprint.


## 2026-11-04 — Priorità landscape/fullscreen/UI bloccata allo schermo
- Richiesta utente: grafica isometrica 100%, gioco solo orizzontale, pulsante fullscreen e ottimizzazione viewport. Evitare completamente che il gesto touch trascini l'intera UI.
- Aggiornati `index.html`: pulsante fullscreen nella barra alta e overlay "Ruota il dispositivo" per smartphone portrait.
- Aggiornati `style.css`: shell fissata a 100dvh e documento senza scroll/overscroll/touch-pan, HUD/score/minimappa ancorati, Canvas a 100% dell'area battaglia, layout compatto per landscape a bassa altezza.
- Aggiornato `game.js`: pausa simulazione in portrait, Fullscreen API con tentativo facoltativo di orientation.lock e fallback, resize del backing Canvas ai pixel viewport/DPR, scala cover uniforme senza deformare sprite, mapping pointer/zoom e minimappa collegati al viewport reale.
- Creato `tests/viewport-ui.test.cjs` per smoke test Node/V8 di rotazione, inizializzazione, resize, fullscreen e binding gesture. Verifiche già eseguite nell'ambiente tool: parsing JS in V8 riuscito; avvio simulato nel DOM mock, resize 740×315 CSS px → 1480×630 pixel, pulsante fullscreen registrato, partita facile avviata, listener touch/pointer presenti (PASS).
- TEST NON ANCORA ESEGUITI: suite Node persistente in ambiente locale reale; browser desktop/mobile, fullscreen hardware Android, notch/safe-area, confronto visivo renderer. Non marcare queste attività completate.
- Roadmap modificata: questa è priorità immediata sopra nuovi sistemi; renderer ancora NON isometrico 100% e deve essere affrontato dal worker come prossimo intervento.


## 2026-11-04 — Importazione asset v1
- Generato un nuovo concept sheet con ulteriori edifici (taverna, mercato, magazzino, distilleria, abitazioni), terreni e UI in stile RTS 2000.
- Creato pacchetto locale di asset derivati: 4 edifici, 2 sprite-sheet personaggio, 12 varianti terreno, foglio HUD, concept sheet; pacchetto ZIP offerto in conversazione.
- CARICATI REALMENTE IN REPO: 3 WebP raster low-res (residenza, gendarme idle, mercenario idle); 4 tile isometrici SVG (mud, cobble, puddle, debris); 5 props SVG (barrel, crate, street lamp, wooden fence, lantern).
- Creati assets/manifest.json, assets/README.md e assets/index.html per catalogo e anteprime.
- Integrato game.js con caricamento delle 3 immagini raster e fallback procedurale. I fogli non caricati sono indicati come DA IMPORTARE, non dichiarati presenti.
- Test attualmente disponibili: upload e tracciamento GitHub verificati; non è stato effettuato collaudo browser della resa visuale. La transizione a isometria completa resta pendente.


## 2026-11-04 — Inizializzazione + prima implementazione
- Scelta repository: `CzekUns/Rtsmobile` (GitHub Pages distribuisce la root di main).
- Scelta path riservato: `quartieri-ombra/`, inizialmente inesistente e verificato libero.
- Creazione di README.md, SPEC.md, AGENTS.md e ROADMAP.md con criteri di completamento e istruzioni di isolamento.
- Prima implementazione: `index.html`, `style.css`, `game.js` indipendenti, avvio per 3 difficoltà, disegno tattico su Canvas, mappa con 15 edifici, fedeltà, influenza, selezione, ordini, pathfinding a griglia, esazione, reclutamento casuale, mercenari, IA, combattimento, HUD inferiore e minimappa.
- Controllo statico con parser JS: sintassi di `game.js` valida; riferimenti relativi a CSS/JS verificati.
- Attivata automazione oraria `Worker orario Quartieri d'Ombra`, ID `6aeae2b713b0819184a4bc340c5a0ae6`, dalle 09:00 Europe/Rome con ricorrenza ogni ora.
- NON ancora verificato: deployment effettivo della nuova sottopagina Pages, smoke browser, mobile/touch e correttezza dinamica completa. Non considerare gameplay completo né asset approvati.
- Attività della prima esecuzione worker: verificare link Pages e render in browser, bugfix critici, comandi e loop; scrivere test meccanici ripetibili.

## 2026-11-04 09:00 — Worker 1
- Esaminati integralmente AGENTS.md, SPEC.md, ART_DIRECTION.md, ROADMAP.md, WORKLOG.md e README.md.
- Commit `aebf2beb830aab029c3c473fd09aba8925f53e41`: aggiunti trascinamento mappa via pointer, zoom con pinch su touch e rotella mouse, coordinate input trasformate correttamente e cornice viewport nella minimappa.
- Corretto accumulo esperienza gendarmi: in precedenza veniva sommato una volta per ogni edificio nel raggio (livellamento erroneamente accelerato); ora una volta per unità e secondo ruolo.
- Selezione e movimento bloccati durante pausa; feedback esplicito quando la destinazione non è raggiungibile.
- Verifica eseguita: parsing sintattico JavaScript tramite `new Function` riuscito prima del commit.
- Non eseguiti: smoke test browser desktop/mobile, test di bilanciamento, test visivi; non dichiarare questi elementi verificati.
- Gli asset ImageGen prodotti nella conversazione non sono ancora stati integrati come sprite runtime; richiedono preparazione con trasparenza, normalizzazione e caricamento binario in repository. La grafica attuale resta provvisoria.
- Prossima iterazione: test browser reali, bugfix del pathfinding e prima integrazione degli asset grafici approvati con caricamento/fallback.

## 2026-11-04 10:00 — Worker, economia ed esazione
- Commit codice `a1b98b211262f6689e95314c914dbb4d67d811ab`: `game.js` vincola la riscossione al `building` effettivamente assegnato al gendarme; l'IA non considera più completato un incarico esattore presso un edificio diverso.
- Acquisto mercenario IA: addebito 90 oro solo se `spawn` restituisce una nuova unità, evitando perdita di oro a limite popolazione.
- Rilettura della `main` dopo commit; eseguiti 4 controlli statici mirati sul codice aggiornato, tutti superati. Non eseguito runtime browser, né simulazione completa o test touch. Prossimo obiettivo: harness di test dinamico e collaudo visuale desktop/mobile.

## 2026-11-04 11:00 — Worker, ordini e reclutamento
- Commit `da99eaf15e127250a991cfbdbc5b61d77648754c`: impedito assegnare esazione a mercenari, a edifici non produttivi o non alleati; impedito assalto a edificio proprio; messaggio di percorso impossibile; notifica recluta soltanto se spawn riuscito.
- Riletto `game.js` da `main` dopo scrittura: parser V8 `new Function` riuscito, 5/5 controlli statici puntuali positivi.
- Tentativo di recuperare il file nel container per test Node: impossibile risolvere `raw.githubusercontent.com` (DNS). Non dichiarati test dinamici, desktop/touch o screenshot.
- Prossimo passo: test automatici eseguibili in browser e collaudo visivo isometrico.

## 2026-11-04 12:00 — Worker, collisioni del pathfinding
- Commit `9b658db08c3a51766454957b4c0a7084d200ea8b`: corretto `route()` affinché non accetti una destinazione il cui centro di cella ricade nell'ingombro di un edificio, pur se il click è sul bordo libero. Preservato il comportamento di spawn su bordi collisione.
- Test dinamici V8 sulla funzione `route()` estratta dal codice reale con mappa di prova: 5/5 PASS (libero, ostacolo, cella di arrivo, deviazione, coincidenza); parser JS completo PASS.
- Non eseguito browser smoke desktop/touch né confronto screenshot/reference; prossima priorità harness di regressione persistente e rendering isometrico.

## 2026-11-04 13:00 — Worker, condizione di sconfitta
- Corretto `game.js` per rilevare la sconfitta quando non rimangono né edifici né unità, indipendentemente dall'oro inutilizzabile. Commit `27be1bcb7acf8fb4f79610daeccc8ae3d9a1e8d9`.
- Creato test persistente `tests/defeat.test.cjs` (5 scenari) commit `3e179cf59da90069c1eea4081014560a7b487793`.
- Verificato sul codice letto nuovamente da main: parsing JavaScript PASS, condizione aggiornata presente, 5 casi logici PASS in V8. Il test Node salvato non è stato eseguito nell'ambiente corrente; manca browser smoke e test touch.
- Prossimo obiettivo: suite dinamica integrata per influenza/economia/IA e rendering isometrico reale.

## 2026-11-04 14:00 — Worker, regressione pathfinding
- Creato `tests/pathfinding.test.cjs`, commit `b54525c6cb8ff262effbd3199da82259363055e3`. La suite usa `node:vm` per eseguire la funzione `route()` estratta da `game.js`, anziché ricopiare l'algoritmo, e verifica 7 condizioni.
- Verificati 4 casi dinamici direttamente in V8 sulla funzione originale (4/4 PASS). Tentato download del sorgente nel container per eseguire Node: DNS `raw.githubusercontent.com` non risolto; NON dichiarata esecuzione della suite Node né smoke browser.
- Prossimo obiettivo: eseguire suite Node in ambiente con accesso al repository, integrare regressione su economia/influenza e proseguire isometria.


## 2026-11-04 16:00 — Proiezione unificata e cartografia storica
- Implementato in `game.js` un sistema isometrico ortografico 2:1: `isoPoint/isoInverse`, terreno a diamanti, pareti/tetti edifici in prospettiva, unità in posizione coerente, ordinamento per profondità comune e selezione in coordinate proiettate.
- Coordinate logiche originali mantenute per A*, influenza, assalto e spawn: riduce rischio di regressione, ma richiede test integrali. Zoom usa punto proiettato; tap usa trasformazione inversa.
- Commit `75326e8ddd014257ff9f525aac3ad0430a5445ea`. Test persistente `tests/isometric-projection.test.cjs`, commit `1aabebaf599e04d5738e6cb5c53c624c95c8a119`.
- Controllo sintattico JS superato prima della pubblicazione. Test Node/browser e screenshot golden reference NON eseguiti. Non dichiarare completata l'isometria finale.
- Nuova priorità storica dell'utente: geometria dei Five Points nel 1853, strade/isolati irregolari da mappa Perris; evitare OSM moderno come topografia ottocentesca. Attuale `defs` ancora a scacchiera: resta da sostituire.

## 2026-11-04 17:00 — Primo passo topografia Five Points
- `game.js` commit `d06ca32973a169ae181f84bf890aff2ae028838a`: rimpiazzata la disposizione 5×3 a griglia con quindici lotti irregolari non sovrapposti; cinque strade spezzate disegnate nel renderer isometrico, con prospettiva comune; eliminata la ripetizione di strade ortogonali sul terreno. Mantenuti i dati logici e A* per ridurre regressioni.
- `tests/irregular-map.test.cjs` commit `6e0f5f67db81454eb8ad02332852026a98b6f33f`: test di geometria, footprint e tracciati, da eseguire con Node nel checkout. Parser V8 game.js e controllo di non sovrapposizione 15/15 PASS nell'ambiente connettore.
- Base storica di ricerca: William Perris, Maps of the City of New-York, volume 3, plate 25 (1853); Library of Congress, incisione Five Points in 1859. NON sono state importate immagini storiche nel gioco. Le coordinate sono una prima interpretazione artistica, NON un rilievo fedele. Da verificare nomi, angoli e ingombri contro mappa primaria.
- Da completare: esecuzione test Node, screenshot desktop/mobile, convalida strade reali e navigazione; il gioco non è completo.

## 2026-11-04 18:00 — rimozione interferenze stradali
- Dopo rilettura di specifiche, roadmap, art direction e stato `main`, risolte le intersezioni fra 5 strade e 15 lotti della mappa: 8 footprint ricollocati, conservati nomi/ID/tipi, asset, HUD e regole gameplay. Commit `9c803021b62323c9ca50f90ecf5df2a5faa3f7bb`.
- Nuova suite `tests/road-clearance.test.cjs`, commit `a0fc23ae23e20628401bfd224201094fc6a7a06e`, per impedire regressioni su corridoi stradali, numero edifici e distanze di collisione.
- Verifica geometrica eseguita sul codice letto da GitHub: 255 accoppiamenti segmento/lotto campionati a 2 unità, nessuna interferenza; minimo 0,66 unità oltre il limite strada + 10; nessuna coppia di edifici sovrapposta; parser JS PASS.
- Non verificati: suite Node su checkout, percorso A* di ogni edificio, screenshot e interazioni browser, fullscreen/portrait su Android, corrispondenza cartografica storica. Mappa ancora semplificata e non validata su pianta Perris.


## 2026-11-04 19:00 — accessi edifici e spawn sicuri
- Dopo lettura completa dei documenti obbligatori e verifica main, rilevato che la mappa irregolare conteneva accessi esterni non percorribili (porte bloccate da edifici vicini o fuori mappa). Gli spawn spontanei e mercenari potevano materializzarsi in celle A* non navigabili.
- Modificato `game.js`: `spawn` prova i quattro ingressi in ordine rotativo e usa il primo con posizione e centro cella liberi; nessuna nuova unità se nessun ingresso è praticabile. Commit `0c87aedce5441757aeb706fa2af7edfe99102c1e`.
- Aggiunto `tests/spawn-access.test.cjs`, commit `57550f5271e1e375079ae2df6ab2db1398b327fc`.
- Eseguiti 60 casi dinamici V8 sullo `spawn` e `route` reali estratti da main: 60 PASS, 0 fallimenti; testati tutti i 15 edifici con quattro turni di rotazione. Parser `game.js` PASS.
- Non eseguiti suite Node sul checkout, browser desktop/mobile, fullscreen Android, confronto visivo golden reference. Prossimo passo: test completo connettività e correzione della camera che in landscape può tagliare parte della mappa.


## 2026-11-04 20:00 — Correzione camera e minimappa in proiezione isometrica
- Riletti AGENTS, SPEC, ART_DIRECTION, ROADMAP, WORKLOG, README e assets/README su main; isolati i file della cartella.
- Corretto il mismatch della camera: i limiti usavano il mondo logico 1120×680, ma le entità sono disegnate in spazio proiettato 2:1. Nuovi limiti includono tetti e bordi; offset negativi permessi. Centratura quando il viewport è più ampio del quartiere.
- Minimap ridisegnata con polilinee stradali, edifici e unità proiettati e cornice di viewport coerente. Nessun asset precedente modificato.
- Commit `53d78723140e6025511cd9eea5646ade041082aa` e suite regressione `bb54e06d44ae9f14379ecbf9154d83c46412cddd`.
- Eseguiti realmente nel runtime V8: parser completo game.js PASS; 6 configurazioni di dimensioni/zoom con estremi camera PASS; 306 roundtrip isoPoint/isoInverse PASS (errore massimo 2.28e-13). Test Node persistente e screenshot reali non eseguiti. Prossimo: smoke browser su mobile landscape, eliminare interferenze input/zoom e geometria urbana storica verificata.

## 2026-11-04 21:00 — Pan multi-touch e cancellazione gesture
- Riletti integralmente i documenti obbligatori, verificato stato `main` e ispezionati renderer e handler touch.
- Individuato problema: pinch con due dita spostate in parallelo non spostava la camera; i puntatori potevano rimanere registrati dopo perdita di cattura, e una gesture poteva generare selezioni indesiderate.
- Commit `2f81d0c482a97a6e07f9d16682b35a4def169323`: pan del centro delle due dita, pinch zoom centrato, tap soppresso dopo multi-touch, pulizia su `pointercancel`/`lostpointercapture`.
- Commit `17f1c3d035cc9c072d2ef4ceb1f42e7d598a185a`: aggiunto `tests/touch-gestures.test.cjs` con 3 scenari di regressione.
- Verifica realmente eseguita in V8 sugli handler originali estratti dal file pubblicato: tap, pan, pinch, assenza selezione accidentale, reset gesture: 5/5 PASS. Parser JS PASS.
- Non disponibili collaudo hardware Android, screenshot e suite Node checkout; non si marca DoD. Prossimo: viewport landscape e confronti visuali, poi geografia Five Points storica.

## 2026-11-04 22:00 — Audit rete percorribile della mappa
- Letti integralmente AGENTS.md, SPEC.md, ART_DIRECTION.md, ROADMAP.md, WORKLOG.md, README.md e assets/README.md; esaminato game.js da main.
- Creato `tests/map-connectivity.test.cjs` (commit `b06b074fe4332c422f5ae7c41019313587ab9e17`): flood-fill su griglia A* reale e verifica ingressi di tutti i 15 edifici.
- Verifica V8 effettivamente eseguita sui lotti correnti: 1479 celle libere, una sola componente connessa; ingressi validi per edificio: 3,4,4,3,4,3,4,4,4,4,3,4,3,4,4.
- Il test Node è stato scritto ma non eseguito nel checkout; browser e smartphone reali non disponibili in questo runtime. Nessuna modifica al renderer o ai progetti esterni.
- Prossimo: collaudo browser landscape/fullscreen, poi confronto visivo con cartografia Perris e golden reference.

## 2026-11-04 23:00 — Prima preview autonoma della plancia estesa
- Creati `board-preview.html` (commit `ee421dbbf6a1440c42254d085777c21e69b084af`) e `board-preview.js` (commit `3d732aba8fa0a3220a6e6b72a7e9900bd892a0c2`); ottimizzazione culling/render terreno (commit `7fb231b8788ab2bb70500a8b4c8c15b7d707a5e8`).
- Nuova plancia solo scenografica, isolata dal gameplay: 3×3 settori di 900 unità, cinque assi stradali non ortogonali, arterie secondarie connesse, generazione deterministica di caseggiati modulari e props, minimappa, camera drag, pinch e fullscreen. Nessuna modifica agli NPC o al pathfinding.
- **Limiti:** layout artistico NON tracciato da Perris 1853, silhouette ancora procedurali e insufficienti rispetto al golden concept. Nessuna prova browser reale, screenshot o test Android effettuati in questa esecuzione; verifiche di codice e commit GitHub, non di resa visiva. Non segnare alpha completata.

### 2026-11-04 23:58 CET — Board visual pass
- Commit `c2a3957a8966a2f053a21e0f32f86bc2ab4d8f09`: board-preview.js adds deterministic road-aligned broken cobbles on all road segments and layered slate repairs plus raised roof hatches on tall buildings. These are per-object modular Canvas details; no NPC/gameplay edits.
- V8 JavaScript parse of fetched updated file: PASS. Browser screenshots, Android touch and golden side-by-side: NOT performed (browser automation unavailable in this runtime). Container raw GitHub fetch failed DNS (curl code 6); no claim of rendering validation. Await visual comparison.

## 2026-11-05 — Facciate commerciali e balconi
Commit `77e3b5d8`: nella preview della plancia aggiunti insegne sporgenti, cornici lignee per botteghe, davanzali e ringhiere saltuarie ai piani superiori. Solo rendering; nessun cambiamento NPC/economia. Verificata presenza degli anchor nel sorgente prima della modifica; screenshot browser e Android non eseguiti, quindi confronto GOLDEN ancora aperto.

### 2026-11-05 03:00 — Iterazione atmosfera plancia
Commit `ceee77bcec11945fc46d68263febe9c7bf1d5f07`: aggiunti `drawStreetAtmosphere` e `drawDistrictHaze` in `board-preview.js`. Aloni radiali ambra dei lampioni, piccole pozze di luce e banchi di foschia originali generati deterministicamente in coordinate mondo; pass separato dai palazzi e dalla logica di gioco. Revisione statica del sorgente eseguita; non eseguiti browser screenshot, Node regression o prova Android in questa esecuzione. La plancia resta da confrontare con l'immagine golden e non è approvata.

### 2026-11-05 — Plancia, profili dei tetti
- Commit `677cf5d`: nuovi abbaini con finestra e tetto aggettante, coppie di comignoli in muratura su palazzi 3+ piani; elementi originali deterministici disegnati nel singolo sprite cache, senza modifiche a NPC/IA/economia.
- Verifica effettuata: parsing JavaScript V8 (`new Function`) prima della pubblicazione. **Non eseguiti** browser screenshot, test Android o test Node: fedeltà visiva alla golden reference ancora da dimostrare.

### 2026-11-05 — Carri e cavalli originali (commit `4dac14cf`)
- `board-preview.js`: sostituita la sagoma piatta dei carri con un carro a cassa isometrica, assi di legno, carico, ruote a raggi, stanghe, cavallo con finimenti e zampe. Orientamento variabile per ID, senza asset esterni e senza toccare NPC.
- Verifica: modifica sorgente pubblicata; screenshot browser/Android e test automatici **non eseguiti** in questo turno. Rendering visivo e confronto GOLDEN ancora aperti.

### 2026-11-05 — Scenografia mercato (worker)
Commit `f90db4885619453d777356dd8c20543433ecf973`: introdotti banchi mercatali originali, tettoie e merci in Canvas, generati da botteghe selezionate e ordinati per profondità nel renderer. Nessuna modifica NPC/IA/economia. Verifica statica dei punti di integrazione effettuata; test Node, browser reale, screenshot desktop/mobile e confronto golden NON eseguiti (nessun browser di automazione disponibile in questo turno). Possibili compenetrazioni con facciate da verificare in screenshot. Stato NON approvato.

### 2026-11-05 — Bordature stradali irregolari
Commit `d5f9b7e`: aggiunta in `board-preview.js` una fascia di ciottoli e spigoli irregolari lungo entrambi i margini di ogni segmento stradale, con seed stabile e culling viewport. Obiettivo: rompere le lunghe sagome vettoriali delle strade senza cambiare la geometria o la navigazione. Verifica effettuata: parsing JavaScript con `new Function` nel runtime JS prima della pubblicazione. NON effettuati screenshot browser, prove Android o suite Node; confronto GOLDEN ancora aperto. NPC e gameplay invariati.


### 2026-11-05 — Asset restyling iteration
Commit `108a1175`: normalized six ImageGen building sprites at runtime by scanning alpha bounds once per image and anchoring cropped silhouettes at the ground, with a separate contact shadow. Sources untouched, fallback retained, no NPC changes. GitHub code write confirmed; browser screenshot, Android and Node tests NOT executed. Next: real render comparison and WebP production.

### 2026-11-05 — passata raster su suolo e strade
Commit `f7de871c`: `board-preview.js` carica `terrain_mud.png` e `terrain_cobbles.png` come texture raster, applica pattern con clipping sui poligoni della plancia e delle carreggiate. Fallback vettoriale preservato se caricamento fallisce. Nessun file gameplay modificato. **Non eseguiti** screenshot browser/Android né suite Node in questa esecuzione; resta da verificare continuità e prestazioni, e da convertire in WebP runtime.
