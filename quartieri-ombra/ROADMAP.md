### 2026-11-05 22:00 — Audit geometrico comparativo (non approvato)
- [x] `?artAudit=study` visualizza lo studio architettonico SVG già tracciato sulle sei hitbox del blocco Cross Street, usando il viewBox esatto senza padding; `?artAudit=1` conserva la bozza ImageGen non allineata. Modalità soltanto opt-in, senza cambiare `chunk-index.json`.
- [ ] Da verificare screenshot desktop/Android 1×/3×/7.5×; ancora manca il macro-raster ImageGen corretto. Nessuna promozione runtime.


### 2026-11-05 21:00 — Block-2 geometry-locked visual study (NOT approved)
- [x] Added `assets/guides/cross-street-block-2-geometry-locked-art-study.svg`: six buildings traced from the authoritative SVG, with independent walls, slate roofs, brickwork, windows and doors. Preserves positive-slope frontage without rotating the rejected draft (`0b49b6b`).
- [ ] This is a **vector art study**, NOT the requested corrected ImageGen transparent macro-chunk, not a runtime WebP and not validated by browser screenshots. `chunk-index.json` remains unchanged and draft stays opt-in audit only. Next: create corrected ImageGen raster aligned to this geometry, compare 1×/3×/7.5× and individual picking before promotion.

### 2026-11-05 — Primo gruppo ImageGen: conservazione e prova di sovrapposizione (non ancora approvato)
- [x] La nuova immagine continua di un fronte di tenements è stata conservata in **PNG RGBA originale** su GitHub in `assets/source/imagegen-2026-11-05/group_tenements_unaligned_draft.png` (commit `bd22c7b6`) e su Google Drive (ID `1k3kFifxSTf7T_51dLpCzGO6odU5Zsjpp`).
- [x] Creato WebP sperimentale 1332×1160 a trasparenza, con proporzioni originali preservate e margini trasparenti, in `assets/runtime/chunks/block-2-draft-audit.webp` (commit `add2cedc`); è una **bozza per il confronto**, non una risorsa definitiva.
- [x] `board-preview.js` ha una **modalità audit opt-in**: `?artAudit=1` sovrappone per prova il macro-asset al gruppo `block-2` di Cross Street e ne mostra le vere sagome tetto ciano/fronti strada gialli; `?artAudit=clean` mostra la bozza senza guide. La preview normale resta invariata. Boot/pittura del chunk/hitbox e modalità scheletro verificati con Canvas mock V8 (commit `5bf80a2`).
- [x] Provenienza, destinazione e stato non approvato registrati in `assets/chunk-candidates.json` (commit `e1c220a`). **Nessuna iscrizione nel manifest principale `assets/chunk-index.json`**, perché la pendenza illustrata delle facciate non coincide ancora con i tetti/fronti del lotto autorizzato.
- [ ] **P0** Rigenerare il gruppo con angolo della strada esatto, usando `assets/guides/cross-street-block-2-skeleton.svg` come reference rigida, quindi collaudo browser desktop/Android e comparazione a 1×/3×/7.5×. Solo dopo aggiornare `assets/chunk-index.json` con risorse realmente allineate.


### 2026-11-05 — Nuova plancia in tre layer, scheletro e zoom ravvicinato

- [x] Loader automatico da `assets/chunk-index.json` per i soli asset WebP verificati e corrispondenti agli ID-lotto; nessun tentativo di usare slot null (`0dda842a`). La modalità SCHELETRO usa ora solo vettori (nessuna texture raster), conservando il disegno completo di lotti, muri e strade (`d765f029`).

- [x] Implementato `board-skeleton.js`: 454 schede vettoriali con footprint, tetto, facciate street/left/right/rear, porta e tipi `residential/active/decorative`; hit-testing sui poligoni, riconoscimento strada separato, non su box delle immagini (`1c14e50`, `eb0ad23`, `d5d87a8`).
- [x] Definiti **117 chunk artistici** che includono esattamente tutti i 454 lotti; assegnati frame e coordinate per layer di immagine unica; indice di produzione `assets/chunk-index.json` con LOD `base/detail/ultra` ancora a NULL, senza risorse inesistenti (`42c22b6`).
- [x] Creato `board-chunks.js`: registra soltanto immagini realmente presenti, disegna una sola immagine per gruppo pur mantenendo tutte le hitbox individuali; scelte LOD in base allo zoom (`6eb224c`, `c5200f9`).
- [x] `board-preview.js` e entrambe le pagine implementano modalità **SCHELETRO**, **SEGNALINI** residenziali/attività, **GUIDA SVG** del chunk selezionato, evidenziazione dell'intero volume del singolo palazzo e della facciata verso strada, click sulle carreggiate, zoom `0.58×–7.5×` senza cambiare proiezione/camera e fallback vettoriale live a zoom estremo (`4a250ef`, `aaf8b29`).
- [x] Primo export reale per una porzione: [assets/guides/cross-street-block-2-skeleton.svg](assets/guides/cross-street-block-2-skeleton.svg), 6 lotti con tetti, pareti, fronti strada e porte precise (`935880c`, `ff1796b`). Il pilota Canvas è renderizzato a densità 8× per zoom ravvicinato (`19fc8ad`).
- [x] Test permanente `tests/board-skeleton.test.cjs` (5 casi), parsing sorgente e smoke V8 con DOM/Canvas simulato: scena inizializzata, una immagine macro-chunk disegnata, edificio interno selezionabile singolarmente, modalità scheletro, zoom e download guida senza eccezioni (`10792de`). **Suite Node non eseguita su checkout**, sito Pages non raggiungibile dall'attuale ambiente web.
- [ ] **NON ANCORA fatto:** nuovo PNG seamless ImageGen del gruppo Cross Street, registrazione del suo file in runtime, screenshot browser/Android reale e allineamento effettivo disegno/hitbox. L'indice dei chunk contiene LOD null perché non abbiamo ancora arte confermata. Nessuna promessa di zoom senza perdita su PNG insufficientemente risoluti.
- [ ] Dopo il pilota artistico verificato estendere il sistema ai 117 chunk, incluse varianti 2D del terreno e occlusioni; mantenere la golden reference e sospendere NPC fino all'approvazione completa.


### 2026-11-05 20:00 — Cross Street: sei moduli pilota prerender (PARZIALE)
- [x] Nuovo `cross-street-kit.js`: 6 moduli trasparenti generati in Canvas offscreen, con geometria ricavata da ciascun footprint, facciate individuali, tetti, finestre e basamenti. Integrati in entrambe le anteprime prima dei PNG generici, senza modificare NPC.
- [x] Parsing V8 dei sorgenti `cross-street-kit.js` e `board-preview.js`: PASS.
- [ ] Mancano ancora **sei PNG/WebP ImageGen originali** e **cinque raccordi raster condivisi**; i moduli Canvas sono un passaggio grafico intermedio, NON asset finali. Mancano screenshot browser desktop/Android e approvazione. Non estendere ai restanti 448 lotti prima del QA.

### 2026-11-05 — Continuità degli isolati (correzione figurine)
- [x] Nuovo modulo `block-continuity.js` costruisce vicinati reali lungo lo **stesso lato** della stessa via: **337 giunzioni** su 454 lotti, 117 gruppi (105 di almeno due edifici), 170 passaggi `shared` e 167 `passage` (commit `44d2703`). Le giunzioni non alterano collisioni o dati strategici.
- [x] `board-preview.js` posiziona i PNG sulla vera soglia/fronte strada, non sul centro geometrico della figura; crea fondazioni comuni e raccordi isometrici di muratura/tetto o muro basso nei passaggi; usa solo raster A/B con angolo di facciata verificato, mai deformato/mirrored. Per angoli non coperti fallback vettoriale corretto (commit `d461c20`).
- [x] Entrambe le anteprime `board-preview.html` e `board-1860.html` caricano il modulo prima del renderer, con cachebuster aggiornato (`10333af` e `a8d4b32`).
- [x] Nuova suite permanente `tests/block-continuity.test.cjs` e specifica di produzione `BLOCK_ASSET_SPEC.md`: orientamenti, kit left/middle/right/corner, pivot, usura e raccordi con suolo; prompt worker aggiornato per questa priorità.
- [x] Prove V8 sul sorgente GitHub: 337 giunzioni, zero link su lati opposti/strade diverse, zero estremità duplicate, risultati deterministici; bootstrap Canvas mock + zoom/pan/tap/minimappa PASS. **NON equivalgono a screenshot desktop/Android reali.**
- [x] Settore pilota Cross Street: **6 lotti consecutivi** (ID 2,3,4,9,10,11), 5 raccordi condivisi, classe prospettica A reale **33,98°–39,43°**; pivot, impronte e ruoli start/middle/end in `assets/pilot-cross-street.json` (`2eb1a620`), test specifico aggiornato (`3782ea93`). Il kit ImageGen per il settore resta **da produrre**, non inventare file runtime.
- [ ] Fare confronto visivo A/B con foto della build su un isolato pilota, garantendo che le cuciture non coprano porte/finestre e che i raster abbiano l'azimut giusto.
- [ ] Generare e usare **asset modulari originali** di fila (testata sinistra, centrali A/B, testata destra, angolo, tetto e fondazione) per le orientazioni non coperte. La città contiene ancora fallback vettoriali: restyling non ultimato.
- [ ] Migliorare continuità terreno e palazzi su tutti i 9 settori; test hardware mobile/desktop e golden reference. **NPC ancora congelati**.


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


### 2026-11-05 — Raster buildings: transparent-margin normalization
- [x] Runtime crop alpha bounding-box cached per source PNG; real building silhouette fits lot footprint rather than transparent ImageGen canvas. Contact shadows now align to ground. Commit `108a1175`.
- [ ] Still pending: real browser screenshots, Android landscape, WebP optimization, terrain/props/HUD raster integration and visual approval. No gameplay changes.

### 2026-11-05 — raster terrain pass (parziale)
- [x] Layer raster ImageGen fango e acciottolato inseriti nel renderer della plancia, ritagliati ai poligoni mondo (commit `f7de871c`). Source PNG invariati.
- [ ] Convertire in WebP runtime e validare tileability/stacchi con screenshot; browser e Android landscape non ancora collaudati. Non approvato.
