# Checkpoint · SKH-TERRAIN-001 — coste e transizioni 7KAA

- Data: 2026-11-13; PR #118 draft: https://github.com/CzekUns/Rtsmobile/pull/118
- Stato: IN_PROGRESS; nessuna costa collegata a Canvas, nessun merge.
- Branch: `agent/skh-integration/original-coast-transitions`.
- HEAD codice/test prima del checkpoint: `eed8a6d9b4c72ea5736f64d6f6c22df0d28e542d`.
- Commit nuovi: `8b7b75da13cfce0c9427c733b0481a13abee36e2` aggiunge `tools/assets/terrain-database.mjs`; `eed8a6d9b4c72ea5736f64d6f6c22df0d28e542d` aggiunge `tests/assets/terrain-database.test.mjs`.
- Fonte upstream acquisita con GitHub contents API (base64): `the3dfxdude/7kaa` commit `14e6fdfba9481af4dc3a54722614a608776e20bc`, `data/RESOURCE/TERRAIN1.RES` (20,636 byte, Git blob SHA-1 `8e9c2fc8799d2cfac2b4c531099841dd4e1ae5ac`), `data/RESOURCE/I_TERN1.RES` (Git blob SHA-1 `25bd3189590f7573f0121b28eb120566d411f8ab`); GPLv2 dal repository sorgente. **SHA-256 dei byte non ancora calcolati**: gli SHA-1 Git non sono SHA-256.
- Risultato verificato sui byte reali: `TERRAIN1.RES` è un database dBASE III (header 385 byte, 750 record, 27 byte per record: marker di cancellazione + 26-byte TerrainRec). 11 campi NW_TYPE, NE_TYPE, SW_TYPE, SE_TYPE, EXTRA, SPECIAL, REP_TYPE, SEC_TYPE, PATTERN_ID, FILENAME, BITMAPPTR. Primo record originale byte 385, record costa originale ID 412 byte 11482, file `SG-028`, bitmap offset `0x13668`. Osservate 180 righe con REP/SEC di cui esattamente una acqua S. Questi sono record autentici, non grafica generata.
- Nuovo decoder valida versione dBASE, schema, dimensioni, marker e record completi; test usa byte originali di record 1 e 412, con casi negativi. Rimane da verificare CI sul nuovo HEAD; test locali npm NON eseguiti: `git ls-remote https://github.com/the3dfxdude/7kaa.git HEAD` → `Could not resolve host: github.com`.
- CI precedente sull'HEAD checkpoint `21cbdc8b7cd5263861e275e2093f49256c813d84`: https://github.com/CzekUns/Rtsmobile/actions/runs/43413858994 — SUCCESS. Non è CI del nuovo codice.
- Browser, Android, Pages e confronto 1x/2x: NOT_RUN. Nessuna dichiarazione di parità grafica.

## Singolo prossimo passo
Verificare CI dell'HEAD di questo checkpoint e correggere subito eventuali errori; poi recuperare i byte `I_TERN1.RES` tramite GitHub contents API, calcolare SHA-256 effettivi degli archivi e decodificare il framing bitmap all'offset verificato `0x13668` per produrre la prima fixture grafica autentica, senza collegare Canvas prima della verifica.
