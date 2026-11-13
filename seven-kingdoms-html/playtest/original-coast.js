/* Source-verified SG (sea/grass) coast bitmap atlas, but the world seed and
 * corner sampling are still JS demo logic. Preserve fallback when loading fails.
 * GPL-2.0-or-later.
 */
export const ORIGINAL_COAST=Object.freeze({
 image:'../assets/previews/TERRAIN1-SG-coast-16x12.png',
 manifest:'../assets/manifests/TERRAIN1-SG-coast-16x12.json',
 width:512,height:384,tile:32,columns:16
});
const masks=Object.freeze({'-':1,'0':2,'+':4,B:3,A:6,'*':7});
const type=t=>t==='water'?'S':t==='grass'?'G':null;
export function coastMask(types){
 if(!Array.isArray(types)||types.length!==4)return null;
 const list=types.map(type);
 if(list.some(x=>!x)||list.every(x=>x===list[0]))return null;
 return list.reduce((bits,x,i)=>bits|(x==='S'?(1<<i):0),0);
}
export function findCoastRecord(records,mask){
 if(!Array.isArray(records)||!Number.isInteger(mask)||mask<1||mask>14)return null;
 const types=Array.from({length:4},(_,i)=>(mask&(1<<i))?'S':'G');
 // First match in the original TERRAIN1 database order. Original 7KAA
 // TerrainRes::scan also matches subtype masks and special flags; the demo
 // has no real corner subtype/height map, so request the broad '*' mask.
 for(const record of records){
  if(record?.specialFlag!==''||!Array.isArray(record.cornerCodes)||record.cornerCodes.length!==4)continue;
  const match=record.cornerCodes.every((code,i)=>typeof code==='string'&&code[0]===types[i]&&(masks[code[1]]&7)!==0);
  if(match)return record;
 }
 return null;
}
export class OriginalCoastPreview{
 constructor({imageFactory=()=>new Image(),fetcher=fetch}={}){
  this.image=imageFactory();
  this.image.src=new URL(ORIGINAL_COAST.image,import.meta.url).href;
  this.records=null;this.lookup=null;
  const uri=new URL(ORIGINAL_COAST.manifest,import.meta.url).href;
  this.loading=Promise.resolve().then(()=>fetcher(uri)).then(r=>{
   if(!r.ok)throw Error('coast manifest unavailable');return r.json();
  }).then(data=>{
   if(data?.schemaVersion!==1||data.count!==180||data.columns!==16||data.rows!==12||
      !Array.isArray(data.records)||data.records.length!==180||
      data.records.some((r,i)=>r.atlasIndex!==i||!Number.isInteger(r.id)||!Array.isArray(r.cornerCodes))){
    throw Error('coast manifest inconsistent');
   }
   this.records=data.records;
   this.lookup=Array.from({length:16},(_,m)=>findCoastRecord(this.records,m));
  }).catch(()=>{this.records=null;this.lookup=null});
 }
 isReady(){return !!this.lookup&&this.image?.complete&&this.image.naturalWidth===ORIGINAL_COAST.width&&this.image.naturalHeight===ORIGINAL_COAST.height}
 drawTile(ctx,x,y,t,cornerTypes){
  const mask=coastMask(cornerTypes),record=mask===null?null:this.lookup?.[mask];
  if(!record||!this.isReady()||!Number.isFinite(t)||t<=0)return false;
  const col=record.atlasIndex%ORIGINAL_COAST.columns,row=Math.floor(record.atlasIndex/ORIGINAL_COAST.columns);
  const dx=Math.floor(x),dy=Math.floor(y),dw=Math.max(1,Math.ceil(x+t)-dx),dh=Math.max(1,Math.ceil(y+t)-dy);
  ctx.save();
  try{
   ctx.imageSmoothingEnabled=false;
   ctx.drawImage(this.image,col*32,row*32,32,32,dx,dy,dw,dh);
   return true;
  }catch{return false}finally{ctx.restore()}
 }
}
