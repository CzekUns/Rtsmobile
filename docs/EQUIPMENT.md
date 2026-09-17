# T06 — Oggetti individuali (BUILD 37)

Ogni oggetto è un record unico in `game.gear`: ID, tipo e una sola posizione
(`equipped`, `bag`, `storage`, `ground`). Le viste interrogano questo registro,
non mantengono copie dell'inventario. `transferEquipment` riceve ID della persona,
ID oggetto, posizione attesa e destinazione: valida tutto prima di modificare
l'unica posizione. Comandi obsoleti/doppio tap non spostano un oggetto già trasferito.

Scelte **provvisorie**, non requisiti attribuiti all'utente:

- Slot mano, corpo, testa; catalogo iniziale ascia, tunica, copricapo.
- Borsa di 4 oggetti e rastrelliera di 8 in Casa comune/Magazzino/Distretto.
  Sono spazi separati dal carico di merci: non aumentano la capacità di grano,
  legno ecc. e non ne duplicano il contenuto. Nessun bonus di combattimento ancora.
- Ogni persona iniziale di una nuova partita possiede una tunica. Nessuna
  distribuzione gratuita al caricamento di vecchi salvataggi o ai nuovi arrivi.
- Accesso alle rastrelliere entro 2 tile dal centro o dall'interno del proprio
  Distretto; recupero a terra entro 1,5 tile. Nessun trasferimento remoto o altrui.
- Uno slot occupato va liberato esplicitamente; niente scambi impliciti.

Morte/distruzione collocano gli oggetti a terra prima di rimuovere il possessore
e prima dell'autosave. I record a terra persistono; resa grafica e comandi UI
appartengono alle fasi successive. Crafting/commercio non producono ancora equipaggiamento.

Il formato v5 aggiunge `equipmentRules: 1` e `gear`. I vecchi snapshot senza entrambi
si caricano con registro vuoto, conservando il testo originale e tutte le merci.
ID duplicati, proprietari assenti, slot incompatibili o doppi e spazi ecceduti
sono rifiutati prima di sostituire la partita. Il paperdoll T07 e la vista Skill T08
restano lavori distinti; T06 è il contratto dati, non una UI già collaudata.

Test: `node tests/equipment.cjs`, più suite precedenti. Ambiente Node VM/DOM,
non browser né hardware fisico.
