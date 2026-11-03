# Lavoro parallelo — Seven Kingdoms HTML Edition

**Scopo:** fare lavorare più agenti contemporaneamente **senza riscrivere file condivisi e senza confondere Seven Kingdoms con Ver Sacrum**. Questa è la procedura eseguibile, collegata al piano strategico in [PIANO_DI_SVILUPPO.md](./PIANO_DI_SVILUPPO.md). I vincoli automatici sono in [WORKSTREAMS.json](./WORKSTREAMS.json); le regole per gli agenti in [AGENTS.md](./AGENTS.md).

## Stato effettivo

- **Predisposto:** branch naming, ownership di cartelle, consegna via PR, contratti e test, controllo automatico dei path per branch `agent/skh-*`.
- **Non garantito dal solo documento:** gli agenti **non sono in esecuzione**; vanno avviati da sessioni/automazioni esterne, collegati a GitHub e assegnati. Le issue sono consegne da svolgere, non codice già scritto.
- **Nessuna protezione `main` imposta da questo documento**: l'integratore/proprietario deve attivare su GitHub "Require a pull request" e "Require status checks to pass" per rendere vincolante la revisione; il workflow da solo segnala i problemi.
- **Riferimento tecnico:** 7KAA originale per parità, build C++/WASM `CzekUns/sevenkindomsmobile` per confronto, questa cartella per porting nativo.

## Sprint parallelo iniziale: F00–F02

I seguenti cinque flussi possono lavorare **in contemporanea da `main`**. Le interfacce saranno collegate solo dallo stream d'integrazione (sesto agente) dopo la review.

| ID | Agente | Branch suggerito | File scrivibili | Consegna indipendente |
|---|---|---|---|---|
| SKH-101 | Asset & decoder | `agent/skh-assets/decoder` | `tools/assets/`, `assets/manifests/`, `assets/previews/`, `tests/assets/`, `docs/assets/` | Catalogo degli archivi, parser sperimentale, frame/offset/palette e manifest |
| SKH-102 | Villaggi & regole | `agent/skh-towns/parity` | `systems/towns/`, `tests/towns/`, `docs/towns/` | Funzioni pure + test per tasse, sussidi, fedeltà, cultura, reclute |
| SKH-103 | UI classica | `agent/skh-ui/classic-hud` | `ui/classic/`, `tests/ui/`, `docs/ui/` | Componenti HUD e pannelli 800×600 con prove visive; non editare index/style |
| SKH-104 | Engine & salvataggi | `agent/skh-core/determinism` | `core/`, `tests/core/`, `docs/core/` | Clock a tick deterministico, seed RNG, ID persistenti, save versionato |
| SKH-105 | Movimento & collisioni | `agent/skh-movement/pathfinding` | `systems/movement/`, `tests/movement/`, `docs/movement/` | A*, griglia di occupazione, regole di movimento e test |
| SKH-106 | Coordinatore/integratore | `agent/skh-integration/first-wiring` | File comuni `game.js`, `rules.js`, `view.js`, `index.html`, `style.css` e altri del progetto | Verifica contratti; integra i cinque rami in PR dedicate, risolve dipendenze e prova la build |

Le cartelle indicate sono relative a `seven-kingdoms-html/`. La **lista esatta delle autorizzazioni** è nel file macchina `WORKSTREAMS.json` (usa quella per ogni modifica).

### Contratti pubblici minimi per ogni stream

Ogni corsia crea `docs/<corsia>/CONTRACT.md` e relativi test **prima** di chiedere l'integrazione. Evitare classi che importano direttamente `SevenGame` o la UI monolitica finché l'integratore non conferma il contratto.

**SKH-101 — Asset.** `tools/assets/` espone uno script CLI con input `--source <path>` e `--out <path>`, che produce `assets/manifests/<pack>.json` contenente `source`, `sourceHash`, `license`, `sprites[]` con `id`, `action`, `direction`, `frame`, `width`, `height`, `pivotX`, `pivotY`, `palette`, `path`. Verificare 6 frame dichiarati vs distinti; **non inventare dimensioni e offset**. Fonti originali: `ORESX.cpp`, `OSPRTRES.cpp`, `OSFRMRES.cpp`, `ODB.cpp`.

**SKH-102 — Regole villaggi.** Esportare **funzioni pure** in `systems/towns/`, con input di stato immutabile e ritorno `{ok, reason?, nextTown, cashDelta?, effects[]}`, senza scrivere a `localStorage` o invocare il renderer. Numeri e condizioni dalle funzioni 7KAA `Town::collect_tax`, `Town::reward`, `Town::recruit`, `update_loyalty`, `update_resistance`. Testare penalità cumulative, razze, forti non collegati, soglie.

**SKH-103 — UI.** Esportare funzioni/renderers in `ui/classic/` che ricevono un `ViewModel` descritto in `docs/ui/CONTRACT.md`, non un'istanza concreta di `SevenGame`. Componenti non devono fare save, mutare stato di simulazione o aggiungere handler globali senza documentazione. Presentare snapshot 800×600, Android landscape, schema touch.

**SKH-104 — Core.** Esportare servizi *non mutanti* per `stepClock(state, delta)`, generatore riproducibile `createRng(seed)`, allocator ID e serializzazione `encodeSave/decodeSave` con `schemaVersion` e migrazione. Essere indipendente da `window`, `document`, canvas e `localStorage` (gli adapter browser sono dell'integratore).

**SKH-105 — Movimento.** `findPath({width,height,start,goal,isBlocked,maxNodes}) => [{x,y},...]` con coordinate in **tile**, ordine deterministico e convenzione per ostacoli esplicita; `canOccupy(...) ` per unità grandi. Test per ostacoli, corsie strette, mete impossibili, unità adiacenti, zero sovrapposizione. NON imporre un proprio scheduler.

**SKH-106 — Integrazione.** Definire adapter e traduzione in `game.js`/`rules.js`/`view.js` SOLO dopo review, senza duplicare algoritmi già consegnati dalle altre corsie. Può richiedere iterazione sul contratto, ma **non modifica silenziosamente il codice di altri agenti**.

### Workflow operativo reale

1. Il coordinatore approva una issue. L'agente prende il branch specifico dal più recente `main` (`git fetch origin`).
2. Se più agenti usano la stessa macchina/repo: **un Git worktree distinto per agente**, con directory diversa. Esempio:
   ```bash
   git fetch origin
   git worktree add ../7k-assets -b agent/skh-assets/decoder origin/main
   git worktree add ../7k-towns -b agent/skh-towns/parity origin/main
   git worktree add ../7k-ui -b agent/skh-ui/classic-hud origin/main
   git worktree add ../7k-core -b agent/skh-core/determinism origin/main
   git worktree add ../7k-movement -b agent/skh-movement/pathfinding origin/main
   ```
   Se i branch esistono già, `git worktree add ../7k-assets agent/skh-assets/decoder` invece di ripetere `-b`.
3. Agente lavora nei propri path, scrive test e contratto. `npm --prefix seven-kingdoms-html test`.
4. Agente apre PR: titolo `[SKH-101] ...`, descrizione secondo `docs/PR_CHECKLIST.md`. CI verifica test, JS e scope dei file cambiati.
5. Un PR della corsia **non integra automaticamente la funzionalità nel gioco**. Il coordinatore esamina il contratto e, se corretto, approva il merge in `main`.
6. L'agente integrazione parte dal `main` aggiornato e fa PR piccola e distinta per il collegamento al runtime; l'ordine di integrazione è **core → towns → movement → assets → UI** in funzione delle dipendenze effettive, senza impedire che il lavoro isolato avanzi in parallelo.
7. Dopo ogni integrazione: snapshot di gioco originale e HTML, test parity, Android reale, aggiornamento stati nel piano. Nessuna dichiarazione di "completato" se manca la prova visuale/correttezza.

### Rami, conflitti e responsabilità

- **Non usare branch `work/T*` esistenti**: appartengono al lavoro precedente sulla root di Ver Sacrum. I nuovi sono solo `agent/skh-*/`.
- Evitare che due agenti modifichino `rules.js`, `game.js`, `index.html` o `style.css` insieme: sono **entrypoint del coordinatore**. Il codice nuovo nasce in moduli isolati.
- Non fare un merge "last writer wins", non push forzati a `main`, non cherry-pick di componenti non revisionati.
- Se due issue dipendono da una API ancora assente: documentare contratto/adapter mock con test; l'integratore definisce la versione condivisa. Nel frattempo proseguire su altri task.
- Non annullare una correzione fatta da un altro agente perché il proprio branch era vecchio. Riesaminare il diff prima di fare rebase.
- L'agente asset non interviene nei file binari ufficiali della versione WebAssembly e non aggiorna la MOD esistente.

## Check di qualità per il primo batch

| Stream | Prova indipendente (necessaria, non facoltativa) | Blocco |
|---|---|---|
| Assets | Manifest riproducibile e confronto bit/frame; atlas campione e rendering visivo | No asset originali senza dati e licenza |
| Towns | Tabelle C++ originali, 3+ casi per ciascun comportamento | No "formula inventata per assomigliare" |
| UI | Screenshot comparato, pannelli non troncati, simulazione touch | No HTML con finti pulsanti |
| Core | Seed riproducibile, pausa/tick, encoding/decoding stabile | No cambiamenti silenziosi ai salvataggi |
| Movement | Griglia, collisioni, pathfinding, target impossibili | No unità che attraversano edifici |
| Integration | Import reali, nessuna regressione, build browser e handheld | Non prendere in carico codice non reviewato |

## Handoff standard tra agenti

Nel PR va inserita una nota in `docs/<corsia>/CONTRACT.md` con:
```text
Issue / branch / PR:
Sorgente upstream (commit/percorso):
Files modificati:
Export e struttura dati:
Dipendenze richieste dall'integratore:
Test automatici eseguiti:
Prove visive e link screenshot (se applicabili):
Limiti / funzioni ancora mock:
Decisioni in attesa:
```

Nessuno stream ha bisogno di aspettare che gli altri completino il codice per iniziare il proprio lavoro **isolato**. I vincoli emersi nella review sono trasformati in issue di adattamento, non in modifiche fuori scope.

## Passi di amministrazione ancora da eseguire dal maintainer

1. **Attivare branch protection su `main`** e richiedere il job `seven-kingdoms-html / JS tests & stream scope`, se disponibile sul piano GitHub.
2. **Assegnare le issue ad agenti o collaboratori**: i branch e le issue predisposti non equivalgono ad agenti avviati.
3. Valutare se dividere `seven-kingdoms-html/` in repo autonoma per evitare contaminazione con la root `Rtsmobile`.
4. Dopo F00 decidere quali corsie aggiungere: economy, military, diplomacy, mods e QA sprite con regole di ownership ugualmente esplicite.

**Regola finale:** parallelismo sì sulle attività e sulle cartelle; **integrazione serializzata per contratto** nei file condivisi.
