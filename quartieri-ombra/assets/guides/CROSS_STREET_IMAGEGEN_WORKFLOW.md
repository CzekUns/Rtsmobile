# Cross Street block-2 — Reference obbligatoria per ImageGen

## Errore verificato dall'utente
La prima macro-illustrazione ImageGen mostrava un fronte architettonico ottocentesco credibile ma **non corrispondeva** a volumi, tetti, orientamento della strada e hitbox del blocco reale. Un altro tentativo di ImageGen ha prodotto una tavola illustrativa con etichette e diagrammi, non un asset runtime. Nessuna delle due immagini è approvata.

## Input da fornire **realmente** alla generazione image-to-image
1. **Reference architettonica esatta**: [cross-street-block-2-imagegen-input.svg](cross-street-block-2-imagegen-input.svg) — file 1332×1160 e `viewBox 0 0 333 290`; sei volumi dalla geometria canonica, nessun fondale.
2. **Maschera principale indipendente**: [cross-street-block-2-alpha-master.svg](cross-street-block-2-alpha-master.svg) — stessa tela e stesse sagome, bianco opaco soltanto sulle forme degli edifici, trasparente ovunque altrove.
3. **Guida analitica**: [cross-street-block-2-skeleton.svg](cross-street-block-2-skeleton.svg) — tetti, facciate, porte e lotti [2, 3, 4, 9, 10, 11]. La reference **non è il precedente screenshot con ciano sovrapposto alla bozza non allineata**.

Gli SVG possono essere rasterizzati in PNG RGBA alle dimensioni indicate mantenendo **esattamente** la tela, i margini, la camera e l'origine. Il riferimento per ImageGen dev'essere allegato all'operazione di image-to-image, non soltanto citato in un prompt o in un file README.

## Come produrre l'artwork
- Richiedere a ImageGen di **rivestire i sei volumi presenti nella reference**, non di ricreare liberamente il quartiere: mattoni deteriorati, tetti in ardesia, modanature, finestre e porte in stile Five Points c. 1860, vista RTS isometrica 2:1. Gli spigoli degli edifici, gli attacchi a terra, i tetti e la linea di strada sono **fissi**.
- Vietati aggiunte di case, cambi di orientamento, nuovi arretramenti, sfondo/cielo, diagrammi, etichette, numeri, bordo, annotazioni, texture oltre sagoma e ritagli arbitrari. Tela identica 1332×1160 (o risoluzione multipla con la stessa origine).
- Il risultato generativo non diventa mai la sorgente delle hitbox. Applicare sempre in compositing la maschera deterministica prima della pubblicazione, mantenendo la selezione su `board-skeleton.js` e il depth sort del singolo lotto.
- **La maschera del solo ingombro non corregge** finestre o fronti su facciate sbagliate. Se ImageGen cambia la prospettiva o il ritmo delle facciate, rigenerare o generare **solo materiali/decorazioni per piani** e comporli su tetti e pareti con le trasformazioni del motore.
- L'immagine generata può essere posta negli slot `assets/runtime/chunks/` e `chunk-index.json` **soltanto dopo** un confronto visivo ai livelli di zoom 1×, 3×, 7.5× e click di ciascuno dei sei edifici, con screenshot reali browser. Altrimenti mantenerla fra le bozze in audit.

## Garanzia formale
La geometria di produzione è: 
`world.buildings → board-skeleton.js → roof/faces/ground → reference+alpha → ImageGen texture → mask/compositing → runtime`.

Ogni successiva rigenerazione dello scheletro che cambi tetti o pareti deve anche rigenerare questi due riferimenti: un artwork già realizzato **non** si riallinea magicamente a nuovi lotti.
