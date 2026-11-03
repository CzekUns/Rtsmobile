/* Separate, accessible touch overlay for 7KAA HTML native. GPL-2.0-only.
 * Mount outside a transformed/scaled game stage to keep real 44 CSS pixel targets.
 * No global listeners, no simulation state mutations. */
import {REPORTS} from './classic-hud.js';

export function createClassicTouchControls(host,hud,{documentRef=globalThis.document}={}){
  if(!host||!documentRef?.createElement||!hud?.getTargets||!hud?.dispatchPoint){
    throw new TypeError('host, document and HUD adapter required');
  }
  const root=documentRef.createElement('div');
  root.className='sk-classic-touch';root.setAttribute('data-sk-touch','');
  const toggle=documentRef.createElement('button');
  toggle.type='button';toggle.className='sk-classic-touch-toggle';
  toggle.textContent='Orders';toggle.setAttribute('aria-expanded','false');
  toggle.setAttribute('aria-label','Open classic game controls');
  const panel=documentRef.createElement('div');panel.className='sk-classic-touch-panel';
  panel.hidden=true;panel.setAttribute('aria-label','Game reports and orders');
  root.append(toggle,panel);host.appendChild(root);
  let open=false,disposed=false;
  function send(target){
    if(disposed)return;
    const r=target.rect;
    hud.dispatchPoint(r.x+r.w/2,r.y+r.h/2);
  }
  function addButton(label,target,disabled=false){
    const button=documentRef.createElement('button');
    button.type='button';button.textContent=String(label);button.disabled=disabled;
    button.addEventListener('click',()=>send(target));
    panel.appendChild(button);
  }
  function refresh(){
    if(disposed)return;
    panel.replaceChildren();
    const targets=hud.getTargets();
    const reportTargets=targets.filter(t=>t.id==='report');
    for(const [id,label] of REPORTS){
      const t=reportTargets.find(x=>x.report===id);
      if(t)addButton(label,t);
    }
    const modeTargets=targets.filter(t=>t.id==='map-mode');
    for(const t of modeTargets)addButton(t.mode==='villages-map'?'Village map':t.mode,t);
    const actions=hud.getModel().selection.actions;
    for(const action of actions){
      const t=targets.find(x=>x.id==='action'&&x.action===action.id);
      if(t)addButton(action.label||action.id,t);
    }
  }
  function setOpen(value){
    open=!!value;
    panel.hidden=!open;
    toggle.setAttribute('aria-expanded',String(open));
    toggle.textContent=open?'Close':'Orders';
    if(open)refresh();
  }
  const click=()=>setOpen(!open);
  toggle.addEventListener('click',click);
  return {element:root,refresh,setOpen,dispose(){
    if(disposed)return;
    disposed=true;toggle.removeEventListener('click',click);root.remove();
  }};
}
