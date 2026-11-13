# Checkpoint · SKH-TERRAIN-001 — coste e transizioni 7KAA

- Data: 2026-11-13, esecuzione dopo transizione HUD.
- Stato: IN_PROGRESS, nessun asset costa originale ancora recuperato o renderizzato.
- Base: main dopo merge #115 (STATE indica ec628a2edf87e0d3d2f46a338d751057fd1ca55a).
- Branch: `agent/skh-integration/original-coast-transitions`.
- Ultimo SHA codice prima di questo checkpoint: `0eebe8e7ddf15ee5d91417ed8c0fa5020845976c`.
- File aggiunti: `tools/assets/coast-manifest.mjs`, `tests/assets/coast-manifest.test.mjs`.
- Funzione: manifest fail-closed con source URL/commit/licenza/hash, record con offset/length e 4 corner; lookup solo su corrispondenza unica, altrimenti null (fallback). Nessuna modifica al Canvas, collisioni, salvataggi o HUD.
- Provenienza originale: NON VERIFICATA. Tentativi: `https://github.com/7kfans/7kaa` via connector `src/OTERRAIN.cpp`, `src/OTERRAIN.h`, `COPYING` -> HTTP 404; `git ls-remote https://github.com/7kfans/7kaa.git HEAD` -> `Could not resolve host: github.com`. Nessun record, corner order, hash o licenza di archivio affermato come autentico. URL e hash del test sono fixture fittizie, mai asset.
- Test: suite npm locale NON ESEGUITA (DNS impedisce checkout); nuovi test Node aggiunti, CI HEAD da verificare. Pages: solo precedente release HUD, nessun deploy terrain.
- Nota tecnica: lo schema di manifest e l'ordine corner sono provvisori e non sono una prova di formato upstream. Il lookup non va collegato al renderer prima di verificare le convenzioni 7KAA.

## Singolo prossimo passo
Recuperare tramite sorgente 7KAA realmente accessibile `OTERRAIN.cpp` e tabelle/archivi terreno con commit, licenza e hash verificabili; confrontare l'ordine dei corner e il layout dei record con lo schema, correggere lo schema e scrivere fixture reali prima di collegare Canvas.
