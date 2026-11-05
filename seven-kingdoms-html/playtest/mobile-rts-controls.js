/* Mobile browser adapter for a reusable RTS joystick and press-and-hold MOD.
 * Pure gesture/formation utilities are in rts-touch-core.js.
 * Does not synthesize SDL mouse events; each game supplies onPan.
 * GPL-2.0-only.
 */
export function installMobileRtsControls({joystick,thumb,modifier,toggle=null,onPan,onModChange=()=>{}}){
 let stickId=null,modId=null,modActive=false,vector={x:0,y:0,power:0},raf=0,last=0;
 const setMod=on=>{
  modActive=on;modifier.classList.toggle('active',on);
  modifier.setAttribute('aria-pressed',String(on));onModChange(on);
 };
 const update=e=>{
  const rect=joystick.getBoundingClientRect();
  const dx=e.clientX-(rect.left+rect.width/2),dy=e.clientY-(rect.top+rect.height/2);
  const max=Math.max(1,rect.width*.32),distance=Math.hypot(dx,dy);
  const strength=Math.min(1,distance/max);
  vector=distance?{x:dx/distance,y:dy/distance,power:strength}:{x:0,y:0,power:0};
  const scale=distance>max?max/distance:1;
  thumb.style.transform='translate('+Math.round(dx*scale)+'px,'+Math.round(dy*scale)+'px)';
 };
 const frame=now=>{
  if(stickId===null){raf=0;last=0;return;}
  const dt=last?Math.min(.05,(now-last)/1000):1/60;last=now;
  if(vector.power>.12)onPan(-vector.x*dt*300*vector.power,-vector.y*dt*300*vector.power);
  raf=requestAnimationFrame(frame);
 };
 const stopStick=()=>{
  if(stickId===null)return;
  stickId=null;joystick.classList.remove('active');thumb.style.transform='';
  vector={x:0,y:0,power:0};last=0;
  if(raf)cancelAnimationFrame(raf);raf=0;
 };
 joystick.addEventListener('pointerdown',e=>{
  if(stickId!==null)return;
  e.preventDefault();stickId=e.pointerId;
  try{joystick.setPointerCapture(e.pointerId)}catch(_){}
  joystick.classList.add('active');update(e);raf=requestAnimationFrame(frame);
 });
 joystick.addEventListener('pointermove',e=>{
  if(e.pointerId!==stickId)return;e.preventDefault();update(e);
 });
 for(const type of ['pointerup','pointercancel','lostpointercapture'])
  joystick.addEventListener(type,e=>{if(e.pointerId===stickId)stopStick()});
 modifier.addEventListener('pointerdown',e=>{
  if(modId!==null)return;
  e.preventDefault();modId=e.pointerId;
  try{modifier.setPointerCapture(e.pointerId)}catch(_){}
  setMod(true);
 });
 const release=e=>{
  if(modId===null||e.pointerId!==modId)return;
  modId=null;setMod(false);
 };
 for(const type of ['pointerup','pointercancel','lostpointercapture'])
  modifier.addEventListener(type,release);
 for(const el of [joystick,modifier])el.addEventListener('contextmenu',e=>e.preventDefault());
 const reset=()=>{stopStick();modId=null;setMod(false)};
 const root=joystick.parentElement;
 const setMenuOpen=on=>{
  if(!toggle)return;
  if(!on)reset(); // Closing a pop-out can never leave MOD pressed.
  root.classList.toggle('is-open',on);
  toggle.setAttribute('aria-expanded',String(on));
  toggle.setAttribute('aria-label',on?'Nascondi levetta e MOD':'Apri levetta e MOD');
 };
 if(toggle){
  toggle.addEventListener('click',()=>setMenuOpen(!root.classList.contains('is-open')));
  setMenuOpen(false);
 }
 window.addEventListener('blur',reset);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)reset()});
 return {modifierHeld:()=>modActive,reset,closeMenu:()=>setMenuOpen(false)};
}
