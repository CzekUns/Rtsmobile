# AGENTS.md — Seven Kingdoms HTML Edition

**Ambito: soltanto `seven-kingdoms-html/`.** Questa cartella è la riscrittura nativa di **Seven Kingdoms: Ancient Adversaries**. NON è il progetto Ver Sacrum nella root e NON è il vecchio esperimento `ver-sacrum-7k/`.

## Stato persistente e programma dell'orchestratore (novembre 2026)

Per ogni chat o automazione esecutiva, il programma concordato e lo stato reale sono in [`coordination/README.md`](./coordination/README.md), [`coordination/STATE.json`](./coordination/STATE.json), [`coordination/TASKS.json`](./coordination/TASKS.json) e nel checkpoint dell'incarico sul **branch attivo**. **Leggere questi file prima di ripetere audit o scegliere un incarico.** I ruoli SKH-101–106 non diventano agenti in esecuzione soltanto perché esistono nel piano.

La pianificazione globale `coordination/{ROADMAP.md,TASKS.json,STATE.json,DECISIONS.md,HANDOFF.md}` è di competenza esclusiva dell'orchestratore/integratore (corsia SKH-106), con modifiche tramite PR. Gli altri stream mantengono prove e avanzamento sulle rispettive PR; non sovrascrivono i dati globali. L'integratore/automazione segue **un solo task assegnato** fino a consegna o blocco esterno documentato; la priorità non va reinventata a ogni esecuzione.

## Istruzioni obbligatorie prima di scrivere codice

1. Leggi `README.md`, `PIANO_DI_SVILUPPO.md`, `PORTING_MAP.md`, `PARALLEL_WORK.md` e `WORKSTREAMS.json`.
2. Individua la tua corsia/issue **SKH-101 … SKH-106**, crea o usa **il relativo branch** `agent/skh-<corsia>/<task>` partendo da `main` aggiornato. Non fare commit direttamente su `main`.
3. **Modifica esclusivamente i path in `WORKSTREAMS.json` assegnati al tuo stream.** Il controllo CI rifiuta PR `agent/skh-*` che oltrepassano i confini.
4. Se devi cambiare `game.js`, `rules.js`, `view.js`, `index.html`, `style.css`, `README.md` o altri file comuni, **NON farlo nel tuo stream**: definisci export/contratto in `docs/<corsia>/CONTRACT.md` e passa una richiesta allo stream `integration`.
5. Non copiare da Ver Sacrum modello, codice, asset o salvataggi. I riferimenti per regole e dati sono sorgenti **7kaa C++ GPLv2** e build originale WebAssembly già pubblicata, con versione verificata.
6. Non dichiarare `implemented/parity` ciò che è solo una simulazione o un placeholder. Per ogni modulo: riferimento originale, casi di test, comportamento ripetibile, limiti espliciti.
7. Asset: prima conversione legittima delle risorse originali, solo poi creazione di nuovi sprite per le mod. Per diagonali M/GM leggere prima `CzekUns/sevenkindomsmobile/skills/seven-kingdoms-oblique-walk/SKILL.md`.
8. Non introdurre dipendenze non necessarie, WebAssembly nel nuovo runtime, scritture a storage condiviso senza namespace, o manipolazioni di archivi di terze parti senza verifica delle licenze.

## Ownership per agente

| Corsia | Branch prefix | File modificabili | Scopo |
|---|---|---|---|
| SKH-101 Assets | `agent/skh-assets/` | `tools/assets/`, `assets/manifests/`, `assets/previews/`, `tests/assets/`, `docs/assets/` | Decoder, atlanti, asset manifest, QA |
| SKH-102 Towns | `agent/skh-towns/` | `systems/towns/`, `tests/towns/`, `docs/towns/` | Regole città/razze/fedeltà con test C++ |
| SKH-103 UI | `agent/skh-ui/` | `ui/classic/`, `tests/ui/`, `docs/ui/` | UI originale, componenti/overlay senza cambiare entrypoint |
| SKH-104 Core | `agent/skh-core/` | `core/`, `tests/core/`, `docs/core/` | Clock, RNG, save/versioni e determinismo |
| SKH-105 Movement | `agent/skh-movement/` | `systems/movement/`, `tests/movement/`, `docs/movement/` | Pathfinding e collisioni in moduli isolati |
| SKH-106 Integration | `agent/skh-integration/` | tutta `seven-kingdoms-html/` + workflow CI dedicato | Collegamento degli export e regressioni, un PR alla volta |

I path di tabella sono **relativi alla cartella `seven-kingdoms-html/`**, salvo il workflow. La macchina usa la lista esatta in `WORKSTREAMS.json`; questa tabella è solo un promemoria.

## Protocollo di consegna per gli agenti

- **Un issue → un branch → un PR** verso `main` con prefisso `[SKH-10N]` nel titolo.
- Inizia con un file `docs/<corsia>/CONTRACT.md`: export, input/output, errori, dipendenze, provenienza e limiti. Non servono modifiche a file comuni.
- Commit con titolo specifico `feat(7k-assets): ...`; niente "refactor totale" multi-corsia.
- Sviluppa in **worktree separato** se più agenti operano sullo stesso computer:
  `git fetch origin && git worktree add ../7k-assets -b agent/skh-assets/decoder origin/main`.
  Per gli altri stream cambia il prefisso, usando directory e branch differenti.
- Prima di aprire PR: `npm --prefix seven-kingdoms-html test` e, se applicabile, test renderer/assets con preview e screenshot. Mai omettere la prova manuale quando il risultato è visivo.
- PR deve specificare: issue, scope, export consegnati, test, screenshot, riferimenti upstream e **cosa NON è ancora pronto**.
- Non fare merge autonomo in `main`. Il coordinatore verifica CI, conflitti, compatibilità del contratto, effetti visivi e provenienza prima del merge.
- L'integratore non riscrive in un PR il codice altrui: collega gli export, esegue regressioni, aggiorna i manifest e richiede correzioni al proprietario se serve.
- Se il lavoro richiede file di un'altra corsia, apri un issue/nota di handoff; **non** scavalcare la ownership e **non** fare cherry-pick silenziosi.

## Gate di integrazione

**Contratto → test indipendenti → PR isolato → review → merge → PR di integrazione → confronto con Seven Kingdoms originale → release.**

I branch `agent/skh-*` hanno verifica automatica del perimetro. Il sistema NON imposta automaticamente regole GitHub di protezione del ramo: i merge manuali devono rispettare questa policy finché non vengono attivati branch protection/required checks dal proprietario della repo.

## Avvio rapido

```bash
git fetch origin
git worktree add ../7k-towns -b agent/skh-towns/parity origin/main
cd ../7k-towns
npm --prefix seven-kingdoms-html test
# Lavorare SOLO in seven-kingdoms-html/systems/towns, tests/towns, docs/towns.
# Aprire PR verso main, indicando SKH-102.
```

**Se il codice condiviso è in evoluzione mentre sviluppi, aggiorna/rebase il tuo ramo appena prima di aprire la PR**; non sovrascrivere i cambiamenti altrui. In caso di conflitto sul contratto, lo risolve il coordinatore con le due parti.
