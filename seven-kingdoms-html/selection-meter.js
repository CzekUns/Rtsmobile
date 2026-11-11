/* Selection panel numeric indicators; no asset/palette invention. GPL-2.0-only. */
const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function selectionMeter(label,value,max=100){
 const ceiling=Number.isFinite(max)&&max>0?max:100;
 const raw=Number.isFinite(value)?value:0;
 const current=Math.min(ceiling,Math.max(0,raw));
 const pct=current/ceiling*100;
 const name=escapeHtml(label);
 return '<div class="selection-meter" role="progressbar" aria-label="'+name+
  '" aria-valuemin="0" aria-valuemax="'+ceiling+'" aria-valuenow="'+current+'">'+
  '<span class="selection-meter-track"><span class="selection-meter-fill" style="width:'+pct+'%"></span></span>'+
  '<span class="selection-meter-caption">'+name+' <strong>'+Math.floor(current)+'</strong>/'+Math.floor(ceiling)+'</span></div>';
}
