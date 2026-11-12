# Registro decisioni

## DEC-001 — 2026-11-12 · Coordinamento condiviso persistente

**Decisione del proprietario:** usare un ambiente comune per registrare progressi e un programma preconcordato da un orchestratore; organizzare la repository e correggere l'automazione già attiva.

**Implementazione:** `coordination/` su GitHub `main`; ordine iniziale `SKH-HUD-001` → `SKH-TERRAIN-001` → `SKH-TERRAIN-002` → `SKH-STRUCTURES-001` → `SKH-QA-001`. L'automazione esistente mantiene la propria periodicità; il suo prompt diventa un breve contratto di lettura del piano persistente e di continuazione di **un solo incarico**, invece di un audit generale ripetitivo.

**Motivo:** le esecuzioni precedenti verificavano ripetutamente cinque PR HUD (#97/#101/#103/#105/#107) senza produrre codice/merge. Il ripristino dopo interruzione deve partire dal checkpoint dell'ultimo branch attivo.

**Eccezioni consentite:** fix urgenti per impedire regressioni/rotture su main, fermando e registrando la deviazione; nuove priorità su ordine e scope richiedono istruzione del proprietario. I collaudi device impossibili possono rimanere come `awaiting_manual_qa` documentati.

**Stato:** decisione iniziale; nessun task di prodotto è dichiarato completato dall'aggiunta di questo protocollo.
