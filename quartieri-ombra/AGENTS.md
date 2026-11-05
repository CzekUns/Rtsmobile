# Confini obbligatori degli agenti — Quartieri d'Ombra

Progetto isolato: `CzekUns/Rtsmobile/quartieri-ombra/`. Sviluppa soltanto qui.

## Regola non negoziabile
- NON modificare, cancellare o rinominare nessun file fuori da `quartieri-ombra/`.
- NON modificare root `index.html`, README, asset globali, `.github/`, workflow Pages, `seven-kingdoms-html/`, `ver-sacrum-7k/` o qualsiasi altro gioco.
- NON creare branch globali di deploy né alterare Pages. Il deploy esistente pubblica tutta la root di `main` e renderà disponibile `/Rtsmobile/quartieri-ombra/` senza cambi di configurazione.
- La direzione estetica marcata APPROVATA in ART_DIRECTION.md è vincolante: il concept in-game 1998–2003 prevale sui precedenti artwork cinematografici; non marcare grafica finita prima del confronto con lo screenshot originale.
- Non usare asset di film, fotogrammi protetti, nomi di personaggi di finzione, loghi e altri contenuti senza licenza. I mockup sono SOLO reference visive; non ritagliare porzioni come sprite finali senza verificare condizioni e qualità.
- Conflitti con altre automazioni: recupera sempre ultima main prima di scrivere; fai modifiche file-specifiche; mai force push; mai sovrascrivere file di altri progetti.
- Prima di ogni sessione leggi README.md, SPEC.md, ART_DIRECTION.md, ROADMAP.md, WORKLOG.md e questo file.

## Metodo di ogni iterazione
1. Esamina stato reale della cartella e ultime modifiche, scegli il primo obiettivo non completato della roadmap.
2. Implementa codice o asset ORIGINALE realmente funzionale, non solo piani o placeholders. Preferisci una piccola porzione completa e testabile.
3. Esegui controlli (linter, test unitari e smoke browser se disponibile); correggi bug; non dichiarare test eseguiti senza effettuarli.
4. Aggiorna ROADMAP.md con progresso verificato e WORKLOG.md con data, commit e risultato; se necessario annota blocco.
5. Consegna modifiche limitate alla cartella e comunica in modo sintetico cosa è cambiato con link e criticità.
6. Regole mancanti/ambigue: preserva l'intento della chat; fai decisioni reversibili, documentale; non inserire espansioni prima del loop base.

## Qualità e chiusura
Considera il progetto FINITO soltanto quando tutti i criteri in ROADMAP.md / Definition of Done sono verificati su desktop e mobile, la partita è completabile sia vincendo che perdendo, l'IA usa le stesse regole, i salvataggi funzionano, non ci sono errori bloccanti, l'interfaccia e asset hanno una direzione anni 1998–2003 coerente e test di regressione passano. Dopo verifiche con esito positivo, aggiorna stato COMPLETATO, segnala completamento e disattiva il worker orario se hai accesso alla sua automazione. Non fermarti solo perché un MVP è avviabile.
