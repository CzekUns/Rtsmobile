const game = new Game();
// Restore before the first animation frame can overwrite an existing save.
try {
  if (localStorage.getItem('terra-italica-save-v4') || localStorage.getItem('terra-italica-save-v3') || localStorage.getItem('terra-italica-save-v2')) {
    game.setPaused(true);
    game.load();
  }
} catch (error) {
  game.setPaused(true);
  game.message('Archivio locale non disponibile. Puoi giocare, ma il salvataggio potrebbe non riuscire.');
}
