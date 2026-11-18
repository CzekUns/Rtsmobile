# SKH-QA-001 — checkpoint iniziale di transizione

## 2026-11-18 07:01 CET — riparazione PR #123
- **Fonte main:** STATE.json ancora attivo su SKH-STRUCTURES-001; PR #122 già squash-merged su main `8197e8e322b750c7cdbdb170198ade91b0c257e7`.
- **Branch di transizione:** `agent/skh-integration/structures-release-transition`; PR [#123](https://github.com/CzekUns/Rtsmobile/pull/123), HEAD iniziale `6672556f5ee462fa6e14e36042336789ecfca022`.
- **Errore CI riproducibile:** Actions [#44240862784](https://github.com/CzekUns/Rtsmobile/actions/runs/44240862784) completed/failure sullo SHA sopra, step `Node unit tests (recursively discovered)`. Il validatore `coordination/validate.mjs` richiede `coordination/checkpoints/<STATE.activeTaskId>.md` presente sul branch; il branch transizione aveva attivato SKH-QA-001 senza creare il relativo checkpoint. Questo è un difetto concreto verificato per ispezione del file, non una trascrizione dei log del runner (non accessibili qui).
- **Correzione pubblicata:** aggiunto il checkpoint SKH-QA-001 su questo stesso branch, per permettere la validazione della transizione senza inventare un task o cambiare ordine.
- **CI/Node:** npm test/check locali NON_ESEGUITI (checkout locale non disponibile); CI precedente fallita; CI sul nuovo HEAD DA VERIFICARE. Pages post-merge PR #122 e test Android/parità originale NON_VERIFICATI.
- **Ambito:** solo documentazione coordinamento della PR #123, nessuna modifica runtime o asset.
- **Prossimo passo unico:** controllare Actions sull'HEAD del commit che aggiunge questo checkpoint; se fallisce leggere il job specifico e correggerlo; se verde e mergeability confermata integrare PR #123, poi verificare main e Pages e proseguire sul branch assegnato `agent/skh-integration/fidelity-regression-qa`.


## 2026-11-18 07:55 CET — transizione integrata, avvio QA
- **Fonte verificata:** main STATE.json ora indica SKH-QA-001, TASKS.json mantiene l'ordine approvato. PR #123 non-draft, mergeable e CI [#44248390487](https://github.com/CzekUns/Rtsmobile/actions/runs/44248390487) completed/success sul suo HEAD esatto `7bea6fda7a8a52536ab53d4f8523691b796731dd`.
- **Merge effettivo:** PR #123 squash-merged su main `c276b5806a2812df1ac8ad493057f62e2d7f83f8`. Creato questo branch QA da tale commit, senza alterare il programma.
- **CI e Pages post-merge:** CI su SHA main non ancora presente nel risultato delle workflow runs al controllo; Pages post-merge NON_VERIFIED. CI precedente della PR #123 verde, non equivale a Pages. npm test/check locali NON_ESEGUITI. Android landscape e parità stessa scena 7KAA NON_ESEGUITI.
- **File modificati:** solo questo checkpoint QA. Nessun runtime modificato, nessuna PR QA ancora aperta. Branch `agent/skh-integration/fidelity-regression-qa`, base main `c276b5806a2812df1ac8ad493057f62e2d7f83f8`.
- **Singolo prossimo passo:** verificare CI main e Pages per `c276b5806a2812df1ac8ad493057f62e2d7f83f8`, poi implementare sul medesimo branch un test browser riproducibile di regressione HUD/terreno/strutture 1×/2× con screenshot archiviati, prima della QA manuale Android e confronto originale.

## 2026-11-18 08:55 CET — regressione browser integrata
- **Branch:** `agent/skh-integration/fidelity-regression-qa`; ultimo commit di codice/workflow `c19e1c097626aa367d9fdc3f2d8b8d03a2bcb240` (prima `e06aa9bbde499c366dcf134c1a7a0aae5b01dc81`).
- **File:** `tests/browser/run-integrated-regression.mjs` aggiunto; `.github/workflows/seven-kingdoms-html-ci.yml` esteso per eseguire test Chromium e caricare due screenshot come artifact.
- **Cosa prova:** fixture HUD già esistente con stato PASS; produzione `WorldView` con fortezza cinese in-world a 1×/2×, differenze pixel positive rispetto al fallback, PNG validi e SHA distinti. **Non** prova parità originale né device Android, e non confronta ancora ogni categoria di terreno.
- **CI/Node:** test npm locali NON ESEGUITI; il workflow sul nuovo HEAD è in attesa di verifica. Query workflow su main `c276b5806a2812df1ac8ad493057f62e2d7f83f8` ha restituito lista vuota (endpoint connector filtra run PR); Pages post-merge NON VERIFICATO, non dichiarare fallimento né successo.
- **QA:** Android fisico NOT_RUN, stessa scena originale 7KAA NOT_RUN.
- **Singolo prossimo passo:** controllare CI HEAD della PR QA; se rosso correggere il test; se verde scaricare artifact `skh-qa-001-worldview-1x-2x`, ispezionare screenshot e completare i gate di regressione prima del merge.

## 2026-11-18 09:57 CET — CI e screenshot regressione verificati
- **Branch/HEAD verificato:** `agent/skh-integration/fidelity-regression-qa` @ `5d5e9603a20b8f2294363f8eff776c2a09382a33`, PR [#125](https://github.com/CzekUns/Rtsmobile/pull/125).
- **CI HEAD:** [Actions #44262792293](https://github.com/CzekUns/Rtsmobile/actions/runs/44262792293) completed/success; job JS tests & stream scope success, inclusi Node unit tests, syntax checks, HUD Chromium, integrated HUD/WorldView Chromium, upload screenshot e ownership. Alcuni job estrazione originali skipped (non interpretarli come passati).
- **Artifact ispezionato realmente:** `skh-qa-001-worldview-1x-2x` id `14409405899`, SHA256 archivio GitHub `1d42beea131003968a756678faa00a32946c714639a48889037618d5eb1ab4bc`. Entrambi i PNG aperti e confrontati visivamente: forte cinese completa a 1× e 2×, nessun taglio evidente del tetto/torri; pixel art ingrandita senza smoothing macroscopico. Differenze rispetto al fallback: 12910 pixel 1× e 51410 pixel 2×. Le immagini sono screenshot di fixture HTML, non dell'interfaccia di partita completa: area nera sotto la mappa, HUD e controlli touch non presenti nello screenshot. Non costituiscono prova fullscreen Android o parità con scena 7KAA.
- **File runtime modificati in questa run:** nessuno; aggiornato solo questo checkpoint con prova CI e ispezione visiva. Test npm locali NON_ESEGUITI. Pages sul main `c276b5806a2812df1ac8ad493057f62e2d7f83f8` NON_VERIFICATO. Android fisico e stessa scena 7KAA NON_ESEGUITI.
- **Prossimo passo unico:** estendere il test Chromium integrato a una schermata del gioco reale con HUD e controlli visibili a 1×/2×, salvando screenshot verificabili; mantenere aperti i gate Android e parità originale.
