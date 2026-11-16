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
