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
