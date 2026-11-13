# Seven Kingdoms HTML Edition — handoff esecutivo

## 13 novembre 2026 · Nuovo incarico attivo SKH-TERRAIN-002

Il giro di integrazione del proprietario ha completato la prima tranche costiera: [PR #118](https://github.com/CzekUns/Rtsmobile/pull/118) verificata e pubblicata su main **`c1a9afb39f4cd52e4a39f94addc4a5efe55444c2`**. La prossima priorità del programma resta quella concordata: **forestazione, rocce e colline originali 7KAA** (SKH-TERRAIN-002). L'automazione oraria riprende dal checkpoint di questo ID, non dal vecchio arretrato HUD o coste.

### Stato verificato
- **PR:** #118 merged, 180 record autentici `SG` mare/erba da TERRAIN1.RES, I_TERN1.RES, PAL_STD.RES 7KAA (sha256 nel manifest).
- **Sorgenti / decoder:** `tools/assets/{terrain-record,terrain-database,terrain-bitmap,render-coast,indexed-png}.mjs`; manifest 180 record, original pixel atlas 512×384.
- **Rendering reale:** `playtest/original-coast.js` collegato in `view.js`, `?coasts=0` per disabilitare selettivamente; pure original 32 tiles preservate come fallback.
- **Test PR:** [#43438890792](https://github.com/CzekUns/Rtsmobile/actions/runs/43438890792), 232 Node PASS, 0 FAIL, 2 SKIP + Chromium HTTP PASS.
- **Main CI:** [#43439241900](https://github.com/CzekUns/Rtsmobile/actions/runs/43439241900) SUCCESS. **Pages:** [#43439241935](https://github.com/CzekUns/Rtsmobile/actions/runs/43439241935) SUCCESS.
- **Galleria grafica:** `assets/previews/terrain-coast-qa.html` con 1×/3×, 14/14 combinazioni. Questo NON sostituisce il confronto della stessa scena 7KAA o test hardware Android.
- **Dati demo:** terra/collisioni, unità e partite salvate non modificati.

### Per l'esecutore della prossima run
1. Recupera `coordination/STATE.json`, `TASKS.json`, poi il checkpoint `coordination/checkpoints/SKH-TERRAIN-002.md` **dal branch del task** (se esistente, più recente di main); non ricominciare dai 750 record di costa.
2. Verifica il catalogo risorse originali dedicate a **alberi/foreste, rocce, colline/rilievi** nel sorgente 7KAA pinned; distingue texture di terreno puro, sprite di natura e oggetti elevati con layering e ingombro.
3. Crea o riprendi `agent/skh-integration/original-landscape-overlays` da ultimo main. Pubblica un insieme coerente di risorse originali con provenienza/hash, atlas, test e preview. Il collegamento in `view.js` rispetta depth order di città/forti/unità e il layout mobile.
4. Test Node + CI GitHub HEAD + browser HTTP e, quando possibile, screenshot grafici 1×/2×; conserva il fallback. Pubblica il checkpoint prima della fine di ogni run, specificando la prossima azione esatta.
5. Non segnare `done` se mancano QA device o generatore originale. L'eventuale limite esterno va registrato, senza ritornare ad audit generici.

### Residui manuali
- HUD #115: test fisico Android fullscreen/MOD+levetta.
- SG coast #118: confronto pixel scena 1×/2× e Android, original world generator non ancora portato.
- Nessun nuovo blocco tecnico di CI/Pages nella release SG.
