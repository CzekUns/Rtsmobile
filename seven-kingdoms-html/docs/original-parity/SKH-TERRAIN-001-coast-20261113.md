# SKH-TERRAIN-001 — 180 coste SG originali 7KAA (13 novembre 2026)

## Origine verificata e riproduzione
- **Repository sorgente:** `the3dfxdude/7kaa` commit `14e6fdfba9481af4dc3a54722614a608776e20bc`, dati GPL-2.0-or-later.
- `data/RESOURCE/TERRAIN1.RES` (750 righe DBF): SHA-256 `67b445d86916393c00e3b88466b7fa354701ef33b1c372e06fc463e0ba8a613a`.
- `data/RESOURCE/I_TERN1.RES` (bitmap 32×32 indicizzate): SHA-256 `791745a1bbaed1eeb3582725cf05f90918fd0733682b32eec697b6e297f45774`.
- `data/RESOURCE/PAL_STD.RES` (RGB 256×3, header 8 byte): SHA-256 `8bda65c749340446edb6debe73a5b0f67b1a4af8dd0fdb1fa0222a69848b6ef7`.
- In `TERRAIN1.RES` sono presenti **180 righe SG** con una sola tipologia mare `S` nella coppia rappresentante/secondaria `S/G`. Tutte hanno bitmap originali da 32×32 in `I_TERN1.RES`. Tutti i dati di bordo NW/NE/SW/SE sono conservati nel manifest.
- La bitmap originale `SG-028` (ID 412, offset `0x13668`) ha payload LE 1028, w=32, h=32, primi 16 indici `b8 27 69 b9 28 69 28 69 27 26 28 28 27 b8 28 69`, testati.
- I tre SHA-256 sono calcolati sui veri byte originali; i Git blob SHA sono distinti e registrati nel manifest.

## Asset e rendering nel browser
- Atlas `assets/previews/TERRAIN1-SG-coast-16x12.png`: **512×384, indicizzato 8-bit**, palette RGB autentica, 180 tasselli DBF in ordine di ID, senza creare pixel o colori nuovi.
- Manifest `assets/manifests/TERRAIN1-SG-coast-16x12.json`: record fonte, offset, cornerCodes, atlasIndex, hash, fileName.
- Generatore `tools/assets/render-coast.mjs` (dipende soltanto dagli archivi 7KAA originali, non da rete) e codec `tools/assets/indexed-png.mjs` possono ricostruire l'atlas, rifiutando input con hash diversi.
- `playtest/original-coast.js` seleziona il primo record SG il cui codice di angoli corrisponde alle classi di vertice campionate dalla demo, conservando la logica di priorità prima compatibile con `TerrainRes::scan`.
- `view.js` lo disegna sotto città/unità quando l'asset è disponibile. Mappa/collisione/salvataggi/minimappa invariati. Se il PNG o il manifest non si caricano, rimane visibile la tessera originale pura; `?coasts=0` disattiva selettivamente le coste.

## Fedeltà e limiti (non equivocare)
Il generatore di mondi HTML produce **classi terreno per cella** mentre 7KAA impiega codici di quattro angoli con quote/sotto-tipi e pattern. Qui i quattro angoli sono **campionati dalla griglia dimostrativa** e usa il mask wildcard per l'abbinamento. Non sono ancora importati il sistema di quote, la scelta casuale pesata degli originali, le coste `SF` o `SD` e i tre regimi dei terreni non acqua, né foreste/rocce/colline come overlay. Sono **pixel originali su topologia demo**, non una mappa originale ricostruita.

## QA grafica
- [Apri la galleria originale 1×/2×](../../assets/previews/terrain-coast-qa.html): contatto dei 180 record e 14 esempi di bordo in scala doppia.
- [Atlas PNG](../../assets/previews/TERRAIN1-SG-coast-16x12.png)
- [Manifest](../../assets/manifests/TERRAIN1-SG-coast-16x12.json)
- [Gioco con coste](../../index.html?coasts=1) / [Gioco senza coste](../../index.html?coasts=0)
- Nodo: test Node PNG + integrità indici, 14/14 combinazioni, immagine/fetch in Chromium HTTP. **Non** sono un confronto con schermata originale 7KAA né collaudo su Android reale. Non segnare come parità visiva certificata.
