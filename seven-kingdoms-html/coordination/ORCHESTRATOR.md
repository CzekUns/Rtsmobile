# Orchestratore — contratto operativo

## Decisione vs esecuzione
Il proprietario definisce **che cosa costruire e in quale ordine**. L'orchestratore traduce questa scelta in task con ID, owner, dipendenze, criteri di completamento, branch e limiti di responsabilità. Le sessioni e automazioni esecutive attuano **l'ID attivo**; non inventano un nuovo piano all'avvio di ciascuna esecuzione.

**Unico incarico esecutivo attivo:** `STATE.json.activeTaskId`. L'ordine fissato è `TASKS.json.taskOrder`. Le altre attività sono in coda, non schedulate né promesse come agenti già in esecuzione.

## Algoritmo di assegnazione
1. Leggere `STATE.json` da main e validare con `validate.mjs`.
2. Leggere il task corrispondente da `TASKS.json`, poi cercare `coordination/checkpoints/<id>.md` sull'HEAD di `STATE.activeTaskBranch` o del task `workBranch`; il checkpoint del branch ha precedenza per dettagli tecnici non ancora mergiati.
3. Non attraversare tutte le PR ogni run. Risolvere **l'ultimo step ancora aperto**. Controllare differenze dall'HEAD registrato, e non rifare analisi completate.
4. Eseguire una sequenza code→test→CI→fix→merge→Pages; usare compare/pr diff per evitare sovrascritture. Alla fine commit/push del checkpoint per la successiva esecuzione, indicando esito anche se non c'è merge.
5. Assegnare task successivo **solo** dopo completamento dei criteri oppure `awaiting_manual_qa` con rilascio tecnico provato e collaudo fisico tracciato. Documentare la decisione. Se esistono blocchi software risolvibili, continuare il task corrente.
6. Se il ramo o `main` cambia da un'altra esecuzione, **non usare force push**; rileggere HEAD e integrare consapevolmente.

## Transizioni consentite
- `queued` → `ready` → `in_progress` → `verified` → `done`
- `ready`/`in_progress` → `blocked` → `in_progress`
- `verified` → `awaiting_manual_qa` quando manca una prova esterna, non un fix software.
- `verified` si riferisce solo ai gate tecnici con evidenza; `done` alla checklist intera. `awaiting_manual_qa` non significa parità certificata.

## Stati persistenti
- `TASKS.json`: programma e acceptance; modificato solo dall'orchestratore con approvazione del proprietario per ri-prioritizzazioni.
- `STATE.json`: incarico e SHA/release veri. Scrittura da integratore, un PR alla volta.
- `checkpoints/<id>.md`: dettaglio progressivo sul **branch di lavoro**; un solo writer per task. Gli HEAD, il PR, il check CI e la prossima operazione vanno aggiornati a ogni esecuzione.
- `HANDOFF.md`: passaggio di consegne leggibile. Non dichiarare progressi inesistenti.
- `QA.md`: verifiche richieste e prove separate.
- `DECISIONS.md`: cambio di assegnazione/priorità e motivazione, con consenso del proprietario.

Quando l'automazione si interrompe **prima del merge**, il checkpoint in branch e i commenti PR sono la verità più recente. Non chiedere che `STATE.json` su main contenga magicamente commit di branch non ancora integrati.

## Limiti di autonomia
L'orchestratore ha autorizzazione del proprietario a fare merge di PR **non draft**, senza conflitti non risolti, con CI verde sull'HEAD e review di compatibilità; verificarne SHA e deployment. Non può attribuire qualità 7KAA pixel-perfect o test Android senza prova. Non tocca repo estranee né il progetto Ver Sacrum. Non può reinterpretare un blocco DNS come test eseguito. Non creare issue/PR duplicati per un errore già tracciato.
