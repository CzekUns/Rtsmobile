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
