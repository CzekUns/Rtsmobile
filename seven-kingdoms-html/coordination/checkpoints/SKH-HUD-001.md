# Checkpoint · SKH-HUD-001 — consolidamento HUD

- **Task:** SKH-HUD-001
- **Stato:** READY — assegnato, **nessuna modifica HUD ancora prodotta da questo task**.
- **Owner:** SKH-106 · integration
- **Data iniziale:** 2026-11-12
- **Main di partenza noto:** `413758a15f93ffe2b302d5edfd7561f5d7fba255`
- **Branch previsto:** `agent/skh-integration/hud-backlog-consolidation` (non ancora creato in questo bootstrap)
- **PR integrativa:** non ancora aperta
- **PR sorgente:** #97, #101, #103, #105, #107
- **CI del task combinato:** NOT_RUN
- **Test browser/Android:** NOT_RUN
- **Release SHA:** none

## Operazione da eseguire appena si riprende
1. Verificare HEAD di main e delle 5 PR. Se il branch previsto è già stato creato, leggere **il checkpoint dal suo HEAD** e continuare dal punto registrato; non sovrascrivere i progressi.
2. Confrontare `game.js`, `index.html` e `style.css` nelle cinque patch. Trascrivere in questa scheda una matrice concreta degli hunk e dei conflitti; riutilizzare gli export e i test pertinenti.
3. Implementare il primo blocco coerente direttamente nel **medesimo branch**, provare test e CI, correggere le incompatibilità, poi completare le altre funzionalità. Non aprire nuovi branch per ogni hunk.
4. Prima di chiudere la run, aggiornare **questo file sul branch** con commit, PR, test, errori e il punto esatto di ripresa. Se manca CI non dichiarare successo.

## Resoconto delle esecuzioni
| Run | Commit/PR | Prova effettuata | Prossimo step |
|---|---|---|---|
| Bootstrap 2026-11-12 | solo istituzione del protocollo | piano e 5 PR identificate; nessuna modifica HUD | verificare HEAD, confrontare diff, sviluppare |

**Nota:** Se `STATE.json` su main è indietro ma questo file nel branch contiene un HEAD più recente, la verità tecnica del task in corso è quella del branch, mentre il piano rimane quello su main.
