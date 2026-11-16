# SKH-STRUCTURES-001 — checkpoint iniziale

- **Stato:** pronto dopo merge della PR di transizione #121; nessun codice strutture avviato.
- **Branch di lavoro assegnato:** `agent/skh-integration/original-buildings-units` (da creare su main dopo #121).
- **Scope:** catalogo edifici originali 7KAA, footprint e fasi di costruzione, sprite direzionali e palette nazionali; preservare fallback, touch, salvataggi e rendering.
- **Provenienza:** usare soltanto 7KAA GPL verificato, partire dai manifest NORMAN/BASE-NORMAN esistenti; non attribuire parità senza prove.
- **QA:** npm test/check e CI HEAD obbligatori, screenshot 1×/2× e Android ancora da ottenere.
- **Singolo prossimo passo:** dopo il merge #121, creare il branch assegnato da main e verificare i manifest NORMAN/BASE-NORMAN per identificare il primo insieme coerente di strutture e frame autentici da integrare.


## Esecuzione 2026-11-16 05:00 CET — transizione verificata e branch inizializzato
- **Transizione:** PR #121 integrata con squash su main `9ddc888276701f888e8127a04ae267c9caf2f5bb`; HEAD di #121 `1d202fdd62bfdedb85933f7f38da8a39bfde8916`, CI [#43795125013](https://github.com/CzekUns/Rtsmobile/actions/runs/43795125013) SUCCESS per tale HEAD. Il successo CI della PR non certifica la nuova main.
- **Branch task:** `agent/skh-integration/original-buildings-units` creato esattamente dal merge `9ddc888276701f888e8127a04ae267c9caf2f5bb`; nessun asset/renderer strutture modificato in questa esecuzione.
- **Test:** npm test/check NOT_RUN: `git ls-remote https://github.com/CzekUns/Rtsmobile.git HEAD` → `Could not resolve host: github.com`. CI e Pages post-merge #121 NON_VERIFIED; Android e parità 7KAA NOT_RUN.
- **Ownership:** SKH-106, scope invariato; nessun cambio del programma concordato.
- **Singolo prossimo passo:** verificare CI/Pages su main `9ddc888`, poi leggere i manifest NORMAN/BASE-NORMAN effettivamente presenti e implementare sul medesimo branch il primo catalogo validato di frame/footprint originali con test; non inventare geometrie né aprire un task diverso.


## Esecuzione 2026-11-16 06:00 CET — catalogo sorgente-backed
- **Branch:** `agent/skh-integration/original-buildings-units`. Codice commit `84fa4c0fbffa5751da2ec6d337fb51e8dfaa2b4a`, test commit `d82adb419f38b3f4342c226264299e08154053bb`.
- **File aggiunti:** `playtest/original-structure-catalog.js` e `tests/original-structure-catalog.test.mjs`.
- **Implementato:** catalogo importabile di BASE:NORMAN (quattro fasi, 4×4 footprint originale dichiarato nella preview, sheet 720×160, frame 180×160) e NORMAN:M (8 direzioni × 6 frame, sheet 768×672, frame 96×112); validazione dimensionale e lookup con fallback null. Le misure provengono da `playtest/original-sprites.js` già integrato; non sono stati inventati nuovi sprite. Limite esplicito: la fortezza demo ha collisione 3×3 e il catalogo non certifica collision parity né civiltà aggiuntive.
- **Verifica:** `npm --prefix seven-kingdoms-html test` e `run check` NON_ESEGUITI, checkout remoto impedito dal DNS (`Could not resolve host: github.com`). GitHub Actions per main `9ddc888`: endpoint per workflow associati al commit ha restituito lista vuota, quindi CI/Pages post-merge NON_VERIFICATI. Nessun test Android o screenshot 1×/2× eseguito. Nessuna PR aperta in questa esecuzione.
- **Singolo prossimo passo:** verificare CI per HEAD `d82adb4` e completare l'integrazione del catalogo nel renderer con fallback, dopo aver verificato la corrispondenza sorgente 7KAA delle fasi/footprint; aggiungere test e riutilizzare la PR del task.
