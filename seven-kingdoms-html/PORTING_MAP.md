# Mappa del porting: Seven Kingdoms C++ → HTML/JavaScript

Il progetto mira alla parità di comportamento, non a inventare un nuovo RTS. Questo documento collega **ciascun modulo originale 7KAA** a un futuro modulo JavaScript. Il codice originale è disponibile con licenza GPLv2:

- https://sourceforge.net/p/skfans/7kaa/ci/master/tree/
- Mirror GitHub ispezionabile: https://github.com/the3dfxdude/7kaa
- Versione giocabile WebAssembly: https://github.com/CzekUns/sevenkindomsmobile

## Stato oggettivo

- **Primo scheletro:** \`rules.js\` contiene sistemi *semplificati e non ancora fedeli numericamente*; \`view.js\` disegna simboli provvisori. Non interpretare il prototipo come 7KAA completo.
- **Nessuna base Ver Sacrum:** non contiene regole, SVG, strutture e salvataggi Ver Sacrum.
- **Nessuna traduzione automatica del WASM:** per ogni modulo si deve confrontare sorgente C++ e comportamento del 7kaa originale, scrivere JS, creare test di parità e poi sostituire il codice temporaneo.
- **Asset:** il gioco originale distribuisce archivi di sprite e risorse in formati dedicati. Per ora non sono stati importati; andranno convertiti rispettando la GPL e i requisiti del marchio.

| Sistema | Sorgente Seven Kingdoms | Obiettivo JS | Stato |
|---|---|---|---|
| Villaggi, crescita, tasse, lealtà | \`src/OTOWN.cpp\` | \`rules/towns.js\` | Semplificato in \`rules.js\` |
| Reclute, formazione e UI villaggi | \`src/OTOWNIF.cpp\`, \`src/OTOWNA.cpp\` | \`rules/recruitment.js\` | Recluta base |
| Villaggi neutrali, resistenza | \`src/OTOWNIND.cpp\` | \`rules/independents.js\` | Diplomazia dimostrativa |
| Edifici, operai, proprietà | \`src/OFIRM.cpp\`, \`src/OFIRMRES.cpp\` | \`rules/firms.js\` | Sei edifici dimostrativi |
| Miniere, depositi, produttività | \`src/OF_MINE.cpp\` | \`rules/mines.js\` | Produzione aggregata |
| Fabbriche, materie prime | \`src/OF_FACT.cpp\` | \`rules/factories.js\` | Produzione aggregata |
| Mercati, merci, commercio | \`src/OF_MARK.cpp\` | \`rules/markets.js\` | Vendita aggregata |
| Unità, ordini, movimento | \`src/OUNIT.cpp\`, \`src/OUNITM.cpp\` | \`rules/units.js\` | Movimento semplice |
| Battaglie e assedi | \`src/OUNITA*.cpp\` | \`rules/combat.js\` | Da iniziare |
| Regni, relazioni, AI | \`src/ONATION*.cpp\`, \`src/OAI_*.cpp\` | \`rules/nations.js\`, \`rules/ai.js\` | Da iniziare |
| Interfaccia e disegno | \`src/OTOWNDRW.cpp\`, \`src/OUNITDRW.cpp\` | \`view.js\`, \`game.js\` | Layout 800×600 ricreato |
| Sprites e dati di gioco | \`data/*.data\` della build browser | \`assets/\` e converter | Da iniziare |

## Metodo obbligatorio per ogni iterazione

1. Isolare la funzione o il comportamento originale 7kaa.
2. Documentare input, output, condizioni e tabelle/costanti.
3. Portarlo in JavaScript con nomi corrispondenti.
4. Confrontare scenari di riferimento e aggiungere test.
5. Collegare al rendering HTML e verificare in game.
6. Contrassegnare come **portato** soltanto quando l'equivalenza è verificata.

Per esempio, il sorgente \`Town::collect_tax\` richiede un accampamento amico collegato e applica penalità cumulative sulla fedeltà; l'attuale \`SevenGame.tax\` è volutamente una scorciatoia prototipale. Per diventare una ricostruzione vera va portata la logica C++ originale, non semplicemente cambiata la grafica.
