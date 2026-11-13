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
