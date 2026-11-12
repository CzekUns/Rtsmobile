# Piano operativo concordato — Seven Kingdoms HTML Edition

**Approvato per l'avvio dall'utente il 12 novembre 2026.** Programma di lavoro persistente che integra, senza sostituire, `PIANO_DI_SVILUPPO.md`. L'ordine è riprodotto in `TASKS.json`; un orchestratore lo può variare solo dopo una nuova decisione esplicita del proprietario, annotata in `DECISIONS.md`. Non ci sono scadenze promesse.

## Ordine delle consegne (una alla volta per l'automazione oraria)

1. **SKH-HUD-001 — Chiudere arretrato HUD.** Consolidare in un'unica integrazione le funzionalità ancora pertinenti delle PR #97, #101, #103, #105, #107. Risolvere conflitti reali di `game.js`/`style.css`/`index.html`, test, CI, merge, deploy. Non riaprire la minimappa già integrata.
2. **SKH-TERRAIN-001 — Coste originali.** Identificare nelle risorse GPL 7KAA transizioni terra/acqua e relative regole per angoli, produrre decoder/atlas/manifest riproducibili e integrate nel Canvas senza cambiare collisioni.
3. **SKH-TERRAIN-002 — Paesaggio naturale originale.** Alberi/foreste, rocce e colline con profondità, ancoraggi e scale corretti.
4. **SKH-STRUCTURES-001 — Edifici e unità originali.** Catalogo, fasi di costruzione, palette nazioni, frame e direzioni; più di un singolo asset dimostrativo.
5. **SKH-QA-001 — Audit visivo e Android.** Confronti stessa scena 1×/2×, performance, regressioni e QA release; elementi non testabili su dispositivo restano evidenziati.

Gli asset NORMAN/BASE-NORMAN e il primo atlante di 32 tile del 6/11, la minimappa rilasciata con PR #112 e #113 e i miglioramenti HUD PR #108–110 sono **già su main**: non ricrearli.

## Gates
Ogni consegna ha un **artefatto funzionante**, fonti verificabili, test e CI, rilascio o blocco preciso e un checkpoint persistente. Per interventi grafici, allegare screenshot confrontabili a 1×/2× quando materialmente possibile e dichiarare ciò che resta da certificare. La prova Android reale non è deducibile da screenshot automatizzati.

Se si è completato codice, CI e deployment ma il collaudo manuale è impossibile, stato `awaiting_manual_qa` e il collaudo resta registrato. L'orchestratore può passare alla successiva attività programmata dopo la chiusura tecnica, senza affermare parità verificata.

## Priorità di prodotto
Il passaggio estetico è sostanziale, non un micro-ciclo per pulsante. Dopo l'arretrato HUD la priorità è **paesaggio originale** (coste → foreste/rocce/colline), quindi edifici e sprite. Preservare fullscreen, menu COMANDI e MOD+levetta a sinistra, box selection, salvataggi, movimento e simulazione.

## Programmazione umana
L'orchestratore è una **responsabilità logica** assegnabile a una chat esecutiva; questa cartella non avvia da sola agenti né crea un orchestratore autonomo. L'automazione già esistente esegue periodicamente l'incarico attivo; gli altri cinque stream non diventano agenti attivi finché non vengono effettivamente avviati e assegnati.
