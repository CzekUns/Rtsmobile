(() => {
  'use strict';
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  Game.prototype.openSkills=function(id){
    if(!this.units.some(u=>u.id===id&&u.owner===0&&u.health>0)){this.message('Seleziona un abitante dalla Comunità.');return false;}
    const dialog=$('#skillsDialog');
    if(!dialog.open){this.pauseBeforeSkills=this.paused;this.backgroundDuringSkills=false;}
    this.skillsPersonId=id;this.setPaused(true);this.pointerCancel();this.orderMode=null;this.buildMode=null;this.syncModeButtons();
    this.renderSkills();$('#skillsStatus').textContent='';if(!dialog.open)dialog.showModal();return true;
  };
  Game.prototype.renderSkills=function(){
    const u=this.units.find(p=>p.id===this.skillsPersonId&&p.owner===0&&p.health>0);
    if(!u){$('#skillsIdentity').textContent='Persona non disponibile';$('#skillsList').innerHTML='';return;}
    $('#skillsIdentity').textContent=u.name+' · '+(u.location.kind==='resident'?'Residente nel Distretto':'Sulla mappa');
    $('#skillsId').textContent='ID '+u.id;
    $('#skillsPeople').innerHTML=this.units.filter(p=>p.owner===0&&p.health>0).map(p=>`<option value="${p.id}">${escape(p.name)} · ${p.id.slice(0,8)}</option>`).join('');
    $('#skillsPeople').value=u.id;
    $('#skillsList').innerHTML=Object.entries(window.TERRA_SKILLS.labels).map(([key,label])=>{
      const level=u.skills[key],xp=u.xp[key]||0,needed=level*window.TERRA_SKILLS.xpPerLevel,capped=level>=window.TERRA_SKILLS.maxLevel;
      const percent=capped?100:Math.min(100,xp/needed*100);
      return `<article class="skill-row" data-skill="${key}"><header><b>${label}</b><span>Livello ${level} · ${capped?'massimo':Math.floor(xp)+'/'+needed+' XP'}</span></header><div class="skill-track" aria-label="${label}: ${Math.round(percent)}% verso il prossimo livello"><i style="width:${percent}%"></i></div></article>`;
    }).join('');
    $('#skillsRules').textContent=`Parametri provvisori configurabili: soglia XP = livello × ${window.TERRA_SKILLS.xpPerLevel}; livello massimo ${window.TERRA_SKILLS.maxLevel}. Nessun blocco è attivo.`;
  };
  const initUI=Game.prototype.initUI;
  Game.prototype.initUI=function(){
    initUI.call(this);const dialog=$('#skillsDialog');
    $('#skillsBtn').onclick=()=>this.openSkills(this.selected?.id);
    $('#skillsPeople').onchange=()=>{this.skillsPersonId=$('#skillsPeople').value;this.renderSkills();$('#skillsStatus').textContent='';};
    $('#closeSkills').onclick=()=>dialog.close();
    dialog.addEventListener('close',()=>{this.skillsPersonId=null;if(!this.suspended&&!this.backgroundDuringSkills)this.setPaused(this.pauseBeforeSkills);this.backgroundDuringSkills=false;});
  };
  const suspend=Game.prototype.suspend;
  Game.prototype.suspend=function(){if($('#skillsDialog').open)this.backgroundDuringSkills=true;suspend.call(this);};
})();
