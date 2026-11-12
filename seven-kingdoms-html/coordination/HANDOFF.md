# Handoff esecutivo — Seven Kingdoms

## Stato iniziale (registrato il 12 novembre 2026)

**Incarico attivo:** `SKH-HUD-001` · consolidamento HUD. **Questo è un handoff iniziale, non una run eseguita.**

- Ultimo main verificato in fase di bootstrap: `413758a15f93ffe2b302d5edfd7561f5d7fba255`, con minimappa integrata, tasti MOD+levetta a sinistra, sprite normanni e 32 tasselli originali.
- Ultimo Pages deployment noto: workflow `43221479622` successo sullo SHA sopra, senza conferma Android reale.
- **Cinque PR non draft in sospeso**, tutte con interventi in `game.js`: #97 (stato report ed Escape), #101 (tastiera HUD), #103 (sidebar e focus), #105 (data e velocità landscape), #107 (stato selezione di villaggi/forti). #105 e #107 modificano anche CSS.
- #97/#101/#103/#105 avevano una CI GitHub associata all'HEAD verde al controllo precedente; la #107 è stata aggiornata e ha una CI push verde sul commit `d7962a79...`, ma i test di integrazione sull'HEAD combinato **non sono stati eseguiti**. Controllare di nuovo gli HEAD all'avvio.
- Non riaprire #98/#99/#100/#104/#106/#111: funzionalità minimappa consolidate e archiviate dopo PR #112/#113.
- Niente nuove transizioni di costa o vegetazione pubblicate in questo bootstrap.

## Prima operazione concreta dell'esecutore

1. Aprire `STATE.json` e `TASKS.json`: task attivo `SKH-HUD-001`.
2. Prima di creare un branch nuovo, controllare l'eventuale branch `agent/skh-integration/hud-backlog-consolidation`; se esiste, leggere **prima** il suo `coordination/checkpoints/SKH-HUD-001.md` e l'eventuale PR. Se manca, crearlo da ultimo main.
3. Leggere patch di #97/#101/#103/#105/#107 **una sola volta**, salvare la matrice conflitti nel checkpoint; fare una sequenza di modifiche integrative su un unico ramo.
4. Testare il prodotto combinato (`npm --prefix seven-kingdoms-html test` e `npm --prefix seven-kingdoms-html run check`), correggere le regressioni e verificare la CI sull'HEAD. Non scambiare i test verdi dei branch singoli per test dell'integrazione.
5. Fare merge della PR verificata, controllare main/Pages ed annotare limiti Android; chiudere solo le vecchie PR dimostrabilmente assorbite e con commento. Aggiornare lo stato persistente e attivare `SKH-TERRAIN-001`.

## Se un passaggio fallisce

Scrivere in `coordination/checkpoints/SKH-HUD-001.md` sul **branch**: errore esatto, comando/URL, HEAD, file interessati, correzione provata e singola prossima operazione. Preferire fix direttamente nello stesso PR. Se DNS del checkout manca, usare i dati GitHub/CI per preparare un cambio reale e non ripetere all'infinito l'audit. Niente marker `completed` senza prova.
