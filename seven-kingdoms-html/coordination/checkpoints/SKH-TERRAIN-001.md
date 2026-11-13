# Checkpoint · SKH-TERRAIN-001 — coste e transizioni 7KAA

- Data: 2026-11-13, continuazione del task attivo da PR #118.
- Stato: IN_PROGRESS. Nessuna bitmap originale costa ancora convertita o collegata al Canvas.
- Branch: `agent/skh-integration/original-coast-transitions`.
- HEAD codice prima del checkpoint: `684f9d0a01abc95ecca9ee59f773065bda0c2c0d`.
- PR: https://github.com/CzekUns/Rtsmobile/pull/118 (draft).
- Nuovi file: `tools/assets/terrain-record.mjs`, `tests/assets/terrain-record.test.mjs`. Decoder di record TERRAIN a 26 byte, ordine angoli NW/NE/SW/SE, tipo S/G/F/D, sottotipo -,0,+,A,B,*, bitmap offset little-endian e classificazione costa. Lookup deterministico di primo record con maschere, senza simulare alternative casuali o decodificare ancora l'involucro .RES. Test di struttura, coast flag, maschere e input non valido.
- Correzione della ricerca precedente: `7kfans/7kaa` non esiste su GitHub (404). Mirror upstream verificato: https://github.com/the3dfxdude/7kaa, commit `14e6fdfba9481af4dc3a54722614a608776e20bc` (archiviato; README rimanda al SourceForge attuale).
- Sorgenti originali: `include/OTERRAIN.h` blob Git SHA-1 `9d45dd521bd5575ec0c7841074f7babed97f3af9`; `src/OTERRAIN.cpp` blob Git SHA-1 `431d253821b42d6b7efb13e99d8684a61c9099f5`. Definiscono TerrainRec, TerrainRes::scan, terrain_code, terrain_mask, nomi risorse. `COPYING` blob Git SHA-1 `1ccdf0d7944e56490c15f8f9d8d159e2f2e577d2` dichiara GPL v2 per codice e dati.
- Archivi upstream presenti in `data/RESOURCE/`: `TERRAIN1.RES` (20636 byte, Git blob SHA-1 `8e9c2fc8799d2cfac2b4c531099841dd4e1ae5ac`), `I_TERN1.RES` (577920 byte, Git blob SHA-1 `25bd3189590f7573f0121b28eb120566d411f8ab`), `I_TERA1.RES` (223023 byte). **Questi sono SHA-1 Git dei blob, NON SHA-256 dei byte degli archivi**; non usarli nel campo source.sha256. Non è stata estratta nessuna risorsa binaria, nessuna fixture reale. `TERRAIN1.RES` non è ancora dimostrato essere una sequenza nuda di record da 26 byte: non applicare il decoder direttamente al file senza analizzare l'intestazione DB.
- Test: file Node aggiunti, `npm --prefix seven-kingdoms-html test` e `npm --prefix seven-kingdoms-html run check` NON eseguiti localmente (checkout GitHub non disponibile); workflow associati a HEAD `684f9d0`: nessuno al momento della consultazione. Nessuna CI verde dichiarata. Pages non modificato; nessun Android o QA visivo.
- Rischio tecnico: il manifest `coast-manifest.mjs` precedente usa corner semplificati land/water e necessita adeguamento a tipi/mask autentici prima di wiring. Il nuovo decoder non inventa record o sprite.

## Singolo prossimo passo
Controllare la CI sull'HEAD aggiornato della PR #118; quindi recuperare i byte di `data/RESOURCE/TERRAIN1.RES` e `I_TERN1.RES` dal mirror 7KAA GPL, verificare SHA-256 e framing del database/resource, estrarre i primi record REALI e scrivere fixture con id/offset prima di collegare il Canvas.
