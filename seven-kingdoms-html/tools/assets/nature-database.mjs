// Source-layout parsers for 7KAA plant and rock resources; no invented sprite pixels.
// the3dfxdude/7kaa @ 14e6fdfba9481af4dc3a54722614a608776e20bc
// include/OPLANT.h, include/OROCKRES.h; GPL-2.0-or-later.
const text=(bytes,start,size)=>String.fromCharCode(...bytes.subarray(start,start+size)).trim();
const number=(bytes,start,size)=>{const raw=text(bytes,start,size);if(!/^\d+$/.test(raw))throw Error('invalid numeric field at '+start);return Number(raw)};
const pointer=(bytes,start)=>new DataView(bytes.buffer,bytes.byteOffset+start,4).getUint32(0,true);
export const RECORD_SIZES=Object.freeze({PLANT:21,PLANTBM:29,ROCK:18,ROCKBLK:17,ROCKBMP:23,ROCKANI:14});
export function parseNatureRecord(kind,bytes){
 const size=RECORD_SIZES[kind];
 if(!size||!(bytes instanceof Uint8Array)||bytes.length!==size)throw Error('invalid '+kind+' record length');
 switch(kind){
 case 'PLANT':return {code:text(bytes,0,8),climateZone:number(bytes,8,1),terrainTypes:[text(bytes,9,2),text(bytes,11,2),text(bytes,13,2)],firstBitmap:number(bytes,15,3),bitmapCountMinusOne:number(bytes,18,3)};
 case 'PLANTBM':return {plant:text(bytes,0,8),size:number(bytes,8,2),offsetX:Number(text(bytes,10,3)),offsetY:Number(text(bytes,13,3)),townAge:text(bytes,16,1),fileName:text(bytes,17,8),bitmapOffset:pointer(bytes,25)};
 case 'ROCK':return {id:text(bytes,0,5),type:text(bytes,5,1),width:number(bytes,6,2),height:number(bytes,8,2),terrain:[text(bytes,10,1),text(bytes,11,1)],firstAnim:Number(text(bytes,12,4)||0),maxFrame:number(bytes,16,2)};
 case 'ROCKBLK':return {id:text(bytes,0,5),x:number(bytes,5,2),y:number(bytes,7,2),rockRecno:number(bytes,9,4),firstBitmap:number(bytes,13,4)};
 case 'ROCKBMP':return {id:text(bytes,0,5),x:number(bytes,5,2),y:number(bytes,7,2),frame:number(bytes,9,2),fileName:text(bytes,11,8),bitmapOffset:pointer(bytes,19)};
 case 'ROCKANI':return {id:text(bytes,0,5),frame:number(bytes,5,2),delay:number(bytes,7,3),nextFrame:number(bytes,10,2),alternateFrame:number(bytes,12,2)};
 }
}
// The DBF header/record framing is checked separately from C++ packed struct fields.
export function parseNatureDatabase(kind,bytes){
 const size=RECORD_SIZES[kind];
 if(!size||!(bytes instanceof Uint8Array)||bytes.length<33||bytes[0]!==3)throw Error('invalid nature DBF');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 const count=view.getUint32(4,true),header=view.getUint16(8,true),stride=view.getUint16(10,true);
 if(stride!==size+1||header<33||header>bytes.length||bytes[header-1]!==13||count>Math.floor((bytes.length-header)/stride))throw Error('invalid nature DBF framing');
 const records=[];
 for(let i=0;i<count;i++){const at=header+i*stride;if(bytes[at]!==32)throw Error('deleted nature row '+(i+1));records.push({id:i+1,...parseNatureRecord(kind,bytes.subarray(at+1,at+stride))})}
 return {count,records};
}
