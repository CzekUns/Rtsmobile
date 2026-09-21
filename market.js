// Persistent local markets. Goods move only through the market and the present trader.
(() => {
  'use strict';
  const RULES={version:1,initialMoney:180,targetStock:20,minPrice:1,maxPrice:99};
  const BASE={food:3,wood:4,stone:5,iron:9,grain:4,barley:4,grapes:5,olives:6,flour:7,barleyFlour:7,bread:9,barleyBread:9,forage:2,milk:6};
  window.TERRA_MARKET={rules:RULES,basePrices:BASE};
  const integer=(n,min=0)=>Number.isSafeInteger(n)&&n>=min;

  Game.prototype.ensureMarkets=function(){
    this.ensureInventories();
    for(const b of this.buildings){
      if(b.type!=='market')continue;
      if(!integer(b.money))b.money=RULES.initialMoney;
      if(!b.demand||typeof b.demand!=='object')b.demand={};
      for(const good of Object.keys(TERRA_GOODS))if(!Number.isFinite(b.demand[good])||b.demand[good]<=0)b.demand[good]=1;
      if(!Array.isArray(b.tradeLedger))b.tradeLedger=[];
    }
    for(const u of this.units)if(!integer(u.money))u.money=20;
  };
  Game.prototype.marketPrice=function(market,good,side='buy'){
    if(market?.type!=='market'||!Object.hasOwn(TERRA_GOODS,good))return null;
    this.ensureMarkets();
    const stock=market.inventory.items[good]||0,demand=market.demand[good]||1,base=BASE[good]||5;
    const scarcity=Math.max(.55,Math.min(2.5,(RULES.targetStock+8)/(stock+8)));
    const midpoint=Math.max(RULES.minPrice,Math.min(RULES.maxPrice,Math.round(base*demand*scarcity)));
    return side==='sell'?Math.max(1,Math.floor(midpoint*.8)):Math.min(RULES.maxPrice,Math.ceil(midpoint*1.15));
  };
  Game.prototype.tradeAtMarket=function({market,trader,good,quantity,side,transactionId}){
    this.ensureMarkets();
    if(!market?.alive||!market.built||market.type!=='market'||!trader||trader.health<=0||trader.location?.kind!=='world')return{ok:false,error:'Mercato o mercante non disponibile.'};
    if(dist(market,trader)>1.15)return{ok:false,error:'Il mercante deve trovarsi al mercato.'};
    if(!Object.hasOwn(TERRA_GOODS,good)||!integer(quantity,1)||!['buy','sell'].includes(side))return{ok:false,error:'Scambio non valido.'};
    if(typeof transactionId!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(transactionId))return{ok:false,error:'Identificativo scambio non valido.'};
    const previous=market.tradeLedger.find(x=>x.id===transactionId);if(previous)return{...previous,replayed:true};
    const unitPrice=this.marketPrice(market,good,side),total=unitPrice*quantity,items=market.inventory.items;
    if(side==='buy'){
      if((items[good]||0)<quantity)return{ok:false,error:'Merce locale insufficiente.'};
      if(trader.money<total)return{ok:false,error:'Denaro del mercante insufficiente.'};
      if(trader.inventory.amount&&trader.inventory.type!==good)return{ok:false,error:'Il carico contiene un’altra merce.'};
      if(trader.inventory.amount+quantity>trader.inventory.cap)return{ok:false,error:'Capacità di carico insufficiente.'};
      items[good]-=quantity;market.money+=total;trader.money-=total;trader.inventory.type=good;trader.inventory.amount+=quantity;
    }else{
      if(trader.inventory.type!==good||trader.inventory.amount<quantity)return{ok:false,error:'Carico locale insufficiente.'};
      if(market.money<total)return{ok:false,error:'Liquidità del mercato insufficiente.'};
      if(this.freeSpace(market)<quantity*TERRA_GOODS[good].volume)return{ok:false,error:'Mercato pieno.'};
      trader.inventory.amount-=quantity;if(!trader.inventory.amount)trader.inventory.type=null;items[good]=(items[good]||0)+quantity;market.money-=total;trader.money+=total;
    }
    const result={id:transactionId,ok:true,side,good,quantity,unitPrice,total};market.tradeLedger.push(result);if(market.tradeLedger.length>50)market.tradeLedger.splice(0,market.tradeLedger.length-50);return result;
  };
  const newGame=Game.prototype.newGame;Game.prototype.newGame=function(seed){newGame.call(this,seed);this.ensureMarkets();};
  const update=Game.prototype.update;Game.prototype.update=function(dt){this.ensureMarkets();return update.call(this,dt);};
  const selectionHTML=Game.prototype.selectionHTML;Game.prototype.selectionHTML=function(e){let html=selectionHTML.call(this,e);if(e instanceof Building&&e.type==='market'){this.ensureMarkets();const offers=Object.keys(TERRA_GOODS).filter(k=>(e.inventory.items[k]||0)>0).map(k=>`${this.resourceName(k)} ${e.inventory.items[k]} · ${this.marketPrice(e,k,'buy')} denari`).join(' · ')||'nessuna merce';html+=`<p>Liquidità locale: <b>${e.money} denari</b>. Offerte: ${offers}.</p><p>I prezzi dipendono da domanda e scorte di questo mercato.</p>`;}return html;};
  const drawBuilding=Game.prototype.drawBuilding;Game.prototype.drawBuilding=function(b){if(b.type!=='market')return drawBuilding.call(this,b);const p=this.worldToScreen(b.x*TILE,b.y*TILE),z=this.camera.zoom,c=this.ctx;c.save();c.fillStyle='#725d3f';c.fillRect(p.x-14*z,p.y-8*z,28*z,16*z);c.fillStyle='#b98b48';c.fillRect(p.x-16*z,p.y-13*z,32*z,6*z);c.fillStyle='#30281f';for(let x=-10;x<=10;x+=10)c.fillRect(p.x+x*z,p.y-7*z,3*z,15*z);c.restore();if(this.selected?.id===b.id)this.selectionRing(p.x,p.y,18*z);};
})();
