# QA, integrazione e stato di verità

## Gate di consegna
| Gate | Prova obbligatoria | Regola |
|---|---|---|
| Sorgente | path, commit e licenza di risorse 7KAA, geometrie e lookup usati | mai inventare formati, frame o palette |
| Codice | commit/push sul branch del task e diff di integrazione | un PR per incarico, niente sovrascritture di stream concorrenti |
| Node | `npm --prefix seven-kingdoms-html test` e `npm --prefix seven-kingdoms-html run check` | collegare output o CI, dichiarare se non eseguiti |
| CI | Actions per **HEAD esatto** della PR integrativa, non soltanto dei suoi componenti | rosso = fix, no merge |
| Compatibilità | controls mobile fullscreen/MOD+levetta, selezione e salvataggi | regressioni bloccanti da correggere |
| Deploy | PR merged, SHA `main` e run GitHub Pages riuscita | mergeable ≠ merge ≠ Pages disponibile |
| Visivo | screenshot confrontati sulla stessa scena a 1×/2× e Android landscape dove disponibili | non inferire prova manuale da CI Node |
| Parità 7KAA | confronti con originale documentati e attribuzioni verificabili | distinguere mock/grafica recuperata/parità certificata |

## Livelli di verifica
- `code_pushed`: il codice esiste soltanto sul branch.
- `ci_passed`: test automatici verdi per HEAD esatto; non prova funzionamento Android.
- `merged`: SHA originale oppure squash su main.
- `pages_deployed`: workflow GitHub Pages concluso **success** per quel main SHA.
- `visually_checked`: confronto visivo davvero eseguito, con schermate e fonti.
- `android_checked`: prova sul telefono effettiva, con condizioni/device; se manca `not_run`.
- `parity_certified`: comportamento/fonti/test originali soddisfatti, non applicabile a un singolo render demo.

## Snapshot prima di questa organizzazione
- `main`: `413758a15f93ffe2b302d5edfd7561f5d7fba255`.
- CI main `43221479431`: success (185 test passati, 0 falliti, 2 condizionali saltati nella verifica precedente).
- Pages `43221479622`: success per quel SHA.
- Lavoro grafico pubblicato: due sprite NORMAN dimostrativi blu/rosso con recolor, BASE:NORMAN su forte come proxy, terreno puro 32 texture, miglioramenti minimappa.
- Non certificati: parità pixel originale, device Android, transizioni coste, vegetazione/rocce e mappa originale completa.
- PR HUD arretrate #97/#101/#103/#105/#107 **non** ancora consolidate su main al momento di questa fotografia.

Questo documento definisce criteri; **non** sostituisce log reali, CI, artefatti o review.
