# Handoff esecutivo — Seven Kingdoms HTML Edition

## 13 novembre 2026 — Nuovo incarico attivo: SKH-TERRAIN-001

**L'ultimo giro di integrazione ha completato tecnicamente SKH-HUD-001** su main mediante [PR #115](https://github.com/CzekUns/Rtsmobile/pull/115). Il programma passa ora alle **coste e transizioni originali 7KAA**. Il collaudo fisico Android/fullscreen rimane registrato come `awaiting_manual_qa` per il task HUD; non equivale a bug aperto noto.

### Dati di rilascio verificati
- **Main prodotto:** `ec628a2edf87e0d3d2f46a338d751057fd1ca55a` — HUD consolidata da #97, #101, #103, #105, #107.
- **Test PR:** [GitHub Actions #43391166870](https://github.com/CzekUns/Rtsmobile/actions/runs/43391166870): 212 Node PASS, 0 FAIL, 2 SKIP e Chromium HTTP smoke **PASS** con ORDINI, report, indicatori, MOD, levetta, invocazione fullscreen tramite stub e ciclo reale di salvataggio/ricaricamento.
- **Test main:** [Actions #43391451648](https://github.com/CzekUns/Rtsmobile/actions/runs/43391451648) SUCCESS.
- **GitHub Pages:** [deploy #43391451601](https://github.com/CzekUns/Rtsmobile/actions/runs/43391451601) SUCCESS sullo SHA di prodotto indicato. Il sito statico è `https://czekuns.github.io/Rtsmobile/seven-kingdoms-html/`.
- **Fonte PR arretrati:** #97, #101, #103, #105, #107 chiuse con note di sostituzione. Non ripubblicarle individualmente.
- **Limiti:** Android fisico e fullscreen immersivo **non testati**; il browser ha verificato la chiamata API, non il comportamento hardware. Nessuna parità grafica originale certificata.

### Prossima azione concreta, senza ripetere gli audit HUD

1. Leggere `coordination/STATE.json`, `TASKS.json` e `coordination/checkpoints/SKH-TERRAIN-001.md` su main oppure, se esiste, sul suo branch più recente.
2. Cercare le definizioni reali delle transizioni di costa nei sorgenti 7KAA (in particolare `OTERRAIN.cpp`, resource naming/record e tavole tile); recuperare ove legittimo `TERRAIN1.RES`, `I_TERN1.RES` e i metadati palette dal repository originale/base 7KAA. Non assumere che un nome indicato sia certamente presente: verificarlo nei file effettivamente accessibili.
3. Creare il branch `agent/skh-integration/original-coast-transitions` da ultimo main se non esiste. Scrivere sul branch un checkpoint con **sorgente esatta, hash/licenza verificati, record di angoli identificati e singolo prossimo step**.
4. Implementare un gruppo coerente di tasselli/mapping acqua-terra, test e anteprima riproducibile. Conservare fallback, unità, input e salvataggi. Test/CI e Pages dopo integrazione.
5. Non cambiare incarico né creare una PR di report quando un punto tecnico può avanzare sul branch attivo.

**Regola di conflitto:** prima di ogni push controllare gli HEAD del branch e di `main`; se un altro esecutore ha avanzato lo stesso task, ripartire dal suo checkpoint. Nessun force push o merge di PR draft.
