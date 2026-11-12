# Seven Kingdoms HTML — ambiente condiviso di lavoro

**Fonte operativa condivisa:** questa cartella su **GitHub `main`**, non la memoria di una singola chat. L'orchestratore ha concordato col proprietario l'ordine delle lavorazioni; le automazioni e le chat esecutive ne eseguono le porzioni. Non inventare agenti attivi: gli stream SKH-101–106 sono **ruoli/corsie**, attivati solo da una chat o automazione reale.

## Leggi in quest'ordine, ogni nuova sessione
1. `coordination/STATE.json`: id incarico attivo, prossimo passo, SHA e ultimo esito (la fotografia iniziale non equivale a lavoro svolto).
2. `coordination/TASKS.json`: task attivo, dipendenze, scope e criteri di accettazione concordati.
3. `coordination/checkpoints/<TASK_ID>.md` sull'**HEAD del ramo di lavoro** (se esiste), poi la stessa scheda su main. Questo checkpoint è la memoria tecnica delle esecuzioni **non ancora integrate**.
4. `coordination/HANDOFF.md` e `coordination/QA.md`.
5. Solo i file sorgente e PR pertinenti al task attivo; `AGENTS.md`, `PARALLEL_WORK.md`, `WORKSTREAMS.json` definiscono i vincoli non derogabili.

Non rieseguire da capo l'audit dell'intera repository ogni ora. Se lo stato è cambiato rispetto all'ultimo checkpoint, verifica **solo le differenze** da SHA/HEAD annotato, quindi riprendi l'operazione interrotta.

## Responsabilità e scritture
- **Proprietario:** approva le grandi priorità/deroghe; il programma in `ROADMAP.md` e `TASKS.json` non cambia senza istruzioni esplicite.
- **Orchestratore/integratore SKH-106:** unico responsabile della pianificazione, transizione task, QA finale e release; ha ownership di `coordination/STATE.json`, `TASKS.json`, `ROADMAP.md` e `DECISIONS.md`. Quando la sessione ChatGPT orchestratrice è inattiva, l'automazione oraria può agire **come integratore esecutivo sull'incarico già assegnato**, senza ripianificare.
- **Altri stream SKH-101–105:** lavorano solo in branch e path autorizzati da `WORKSTREAMS.json`, e scrivono prove negli stessi PR/issue o in `docs/<stream>/`; non modificano i file globali di coordinamento.
- **Checkpoint su branch:** sul ramo dell'incarico, l'esecutore aggiorna `coordination/checkpoints/<TASK_ID>.md` **insieme al codice**, inclusi passaggi verificati, HEAD, test e istruzione per ripartire. Su main il checkpoint è solo l'ultimo stato integrato. Non fare push su main direttamente: usa PR e CI. Nessun force-push.
- **Se due agenti toccano lo stesso modulo:** l'integratore mantiene unico branch/PR di integrazione; gli altri consegnano patch isolate e contratti. Lo stesso `game.js` non va riscritto in branch concorrenti senza diff/rebase.

## Ciclo esecutivo
1. **READ**: `STATE.activeTaskId` → task → checkpoint più recente del branch. Se branch non esiste, crearne uno su ultimo main; se esiste, continuare lì e controllare il nuovo HEAD.
2. **DO**: implementare la prossima azione concreta. Preferire riparare una PR corrente a creare altre PR. Se test/CI falliti, la prossima run deve partire **dal log d'errore**, senza scegliere nuove funzionalità.
3. **CHECKPOINT**: prima di terminare, push del codice e del checkpoint sul branch, con SHA, PR, prova test oppure blocco riproducibile; registrare cosa fare **esattamente** nella prossima run. L'aggiornamento del checkpoint è obbligatorio anche in caso di impedimento tecnico, purché GitHub consenta di scrivere.
4. **QA / MERGE**: test Node + CI GitHub HEAD, review dei conflitti, deploy Pages successivo al merge, QA Android e confronto con riferimento originale dove disponibili. Un PR mergeable non è da solo prova sufficiente.
5. **TRANSIZIONE**: dopo release verificata, l'orchestratore aggiorna `STATE.json`, `TASKS.json` e `HANDOFF.md` su main tramite PR di chiusura; se manca soltanto una verifica fisica non ottenibile, marca `awaiting_manual_qa` e può autorizzare il successivo task lasciando l'obbligo di collaudo aperto.
6. **REPORT**: quantifica codice/asset/test *realmente* pubblicati, link PR/commit/CI, disponibilità Pages, e task/step che verrà ripreso. Distinguere sempre analisi, codice nel ramo, merge e test device.

### Regole anti-loop
- Non ripetere un audit globale se `STATE.json` non ha cambiato incarico.
- Non aprire una PR per un semplice rapporto quando puoi continuare la PR del task.
- Non dichiarare `done` senza prove esplicite associate ai gate; non dichiarare visual parity solo per CI verde.
- Se blocco esterno: `blocked` + errore preciso, tentativo eseguito e alternativa concreta; non generare ripetutamente lo stesso rapporto.
- Non cambiare la cadenza dell'automazione e non creare altre automazioni senza consenso.
- Le transizioni di task sono documentate in `DECISIONS.md`; le attività fuori programma vanno proposte, non avviate autonomamente.

## Validazione del programma
`node seven-kingdoms-html/coordination/validate.mjs` dalla radice della repository; la suite `npm --prefix seven-kingdoms-html test` include verifiche sul programma. Questa validazione copre solo **consistenza dei file di stato**, non la correttezza del gioco.
