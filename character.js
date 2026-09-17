(() => {
  'use strict';
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  Game.prototype.openCharacter=function(id){
    if(!this.units.some(u=>u.id===id&&u.owner===0&&u.health>0)){this.message('Seleziona un abitante dalla Comunità.');return false;}
    const dialog=$('#characterDialog');
    if(!dialog.open){this.pauseBeforeCharacter=this.paused;this.backgroundDuringCharacter=false;}
    this.characterPersonId=id;this.setPaused(true);this.pointerCancel();this.orderMode=null;this.buildMode=null;this.syncModeButtons();
    this.renderCharacter();$('#characterStatus').textContent='';if(!dialog.open)dialog.showModal();return true;
  };
  Game.prototype.renderCharacter=function(){
    const u=this.units.find(u=>u.id===this.characterPersonId&&u.health>0&&u.owner===0);
    $('#characterControls').hidden=!u;
    if(!u){$('#characterIdentity').textContent='Persona non disponibile';return;}
    const kit=this.personEquipment(u.id),catalog=window.TERRA_EQUIPMENT.catalog;
    $('#characterIdentity').textContent=u.name+' · '+(u.location.kind==='resident'?'Residente nel Distretto':'Sulla mappa');
    $('#characterId').textContent='ID '+u.id;
    $('#characterStats').textContent=`Salute ${Math.ceil(u.health)}/${u.maxHealth} · Forza ${u.strength} · Intelligenza ${u.intelligence} · Energia ${Math.ceil(u.stamina)}. Carico merci: ${u.inventory.amount}/${u.inventory.cap}${u.inventory.amount?' '+this.resourceName(u.inventory.type):''}.`;
    for(const slot of window.TERRA_EQUIPMENT.rules.slots){const i=kit.slots[slot];$('#gear-'+slot).textContent=({hand:'Mano',body:'Corpo',head:'Testa'}[slot])+': '+(i?catalog[i.type].name:'vuoto');}
    $('#characterPeople').innerHTML=this.units.filter(p=>p.owner===0&&p.health>0).map(p=>`<option value="${p.id}">${escape(p.name)} · ${p.id.slice(0,8)}</option>`).join('');$('#characterPeople').value=u.id;
    const nearby=this.buildings.filter(b=>b.owner===0&&b.alive&&b.built&&['base','warehouse','house'].includes(b.type)&&(u.location.kind==='resident'?u.location.settlementId===b.id:Math.hypot(u.x-b.x,u.y-b.y)<=2));
    const available=(this.gear||[]).filter(i=>['bag','equipped'].includes(i.location.kind)?i.location.holder===u.id:i.location.kind==='storage'?nearby.some(b=>b.id===i.location.holder):u.location.kind==='world'&&Math.hypot(u.x-i.location.x,u.y-i.location.y)<=1.5);
    this.characterExpected=new Map(available.map(i=>[i.id,{...i.location}]));
    const previous=$('#characterItems').value;
    $('#characterItems').innerHTML=available.map(i=>`<option value="${i.id}">${catalog[i.type].name} · ${{bag:'borsa',equipped:'indossato',storage:'rastrelliera',ground:'a terra'}[i.location.kind]} · ${i.id.slice(-8)}</option>`).join('')||'<option value="">Nessun oggetto disponibile</option>';
    $('#characterItems').value=available.some(i=>i.id===previous)?previous:available[0]?.id||'';
    $('#characterRacks').innerHTML=nearby.map(b=>`<option value="${b.id}">${BUILD_LABEL[b.type]} (${Math.floor(b.x)}, ${Math.floor(b.y)})</option>`).join('')||'<option value="">Nessuna rastrelliera vicina</option>';
    $('#characterRacks').value=nearby[0]?.id||'';
    $('#characterBag').textContent=`Borsa oggetti: ${kit.bag.length}/${window.TERRA_EQUIPMENT.rules.bagCapacity}. Separata dalle merci trasportate.`;
    $('#characterEquip').disabled=$('#characterRemove').disabled=!available.length;
    $('#characterStore').disabled=!available.length||!nearby.length;
  };
  Game.prototype.characterTransfer=function(kind){
    const personId=this.characterPersonId,itemId=$('#characterItems').value,item=(this.gear||[]).find(i=>i.id===itemId);
    if(!item)return false;
    const target=kind==='storage'?{kind,holder:$('#characterRacks').value}:kind==='equipped'?{kind,holder:personId,slot:window.TERRA_EQUIPMENT.catalog[item.type].slot}:{kind,holder:personId};
    const error=this.transferEquipment(personId,itemId,this.characterExpected?.get(itemId),target);
    $('#characterStatus').textContent=error||'Oggetto trasferito.';
    if(!error&&!this.save(true))$('#characterStatus').textContent+=' Salvataggio non riuscito: riprova da Mondo → Salva.';
    this.renderCharacter();return !error;
  };
  const initUI=Game.prototype.initUI;
  Game.prototype.initUI=function(){
    initUI.call(this);const dialog=$('#characterDialog');
    $('#characterBtn').onclick=()=>this.openCharacter(this.selected?.id);
    $('#characterPeople').onchange=()=>{this.characterPersonId=$('#characterPeople').value;this.renderCharacter();$('#characterStatus').textContent='';};
    $('#closeCharacter').onclick=()=>dialog.close();
    $('#characterEquip').onclick=()=>this.characterTransfer('equipped');
    $('#characterRemove').onclick=()=>this.characterTransfer('bag');
    $('#characterStore').onclick=()=>this.characterTransfer('storage');
    dialog.addEventListener('close',()=>{this.characterPersonId=null;this.characterExpected=null;if(!this.suspended&&!this.backgroundDuringCharacter)this.setPaused(this.pauseBeforeCharacter);this.backgroundDuringCharacter=false;});
  };
  const suspend=Game.prototype.suspend;
  Game.prototype.suspend=function(){if($('#characterDialog').open)this.backgroundDuringCharacter=true;suspend.call(this);};
})();
