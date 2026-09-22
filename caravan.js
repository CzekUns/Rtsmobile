// Physical market journeys. A caravan is the same persistent person and cargo record.
(() => {
  'use strict';
  const threatDistance=4;
  const integer=(n,min=0)=>Number.isSafeInteger(n)&&n>=min;

  Game.prototype.assignCaravan=function({trader,market,good,quantity,side,transactionId}){
    this.ensureMarkets();
    if(!trader||trader.health<=0||trader.location?.kind!=='world'||!market?.alive||!market.built||market.type!=='market')return 'Scegli un mercante sulla mappa e un mercato operativo.';
    if(!Object.hasOwn(TERRA_GOODS,good)||!integer(quantity,1)||!['buy','sell'].includes(side))return 'Scambio non valido.';
    if(typeof transactionId!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(transactionId))return 'Identificativo viaggio non valido.';
    if(side==='buy'){
      const price=this.marketPrice(market,good,'buy');
      if((market.inventory.items[good]||0)<quantity)return 'Merce locale insufficiente.';
      if(trader.money<price*quantity)return 'Denaro del mercante insufficiente.';
      if(trader.inventory.amount+quantity>trader.inventory.cap)return 'Capacità di carico insufficiente.';
      if(trader.inventory.amount&&trader.inventory.type!==good)return 'Libera o rendi compatibile il carico prima del viaggio.';
    }else if(trader.inventory.type!==good||trader.inventory.amount<quantity)return 'Il mercante non trasporta la merce da vendere.';
    const path=this.pathToBuilding(trader,market);if(path===null)return 'Mercato non raggiungibile.';
    const home={x:Math.floor(trader.x),y:Math.floor(trader.y)};
    this.cancelTask(trader);trader.task={type:'caravan',market:market.id,good,quantity,side,transactionId,phase:'market',home,traded:false,threatened:false};
    trader.state='caravan';trader.path=path;return null;
  };
  Game.prototype.caravanThreat=function(u){return this.raiders.some(r=>r.health>0&&dist(u,r)<=threatDistance);};
  Game.prototype.updateCaravan=function(u,dt){
    const t=u.task;if(t?.type!=='caravan'){this.cancelTask(u);return;}
    const market=this.findById(this.buildings,t.market);
    if(t.phase==='market'){
      if(!market?.alive||!market.built||market.type!=='market'){this.cancelTask(u);this.message('Viaggio annullato: il mercato non è più disponibile.');return;}
      t.threatened=this.caravanThreat(u);if(t.threatened){u.path=[];return;}
      if(dist(u,market)>1.15){if(!u.path.length){const path=this.pathToBuilding(u,market);if(path===null){this.cancelTask(u);this.message('Viaggio fermato: mercato non raggiungibile.');return;}u.path=path;}this.followPath(u,dt,1.45);return;}
      const result=this.tradeAtMarket({market,trader:u,good:t.good,quantity:t.quantity,side:t.side,transactionId:t.transactionId});
      if(!result.ok){this.cancelTask(u);this.message(result.error||'Scambio della carovana non riuscito.');return;}
      t.traded=true;t.phase='return';t.threatened=false;
      u.path=this.findPath(u.x,u.y,t.home.x,t.home.y,1);
      if(!u.path.length&&Math.hypot(u.x-t.home.x,u.y-t.home.y)>.8){this.cancelTask(u);this.message('Scambio completato; ritorno bloccato. Il carico resta al mercante.');return;}
      this.save(false);return;
    }
    t.threatened=this.caravanThreat(u);if(t.threatened){u.path=[];return;}
    if(Math.hypot(u.x-t.home.x,u.y-t.home.y)<=.8){this.cancelTask(u);this.message(`${u.name} è tornato dal mercato.`);return;}
    if(!u.path.length){u.path=this.findPath(u.x,u.y,t.home.x,t.home.y,1);if(!u.path.length){this.cancelTask(u);this.message('Ritorno bloccato: merci e denaro restano al mercante.');return;}}
    this.followPath(u,dt,1.45);
  };
  const updateUnit=Game.prototype.updateUnit;
  Game.prototype.updateUnit=function(u,dt){if(u.state==='caravan'){this.updateCaravan(u,dt);return;}updateUnit.call(this,u,dt);};
  const unitStatus=Game.prototype.unitStatus;
  Game.prototype.unitStatus=function(u){if(u.task?.type==='caravan')return u.task.threatened?'carovana ferma: minaccia':u.task.phase==='market'?'carovana verso il mercato':'carovana di ritorno';return unitStatus.call(this,u);};
  Game.prototype.startTradeCaravan=function(){const d=this.updateTradePreview();if(!d.trader||!d.market||!integer(d.quantity,1))return false;const error=this.assignCaravan({...d,transactionId:this.tradeTransactionId});$('#tradeStatus').textContent=error||'Carovana partita: lo scambio avverrà solo all’arrivo al mercato.';if(error)return false;this.save(true);$('#tradeDialog').close();return true;};
  const initUI=Game.prototype.initUI;
  Game.prototype.initUI=function(){initUI.call(this);$('#sendCaravan').onclick=()=>this.startTradeCaravan();};
})();
