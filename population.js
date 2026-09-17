// Prototype balance rules, deliberately separate from housing and actual people.
(() => {
  'use strict';
  const RULES=Object.freeze({baseHousing:5,districtHousing:5,mealEveryDays:30,foodPerPerson:1,
    minimumResidents:2,settledDays:150,arrivalFood:18});
  window.TERRA_POPULATION=RULES;
  Game.prototype.populationCap=function(){
    return this.buildings.reduce((sum,b)=>sum+(b.owner===0&&b.alive&&b.built?(b.type==='base'?RULES.baseHousing:b.type==='house'?RULES.districtHousing:0):0),0);
  };
  Game.prototype.populationFood=function(){
    this.ensureInventories();
    const base=this.buildings.find(b=>b.type==='base'&&b.owner===0&&b.alive&&b.built);
    return base?this.available(base,'bread')+this.available(base,'food'):0;
  };
  Game.prototype.spendPopulationFood=function(amount){
    const base=this.buildings.find(b=>b.type==='base'&&b.owner===0&&b.alive&&b.built);
    if(!base||!Number.isSafeInteger(amount)||amount<0||this.populationFood()<amount)return false;
    const bread=Math.min(amount,this.available(base,'bread'));
    return this.pay({bread,food:amount-bread});
  };
  Game.prototype.populationInfo=function(){
    const count=this.units.filter(u=>u.owner===0&&u.health>0).length,capacity=this.populationCap();
    return {count,capacity,free:Math.max(0,capacity-count),overcrowded:Math.max(0,count-capacity),
      meal:count*RULES.foodPerPerson,food:this.populationFood(),nextMealIn:RULES.mealEveryDays-this.totalDays%RULES.mealEveryDays};
  };
  Game.prototype.admissionBlocker=function(b){
    const p=this.populationInfo();
    if(!b||b.type!=='house'||b.owner!==0||!b.alive||!b.built)return 'Distretto non operativo';
    if(!p.free)return 'Alloggi esauriti';
    const residents=this.units.filter(u=>u.health>0&&u.owner===0&&u.location.kind==='resident'&&u.location.settlementId===b.id).length;
    if(residents<RULES.minimumResidents)return `Servono ${RULES.minimumResidents} residenti`;
    if(b.residents.length>=RULES.districtHousing)return 'Distretto pieno';
    if(p.food<RULES.arrivalFood+p.meal+RULES.foodPerPerson)return 'Cibo insufficiente per accoglienza e prossima razione';
    return null;
  };
  const buildingDay=Game.prototype.buildingDay;
  Game.prototype.buildingDay=function(b){
    if(b.type!=='house')return buildingDay.call(this,b);
    if(this.admissionBlocker(b)){b.birthDays=0;return;}
    b.birthDays=Math.min(RULES.settledDays,b.birthDays+1);
    if(b.birthDays<RULES.settledDays)return;
    if(!this.spendPopulationFood(RULES.arrivalFood))return;
    const u=new Unit(NAMES[this.rng.int(0,NAMES.length-1)],b.x,b.y,this.rng);
    // Admission creates one new identity already housed, never a duplicate world node.
    u.location={kind:'resident',settlementId:b.id};this.units.push(u);b.residents.push(u.id);b.birthDays=0;
    this.message(`${u.name} è accolto nel Distretto. Consumate ${RULES.arrivalFood} razioni.`);
  };
  const advanceDay=Game.prototype.advanceDay;
  Game.prototype.advanceDay=function(){
    if((this.totalDays+1)%RULES.mealEveryDays===0){
      const p=this.populationInfo(),used=Math.min(p.meal,p.food);
      if(used)this.spendPopulationFood(used);
      if(used<p.meal){for(const b of this.buildings)if(b.type==='house')b.birthDays=0;this.message(`Scarsità di cibo: ${used}/${p.meal} razioni. La crescita si ferma.`);}
    }
    advanceDay.call(this);
  };
  const renderCommunity=Game.prototype.renderCommunity;
  Game.prototype.renderCommunity=function(){
    renderCommunity.call(this);const p=this.populationInfo();
    $('#populationSummary').textContent=`Popolazione ${p.count} · Alloggi ${p.capacity} · Posti liberi ${p.free}${p.overcrowded?` · Sovraffollamento ${p.overcrowded}`:''}. Consumo: ${p.meal} razioni ogni ${RULES.mealEveryDays} giorni; prossima razione fra ${p.nextMealIn} giorni. Cibo disponibile alla Casa comune: ${p.food}.`;
    $('#populationDistricts').innerHTML=this.buildings.filter(b=>b.owner===0&&b.type==='house').map(b=>`<p>Distretto (${Math.floor(b.x)}, ${Math.floor(b.y)}): ${this.admissionBlocker(b)||`accoglienza ${b.birthDays}/${RULES.settledDays} giorni favorevoli`}</p>`).join('')||'<p>Costruisci un Distretto e fai entrare almeno due residenti per accogliere nuove persone.</p>';
  };
})();
