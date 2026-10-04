# T04 — Comunità e mobilitazione (BUILD 35)

Comunità → Gestisci comunità apre un elenco nominale in pausa. Seleziona centra la
persona (anche residente); Mobilita fa uscire lo stesso record da un Distretto,
se esiste spazio, e lo rende mobilitato. Una persona impegnata va prima liberata.
Smobilita annulla il compito preservando il carico e rende disponibile la persona
nella posizione corrente. Entra la riporta fisicamente al Distretto e smobilita.

Disponibili + occupati + mobilitati = popolazione viva del giocatore. Residenti è
un conteggio separato della collocazione: include persone disponibili nei Distretti.
Un mobilitato resta tale mentre riceve ordini: la mobilitazione è un impiego esplicito,
non una deduzione dal combattimento automatico. Nessun bonus militare implicito.

`mobilized` è un booleano opzionale additivo nel formato v5, assente nei vecchi
salvataggi = false. Un residente non può essere mobilitato. ID, salute, skill e carico
restano nello stesso Unit. La chiusura dopo background non riprende la simulazione.

Verifica: `node tests/community.cjs`, nove casi in Node VM/DOM simulato;
restano da eseguire verifica browser reale e dispositivo.
