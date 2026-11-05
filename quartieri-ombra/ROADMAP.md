### 2026-11-05 — Prima integrazione runtime asset ImageGen (P0)
- [x] La preview usa ora PNG originali di caseggiati, botteghe, taverne, officine e stalle da `assets/source/imagegen-2026-11-05/` su una selezione deterministica di lotti; profondità, coordinate e hit testing restano basati sul mondo 3×3. Nessuna deformazione non uniforme, nessun mirroring; fallback vettoriale su caricamento fallito, magazzini e parte degli edifici.
- [x] Controllo sintattico V8 `new Function` sul sorgente modificato: PASS.
- [ ] Questa è una prima integrazione, NON il restyling totale: ancora PNG source non ottimizzati, orientamenti e margini trasparenti da verificare, terreno/props/HUD da rasterizzare. Screenshot desktop e Android landscape NON eseguiti; nessuna approvazione visiva.

### 2026-11-05 — Segnaletica mercatale e carri deterministici
- [x] Aggiunte insegne pendenti individuali ai banchi (tavole, simboli e colori deterministici), correzione orientamento carri: `p.seed` anziché `p.id` assente nei props (`e5f9fff5`).
- [x] Parsing V8 `new Function` del sorgente aggiornato: PASS (38203 caratteri).
- [ ] Screenshot browser desktop/mobile, verifica collisioni insegne e confronto con golden ancora aperti. Nessun lavoro NPC.

### 2026-11-05 — Correzione collocazione banchi di mercato
- [x] I banchi mercatali della preview ora sono ancorati alle porte rivolte verso strada, con offset esterno, invece che a un angolo arbitrario del lotto (commit `be52cb08`). Questo riduce il rischio di tettoie incastrate negli edifici.
- [ ] Screenshot browser desktop/Android, verifica collisioni visuali e confronto golden ancora da effettuare. Nessuna approvazione visiva; gameplay congelato.

### 2026-11-05 — Scale antincendio sulle facciate
- [x] Inserite passerelle e scale esterne in ferro su un sottoinsieme deterministico di caseggiati alti, con geometria agganciata alla parete (`e223ab3a`).
- [ ] Rendering browser, suite Node e confronto visivo golden non verificati in questa iterazione: rete locale DNS indisponibile. Non considerare approvata la plancia.

### 2026-11-05 — Stenditoi sui tetti dei caseggiati
- [x] Nuovi stenditoi originali con pali, corda incurvata e panni individuali su una parte dei tetti residenziali alti; integrati nello sprite cache di ogni edificio (`c0827073`).
- [ ] Test automatici, screenshot reali desktop/mobile e confronto golden ancora mancanti: non dichiarare approvazione visiva.

### 2026-11-05 — Silhouette produttive differenziate
- [x] Tetto magazzino con castelletto di sollevamento, puleggia e fune; tetto stalla con lanterna di aerazione a lamelle. Disegno originale modulare integrato nel prerender degli edifici (`ea3a9158`).
- [x] Parsing V8 della nuova `board-preview.js` riuscito; [ ] screenshot browser/Android, confronto golden e suite Node restano da eseguire. NPC invariati.

### 2026-11-05 — Drenaggio urbano e bordi strada
- [x] Aggiunti tombini in ferro e cordoli sconnessi generati in coordinate mondo nella preview (`c232f8eb`), senza modificare logica gameplay.
- [ ] Screenshot browser desktop/mobile e confronto golden ancora da eseguire.

### 2026-11-05 — Cornicioni e marcapiani originali
- [x] Facciate della preview arricchite con lesene laterali, marcapiani irregolari, ombre sotto cornice e giunti di pietra (`d4c18b10`), senza alterare lotti o gameplay.
- [ ] Collaudo browser e screenshot golden ancora necessari; non dichiarare approvata la plancia.

### 2026-11-05 — Usura delle facciate
- [x] Inseriti intonaci scrostati, macchie di fuliggine e sporco alla base dei muri, ritagliati sulle facciate e variati per edificio (`5514e872`).
- [ ] Screenshot della build reale e confronto con golden reference ancora mancanti; nessuna approvazione visiva.


### 2026-11-05 — Rendering strade bagnate
- [x] Aggiunte pozzanghere e riflessi discreti lungo ogni segmento stradale, con distribuzione deterministica e culling viewport (`board-preview.js`, commit `274b4049`).
- [ ] Non ancora verificato screenshot desktop/Android; nessuna approvazione visiva. NPC invariati.
### Rilascio B2 verificato — 2026-11-04
- [x] Workflow [41926287816](https://github.com/CzekUns/Rtsmobile/actions/runs/41926287816): step **Deploy to GitHub Pages = success** (non skipped); prima pubblicazione comprovata del nuovo link `board-1860.html`.
- [x] Test in Node sull'artefatto Pages B2: 49/49 dopo riparazione di tre harness obsoleti; nessuna modifica a NPC, IA, gameplay.
- [ ] Verifica visiva sullo smartphone reale e screenshot del sito pubblico: ancora necessaria; ambiente Chromium disponibile qui nega l'apertura delle pagine (`ERR_BLOCKED_BY_ADMINISTRATOR`).

## Emergenza visibilità plancia — 2026-11-04
- [x] Individuato conflitto nel deploy `41924861810`: `actions/deploy-pages` rifiuta un nuovo deploy mentre uno è in corso; verde dei run precedenti non equivale a deploy perché step `skipped`.
- [x] Aggiunta URL nuova `board-1860.html`, caricamento versionato e watchdog di avvio per evitare la schermata nera senza diagnosi.
- [ ] Verificare che l'ultimo workflow esegua **Deploy to GitHub Pages = success** (non skipped) e che il browser pubblico mostri la nuova build B2.
- [ ] Collaudo screenshot/gesture su browser desktop e Android landscape reale; solo successivamente tornare ai miglioramenti visivi.

# Roadmap operativa — aggiornare ad ogni worker

## Avanzamento reale della nuova plancia — 2026-11-04

- [x] **Nuovo mondo modulare 3×3**: `board-world.js`, 2700×2100 unità logiche, 9 settori popolati, 21 polilinee stradali, **454 edifici** su lotti non sovrapposti, **212 props**. Questi sono dati editabili e ripetibili, NON una singola immagine di sfondo e NON una mappa catastale verificata.
- [x] **Anteprima navigabile**: `board-preview.html`, `board-preview.css`, `board-preview.js` con rendering 2D isometrico, facciate, tetti, insegne/tende, strade e solchi, props separati, camera drag/pinch/rotella, minimappa cliccabile, tap selezione, fullscreen e landscape-only CSS.
- [x] Collegamento `NUOVA PLANCIA` nella pagina del gioco esistente, senza toccare `game.js` o NPC.
- [x] Cache LRU di 320 sprite prerenderizzati per edificio. Verifica V8: 228 sprite creati al primo frame in viewport simulata, nessuna ricostruzione dopo zoom in/out, comandi di disegno successivi ridotti.
- [x] Test di geometria eseguiti direttamente sul sorgente pubblicato: tutti e nove i settori abitati, 454 edifici senza sovrapposizioni, 21 strade e 212 props; parser V8 PASS. Test Node permanente `tests/board-world.test.cjs` pubblicato (non eseguito da Node).
- [ ] **Non raggiunta la qualità visiva finale.** Servono sprite originali dettagliati, inquadratura più fedele al concept approvato, reali screenshot browser desktop/Android landscape e confronto puntuale.
- [ ] Tracciati ispirati storicamente ma non ancora georeferenziati/validati contro Perris 1853. La preview non dimostra fedeltà topografica.
- [ ] Riprendere gli NPC solo dopo approvazione esplicita della plancia. Mantenere l'automazione attiva.


## P0 ASSOLUTA — PLANCIA IMMAGINE APPROVATA E MAPPA ESTESA (2026-11-04)

L'utente ha visto il movimento NPC e ha esplicitamente richiesto di **SOSPENDERE lo sviluppo NPC per il momento**. Concentrarsi esclusivamente su plancia, grafica ambientale, continuità mappa, zoom/camera/minimappa e visualizzazione landscape. **[BOARD_MASTER.md](BOARD_MASTER.md) è il riferimento operativo vincolante**: l'ultimo ImageGen approvato dall'utente è la golden reference prioritaria rispetto ai mockup precedenti. Non riprodurre il film.

- [x] Promosso il riferimento visivo definitivo e conservata un'anteprima autentica, ridotta, nella cartella `assets/references/` (non è uno sprite).
- [ ] Layout continuo **minimo 2×2** rispetto alla finestra rappresentata; preferenza 3×3 settori urbani senza evidenti ripetizioni.
- [ ] Fronti stradali compatti, incrocio a cinque punte riconoscibile, palazzi e architettura densi come reference, atmosfera ambrata/fangosa, carrozze/props.
- [ ] Preview separata o modalità mappa senza NPC, utilizzabile con camera drag/zoom e minimappa in smartphone landscape/fullscreen.
- [ ] Renderer modulare con asset e layer originali, non immagine statica incollata nel campo di gioco.
- [ ] Confronto screenshot della build reale desktop/mobile con golden reference 1672×941; non segnare pronti senza evidenza.
- [ ] Alla soglia grafica, **richiedere valutazione della plancia da parte dell'utente** prima di riprendere NPC/pathfinding/IA.

Fino a nuovo ordine, priorità estetica e urbanistica su gameplay; bugfix gameplay solo se blocca la visualizzazione della preview. I criteri DoD finali rimangono, ma sono rinviati al termine della fase di plancia.


Stato: IN SVILUPPO. Priorità grafica/urbanistica richiesta dall'utente: ricostruzione Five Points > qualità renderer > collaudo > espansioni.

## CRITERIO DI SOLLECITO — alpha visivamente accettabile (2026-11-04)
## Esecuzione immediata sollecitata — miglioramenti grafici (2026-11-04)

- Implementate 5 variazioni originali dell'edilizia (`shop`, `tenement`, `dwelling`, `mill`, `warehouse`) con forme di tetto differenti, falde, cornicioni, comignoli e lucernari disegnati nella proiezione isometrica; commit `0efddc78c7a7d83332239493b2d6f6d55150cce2`.
- Integrati nella build **5 SVG originali già presenti** (barrel, crate, street lamp, fence, lantern) in 15 posizioni prospettiche, con depth sort comune a edifici/unità e fallback procedurale; non sono nuove risorse esterne.
- Nuovo test persistente `tests/streetscape-render.test.cjs`, commit `a25c5d8ece57ef96936a88b4d630908d3123d2ad`; verifiche dinamiche in V8: 5 categorie distinte, 30 poligoni tetto validi, 0 poligoni non finiti, 15/15 props fuori dai footprint di edifici; parsing JS PASS.
- **NON è ancora alpha accettabile**: mancano screenshot veri, confronto storico accurato, asset ricchi individuali, test browser Android e controllo completo della giocabilità.



**Richiesta esplicita:** proseguire le esecuzioni operative fino a un livello grafico e ludico accettabile, non compilare soltanto report o test. Soglia verificabile definita in [VISUAL_ACCEPTANCE.md](VISUAL_ACCEPTANCE.md), tutte le caselle inizialmente APERTE.

Regola per i prossimi worker: **priorità a commit che cambiano tangibilmente il gioco visibile**, con test a supporto. Ogni iterazione deve produrre nuovi elementi di scena/asset, fedeltà dei tracciati stradali o correzione diretta di difetti grafici/UI, oppure documentare un blocco tecnico reale. Non spendere iterazioni solo su suite di test aggiuntive mentre la grafica è ancora prototipale, salvo bug bloccanti.

- [ ] Tracciato Five Points coerente con almeno una mappa storica documentata (Perris 1853) e comparazione OSM attuale attribuita.
- [ ] Quartiere densamente edificato con facciate orientate verso strade e vicoli, 4+ tipologie originali distinte, decorazioni contestualizzate.
- [ ] Proiezione, livelli e sprite coerenti, HUD classico landscape fullscreen realmente utilizzabile.
- [ ] Screenshot desktop e smartphone landscape di build reale confrontati con golden reference; criteri PASS documentati.
- [ ] Partita completa senza regressioni delle meccaniche.
- [ ] Dopo la soglia, mantenere worker attivo per la Definition of Done completa, salvo nuovo ordine esplicito.

## PRIORITÀ VISIVA P0 — città Five Points 1853–1860 (aggiornamento user screenshots)

**Scopo dominante richiesto dall'utente: qualità grafica e coerenza urbanistica prima di espansioni di gameplay.** Consultare [VISUAL_RESEARCH.md](VISUAL_RESEARCH.md) e ART_DIRECTION.md. Non confondere una grafica 2D isometrica con un quartiere storicamente corretto.

- [x] Catalogazione iniziale di Perris 1853, incrocio storico, LoC 1859, OSM moderno e clip cinematografiche come reference **senza** includere materiale non autorizzato nella build.
- [x] Prima variazione **originale e integrata nel renderer** dei fronti edificio: marcapiani, finestre in prospettiva, botteghe, tende, ingressi; geometria dei 15 edifici testata in V8 (846 poligoni, 0 invalidi). Aspetto definitivo da valutare.
- [ ] Costruire base geografica attuale in OpenStreetMap come layer comparativo con attribuzione; evidenziare in documentazione **cosa è sopravvissuto e cosa è cambiato** dal 1853.
- [ ] Leggere la pianta Perris ad alta risoluzione, fissare l'incrocio storico dei Five Points; estrarre e verificare polilinee e isolati con tracciabilità per tratto, niente falsa georeferenziazione.
- [ ] Rifare lotti/fronti più fedeli alla pianta, conservando almeno 15 edifici, accessi, collisioni e unità percorribili.
- [ ] Produrre **sprite originali separati**: almeno 2 residenziali, 1 fila di botteghe/taverna, 2 produttivi, tende, insegne, carri, props e suolo fangoso/lastricato; ciascuno con pivot/footprint e fonte descrittiva.
- [ ] Illuminazione ambra, mattoni degradati, strade strette, densità più disordinata; differenza evidente fra vie commerciali e vicoli poveri.
- [ ] Acquisire screenshot *della build reale* Android landscape e desktop e confrontare con golden reference in-game RTS 1998–2003 e materiali storici, prima di marcare la grafica completa.

Non copiare screenshot della ricerca Google, immagini film o scansioni in app; non affermare autenticità storica dove è presente solo un'interpretazione. Tutte le modifiche restano dentro quartieri-ombra/.

## PRIORITÀ IMMEDIATE — interfaccia mobile landscape e isometria integrale (richiesta utente 2026-11-04)

La grafica del gioco deve essere isometrica al 100% e coerente con il riferimento in-game RTS PC 1998–2003. Prima delle espansioni e del polish completare i seguenti task:

- [x] Impostazione smartphone in landscape-only con schermata di rotazione se portrait; simulazione sospesa in portrait per view mobile.
- [x] Pulsante fullscreen nell'HUD che usa Fullscreen API su gesto utente; tentativo di orientation.lock quando supportato, fallback rispettoso dei limiti browser.
- [x] Shell a dimensioni viewport con scroll di pagina bloccato e input touch riservato al Canvas; HUD non deve trascinarsi con pan/pinch.
- [x] Canvas con backing store in proporzione al contenitore e camera che usa scale cover uniforme senza stretch; vista minimappa derivata dalla dimensione effettivamente visibile.
- [ ] Test browser reale Android landscape: nessun movimento/scroll di barra, minimappa o HUD al trascinamento; pinch solo sulla mappa, bottoni operativi e fullscreen.
- [ ] Test desktop responsive su 16:9, 21:9 e viewport a bassa altezza: campo di gioco deve occupare tutto lo spazio restante, comandi mai tagliati, HUD leggibile, assenza overflow.
- [ ] Renderer isometrico 2D INTEGRALE: griglia, terreno/strade, posizionamento e collisioni edifici, profondità/sorting, unità e interazioni in stessa proiezione; non basta la texture pseudo-isometrica.
- [ ] Utilizzare sprite/props asset library con pivot e footprint appropriati, minimappa/indicatori selezione coerenti.
- [ ] Confronto screenshot desktop e landscape mobile con la golden reference approvata e correzione discrepanze.

Criterio di accettazione: durante una partita in smartphone orizzontale l'utente non può scorrere o spostare con il dito l'INTERA pagina/UI; soltanto la camera della mappa sotto l'HUD fisso. Fullscreen funziona quando consentito, senza promesse di blocco hardware negli altri browser.

## Fase 0 — Fondazioni
- [x] Percorso isolato in repository esistente; niente modifiche ad altri progetti.
- [x] Specifica, confini e roadmap persistente.
- [ ] Prima build web avviabile e raggiungibile su Pages.
- [ ] Test avvio e smoke desktop/mobile.

## Fase 1 — Gameplay completo
- [ ] Mappa isometrica, 15 edifici e movimento di camera.
- [ ] Tre difficoltà, proprietà iniziali corrette e condizioni di fine partita.
- [ ] Selezione e movimento unità tramite percorsi reali.
- [ ] Influenza territoriale basata su livello/distanza/stazionamento.
- [ ] Fedeltà e conquista pacifica con aggiornamento UI.
- [ ] Residenze: reclutamento spontaneo correlato a consenso.
- [ ] Produzione oro, deposito locale, esattore gendarme.
- [ ] Mercenari pagati in oro, combattimento e conquista violenta.
- [ ] IA simmetrica con attività di conquista, presidio, difesa, esazione, acquisto.

## Fase 2 — Gameplay bilanciato
- [ ] Nessuna risorsa/bonus segreti per IA.
- [ ] Test automatici deterministici per fedeltà, reclute, economia, acquisti, IA, vittoria/sconfitta.
- [ ] Partita facile e difficile terminabili; tuning durata/ritmo.
- [ ] Salvataggio/caricamento e versione dello stato.
- [ ] UI touch: pannello selezione, movimento, azioni, zoom e drag senza conflitti. (Pan e pinch implementati; smoke touch ancora da verificare.)

## Fase 3 — Grafica approvata
- [ ] Asset originali, individuali e sostituibili: tile terra, strade, resid, prod, gendarme, mercenario.
- [ ] Isometria 2D 1998–2003 leggibile e coerente con screenshot concept; palette sporca, case di mattoni, fango, luci ambra.
- [ ] UI classica con HUD inferiore, minimappa, pannello unità/edificio, icone e leggenda.
- [ ] Evidenziazione selezione, fedeltà, influenza e stati di combattimento non invasiva.
- [ ] Performance utilizzabile su Android di fascia media e PC.

## Fase 4 — Rifinitura
- [ ] Sonoro originale o di licenza adeguata, controlli audio.
- [ ] Tutorial breve / comandi accessibili.
- [ ] Errori console risolti, nessuna eccezione grave, fallback asset.
- [ ] Accessibilità minima: pulsanti leggibili, dimensioni touch, contrasto.
- [ ] Documentazione avvio, salvataggi, comandi, licenze dei contenuti.

## Definition of Done
- [ ] Tutti i punti di Fasi 1–4 verificati, niente task P0/P1.
- [ ] 2 cicli consecutivi di regressione superati su desktop e mobile/touch.
- [ ] Pubblicazione Pages raggiungibile senza alterare gli altri giochi.
- [ ] Licenze/autorialità degli asset verificabili.
- [ ] Report finale con link Pages e commit, stato `COMPLETATO`.

Non marcare completate azioni non eseguite. L'worker orario resta attivo fino a tutti i criteri sopra, salvo ordine esplicito dell'utente.

## Verifica 2026-11-04 10:00
- Corretto bug esazione: il gendarme ora ritira oro esclusivamente dal produttivo assegnato, non da ogni produttivo nel raggio. IA conserva incarico solo se il produttivo assegnato è ancora idoneo.
- Corretto addebito IA mercenari: il costo viene sottratto soltanto dopo spawn riuscito.
- Verifiche automatiche statiche su sorgente GitHub: 4/4 controlli di regressione puntuali superati. Nessun test browser/touch eseguito; nessuna casella DoD aggiuntiva marcata.

## Verifica 2026-11-04 11:00
- Corretto comando esazione: consentito soltanto a gendarme verso produttivo posseduto; respinto assalto contro edificio alleato.
- Ordine verso edificio irraggiungibile ora segnala esplicitamente il fallimento anziché cambiare selezione silenziosamente.
- Messaggio reclutamento spontaneo mostrato solo se lo spawn è effettivamente riuscito (limite unità).
- Commit codice `da99eaf15e127250a991cfbdbc5b61d77648754c`. Verifica parser JS V8 e 5 controlli sorgente mirati superati; browser e simulazioni dinamiche non eseguiti. Nessuna casella DoD completata.

## Verifica 2026-11-04 12:00
- Pathfinding: rifiuto esplicito di destinazioni con centro della cella occupato, anche quando il punto cliccato cade appena fuori dal perimetro; evita percorsi che terminano dentro gli edifici.
- Eseguiti 5 test dinamici del `route()` reale estratto dal sorgente in V8: percorso libero, punto dentro ostacolo, centro cella ostruito, deviazione attorno a ostacolo, destinazione coincidente (5/5 PASS). Parsing integrale `game.js` superato.
- Commit codice `9b658db08c3a51766454957b4c0a7084d200ea8b`. Non effettuato smoke browser né confronto grafico desktop/mobile: DoD invariata.

## Verifica 2026-11-04 13:00
- Corretto stato terminale: quando il giocatore non possiede edifici né unità, la sconfitta scatta anche con oro residuo, poiché non esiste un edificio da cui assoldare mercenari. Conservata possibilità di recupero con almeno un'unità o edificio.
- Aggiunto `tests/defeat.test.cjs` con 5 casi di regressione eseguibili tramite Node.js; verifica di sintassi del sorgente e 5 casi logici eseguiti in V8 del connettore (PASS). Non eseguito Node locale né browser/touch: nessun criterio DoD marcato.
- Commit codice `27be1bcb7acf8fb4f79610daeccc8ae3d9a1e8d9`; test `3e179cf59da90069c1eea4081014560a7b487793`.

## Verifica 2026-11-04 14:00
- Aggiunta suite persistente `tests/pathfinding.test.cjs` che estrae ed esegue `route()` reale da `game.js` in VM isolata: 7 scenari (corridoio, ostacoli, centro cella, aggiramento, destinazione identica, limiti mappa, secondo ostacolo).
- Commit test `b54525c6cb8ff262effbd3199da82259363055e3`. Quattro scenari dinamici della funzione effettiva eseguiti nel runtime V8 e superati. Esecuzione Node della suite persistente non verificata: container senza accesso DNS a raw.githubusercontent.com. Nessuna casella DoD marcata; mancano browser desktop/touch e screenshot.

## Verifica 2026-11-04 15:00 — prima passata terreno isometrico
- Implementato in `game.js` `drawIsometricGround()`: disegno a diamanti 2:1 di tile fangosi e lastricato, variazione cromatica deterministica e segni di usura; eliminato il precedente fondale a strade ortogonali rettangolari.
- Aggiunto `tests/isometric-ground.test.cjs`: controlla rapporto 2:1, densità dei tile e determinismo. Esecuzione V8 diretta della funzione reale: 462 riempimenti, 459 contorni, vettore primo spigolo (+48,+24), PASS. Sintassi `game.js` PASS.
- **Parziale, non completato:** edifici, collisioni, unità, selezione e minimappa mantengono coordinate cartesiane: non è ancora isometria 100%. Occorre introdurre una proiezione unificata con inversa per hit-test, pathfinding e camera, e profondità sprite; non marcare Fase 1/3 completata.
- Non effettuati browser smoke, Android fullscreen/landscape, confronto screenshot reference. Nessun altro file fuori `quartieri-ombra/` toccato.


## Priorità cartografica storica — Five Points, circa 1853
- [ ] Ricostruire il tracciato stradale reale da William Perris, *Maps of the City of New-York*, vol. 3, tavola 25 (1853), integrando la cartografia 1831 e viste d'epoca. OSM moderno soltanto come orientamento, non come sorgente della topografia ottocentesca.
- [ ] Sostituire i 15 edifici in scacchiera con lotti irregolari lungo fronti strada, corti e vicoli, senza perdere giocabilità, collisioni e raggiungibilità.
- [ ] Introdurre dati geometrici separati (polilinee stradali, lotti, footprint, punti di accesso) e documentare scala/semplificazioni rispetto alla mappa storica.
- [ ] Confrontare il risultato con la fonte storica e verificare condizioni di licenza per ciascuna immagine di riferimento; NON importare scansioni come sprite di gioco.

Fonte primaria: https://commons.wikimedia.org/wiki/File:Perris_Manhattan_V._3_Plate_25_publ._1853.jpg (William Perris, 1853, dominio pubblico USA); fonte iconografica: https://www.loc.gov/item/2006677419/ (incisione della zona, 1859).
Nota: la proiezione isometrica non deve essere confusa con la regolarità urbanistica. Il renderer può avere una griglia tecnica invisibile, ma la città non deve essere una scacchiera.

## Verifica 2026-11-04 16:00
- Proiezione ortografica 2:1 unica per terreno, footprint edifici, sprite unità, selezione e profondità. Mappatura inversa touch e zoom nello stesso sistema; pathfinding e influenza restano in coordinate logiche invarianti.
- Commit codice `75326e8`; test di proiezione `1aabeba`. Parsing JS verificato prima del commit. Test Node persistente creato, non eseguito in browser reale. Layout e collocazione storica ancora da rifinire.
- La casella renderer INTEGRALE rimane aperta finché collaudo mobile, asset e screenshot golden reference non sono verificati.

## Verifica 2026-11-04 17:00 — primo layout Five Points irregolare
- Sostituiti i 15 edifici in griglia con 15 lotti a coordinate irregolari, con distanze di sicurezza fra collisioni. Creati cinque tracciati stradali spezzati proiettati isometricamente; eliminata la ripetizione di strade ortogonali ogni N tile. Commit `d06ca32973a169ae181f84bf890aff2ae028838a`.
- Test persistente `tests/irregular-map.test.cjs` (commit `6e0f5f67db81454eb8ad02332852026a98b6f33f`) per numero lotti, assenza sovrapposizioni, irregolarità e tracciati. Eseguiti controllo sintattico V8 e verifica geometrica diretta (PASS). Test Node/browser non ancora eseguiti.
- ATTENZIONE: interpretazione ludica PRELIMINARE, non ricostruzione cartografica verificata. Necessaria georeferenziazione della pianta Perris 1853 e confronto con mappe/immagini originali prima di dichiarare fedeltà storica. I nomi stradali sono riferimenti storici, non attribuzioni di coordinate esatte.
- Restano: percorso navigabile lungo le vie, allineamento dei fronti edificio, asset e test smartphone reali. Nessuna casella DoD completata.

## Verifica 2026-11-04 18:00 — corridoi stradali sgombri
- Corrette le interferenze fra strade ed edifici del primo layout irregolare: ricollocati 8 dei 15 lotti mantenendo cinque polilinee stradali, tutti i tipi e gli ID degli edifici, collisioni A* e logica di proprietà.
- Aggiunto test persistente `tests/road-clearance.test.cjs`: distanza geometrica campionata ogni 2 unità fra ciascun segmento stradale e tutti i 15 footprint, comprensiva di metà larghezza strada e margine collisioni 10 unità. Eseguito lo stesso controllo dinamico V8 sulla geometria letta dalla main: **255 combinazioni strada/lotto PASS, zero interferenze, minimo margine residuo 0,66 unità**; 105 coppie di edifici senza sovrapposizioni; parsing JS PASS.
- Commit codice `9c803021`, test `a0fc23ae`. Test Node persistente non eseguito nell'ambiente, né smoke browser desktop/Android o screenshot comparativo; nessuna casella DoD chiusa.
- **Nota storica:** layout ancora artistico, non rilievo catastale verificato. Prossimo passo: percorribilità reale, maggiore separazione fisica nei punti stretti, allineamento dei fronti strada e confronto con Perris 1853.


## Verifica 2026-11-04 19:00 — spawn navigabili su lotti irregolari
- Corretto `spawn()`: ora controlla confini mappa, collisione puntuale e centro cella A* per tutti e quattro gli accessi esterni, scegliendo soltanto un ingresso libero. Se nessun accesso è disponibile lo spawn fallisce senza aggiungere unità e senza consumare ID.
- Commit codice `0c87aed`; test permanente `tests/spawn-access.test.cjs` commit `57550f5`.
- Verifica V8 dinamica della funzione originale estratta da `game.js`: 15 edifici × 4 rotazioni di accesso = **60/60 spawn validi** con rotta locale percorribile; parsing JavaScript PASS. La suite Node persistente non è stata eseguita; mancano ancora browser desktop/Android, test completo di connettività stradale e confronto con mappa Perris.
- Nessun criterio Definition of Done aggiuntivo marcato: la geometria storica resta una reinterpretazione, e la scala/camera isometrica va verificata in browser reale.


## Verifica 2026-11-04 20:00 — camera isometrica e minimappa
- Corretto `game.js`: limiti camera calcolati in coordinate **proiettate** (inclusi tetti e margini), con possibilità di offset negativo; la camera precedente usava impropriamente W/H logici e poteva tagliare gli edifici periferici.
- Inizializzazione della camera vincolata ai limiti del quartiere. Minimap disegna le stesse polilinee delle strade e gli edifici/unità proiettati in 2:1, con rettangolo di viewport in coordinate isometriche anziché cartesiane.
- Commit codice `53d78723140e6025511cd9eea5646ade041082aa`, test `bb54e06d44ae9f14379ecbf9154d83c46412cddd`. Test dinamici V8 eseguiti: 6 viewport/zoom × 2 estremi di camera (PASS), 306 coppie iso forward/inverse (errore massimo 2.28e-13), parser integrale PASS. Suite Node persistente creata ma non eseguita in Node locale; test visivi Android/browser reali NON eseguiti.
- Limite aperto: CAMERA_BOUNDS è un bounding box progettato per il layout attuale, da ricalcolare dinamicamente quando cambiano lotti/asset; la mappa storica resta artistica, non georeferenziata. Non completare caselle DoD.

## Verifica 2026-11-04 21:00 — Gesture camera isometrica
- Corretta la gestione multi-touch: due dita spostano la camera anche senza variare la distanza; pinch zoom centrato sulle dita; dopo pinch non viene emesso un tap spurio dal dito rimasto.
- Gestiti `pointercancel` e `lostpointercapture` per evitare puntatori bloccati.
- Commit codice `2f81d0c482a97a6e07f9d16682b35a4def169323`, test permanente `17f1c3d035cc9c072d2ef4ceb1f42e7d598a185a`.
- Verifica dinamica V8 sugli handler REALI estratti da main: tap singolo, pan a due dita, assenza tap accidentale, pinch zoom e reset dei pointer: 5/5 PASS; sintassi JS PASS. Suite Node persistente non eseguita su checkout, browser mobile/desktop NON collaudati: nessuna casella DoD completata.

## Verifica 2026-11-04 22:00 — Connettività integrale A*
- Nuovo test persistente `tests/map-connectivity.test.cjs` legge i lotti direttamente dal `game.js` reale e verifica con BFS che tutte le celle libere appartengano alla stessa componente, e che ogni edificio abbia almeno un ingresso connesso.
- Verifica dinamica indipendente sulla geometria corrente: 1479 celle percorribili, 1 sola componente; 15/15 edifici con accesso valido (3–4 accessi ciascuno). Commit test `b06b074fe4332c422f5ae7c41019313587ab9e17`.
- Non eseguiti Node CLI della suite persistente, browser desktop/Android, fullscreen, screenshot golden reference. Non segnare DoD completata.

### 2026-11-04 — preview plancia modulare, prima iterazione
- [x] Creata pagina isolata `board-preview.html` con renderer `board-preview.js`: nove settori di produzione contigui, cinque arterie ramificate, case decorative modulari con tetti/facciate/finestre e props, camera drag/pinch/zoom, minimappa e fullscreen opzionale. NPC e meccaniche non modificati.
- [ ] **Non validato in browser**: la preview è una prima struttura procedurale e NON soddisfa ancora la densità/fedeltà del concept; servono screenshot desktop/landscape, ottimizzazione, asset più ricchi, verifica storica Perris e approvazione utente.

### Plancia — iterazione visiva 2026-11-04 23:58 CET
- [x] Nuova passata grafica effettiva: ciottoli irregolari per tratto stradale, riparazioni in ardesia e abbaini/sopralzi sui tetti alti (`c2a3957`). Parsing V8 PASS.
- [ ] Browser reale desktop/mobile landscape, screenshot comparato con reference approvata, controllo prestazioni e fedeltà visiva: ancora da verificare. Non equivale ad approvazione.

- [x] Iterazione grafica 2026-11-05: insegne botteghe, cornici, davanzali e balconi nella preview (`77e3b5d8`).
- [ ] Collaudo browser desktop/mobile landscape con screenshot e confronto GOLDEN: ancora necessario.

### 2026-11-05 — Illuminazione ambientale modulare
- [x] Nuovo pass di rendering world-space per aloni ambra dei lampioni, riflessi a terra e 58 banchi di foschia a coordinate fisse; commit `ceee77bc`. Nessuna modifica a NPC o gameplay.
- [ ] Screenshot desktop/Android e confronto con golden reference ancora mancanti; alpha visiva NON approvata.

### Aggiornamento 2026-11-05 — P0 plancia
- [x] Iterazione grafica visibile: abbaini e coppie di camini sui tetti, commit `677cf5d` (solo `board-preview.js`).
- [ ] Screenshot reale desktop/mobile landscape e confronto con golden reference: NON verificati.
- [ ] Alpha visiva accettabile / approvazione utente: NON raggiunte.

### Aggiornamento plancia 2026-11-05
- [x] Carri con sagoma isometrica dettagliata, cavallo e finimenti originali nel renderer (`4dac14cf`).
- [ ] Collaudo browser reale desktop/mobile landscape, screenshot e confronto GOLDEN; non dichiarare approvata la plancia.

- 2026-11-05: plancia, nuovi banchi di mercato con tettoie e merci come layer depth-sorted indipendente (commit f90db488). Verifica visiva browser/mobile e confronto GOLDEN ancora NON eseguiti; non segnare alpha approvata.

- [x] 2026-11-05: bordi stradali irregolari con ciottoli deterministici nei segmenti delle vie (commit `d5f9b7e`). Resta aperto il confronto screenshot browser con la golden reference e il test mobile landscape; non considerare questa rifinitura un'approvazione.
