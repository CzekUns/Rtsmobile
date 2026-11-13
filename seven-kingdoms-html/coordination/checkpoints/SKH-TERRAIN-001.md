# Checkpoint · SKH-TERRAIN-001 — coste e transizioni 7KAA

- Data: 2026-11-13, continuazione PR #118 draft.
- Stato: IN_PROGRESS; nessuna bitmap costa convertita né Canvas modificato.
- Branch: `agent/skh-integration/original-coast-transitions`.
- HEAD codice/test prima del checkpoint: `3668b853a3ae409df37c159749e8196efb6b7b70`.
- PR: https://github.com/CzekUns/Rtsmobile/pull/118
- Commit codice `ec72d4a0ddd4bd4a90f78963c14ee30976d20aaa`: `tools/assets/terrain-record.mjs`, correzione concreta: `TerrainRes::scan` richiede `special_flag == special`; il vecchio lookup accettava erroneamente tutti i record blank anche durante richieste speciali. Il blank viene ora normalizzato a 0, coerentemente con `TerrainRes::load_info`.
- Commit test `3668b853a3ae409df37c159749e8196efb6b7b70`: `tests/assets/terrain-record.test.mjs`, regressioni per ricerca normale/speciale e assenza di fallback scorretto.
- Fonte originale verificata: `the3dfxdude/7kaa` commit `14e6fdfba9481af4dc3a54722614a608776e20bc`, `src/OTERRAIN.cpp` (`TerrainRes::scan`, `load_info`), `include/OTERRAIN.h`, licenza GPLv2. Record da 26 byte e offset bitmap già implementati nella PR.
- CI precedente sul commit `3866c019493715b1733cdb417e25e0a680d88126`: GitHub Actions run https://github.com/CzekUns/Rtsmobile/actions/runs/43405520065 SUCCESS. **Non è CI del nuovo codice**. Nuovo HEAD `3668b85` da verificare alla prossima esecuzione. `npm --prefix seven-kingdoms-html test` e `npm --prefix seven-kingdoms-html run check` NON eseguiti localmente: `git ls-remote https://github.com/the3dfxdude/7kaa.git HEAD` fallisce con `Could not resolve host: github.com`. Nessuna prova Chromium/Android/Pages nuova.
- Archivi upstream identificati ma byte non recuperati: `data/RESOURCE/TERRAIN1.RES` e `I_TERN1.RES`. SHA-1 Git precedentemente annotati NON sono SHA-256 dei file. Non assumere che il RES sia un array grezzo di record; framing Database ancora da verificare.

## Singolo prossimo passo
Controllare la CI sull'HEAD del branch dopo questo checkpoint; recuperare tramite percorso binario legittimo `TERRAIN1.RES` e `I_TERN1.RES`, misurare SHA-256 e framing Database, poi creare fixture REALI con offset e ID. Non collegare Canvas finché i record non sono dimostrati.
