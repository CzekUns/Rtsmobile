const game = new Game();
// Restore before the first animation frame can overwrite an existing save.
try {
  if (localStorage.getItem('terra-italica-save-v5') || localStorage.getItem('terra-italica-save-v4') || localStorage.getItem('terra-italica-save-v3') || localStorage.getItem('terra-italica-save-v2')) {
    game.setPaused(true);
    game.load();
  }
} catch (error) {
  game.setPaused(true);
  game.message('Archivio locale non disponibile. Puoi giocare, ma il salvataggio potrebbe non riuscire.');
}


if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      let reloading=false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if(reloading)return;
        reloading=true;
        location.reload();
      });
      const registration=await navigator.serviceWorker.register('./sw.js?v=117', {updateViaCache:'none'});
      await registration.update();
      if(registration.waiting)registration.waiting.postMessage({type:'SKIP_WAITING'});
      registration.addEventListener('updatefound', () => {
        const worker=registration.installing;
        worker?.addEventListener('statechange', () => {
          if(worker.state==='installed'&&navigator.serviceWorker.controller)worker.postMessage({type:'SKIP_WAITING'});
        });
      });
    } catch (_) {}
  });
}
