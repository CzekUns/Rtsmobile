# Checkpoint · SKH-TERRAIN-002 — vegetazione, rocce e rilievi originali

- **Stato:** READY; nessun nuovo asset naturale convertito da questo task al momento dell'handoff.
- **Owner:** SKH-106 (integrazione). La corsia SKH-101 Assets è una possibile fonte di export isolati; mantenere l'ownership di WORKSTREAMS.json.
- **Data:** 2026-11-13.
- **Main release di partenza:** `c1a9afb39f4cd52e4a39f94addc4a5efe55444c2`, PR #118 coste SG.
- **Branch assegnato:** `agent/skh-integration/original-landscape-overlays` (creare solo se inesistente); PR nuova da aprire solo per questo task.
- **Test del nuovo task:** NOT_RUN. Non confondere con la CI SG.
- **Sorgente 7KAA pinned:** `the3dfxdude/7kaa@14e6fdfba9481af4dc3a54722614a608776e20bc`, licenza GPLv2 or later, verificare ogni archivio specifico prima della conversione.
- **Manifest e asset SG già pubblicati:** `assets/manifests/TERRAIN1-SG-coast-16x12.json` e `assets/previews/TERRAIN1-SG-coast-16x12.png`. Non duplicarli.

## Singolo prossimo passo
Catalogare nel codice sorgente 7KAA e nel suo `data/RESOURCE` le risorse effettive degli alberi/foreste, rocce e colline. Distinguere overlay vs terreno e i rispettivi ancoraggi/profondità; per almeno un gruppo verificare offset/bitmap originale e palette, registrando hash reali e il nome del formato. Poi creare sullo stesso branch il primo atlas riproducibile e il checkpoint con record di provenienza e test.

## Obiettivo grafico verificabile
Sostituire un gruppo coerente di elementi naturali provvisori con elementi originali, rispettando layering e zoom, senza toccare la simulazione o rompere le coste appena pubblicate. Creare anteprima/campioni 1×/2× per QA.

## Esecuzioni
| Esecuzione | Prova | Passaggio successivo |
|---|---|---|
| Handoff 2026-11-13 | Nessun codice naturale nuovo; PR #118 coast pubblicata | individuare risorse originali e caratteristiche layering |

## Esecuzione 2026-11-13 16:00 CET — primo decoder originale
- **Branch:** `agent/skh-integration/original-landscape-overlays` creato da main; ultimo commit codice `d435eeaa105424db7350680ca366150531338261`.
- **Modifiche:** `tools/assets/nature-database.mjs` e `tests/assets/nature-database.test.mjs`. Decoder record packed + framing dBASE III per PLANT/PLANTBM e ROCK/ROCKBLK/ROCKBMP/ROCKANI, test per offset signed, puntatori little endian, limiti e marker DBF.
- **Provenienza verificata nei sorgenti:** `the3dfxdude/7kaa@14e6fdfba9481af4dc3a54722614a608776e20bc`, `include/OPLANT.h`, `src/OPLANT.cpp`, `include/OROCKRES.h`, `src/OROCKRES.cpp`; GPL-2.0-or-later. Le risorse si chiamano `PLANT1.RES`, `PLANTBM1.RES`, `I_PLANT1.RES`, `ROCK1.RES`, `ROCKBMP1.RES`, `ROCKBLK1.RES`, `ROCKANI1.RES`, `I_ROCK1.RES` quando terrain_set=1. I byte originali e i rispettivi SHA-256 **non sono ancora verificati**.
- **Test:** npm locale NOT_RUN: checkout Git fallito con `Could not resolve host: github.com`. CI del branch non ancora verificata; nessuna dichiarazione PASS. Nessuna immagine/atlas originale prodotta, nessun rendering modificato e nessun merge/Pages.
- **Prossimo passo unico:** verificare CI sul nuovo HEAD e correggere errori; poi recuperare gli archivi originali PLANT1/PLANTBM1/I_PLANT1 con hash SHA-256, decodificare un record bitmap reale e generare un primo atlante di vegetazione con palette originale e test pixel, mantenendo il medesimo branch/PR.

## Esecuzione 2026-11-13 17:00 CET — fix parser DBF
- **PR:** #120 draft, branch `agent/skh-integration/original-landscape-overlays`.
- **Codice:** `3775124eedb518b4c960e0d4b7bc65cf64d88ba2` corregge `/^\\\\d+$/` (regex che cercava il backslash letterale) in `/^\\d+$/` per i campi numerici ASCII di PLANT/ROCK. `486b982fd1d3b3a8ad75c8fe69de0e78bdaa797b` aggiunge regressione con campo `001` valido e `0A1` invalido.
- **HEAD codice prima del checkpoint:** `486b982fd1d3b3a8ad75c8fe69de0e78bdaa797b`. **Branch HEAD finale:** commit di questo checkpoint (vedere cronologia branch).
- **Verifica:** interrogazione GitHub Actions sui commit `d435eeaa105424db7350680ca366150531338261` e `3775124eedb518b4c960e0d4b7bc65cf64d88ba2` non ha restituito run associate. npm test/check **NOT_RUN**, nessun checkout locale disponibile in questa esecuzione. CI nuovo HEAD non certificato. Nessun merge, Pages, Android o confronto visivo.
- **Asset originali:** nessun nuovo archivio/bitmap/hash recuperato o certificato in questa esecuzione.
- **Prossimo passo unico:** verificare Actions per HEAD della PR #120, correggere eventuale errore; quindi recuperare PLANT1.RES/PLANTBM1.RES/I_PLANT1.RES dal commit upstream pinned, registrarne SHA-256 e decodificare una bitmap originale con palette verificata per il primo atlante vegetazione.


## Esecuzione 2026-11-13 18:00 CET — bitmap PLANT e integrità riferimenti
- **Stato iniziale:** PR #120 draft; HEAD checkpoint `5dc1e0c2d1344f83c6a28f4e053ddefaee3a728d`. GitHub Actions per tale SHA: run #43458300084 SUCCESS. Non certifica i nuovi commit.
- **Sorgente verificata:** `the3dfxdude/7kaa@14e6fdfba9481af4dc3a54722614a608776e20bc/src/OPLANT.cpp`, GPL-2.0-or-later: `bitmap_ptr` come uint32 LE, `read_imported(bitmapOffset)`, bitmap width/height come short 16-bit LE, `bitmap_count = 1 + atoi(...)`; `include/OPLANT.h` per campi. La palette e i byte originali non sono ancora acquisiti.
- **Codice pubblicato:** `bc1711b946850133238130b931556a8d63b25c96` aggiunge `tools/assets/nature-bitmap.mjs`: lettura sicura di bitmap indicizzata e verifica range/codici dei riferimenti 1-based PLANT→PLANTBM; `5a5f45306a9ed9da4af5092e29db074c321a410d` aggiunge `tests/assets/nature-bitmap.test.mjs` con 4 test (framing LE, errori, link e mismatch). **HEAD codice:** `5a5f45306a9ed9da4af5092e29db074c321a410d`; branch HEAD finale include questo checkpoint.
- **Prove:** npm locale NOT_RUN: `git ls-remote https://github.com/CzekUns/Rtsmobile.git HEAD` fallisce `Could not resolve host: github.com`. CI nuova HEAD non ancora verificata. Nessun asset autentico, SHA-256, atlas, Canvas, Pages, Android o merge prodotti in questa run.
- **Singolo prossimo passo:** controllare CI sul nuovo HEAD e correggere eventuali fallimenti; recuperare `PLANT1.RES`, `PLANTBM1.RES`, `I_PLANT1.RES` e palette originale dal pinned upstream con SHA-256, generare una fixture bitmap reale e un atlas PNG riproducibile; solo dopo collegare rendering e preview 1×/2×.

## Esecuzione 2026-11-13 19:00 CET — exporter atlas originale con provenance gate
- **Task:** SKH-TERRAIN-002, PR #120 draft, branch `agent/skh-integration/original-landscape-overlays`.
- **CI precedente:** Actions #43469076051 SUCCESS sul checkpoint `e68176f180c6ad82c7ac36c51fcca25fd474fed6` (non prova del nuovo HEAD).
- **Codice nuovo:** `577fbe8fbdbf79f4cf28ca720a4294f6ac40c335` crea `tools/assets/export-plant-atlas.mjs`: esportazione PNG indicizzata con dimensioni originali e posizionamento shelf, manifest PLANT/PLANTBM, provenienza GPL e hash SHA-256 obbligatori di quattro input, sorgente upstream pinned. `42a3074c63233ba97263ef8ffab59f34ccba1a38` crea `tests/assets/export-plant-atlas.test.mjs` (determinismo, header PNG, manifest, rifiuto hash/commit/palette non verificati). Test fixture **sintetiche esclusivamente per test**; nessun asset grafico sintetico esportato nel gioco.
- **HEAD codice prima del checkpoint:** `42a3074c63233ba97263ef8ffab59f34ccba1a38`; HEAD finale è il commit che aggiorna questo checkpoint.
- **Limiti:** recupero archivi originali e SHA reali non completato; nessun atlante autentico, Canvas, preview 1x/2x, merge, Pages o prova Android. DNS checkout `Could not resolve host: github.com` già riprodotto. `npm test`/`npm run check` locali NOT_RUN; CI del nuovo HEAD non ancora certificata.
- **Singolo prossimo passo:** verificare CI dell'HEAD checkpoint, correggere eventuali errori; acquisire PLANT1.RES, PLANTBM1.RES, I_PLANT1.RES e PAL_STD.RES dall'upstream pinned, calcolare SHA-256 reali e usare l'exporter per produrre il primo PNG e manifest autentici sullo stesso branch.


## Esecuzione 2026-11-13 20:00 CET — trasparenza indicizzata e limiti memoria
- **Task/PR:** SKH-TERRAIN-002, [#120](https://github.com/CzekUns/Rtsmobile/pull/120) draft; branch `agent/skh-integration/original-landscape-overlays`.
- **CI checkpoint precedente:** [Actions #43478190361](https://github.com/CzekUns/Rtsmobile/actions/runs/43478190361) SUCCESS per `914a53277965d4e527ea0a04fe370b3d3891c285`.
- **Codice pubblicato:** `81fb2f222fc71d2a24820468cabdb563fcad8291` aggiunge supporto PNG tRNS con indice trasparente esplicito (nessun indice inventato), preservando output preesistente quando non fornito; `f49d37721a7e4878c55791b0f83a36da9a2b8e53` collega la trasparenza opzionale all'export/manifest e rifiuta atlas oltre 10M pixel prima di allocare; `e39c5168f81a7d9e98bea8df49d6c42bec70a749` aggiunge test su tRNS, indice invalido e archivio 4096×4096.
- **Verifica:** Actions interrogate per commit codice `e39c5168f81a7d9e98bea8df49d6c42bec70a749`: nessuna run associata al momento del controllo. npm test/check locale **NOT_RUN** perché `git ls-remote https://github.com/the3dfxdude/7kaa.git HEAD` restituisce `Could not resolve host: github.com`. Non attribuire PASS ai nuovi commit.
- **Limitazioni:** non acquisiti PLANT1.RES/PLANTBM1.RES/I_PLANT1.RES/PAL_STD.RES con hash upstream; nessun PNG vegetale autentico, nessuna integrazione Canvas, preview 1×/2×, merge, Pages o Android. L'indice trasparente deve essere verificato contro il decoder 7KAA prima di abilitarlo.
- **Branch HEAD codice prima del checkpoint:** `e39c5168f81a7d9e98bea8df49d6c42bec70a749`. HEAD finale è il commit di questo checkpoint.
- **Singolo prossimo passo:** verificare la CI dell'HEAD del checkpoint, correggere se rossa; recuperare gli archivi originali PLANT e PAL_STD dal pinned upstream, calcolare SHA-256, determinare indice trasparente dai sorgenti 7KAA e generare PNG+manifest autentici mediante exporter esistente.


## Esecuzione 2026-11-13 21:00 CET — pagina QA 1×/2× per atlante PLANT
- **Task/PR:** SKH-TERRAIN-002, PR #120 draft; branch `agent/skh-integration/original-landscape-overlays`.
- **CI checkpoint precedente:** GitHub Actions #43487548236 SUCCESS per HEAD `32e7fb376820d71130cc4728c5a0ee07b31053c9` (verificato via commit workflow runs). **Non** certifica i commit nuovi.
- **Codice pubblicato:** `ba681f40c0409b4b90630fabdf6f6aa88c918a28` aggiunge `tools/assets/plant-atlas-preview.mjs`, pagina HTML deterministica da manifest dell'exporter, atlas originale a zoom 1×/2× senza interpolazione, tabella bitmap/ancoraggi e dichiarazione esplicita di QA non eseguito; `7c0b83b41c7ecbe10576478c2b2fb165695a8232` aggiunge `tests/assets/plant-atlas-preview.test.mjs` (zoom, limiti geometria, escaping). Non introduce pixel o immagini sintetiche nel gioco.
- **Verifica:** `git ls-remote https://github.com/CzekUns/Rtsmobile.git HEAD` fallisce `Could not resolve host: github.com`. npm test/check locali NOT_RUN. CI nuovo HEAD ancora non certificato. Nessun merge/Pages/Android o confronto reale 7KAA.
- **Sorgenti:** interrogato GitHub upstream pinned: `data/RESOURCE/PLANT1.RES` restituisce contenuto DBF, ma il connettore non garantisce byte binari integrali per hashing. Non sono stati calcolati SHA-256 autentici né generati atlas/preview da bitmap originali. Restano mancanti PLANTBM1.RES, I_PLANT1.RES e palette con byte affidabili.
- **Branch HEAD codice prima del checkpoint:** `7c0b83b41c7ecbe10576478c2b2fb165695a8232`. HEAD finale: commit di questo checkpoint.
- **Singolo prossimo passo:** verificare CI dell'HEAD checkpoint, correggere eventuali failure; acquisire in modo byte-exact i quattro archivi upstream pinned (PLANT1/PLANTBM1/I_PLANT1/PAL_STD), registrarne SHA-256 e generare atlas PNG, manifest e pagina QA 1×/2× con gli strumenti già pubblicati.


## Esecuzione 2026-11-13 22:00 CET — acquisizione binaria pinned e provenance
- **Task/PR:** SKH-TERRAIN-002, [#120](https://github.com/CzekUns/Rtsmobile/pull/120) draft; branch `agent/skh-integration/original-landscape-overlays`.
- **CI checkpoint precedente:** [Actions #43498189697](https://github.com/CzekUns/Rtsmobile/actions/runs/43498189697) SUCCESS sul checkpoint `437b9f0afb331427b779d8547759b976a68de5dc`; non certifica i commit di questa run.
- **Codice pubblicato:** `2cec66629fb6af21332049f6aa6e0dda9a4980db` aggiunge `tools/assets/fetch-plant-resources.mjs`: downloader byte-exact dei quattro archivi 7KAA pinned tramite raw.githubusercontent.com, registrazione SHA-256 e lunghezza per ciascun file, rifiuto di commit diverso, HTTP error, payload vuoto o oversize, scrittura senza sovrascrittura. `677956ee0c7387446bb30f7ab850113ac44b8f81` aggiunge test con fetch mock su byte binari, hash e fail-closed.
- **Limite:** downloader predisposto ma archivi NON scaricati in questa run, SHA-256 reali NON disponibili, nessun PNG autentico/Canvas/merge/Pages/Android. DNS locale `git ls-remote https://github.com/CzekUns/Rtsmobile.git HEAD` → `Could not resolve host: github.com`; npm test/check NOT_RUN. CI sul nuovo HEAD ancora non verificata.
- **Branch HEAD codice prima del checkpoint:** `677956ee0c7387446bb30f7ab850113ac44b8f81`; HEAD finale: commit checkpoint della presente esecuzione.
- **Singolo prossimo passo:** verificare CI sull'HEAD del checkpoint, correggere eventuali failure; eseguire `node seven-kingdoms-html/tools/assets/fetch-plant-resources.mjs <directory-temporanea>` in runner con rete, usare hash e byte effettivi per generare l'atlante PNG e manifest autentici con exporter esistente, pubblicando preview 1×/2×.

## Esecuzione 2026-11-13 23:00 CET — pipeline unica originale PLANT
- **Task/PR:** SKH-TERRAIN-002, PR #120 draft, branch `agent/skh-integration/original-landscape-overlays`.
- **CI checkpoint precedente:** [Actions #43506553373](https://github.com/CzekUns/Rtsmobile/actions/runs/43506553373) SUCCESS per `edb733ab23d9cc51f6705c2186f00ef76938b4ba`; non certifica questo HEAD.
- **Codice pubblicato:** `bb385bca1041f80579d7f8eba11824d7b3ce1f15`, `14648244878e66b0d0d8d4bf7b64a8190739ab75`, `a524e04df357ec91129692c03616edcfb91e6f9e`. Nuovo `tools/assets/build-original-plant-atlas.mjs`: pipeline unica che scarica i quattro archivi upstream pinned, verifica SHA-256 via exporter esistente, genera PNG originale, manifest con URL/hash e anteprima 1×/2×. Fallisce prima di scrivere output se il download, il decoder o l'export falliscono. Non sono state create immagini sintetiche.
- **Verifica:** CI sul nuovo HEAD NON ANCORA CERTIFICATA; npm test/check locali NOT_RUN, checkout non disponibile. Nessun download originale o PNG eseguito in questa run, nessun merge/Pages/Android. Il codice non è ancora integrato in Canvas.
- **HEAD codice prima del checkpoint:** `a524e04df357ec91129692c03616edcfb91e6f9e`. Il commit del checkpoint è il nuovo HEAD finale del branch.
- **Singolo prossimo passo:** verificare la CI esatta del nuovo HEAD e correggere qualsiasi failure; poi eseguire `node seven-kingdoms-html/tools/assets/build-original-plant-atlas.mjs <directory-temporanea>` su runner con rete, controllare hash e pixel originali, pubblicare PNG/manifest/preview nella stessa PR.


## Esecuzione 2026-11-13 23:58 CET — esecuzione pipeline su runner CI
- **Task/PR:** SKH-TERRAIN-002, PR #120 draft, branch `agent/skh-integration/original-landscape-overlays`.
- **Stato iniziale:** checkpoint `588e4524858afd6fd6600bccc411b7255162c992`; pipeline originale PLANT già codificata ma mai eseguita su byte autentici.
- **Codice pubblicato:** `a386b0af5fc6e723b353cb2b7298f302cae8dc02` modifica `.github/workflows/seven-kingdoms-html-ci.yml`: nuovo job `original-plant-atlas` limitato al branch/PR di questo task. Esegue davvero `build-original-plant-atlas.mjs` sul runner Ubuntu con Node 22 e pubblica PNG, manifest SHA-256 e preview QA 1×/2× come artefatto Actions (retention 14 giorni). Il job fallisce esplicitamente se download/decoder/export non riesce; non maschera gli errori. Il test/check preesistente resta invariato.
- **Verifica locale:** `git ls-remote https://github.com/CzekUns/Rtsmobile.git HEAD` → `Could not resolve host: github.com`; `npm test` e `npm run check` NON eseguiti localmente. La query commit status per `588e4524858afd6fd6600bccc411b7255162c992` non ha restituito statuses; nessuna CI nuova certificata. Il workflow appena pubblicato deve ancora produrre una run verificabile. Nessun PNG, hash o preview autentici certificati in questa esecuzione; nessun merge/Pages/Android.
- **HEAD codice prima del checkpoint:** `a386b0af5fc6e723b353cb2b7298f302cae8dc02`. HEAD finale è il commit di questo checkpoint.
- **Singolo prossimo passo:** controllare il job `original-plant-atlas` sul nuovo HEAD della PR #120; se fallisce, leggere il log e correggere precisamente download/decoder/export nel branch. Se riesce, recuperare l'artefatto PNG+manifest+preview con SHA-256 verificati e integrarli nella PR e poi nel Canvas con layering e test.


## Esecuzione 2026-11-14 00:55 CET — fix palette originale dopo CI rossa
- **Task/PR:** SKH-TERRAIN-002, PR #120 draft; branch `agent/skh-integration/original-landscape-overlays`. Inizio HEAD `1859b9d5c85d29cae5cfb959c4aaae9e524ef086`.
- **CI esatta iniziale:** [Actions #43523658327](https://github.com/CzekUns/Rtsmobile/actions/runs/43523658327) FAILURE su `1859b9d5c85d29cae5cfb959c4aaae9e524ef086`. Jobs falliti: `Original 7KAA PLANT atlas acquisition` nello step `Acquire pinned original PLANT resources and render reproducible atlas`, e `JS tests & stream scope` nello step `Chromium HUD interaction smoke`. Log testuali non accessibili tramite il connettore GitHub; non attribuire una causa certa a entrambi i fallimenti.
- **Difetto verificato dal codice:** `PAL_STD.RES` originale upstream pinned è lungo **776 byte** (confermato directory upstream), mentre `export-plant-atlas.mjs` rifiutava ogni palette diversa da 768 byte. Il decoder costiero già integrato usa 8 byte header (uint32 LE 0x308) + 768 RGB. Questa discrepanza impedisce l'export con la palette originale.
- **Codice pubblicato:** `b622faf8b7c02f2ed2ce013a40080204ce2501c1` aggiorna `tools/assets/export-plant-atlas.mjs` per accettare il contenitore originale 776 byte, validare header 0x308 ed estrarre i 768 byte RGB. Mantiene la compatibilità delle fixture raw RGB. `66409703303eabe5cbd3a40df343cccf2ca27c78` aggiunge test di regressione per palette 776 valida e header corrotto in `tests/assets/export-plant-atlas.test.mjs`.
- **Verifica:** npm test/check locali NOT_RUN: `git ls-remote https://github.com/CzekUns/Rtsmobile.git HEAD` restituisce `Could not resolve host: github.com`. CI per nuovo HEAD da controllare. Nessun atlas, Canvas, merge, Pages o test Android certificato.
- **HEAD codice prima del checkpoint:** `66409703303eabe5cbd3a40df343cccf2ca27c78`; HEAD finale è il commit di questo checkpoint.
- **Singolo prossimo passo:** controllare la CI esatta sul nuovo HEAD; leggere i log dei due job falliti (specialmente acquisizione PLANT e Chromium HUD smoke), correggere eventuali failure residue sul branch, poi recuperare PNG+manifest+preview dal job riuscito. Non cambiare task né aprire una nuova PR.


## Esecuzione 2026-11-14 02:03 CET — correzione framing originale I_PLANT1
- **Task/PR:** SKH-TERRAIN-002, [#120](https://github.com/CzekUns/Rtsmobile/pull/120), branch `agent/skh-integration/original-landscape-overlays`.
- **Stato iniziale:** checkpoint `768b0d895453579c236592789b53691b41d42710`; [Actions #43530949113](https://github.com/CzekUns/Rtsmobile/actions/runs/43530949113) FAILURE per HEAD del checkpoint. Job JS tests & stream scope SUCCESS; job Original 7KAA PLANT atlas acquisition FAILURE. Log del job 132248196231 recuperato: `Error: invalid plant bitmap dimensions` da `nature-bitmap.mjs:11`.
- **Causa verificata nel sorgente originale:** `the3dfxdude/7kaa@14e6fdfba9481af4dc3a54722614a608776e20bc/src/ORESDB.cpp`, `ResourceDb::read_imported(offset)` legge un uint32 LE di lunghezza e restituisce `data_buf + offset + sizeof(int32_t)`. Il nostro decoder interpretava erroneamente quei quattro byte come width/height. `src/OPLANT.cpp` legge width/height dall'indirizzo restituito da read_imported.
- **Codice pubblicato:** `c5f1f6aab180e76ee4fc4b2dc8206403d35b017f` corregge framing e validazione della lunghezza; `8f052d1ce4db02b5647b2cf99aa585f2d0fd8624` aggiorna test bitmap e aggiunge regressione su offset/record length; `52ca13be64b91a14cedbd8549322b540507cc76a` aggiorna fixture e test exporter con il prefisso originale. Nessun nuovo asset inventato.
- **Verifica:** log CI precedente verificato e causa identificata; test npm locali **NOT_RUN** (checkout repository non disponibile). CI per il nuovo HEAD ancora da verificare; nessun PNG originale, merge, Pages o Android certificato in questa esecuzione.
- **HEAD codice prima del checkpoint:** `52ca13be64b91a14cedbd8549322b540507cc76a`. HEAD finale è il commit di questo checkpoint.
- **Singolo prossimo passo:** controllare la CI esatta sul nuovo HEAD, leggere il log del job PLANT se ancora rosso e correggere quel fallimento; se verde scaricare artefatto PNG+manifest+preview originale, verificarne SHA e preparare l'integrazione Canvas sullo stesso branch.


## Esecuzione 2026-11-14 03:03 CET — riparazione sintassi PLANT e regressioni
- **Task/PR:** SKH-TERRAIN-002, PR #120 draft, branch `agent/skh-integration/original-landscape-overlays`.
- **Stato iniziale:** checkpoint `a1afad07078e8e933534a7187f9f825afb0f32a0`. [Actions #43538366846](https://github.com/CzekUns/Rtsmobile/actions/runs/43538366846) FAILURE. Job PLANT 132272817652: `SyntaxError: Invalid or unexpected token` in `nature-bitmap.mjs:8`; job JS 132272817993: 243 PASS, 2 FAIL, 2 SKIP, Chromium skipped.
- **Causa riproducibile:** commit precedente conteneva sequenze letterali `\\n` nel codice JS anziché vere interruzioni di riga, sia in `tools/assets/nature-bitmap.mjs` sia in `tests/assets/nature-bitmap.test.mjs`. Questo impediva il parsing e l'esecuzione della pipeline.
- **Codice pubblicato:** `b091a0bd36baffb0bc126705566d306c2d512774` corregge il modulo; `4a20caaae28830ae1de796d87741c699e41623db` corregge il test di regressione. Nessuna modifica agli asset o al gameplay.
- **Prova:** log autentici della CI precedente analizzati. npm test/check locali NON ESEGUITI; CI sul nuovo HEAD ancora da certificare. Nessun PNG/manifest/preview acquisito, merge, Pages o QA Android.
- **HEAD codice prima del checkpoint:** `4a20caaae28830ae1de796d87741c699e41623db`; HEAD finale sarà il commit di questo checkpoint.
- **Singolo prossimo passo:** verificare la CI sul nuovo HEAD e, se PLANT è ancora rosso, correggere il primo errore effettivo del job; se verde, scaricare e verificare PNG, manifest SHA-256 e anteprima 1×/2× autentici prima di collegare Canvas.


## Esecuzione 2026-11-14 04:00 CET — CI rossa: test syntax riparato, bitmap compressa da implementare
- **Task/PR:** SKH-TERRAIN-002, PR #120 draft, branch `agent/skh-integration/original-landscape-overlays`.
- **Stato iniziale:** branch HEAD `dc3593c20212599052ebe4a7c5dfddd634f1c47f`; [Actions #43549078506](https://github.com/CzekUns/Rtsmobile/actions/runs/43549078506) FAILURE sul medesimo SHA (checkout PR merge sintetico `77b8e19ebaf6627bc29a8a9dbc901f113bb38208`).
- **Log verificati:** job PLANT `132307116678` fallisce con `compressed or truncated PLANT bitmap: 7KAA uses put_bitmap_trans_decompress; indexed pixels require original RLE decoding` in `nature-bitmap.mjs:16`. Il record originale è compresso: **non** trattare payload come pixel indicizzati grezzi e non inventare decoder. Job JS `132307116901`: 248 PASS / 1 FAIL / 2 SKIP, causa del FAIL `SyntaxError: Invalid or unexpected token` in `tests/assets/export-plant-atlas.test.mjs:47`, sequenza letterale `\\n`.
- **Codice pubblicato:** [`f2e9014886d05b4811c420cc8c36b3898fbaacdd`](https://github.com/CzekUns/Rtsmobile/commit/f2e9014886d05b4811c420cc8c36b3898fbaacdd) sostituisce il `\\n` letterale nel test con una vera interruzione di riga. Nessun cambio al runtime o alla palette.
- **Test:** log della CI precedente effettivamente letti. `npm test` e `npm run check` locali NON ESEGUITI; nuova CI HEAD non ancora certificata. Nessun PNG, manifest o preview originali, nessun merge/Pages/Android.
- **Singolo prossimo passo:** verificare CI del nuovo HEAD; poi leggere l'implementazione **esatta** di `put_bitmap_trans_decompress` e il formato compresso PLANT nel sorgente 7KAA pinned, implementare decoder trasparenza/RLE fedele con fixture reali e test di byte, quindi rieseguire job PLANT sullo stesso branch. Non bypassare il controllo di lunghezza.


## Esecuzione 2026-11-14 05:04 CET — CI HEAD e ricerca decoder originale
- **Task/PR:** SKH-TERRAIN-002, PR #120 draft, branch `agent/skh-integration/original-landscape-overlays`.
- **Stato iniziale:** checkpoint `17fe13afdd4a322bb0163fe67e21a6ace88b37cc`; verificata [Actions #43549387978](https://github.com/CzekUns/Rtsmobile/actions/runs/43549387978) su quel commit: workflow FAILURE; job JS tests & stream scope `132308137771` SUCCESS, inclusi Node tests, syntax, Chromium HUD e ownership; job Original 7KAA PLANT atlas acquisition `132308138026` FAILURE allo step acquisizione/atlante, upload saltato. Il problema del test JS precedente è dunque risolto in CI.
- **Indagine sorgente:** verificato il sorgente originale pinned `the3dfxdude/7kaa@14e6fdfba9481af4dc3a54722614a608776e20bc/src/OVGABUF.cpp`; non contiene il decoder. `src/OLZW.cpp` in un fork pubblico mostra LZW generico, ma **non** dimostra che sia il formato dei bitmap PLANT; nessun algoritmo inventato o adattamento non fondato è stato inserito. Ricerca GitHub `put_bitmap_trans_decompress` nel repo upstream senza risultati. Checkout locale impossibile: `git ls-remote https://github.com/the3dfxdude/7kaa.git HEAD` → `Could not resolve host: github.com`.
- **Codice:** nessun file runtime/test modificato in questa esecuzione; aggiornato soltanto questo checkpoint. `npm --prefix seven-kingdoms-html test` e `npm --prefix seven-kingdoms-html run check` locali NOT_RUN. Nessun PNG/manifest/preview originale, merge, Pages o QA Android.
- **Singolo prossimo passo:** individuare nel sorgente originale pinned l'implementazione effettiva di `put_bitmap_trans_decompress` (e le routine richiamate), documentarne byte di controllo/trasparenza e implementare nel decoder `nature-bitmap.mjs` con fixture compresse e test, poi rieseguire la pipeline PLANT su PR #120. Non usare LZW generico senza prova.


## Esecuzione 2026-11-14 05:55 CET — diagnostica binaria persistente PLANT
- **Task/PR:** SKH-TERRAIN-002, [#120](https://github.com/CzekUns/Rtsmobile/pull/120), branch `agent/skh-integration/original-landscape-overlays`. Checkpoint iniziale `c81f84c0b6da16041c1818409db8f7f82629dbd0`. `STATE.json` su main conferma task attivo.
- **Sorgente originale verificato:** `the3dfxdude/7kaa@14e6fdfba9481af4dc3a54722614a608776e20bc/include/IMGFUN.h` dichiara `IMGbltTransDecompress` e `IMGbltAreaTransDecompress`; `src/OPLANT.cpp` li usa. L'implementazione del codec non è ancora localizzata: non è stato inventato RLE/LZW.
- **Codice pubblicato:** `fc8a296e22a0be723003d1eb13e2e3ea53f8570f` aggiunge `tools/assets/inspect-plant-compression.mjs`: campiona fino a 12 record DBF reali, valida offset/framing e registra dimensioni, SHA-256, primi 32 byte esadecimali e frequenze, senza decodifica fittizia. `ba3671a07317c12094d37cf2e36f63e3fc24fee7` modifica workflow esistente per acquisire gli archivi originali pinned e pubblicare sempre il report JSON diagnostico, anche se l'atlante fallisce. `28d937a29b8ac99a944a247e40d31f26438ba0a6` aggiunge tre test di regressione su byte, limiti e record invalidi.
- **Test:** `npm --prefix seven-kingdoms-html test` e `run check` locali NOT_RUN: DNS GitHub non risolvibile e checkout locale non disponibile. Nessuna Actions run ancora restituita per SHA `28d937a29b8ac99a944a247e40d31f26438ba0a6` al momento del controllo. Nessun merge/Pages/Android/atlante prodotto. Ultima CI verificata resta #43549387978, JS verde e PLANT rosso.
- **HEAD codice prima del checkpoint:** `28d937a29b8ac99a944a247e40d31f26438ba0a6`. HEAD finale sarà il commit di questo checkpoint.
- **Singolo prossimo passo:** verificare la CI dell'HEAD nuovo; scaricare l'artefatto `skh-terrain-002-compression-diagnostics` e confrontare i byte PLANT reali con la routine originale `IMGbltTransDecompress` da individuare nella libreria IMGFUN/asm; implementare soltanto il codec documentato e ripetere la pipeline.


## Esecuzione 2026-11-14 07:02 CET — decoder trasparenza 7KAA recuperato e implementato
- **Task/PR:** SKH-TERRAIN-002, PR #120 draft, branch `agent/skh-integration/original-landscape-overlays`; HEAD iniziale `49a84c81f1c5ee2f514dd94487a8e372a6dbcc42`.
- **CI iniziale esatta:** [Actions #43559168279](https://github.com/CzekUns/Rtsmobile/actions/runs/43559168279) FAILURE; job JS `132338774452` SUCCESS, job PLANT `132338774300` FAILURE con `compressed or truncated PLANT bitmap`. Diagnostica pubblicata: [artifact #14099612081](https://github.com/CzekUns/Rtsmobile/actions/runs/43559168279/artifacts/14099612081), 12 record campionati; download originale byte-exact riuscito. SHA-256 verificati nei log: PLANT1 `3d2df0e638b1dd4fe63d9263986481a263a091a550911766b28f59c555e17213`; PLANTBM1 `beb30895ed92be5adffda255d9b92d903486710ea8951c2c978361309e318ae8`; I_PLANT1 `6ee73b29a61b99766dd6df5fa4cf255ea687672bc23db0f97135b8741be9f648`; PAL_STD `8bda65c749340446edb6debe73a5b0f67b1a4af8dd0fdb1fa0222a69848b6ef7`.
- **Sorgente codec recuperato:** [unavowed/7kaa src/imgfun/IB_TD.cpp @169a0d4](https://github.com/unavowed/7kaa/blob/169a0d42ab4a415393b4f64978dcfdf0a5bc4bf8/src/imgfun/IB_TD.cpp) implementa `IMGbltTransDecompress`; [COLCODE.h](https://github.com/unavowed/7kaa/blob/169a0d42ab4a415393b4f64978dcfdf0a5bc4bf8/include/COLCODE.h) definisce codici 0xF8 (skip byte successivo) e 0xF9..0xFF (skip 7..1). È una versione GPL della stessa famiglia 7KAA; parità del codec con il commit upstream pinned resta da validare sui dati reali.
- **Codice pubblicato:** `4f6c77ea5526e60257951caf76185f5fcc871a62` implementa decompressione trasparente bounded in `nature-bitmap.mjs`, preservando indice 255 per pixel trasparenti e rifiutando stream troncati/run fuori bitmap. `1f530a70c00b595ec16f16c7fa0a7dd94c546ccf` aggiunge due test RLE e malformed; `174a9a1186fd59264d074b68ef0fc4250fab83c6` corregge la lunghezza della fixture.
- **Verifica:** npm test/check locali NOT_RUN (checkout locale assente). CI nuovo HEAD NON ANCORA VERIFICATA; nessun atlas originale/Canvas/merge/Pages/Android certificato.
- **HEAD codice prima del checkpoint:** `174a9a1186fd59264d074b68ef0fc4250fab83c6`. HEAD finale è il commit di questo checkpoint.
- **Singolo prossimo passo:** verificare CI del nuovo HEAD; se PLANT rosso leggere log e correggere esattamente il primo errore del codec; se verde recuperare atlas PNG+manifest+preview autentici, verificarne hash/trasparenza e integrare rendering Canvas sullo stesso branch.

## Esecuzione 2026-11-14 08:03 CET — PLANT originale generato, regressione test corretta
- **Task/PR:** SKH-TERRAIN-002, [#120](https://github.com/CzekUns/Rtsmobile/pull/120) draft, branch `agent/skh-integration/original-landscape-overlays`.
- **HEAD iniziale:** `865176962ecf609bc87a205ce9554f8dfc55d3e6`. [Actions #43564474921](https://github.com/CzekUns/Rtsmobile/actions/runs/43564474921) FAILURE complessivo: **job Original 7KAA PLANT atlas acquisition SUCCESS**, job JS tests & stream scope FAILURE (257 PASS, 1 FAIL, 2 SKIP su 260 test).
- **Prova asset:** artifact [original-plant-atlas #14101458488](https://github.com/CzekUns/Rtsmobile/actions/runs/43564474921/artifacts/14101458488) (49.730 byte) e diagnostica [#14101592396](https://github.com/CzekUns/Rtsmobile/actions/runs/43564474921/artifacts/14101592396) (2.205 byte) pubblicati da Actions. Questo certifica l'esecuzione dell'exporter su risorse scaricate, **non** il collegamento al Canvas, né il confronto pixel 7KAA.
- **Fallimento JS riprodotto da log job 132355189538:** `tests/assets/export-plant-atlas.test.mjs:50` attendeva regex `/safe pixel limit/`, mentre il decoder correttamente solleva `Error: plant bitmap exceeds pixel limit`. Nessuna falla nel limite di allocazione dimostrata dal log.
- **Correzione pubblicata:** commit [41877fe](https://github.com/CzekUns/Rtsmobile/commit/41877fe6dec8cb3dda440e18ce9c17667366bd31) aggiorna l'asserzione del test al messaggio effettivo del decoder; nessun bypass della validazione, nessun asset inventato. HEAD codice `41877fe6dec8cb3dda440e18ce9c17667366bd31`; branch HEAD finale è il commit di questo checkpoint.
- **Verifica:** npm test/check locali **NOT_RUN** (checkout locale non disponibile); CI del nuovo HEAD **PENDING/NOT_VERIFIED**. Nessun merge, Pages post-merge, prova Android o QA visiva effettuati.
- **Singolo prossimo passo:** verificare CI sull'HEAD del checkpoint; se verde scaricare l'artefatto PLANT originale #14101458488, verificare manifest/PNG e integrare concretamente atlante e layering Canvas nel branch #120 con test e preview 1×/2×; se rossa correggere il nuovo errore esatto.


## Esecuzione 2026-11-14 08:57 CET — Canvas PLANT predisposto, trasparenza corretta
- **Task/PR:** SKH-TERRAIN-002, [#120](https://github.com/CzekUns/Rtsmobile/pull/120), branch `agent/skh-integration/original-landscape-overlays`. HEAD iniziale `9f0c7a214e41bd669729c36fc9306a44963ac980`.
- **CI HEAD iniziale verificata:** [Actions #43569382191](https://github.com/CzekUns/Rtsmobile/actions/runs/43569382191) SUCCESS, entrambi i job (JS/Chromium e acquisizione PLANT). Atlante autentico [artifact #14104065949](https://github.com/CzekUns/Rtsmobile/actions/runs/43569382191/artifacts/14104065949), 49.730 byte, ZIP digest `sha256:2817ac19feffebbd138d172d737bbff655c7bcacf93626f60d578085a598374f`. Questo è il digest ZIP Actions, non del PNG.
- **Codice pubblicato:** `d760ed60` aggiunge `playtest/original-plants.js`, renderer atlas con verifica dimensioni/manifest/provenienza, posizionamento demo deterministico e fallback; `c301f7c` aggiunge test di validazione, posizionamento, rendering e fallback; `4f2b6dd` collega il layer forestale in `view.js` sotto unità/città/edifici, senza cambiare gameplay. `2d23af8`, `6b499a9`, `e536096` correggono trasparenza: spazi liberi atlas indicizzati 255 e chunk PNG tRNS 255 predefinito, coerente con decoder. HEAD codice prima del checkpoint: `e536096be0f326306a28d0cb5094c82af39173c0`.
- **Limite importante:** il PNG/JSON autentico è ancora nell'artefatto Actions, **non** nei path pubblici `assets/previews/plant-original.png` e `assets/manifests/plant-original.json`. Il renderer usa fallback finché non vengono materializzati; nessuna nuova grafica dichiarata visibile su Pages. Il manifest deve essere rigenerato con trasparenza corretta e PNG/JSON verificati prima della release.
- **Test:** npm test/check locali **NOT_RUN**, checkout GitHub fallito con `Could not resolve host: github.com`. CI per HEAD `e536096` non ancora disponibile alla verifica. Nessun merge, Pages post-merge o Android QA.
- **Singolo prossimo passo:** verificare CI esatta del nuovo HEAD; quindi acquisire l'artefatto PLANT **rigenerato con tRNS 255**, estrarre PNG/JSON, verificare integrità e caricarli nei path pubblici previsti sullo stesso branch #120; eseguire screenshot HTTP 1×/2× e test Node/check prima del merge.
