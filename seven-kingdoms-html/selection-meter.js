/* Selection panel numeric indicators; no asset/palette invention. GPL-2.0-only. */
const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function selectionMeter(label,value,max=100,{decorative=false}={}){
 const ceiling=Number.isFinite(max)&&max>0?max:100;
 const raw=Number.isFinite(value)?value:0;
 const current=Math.min(ceiling,Math.max(0,raw));
 const pct=current/ceiling*100;
 const name=escapeHtml(label);
 const semantics=decorative?' aria-hidden="true"':' role="progressbar" aria-label="'+name+'" aria-valuemin="0" aria-valuemax="'+ceiling+'" aria-valuenow="'+current+'"';
 return '<div class="selection-meter"'+semantics+'>'+
  '<span class="selection-meter-track"><span class="selection-meter-fill" style="width:'+pct+'%"></span></span>'+
  '<span class="selection-meter-caption">'+name+' <strong>'+(ceiling===1?Math.floor(pct)+'%':Math.floor(current)+'/'+Math.floor(ceiling))+'</strong></span></div>';
}
