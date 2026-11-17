/* Source-backed Chinese BASE building, 7KAA GPL resource extraction.
 * Asset: Actions #44029830557 / artifact 14310785266, firm.json.
 * No image is drawn until the verified PNGs are checked into the repository.
 * The original 4x4 footprint is metadata only; demo collision is unchanged.
 */
export const CHINESE_BASE = Object.freeze({
 id:'BASE:CHINESE',raceCode:'CHINESE',firmCode:'BASE',
 footprint:Object.freeze({width:4,height:4}),
 bounds:Object.freeze({x:-12,y:-1,width:147,height:139}),
 pivot:Object.freeze({x:12,y:1}),
 source:Object.freeze({repository:'the3dfxdude/7kaa',commit:'14e6fdfba9481af4dc3a54722614a608776e20bc',
  files:Object.freeze(['data/RESOURCE/STD.SET','data/RESOURCE/I_FIRM.RES','data/RESOURCE/PAL_STD.RES']),
  sha256:Object.freeze(['6e56e633db1578e1a24597808818f4bc5749ac54d2707d3410e0789ed07074db','f937ab083ba15f26ece9e35a0a7834b1807444afc7a1229e4023ce3f8a84fdd9','8bda65c749340446edb6debe73a5b0f67b1a4af8dd0fdb1fa0222a69848b6ef7'])}),
 modes:Object.freeze([
  Object.freeze({kind:'construction',phase:0,file:'BASE-CHINESE-construction-0.png',records:[26]}),
  Object.freeze({kind:'construction',phase:1,file:'BASE-CHINESE-construction-1.png',records:[27]}),
  Object.freeze({kind:'construction',phase:2,file:'BASE-CHINESE-construction-2.png',records:[30,28]}),
  Object.freeze({kind:'active',frame:0,file:'BASE-CHINESE-active-0.png',records:[30,29]}),
  Object.freeze({kind:'idle',file:'BASE-CHINESE-idle.png',records:[30,29]})
 ])
});
export function chineseBaseMode({underConstruction=false,buildProgress=0,active=true}={}){
 if(underConstruction){
  const progress=Number.isFinite(buildProgress)?Math.max(0,Math.min(1,buildProgress)):0;
  return CHINESE_BASE.modes[Math.min(2,Math.floor(progress*3))];
 }
 return CHINESE_BASE.modes[active?3:4];
}
export function validateChineseBaseAssets(manifest,files){
 if(!manifest||manifest.id!==CHINESE_BASE.id||manifest.locWidth!==4||manifest.locHeight!==4||
    manifest.source?.sha256?.tables!==CHINESE_BASE.source.sha256[0]||
    manifest.source?.sha256?.bitmap!==CHINESE_BASE.source.sha256[1]||
    manifest.source?.sha256?.palette!==CHINESE_BASE.source.sha256[2])return false;
 if(!Array.isArray(manifest.modes)||manifest.modes.length!==5)return false;
 return CHINESE_BASE.modes.every((mode,i)=>{
  const source=manifest.modes[i];
  return source?.path===mode.file&&JSON.stringify(source.sourceBitmapRecords)===JSON.stringify(mode.records)&&
   files?.has(mode.file);
 });
}
// Renderer adapter: only an explicitly Chinese fort and fully loaded source
// image can be drawn. Callers retain the fallback whenever this returns false.
export function drawChineseBase(ctx,firm,x,y,t,images){
 if(firm?.kind!=='fort'||String(firm.raceId||'').toUpperCase()!=='CHINESE'||
    !Number.isFinite(firm.size)||firm.size<=0||
    ![x,y,t].every(Number.isFinite)||t<=0)return false;
 const mode=chineseBaseMode(firm),image=images?.get(mode.file);
 if(!image||image.complete!==true||image.naturalWidth!==CHINESE_BASE.bounds.width||
    image.naturalHeight!==CHINESE_BASE.bounds.height)return false;
 const scale=firm.size*t/(4*24);
 ctx.save();ctx.imageSmoothingEnabled=false;
 ctx.drawImage(image,x+firm.size*t/2-(CHINESE_BASE.pivot.x+CHINESE_BASE.bounds.width/2-CHINESE_BASE.pivot.x)*scale,
  y+firm.size*t-(CHINESE_BASE.bounds.height-CHINESE_BASE.pivot.y)*scale,
  CHINESE_BASE.bounds.width*scale,CHINESE_BASE.bounds.height*scale);
 ctx.restore();return true;
}
