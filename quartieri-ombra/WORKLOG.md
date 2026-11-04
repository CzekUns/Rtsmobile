# Diario avanzamento

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
