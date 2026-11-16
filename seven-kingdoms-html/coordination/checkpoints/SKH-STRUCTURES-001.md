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

## Esecuzione 2026-11-16 07:00 CET — catalogo collegato al renderer
- **Stato iniziale:** catalogo Norman isolato, non collegato al renderer. Branch precedente checkpoint aa3ed47; nessuna prova CI HEAD del catalogo.
- **Codice pubblicato:** `playtest/original-sprites.js` commit `b71a80c`; `view.js` commit `cd97f16`; `tests/original-structure-catalog.test.mjs` commit `1007269`. `WorldView` inietta cataloghi espliciti nel preview renderer. Il renderer consulta geometrie/frame/phase del catalogo, verifica atlas e preserva il fallback se sprite non disponibili. Test di adapter senza immagini disponibili.
- **PR del task:** [#122](https://github.com/CzekUns/Rtsmobile/pull/122) draft, HEAD codice `1007269143e6d0bbfc87312356891bd32910fe03`; non pronta al merge. Nessun asset nuovo o cambio collisioni. Restano solo Norman, e la parità con più civiltà non è raggiunta.
- **Test:** checkout locale `git ls-remote https://github.com/CzekUns/Rtsmobile.git HEAD` fallisce `Could not resolve host: github.com`. npm test/check NOT_RUN. `fetch_commit_workflow_runs` per `1007269` restituisce `[]`: CI HEAD NON_VERIFIED. Pages post-merge `9ddc888` NON_VERIFIED; Android e screenshot 1×/2× NOT_RUN.
- **Prossimo passo singolo:** controllare la CI HEAD della PR #122 e correggere eventuale fallimento; poi confermare da fonti 7KAA la geometria/fasi BASE:NORMAN e predisporre seconda famiglia autentica, senza promuovere la PR finché i gate non passano.

## Esecuzione 2026-11-16 08:00 CET — CI precedente verde, catalogo irrigidito
- **Stato iniziale:** PR #122 draft; checkpoint precedente `857ee859fd6a5dc71d4f9fea9daa162c6c0f6774`. GitHub Actions run [#43813849990](https://github.com/CzekUns/Rtsmobile/actions/runs/43813849990) risulta `completed/success` per quell'HEAD; ciò non certifica i commit successivi.
- **Codice sul branch:** `04221c5a22da99be2a296799d1bbfc34cf7033a4` (validazione dimensioni positive, griglia frame, sequenza fasi e ordine direzioni); `df8f1f02897f172c95af15f1a21cf1460e99f10d` (test di geometria, fasi, direzioni e chiavi ereditate); `cb9478b3ef40fa68e9bd6d3668e66721902d8c91` (lookup sicuro con `Object.hasOwn`). File: `playtest/original-structure-catalog.js`, `tests/original-structure-catalog.test.mjs`. Nessuna nuova risorsa grafica e nessuna modifica a collisioni, controlli, salvataggi.
- **Verifica:** test/check npm locali NOT_RUN (checkout non disponibile in questa esecuzione). CI per `cb9478b3` NON_VERIFIED; il successo #43813849990 riguarda esclusivamente `857ee85`. Pages post-merge `9ddc888`, screenshot 1×/2× e Android NON_VERIFIED.
- **Limite di provenienza:** `docs/assets/CONTRACT.md` segnala che l'asset pipeline iniziale non certifica ancora tutti i PNG originali; i cataloghi restano `preview-only`, esclusivamente Norman, senza attribuire footprint collisionale o parità 7KAA.
- **Singolo prossimo passo:** verificare la CI sul nuovo HEAD del branch/PR #122; se fallisce, correggere il test o la validazione specifica, altrimenti verificare nei sorgenti 7KAA le geometrie BASE:NORMAN e preparare la seconda famiglia con provenance e fallback prima del merge.

## Esecuzione 2026-11-16 11:15 CET — test geometrico renderer 1×/2×
- **Stato iniziale:** PR #122 draft, precedente checkpoint `2aa52c574af9c59c228500697d5d785e7796f984`. GitHub Actions [#43821894100](https://github.com/CzekUns/Rtsmobile/actions/runs/43821894100) `completed/success` per quel commit (NON per i commit di questa run).
- **Codice pubblicato:** `ba64bbd5a55258fb0ec250c9826e90338390f802`, `tests/original-structure-catalog.test.mjs`: test delle coordinate sorgente per direzione 3/frame 4, dimensioni e ancoraggi a 1×/2×, fallback razza greca e frame/direzione fuori limite; test della fase finale BASE:NORMAN e della scala visuale 4×4 rispetto alla collisione demo 3×3. Nessun asset, runtime o collisione modificati.
- **Verifica:** npm test/check locali NOT_RUN (checkout non effettuato); CI per `ba64bbd5` NON_VERIFIED; Pages/Android/confronto pixel 7KAA NON_VERIFIED. PR #122 resta draft, nessun merge. I test sono stati scritti ma non ancora eseguiti: possibili errori devono essere corretti prima di altro sviluppo.
- **Singolo prossimo passo:** controllare Actions sull'HEAD `ba64bbd5` della PR #122; se rosso correggere il caso specifico, se verde verificare le geometrie BASE:NORMAN nel sorgente 7KAA e aggiungere una seconda famiglia autentica con provenienza prima di promuovere la PR.
