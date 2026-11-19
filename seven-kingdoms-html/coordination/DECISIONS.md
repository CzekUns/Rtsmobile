# Registro decisioni

## DEC-001 — 2026-11-12 · Coordinamento condiviso persistente

**Decisione del proprietario:** usare un ambiente comune per registrare progressi e un programma preconcordato da un orchestratore; organizzare la repository e correggere l'automazione già attiva.

**Implementazione:** `coordination/` su GitHub `main`; ordine iniziale `SKH-HUD-001` → `SKH-TERRAIN-001` → `SKH-TERRAIN-002` → `SKH-STRUCTURES-001` → `SKH-QA-001`. L'automazione esistente mantiene la propria periodicità; il suo prompt diventa un breve contratto di lettura del piano persistente e di continuazione di **un solo incarico**, invece di un audit generale ripetitivo.

**Motivo:** le esecuzioni precedenti verificavano ripetutamente cinque PR HUD (#97/#101/#103/#105/#107) senza produrre codice/merge. Il ripristino dopo interruzione deve partire dal checkpoint dell'ultimo branch attivo.

**Eccezioni consentite:** fix urgenti per impedire regressioni/rotture su main, fermando e registrando la deviazione; nuove priorità su ordine e scope richiedono istruzione del proprietario. I collaudi device impossibili possono rimanere come `awaiting_manual_qa` documentati.

**Stato:** decisione iniziale; nessun task di prodotto è dichiarato completato dall'aggiunta di questo protocollo.

## DEC-002 — 2026-11-13 · SKH-HUD-001 consegnato tecnicamente; transizione alle coste

**Autorizzazione:** mandato del proprietario di fare il giro di integrazione periodico e programma già concordato in DEC-001. Non è una nuova priorità discrezionale.

**Evidenza:** #115 mergiata su main `ec628a2edf87e0d3d2f46a338d751057fd1ca55a`, CI #43391451648 e Pages #43391451601 success, primo smoke completo Node/Chromium della combinazione con save/reload. Vecchie PR #97/#101/#103/#105/#107 chiuse dopo consolidamento verificato.

**Decisione:** marcare `SKH-HUD-001` `awaiting_manual_qa` (Android reale e vera richiesta fullscreen non testati) e attivare `SKH-TERRAIN-001` in sequenza. Nessun bug software noto blocca l'avvio del task coste. La memoria operativa di questa lavorazione deve stare nel checkpoint del branch del nuovo incarico, non in report ripetitivi.

## DEC-003 — 2026-11-13 · Primo rilascio 180 coste SG e nuovo task paesaggio

**Mandato in corso:** giro di integrazione autorizzato dal proprietario, nel programma fisso approvato in DEC-001.

**Risultato:** PR #118 unita su `c1a9afb39f4cd52e4a39f94addc4a5efe55444c2`, sorgenti byte/palette 7KAA verificati, 180 tasselli di costa mare/erba con tutti i 14 pattern di angoli, test CI #43439241900 e Pages #43439241935 success. Il rendering è **pixel originale applicato a un mondo dimostrativo**, e NON implementa il generatore di 7KAA o quote/sottotipi completi.

**Decisione:** task `SKH-TERRAIN-001` → `awaiting_manual_qa` con prova device e confronto stessa scena ancora da svolgere; passaggio al prossimo incarico già preconcordato `SKH-TERRAIN-002` (vegetazione, rocce, colline e layering). Non creare un nuovo programma, riusare checkpoint sul branch del task corrente.


## 2026-11-16 — transizione tecnica SKH-TERRAIN-002 → SKH-STRUCTURES-001
PR #120 promossa e squash-merged su main `f914a3ab007a7760026829bbc7216080564e0988` con CI PR HEAD verde (#43778104231) e nessun conflitto (mergeable true, behind main 0). Rimangono QA Android/parità 7KAA e verifica Pages post-merge; registrati come pendenti senza certificazione. Si prosegue nel task già concordato SKH-STRUCTURES-001, senza cambiare ordine.


## 2026-11-18 — Transizione concordata SKH-STRUCTURES-001 → SKH-QA-001
Nessuna ripianificazione: si segue `TASKS.json.taskOrder`. PR #122 integrata su main `8197e8e322b750c7cdbdb170198ade91b0c257e7` con CI PR HEAD #44234823855 verde. Stato strutture `awaiting_manual_qa` per Android/parità 7KAA e limiti degli sprite direzionali. CI main/Pages da verificare. Si attiva SKH-QA-001, senza certificare parità o test fisici.


## 2026-11-19 — DEC-005 · SKH-QA-001 in awaiting_manual_qa
Nel programma immutato DEC-001, la PR #125 è stata integrata su main `ce27463932b040d6c2ce54348cd13a8e6e16604a`. CI push [#44511174668](https://github.com/CzekUns/Rtsmobile/actions/runs/44511174668) e workflow Pages [#44511174523](https://github.com/CzekUns/Rtsmobile/actions/runs/44511174523) completati con `success` sullo SHA esatto. I gate automatici di rilascio sono verificati; manca la prova fisica Android e il confronto stessa scena con 7KAA a 1×/2×. Si registra `awaiting_manual_qa`, senza dichiarare parità e senza introdurre un task nuovo. Il calendario esistente rimane invariato.
