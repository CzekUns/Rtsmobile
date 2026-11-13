# Checkpoint · SKH-TERRAIN-001 — coste e transizioni originali 7KAA

- **Stato:** READY — nessun asset di costa ancora convertito da questo incarico.
- **Owner:** SKH-106 Integration, con possibili handoff specifici alla corsia Assets SKH-101 nel rispetto di WORKSTREAMS.json.
- **Data:** 2026-11-13.
- **Main prodotto verificato prima del rilascio di questo checkpoint:** `ec628a2edf87e0d3d2f46a338d751057fd1ca55a`, integrata la #115.
- **Branch previsto:** `agent/skh-integration/original-coast-transitions` (non creato qui).
- **PR:** nessuna aperta per questo task.
- **CI e asset originali:** NOT_RUN / NOT_YET_ACQUIRED; non dichiarare una costa originale già pronta.

## Primo passo concreto
1. Recuperare `coordination/STATE.json`, `TASKS.json`, questo checkpoint dal branch se già avviato, poi `README.md`, `AGENTS.md`, `PARALLEL_WORK.md` e `WORKSTREAMS.json`.
2. Verificare nel codice sorgente 7KAA GPL la logica delle transizioni (classe Terrain, nome e indice record, schemi angoli/corner). Individuare commit/archivi reali e attributi palette, senza assumere formati non confermati.
3. Creare il branch previsto da main e registrare nel checkpoint del branch file/record/commit/hash/licenza originali accertati e differenza rispetto alle 32 tessere già integrate.
4. Cominciare decoder/manifest/test per un blocco acqua-terra coerente; non alterare le regole di terreno e collisione per fingere grafica fedele.
5. Prima di terminare, salvare il prossimo step esatto e un commit sul branch. Se accesso agli archivi fallisce, dichiarare URL/errore e trovare alternativa leggibile/licita senza ricominciare audit HUD.

## Esecuzioni
| Esecuzione | Codice verificato | Prossimo step |
|---|---|---|
| Handoff iniziale 2026-11-13 | Nessun codice costa; release HUD verificata e programma aggiornato | catalogo 7KAA transizioni e lookup, poi prima conversione |
