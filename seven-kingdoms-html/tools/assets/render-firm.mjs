#!/usr/bin/env node
// Original 7KAA building conversion from FBUILD + FFRAME + FBITMAP + I_FIRM.RES.
// References: include/OFIRMRES.h, src/OFIRMRES.cpp, src/OFIRMDRW.cpp, OGAME.cpp.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {parseRes,parseDbf,sha256} from './decode.mjs';
import {decodeImportedBitmap,decodeStandardPalette,indexedToRgba,encodePng,nationRemapTable} from './pixel-codec.mjs';

const check=(v,m)=>{if(!v)throw Error(m)};
const trim=b=>b.toString('latin1').trim();
const integer=b=>{const n=trim(b);check(/^\d+$/.test(n),'Invalid firm numeric record '+JSON.stringify(n));return Number(n)};
const signed=b=>{const n=trim(b);check(/^-?\d+$/.test(n),'Invalid firm offset '+JSON.stringify(n));return Number(n)};
export function parseFirmTables(set){
 const records=parseRes(set),schemas={
  FBUILD:[['firmCode',8],['raceCode',8],['animateFull',1],['constructionFirst',5],['constructionCount',2],
   ['idleBitmap',5],['groundBitmap',5],['firstFrame',5],['frameCount',2],['raceId',3]],
  FFRAME:[['firmCode',8],['raceCode',8],['frameId',2],['delay',2],['firstBitmap',5],['bitmapCount',2]],
  FBITMAP:[['firmCode',8],['raceCode',8],['mode',1],['frameId',2],['locWidth',3],['locHeight',3],
   ['layer',1],['offsetX',3],['offsetY',3],['delay',2],['filename',8],['bitmapOffset',4]]
 };
 const result={};const stringKeys=new Set(['firmCode','raceCode','mode','filename','animateFull']);
 const signedKeys=new Set(['offsetX','offsetY']);
 for(const [name,schema] of Object.entries(schemas)){
  const rec=records.find(r=>r.name===name);check(rec,'Missing original firm table '+name);
  const db=parseDbf(set.subarray(rec.offset,rec.offset+rec.size)),size=schema.reduce((n,[,len])=>n+len,0);
  check(db.recordSize===size+1,'Unexpected original '+name+' padded record size');
  result[name]=db.records.map((row,i)=>{
   check(row[size]===32,'Invalid '+name+' DBF record padding');
   const item={recordNo:i+1};let pos=0;
   for(const [key,len] of schema){
    const data=row.subarray(pos,pos+len);pos+=len;
    item[key]=key==='bitmapOffset'?data.readUInt32LE(0):stringKeys.has(key)?trim(data):signedKeys.has(key)?signed(data):integer(data);
   }
   return item;
  });
 }
 return result;
}
async function source(root,category,name){
 for(const path of [join(root,'data',category,name),join(root,category,name)]){try{return {bytes:await readFile(path),path}}catch(e){if(e.code!=='ENOENT')throw e}}
 throw Error('Missing 7KAA '+category+'/'+name);
}
function unionRect(bitmaps){
 const minX=Math.min(...bitmaps.map(x=>x.offsetX)),minY=Math.min(...bitmaps.map(x=>x.offsetY));
 const maxX=Math.max(...bitmaps.map(x=>x.offsetX+x.width)),maxY=Math.max(...bitmaps.map(x=>x.offsetY+x.height));
 return {x:minX,y:minY,width:maxX-minX,height:maxY-minY};
}
function compose(components,rect){
 const rgba=Buffer.alloc(rect.width*rect.height*4);
 for(const component of components){
  const {width,height,offsetX,offsetY,rgba:src}=component;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const from=(y*width+x)*4,to=((offsetY+y-rect.y)*rect.width+(offsetX+x-rect.x))*4;
   if(src[from+3]===255)src.copy(rgba,to,from,from+4);
  }
 }
 return rgba;
}
export function selectedBuild(tables,firmCode='BASE',raceCode='NORMAN'){
 const build=tables.FBUILD.find(x=>x.firmCode===firmCode&&x.raceCode===raceCode);
 check(build,'Firm build missing '+firmCode+'/'+raceCode);
 check(build.frameCount>0&&build.frameCount<=11,'Invalid original firm frames');
 check(build.firstFrame>0&&build.firstFrame-1+build.frameCount<=tables.FFRAME.length,
  'Original building animation references missing FFRAME');
 const frames=tables.FFRAME.slice(build.firstFrame-1,build.firstFrame-1+build.frameCount);
 check(frames.every(x=>x.firmCode===firmCode&&x.raceCode===raceCode),'Foreign building animation frame');
 const main=frames.flatMap(frame=>{
  check(frame.firstBitmap>0&&frame.bitmapCount>0&&frame.firstBitmap-1+frame.bitmapCount<=tables.FBITMAP.length,'Missing FBITMAP');
  return tables.FBITMAP.slice(frame.firstBitmap-1,frame.firstBitmap-1+frame.bitmapCount);
 });
 const constructionFirst=build.constructionFirst||frames[0].firstBitmap;
 const constructionCount=build.constructionCount||1;
 check(constructionFirst>0&&constructionFirst-1+constructionCount<=tables.FBITMAP.length,
  'Missing construction bitmaps');
 const stages=tables.FBITMAP.slice(constructionFirst-1,constructionFirst-1+constructionCount);
 const ground=build.groundBitmap?tables.FBITMAP[build.groundBitmap-1]:null;
 const idle=build.idleBitmap?tables.FBITMAP[build.idleBitmap-1]:tables.FBITMAP[frames[0].firstBitmap-1];
 check(stages.every(x=>x.firmCode===firmCode&&x.raceCode===raceCode),'Foreign construction bitmap');
 check(main.every(x=>x.firmCode===firmCode&&x.raceCode===raceCode),'Foreign FFRAME bitmap');
 check(!ground||(ground.firmCode===firmCode&&ground.raceCode===raceCode),'Foreign ground bitmap');
 check(idle?.firmCode===firmCode&&idle?.raceCode===raceCode,'Foreign idle bitmap');
 return {build,frames,stages,ground,idle,main};
}
export async function renderFirm(root,out,{firmCode='BASE',raceCode='NORMAN',colorSchemeId=1}={}){
 check(/^[A-Z0-9_]{1,8}$/.test(firmCode)&&/^[A-Z0-9_]{1,8}$/.test(raceCode),'Invalid original firm/race code');
 const [setFile,firmFile,paletteFile]=await Promise.all([
  source(root,'RESOURCE','STD.SET'),source(root,'RESOURCE','I_FIRM.RES'),source(root,'RESOURCE','PAL_STD.RES')]);
 const tables=parseFirmTables(setFile.bytes),selection=selectedBuild(tables,firmCode,raceCode);
 const palette=decodeStandardPalette(paletteFile.bytes),remap=nationRemapTable(colorSchemeId);
 const bitmapRows=[...new Map([...selection.stages,...selection.main,selection.idle,...(selection.ground?[selection.ground]:[])]
  .map(v=>[v.recordNo,v])).values()];
 const loaded=new Map();
 let remappablePixelCount=0;
 for(const rec of bitmapRows){
  const bitmap=decodeImportedBitmap(firmFile.bytes,rec.bitmapOffset);
  check(rec.locWidth>0&&rec.locHeight>0&&rec.layer>0,'Invalid building grid footprint or layer');
  const isGround=selection.ground?.recordNo===rec.recordNo;
  const nationPixels=[...bitmap.pixels].filter(v=>v>=0xe0&&v<=0xe7).length;
  remappablePixelCount+=isGround?0:nationPixels;
  loaded.set(rec.recordNo,{...rec,width:bitmap.width,height:bitmap.height,
   opaque:bitmap.opaque,transparent:bitmap.transparent,
   nationPixels,rgba:indexedToRgba(bitmap,palette,{remap:isGround?null:remap}),
   rawPixelHash:sha256(bitmap.pixels)});
 }
 const all=[...loaded.values()],rect=unionRect(all);
 check(rect.width>0&&rect.height>0&&rect.width*rect.height<=16777216,'Invalid firm union bounds');
 const build={id:firmCode+':'+raceCode,category:'building',firmCode,raceCode,
  source:{repository:'the3dfxdude/7kaa',originalFilePaths:{tables:'data/RESOURCE/STD.SET',
   bitmap:'data/RESOURCE/I_FIRM.RES',palette:'data/RESOURCE/PAL_STD.RES'},
   sha256:{tables:sha256(setFile.bytes),bitmap:sha256(firmFile.bytes),palette:sha256(paletteFile.bytes)}},
  license:{status:'upstream-gpl-release',notice:'Enlight 7kaa GPL release; music excluded'},
  colorSchemeId,nationColorIndices:'E0-E7 -> original game primary/secondary palettes',
  remappablePixelCount,locWidth:loaded.get(selection.frames[0].firstBitmap).locWidth,
  locHeight:loaded.get(selection.frames[0].firstBitmap).locHeight,
  unionBounds:rect,pivotX:-rect.x,pivotY:-rect.y,pivotStatus:'original map-tile origin; ground contact not visually approved',
  modes:[],bitmaps:[],status:'pixels-decoded-not-visual-reviewed',
  decoded:true,visuallyVerified:false,integrated:false,
  notes:['C++ OFIRMDRW.cpp draws ground in layer 4; main construction/active in their own layers',
   'Construction frame 0..N-1 chosen by hit points; preview does not include dynamic FLAG-S0 overlays',
   'Nation-colour scheme is original index mapping, not arbitrary whole-building tint',
   'Visual original screenshot and full renderer layer ordering still need comparison']};
 const base=resolve(out);await mkdir(base,{recursive:true});
 for(const item of all){
  const filename=firmCode+'-'+raceCode+'-bitmap-'+item.recordNo+'.png';
  await writeFile(join(base,filename),encodePng(item.width,item.height,item.rgba));
  build.bitmaps.push({recordNo:item.recordNo,sourceBitmapName:item.filename,bitmapOffset:item.bitmapOffset,
   mode:item.mode,layer:item.layer,offsetX:item.offsetX,offsetY:item.offsetY,
   width:item.width,height:item.height,locWidth:item.locWidth,locHeight:item.locHeight,
   opaquePixels:item.opaque,transparentPixels:item.transparent,
   remappableSourcePixels:item.nationPixels,pixelHash:item.rawPixelHash,
   palette:'PAL_STD.RES',path:filename,decoded:true,visuallyVerified:false});
 }
 const ground=selection.ground?loaded.get(selection.ground.recordNo):null;
 for(let k=0;k<selection.stages.length;k++){
  const phase=loaded.get(selection.stages[k].recordNo),layers=[
   ...(ground&&k===selection.stages.length-1?[ground]:[]),phase
  ],filename=firmCode+'-'+raceCode+'-construction-'+k+'.png';
  await writeFile(join(base,filename),encodePng(rect.width,rect.height,compose(layers,rect)));
  build.modes.push({mode:'construction',phase:k,path:filename,
   sourceBitmapRecords:layers.map(x=>x.recordNo),
   note:k===selection.stages.length-1?'Original ground becomes visible in last construction phase':'No ground in earlier phases'});
 }
 for(let k=0;k<selection.frames.length;k++){
  const frame=selection.frames[k],images=tables.FBITMAP.slice(frame.firstBitmap-1,frame.firstBitmap-1+frame.bitmapCount)
   .map(x=>loaded.get(x.recordNo));
  const layers=[...(ground?[ground]:[]),...images],filename=firmCode+'-'+raceCode+'-active-'+k+'.png';
  await writeFile(join(base,filename),encodePng(rect.width,rect.height,compose(layers,rect)));
  build.modes.push({mode:'active',frame:k,delayTenths:frame.delay,path:filename,
   sourceBitmapRecords:layers.map(x=>x.recordNo),layers:layers.map(x=>x.layer)});
 }
 const idleComponents=[...(ground?[ground]:[]),loaded.get(selection.idle.recordNo)];
 const idleFile=firmCode+'-'+raceCode+'-idle.png';
 await writeFile(join(base,idleFile),encodePng(rect.width,rect.height,compose(idleComponents,rect)));
 build.modes.push({mode:'idle',path:idleFile,sourceBitmapRecords:idleComponents.map(x=>x.recordNo)});
 await writeFile(join(base,'firm.json'),JSON.stringify(build,null,2)+'\n');
 return build;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const a=process.argv.slice(2),arg=k=>a[a.indexOf(k)+1];
 if(!a.includes('--source')||!a.includes('--out')){console.error('Usage: node render-firm.mjs --source /local/7kaa --out /tmp/firm --firm BASE --race NORMAN --scheme 1');process.exitCode=2;}
 else renderFirm(arg('--source'),arg('--out'),{firmCode:arg('--firm')||'BASE',
  raceCode:arg('--race')||'NORMAN',colorSchemeId:Number(arg('--scheme')||1)})
  .then(m=>console.log('Extracted '+m.bitmaps.length+' original building bitmaps; visual QA pending'))
  .catch(e=>{console.error(e.stack);process.exitCode=1});
}
