/* ORDINI responsive sidebar controller; DOM adapter kept independent of the simulation. GPL-2.0-only. */
export function installOrdersSidebar({sidebar,stage,toggle,media,activeElement=()=>document.activeElement}){
 if(!sidebar||!stage||!toggle||!media)throw new TypeError('Missing ORDINI sidebar controls');
 function setVisible(visible){
  if(!visible&&sidebar.contains(activeElement()))toggle.focus();
  stage.classList.toggle('panel-collapsed',!visible);
  toggle.setAttribute('aria-expanded',String(visible));
  toggle.textContent=visible?'ORDINI ◂':'ORDINI ▸';
  sidebar.setAttribute('aria-hidden',String(!visible));
  sidebar.inert=!visible;
 }
 const onMedia=()=>setVisible(!media.matches);
 const onToggle=()=>setVisible(stage.classList.contains('panel-collapsed'));
 onMedia();
 media.addEventListener('change',onMedia);
 toggle.addEventListener('click',onToggle);
 return {setVisible,dispose(){
  media.removeEventListener('change',onMedia);
  toggle.removeEventListener('click',onToggle);
 }};
}
