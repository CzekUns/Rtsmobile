# Quartieri d'Ombra — Laboratorio isometrico B (reference Chicago 1930)

Esperimento **separato e reversibile**: `isometric-1930/index.html`. Non modifica il gioco principale, il LAB WebGL a quota lampione, il vecchio LAB SVG né gli asset ImageGen.

## Scopo

Prendere la grammatica estetica dei giochi strategico-tattici PC 1998–2003, con riferimento principale **Chicago 1930: The Prohibition** (Spellbound Entertainment, 2003), per ottenere in **Five Points, New York, 1860** uno stile isometrico più leggibile e materialmente ricco. È una direzione estetica da validare, non una approvazione.

Stile prioritario:
- inquadratura **ortografica** isometrica, niente camera free-look stradale in questo laboratorio;
- superfici **testurizzate** (mattoni, lastre di ardesia, selciato, intonaco, legno, tappeti) con dettaglio rumoroso e contorni materici;
- edifici selezionabili con **sezione di tetti e facciate frontali**, pavimento e mobili visibili;
- elementi di scala 1860: lampioni a gas, casse, barili, tavoli, banconi, figure con cappelli, finestre illuminate;
- menu tattico in colonna con alto contrasto, evitando riproduzioni di ritratti o interfacce protette.

## Implementazione di questa prima prova

HTML e Three.js r187 (CDN) con pixelRatio limitato, scene depth buffer, camera ortografica (rotazioni di 90°), pan con un dito e pinch zoom, tap selezione, toggle interni. Reimpiegati **26 lotti reali** della mappa canonica `QOBoardWorld.generate(1860)` attorno al Five Points hub. Nessun'immagine di Chicago 1930 viene inserita nel rendering: tutte le texture sono generate nel browser da algoritmi originali.

Codice di prova: `iso-core.js`, `iso-scene.js`; test: `iso-scene.test.cjs`.

## Reference consultabili (non usate come asset)

- Steam: https://store.steampowered.com/app/623920/Chicago_1930_The_Prohibition/
- Galleria GameWatcher: https://www.gamewatcher.com/chicago-1930/screens
- Interni ed esterni: https://www.old-games.ru/game/screenshots/8270.html
- Ristorante e cutaway: https://www.pcgames.de/Chicago-1930-Spiel-19972/Tests/Chicago-1930-256821/
- MobyGames: https://www.mobygames.com/game/11674/chicago-1930/
- Riferimento utente e analisi su Drive: https://drive.google.com/drive/folders/1D6WVX_sd1dRuDyxe4lcCGnZOodkKD5ah

Questi materiali e la schermata allegata dall'utente servono **esclusivamente per studio estetico**; non estrarre, ridistribuire come sprite o incorporare screenshot originali nel gioco.

## Limiti e prossimi criteri

Il laboratorio è un primo test originale di proiezione, materiali e interni. Non equivale a una replica della qualità pre-renderizzata di Chicago 1930. Verificare con screenshot browser desktop/mobile, in particolare: aspetto delle texture, angolazioni 45°/135°/225°/315°, funzione cutaway dal lato vicino, leggibilità arredi a zoom ravvicinato, selezione, FPS e densità di oggetti. Se il feel è accettato, procedere con art QA e modularità dei prefab, non sovrascrivere gli altri renderer.
