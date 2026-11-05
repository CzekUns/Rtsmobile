#!/usr/bin/env node
// Original 7KAA unit conversion: authentic STD.SET + *.SPR + PAL_STD.RES -> PNG.
// Reads local, licensed upstream data. Does not touch the browser game or WASM.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {parseRes,decodeTable,sha256} from './decode.mjs';
import {decodeImportedBitmap,decodeStandardPalette,indexedToRgba,encodePng,mirrorForDirection,nationRemapTable} from './pixel-codec.mjs';

const check=(v,m)=>{if(!v)throw Error(m)};
const dirs=['N','NE','E','SE','S','SW','W','NW'];
const assetPaths=(root,category,name)=>[join(root,'data',category,name),join(root,category,name)];
async function readAsset(root,category,name){
 for(const path of assetPaths(root,category,name)){try{return {path,bytes:await readFile(path)}}catch(e){if(e.code!=='ENOENT')throw e}}
 throw Error('Missing original '+category+'/'+name+' in '+root);
}
export function originalTables(set){
 const records=parseRes(set),tables={};
 for(const name of ['SPRITE','SACTION','SFRAME']){
  const rec=records.find(r=>r.name===name);
  check(rec,'Missing original STD.SET table '+name);
  tables[name]=decodeTable(name,set.subarray(rec.offset,rec.offset+rec.size));
 }
 return tables;
}
function nearest2(width,height,rgba){
 const out=Buffer.alloc(width*height*16);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const src=(y*width+x)*4;
  for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)rgba.copy(out,((2*y+dy)*2*width+2*x+dx)*4,src,src+4);
 }
 return out;
}
function sheet(frames,columns=8,rows=6){
 const cellW=96,cellH=112,anchorX=40,anchorY=50, width=columns*cellW,height=rows*cellH;
 const canvas=Buffer.alloc(width*height*4);
 for(const f of frames){
  if(f.action!=='M'||f.frame>=rows||f.direction>=columns)continue;
  const left=f.direction*cellW+anchorX+f.offsetX,top=f.frame*cellH+anchorY+f.offsetY;
  for(let y=0;y<f.height;y++)for(let x=0;x<f.width;x++){
   const ix=(y*f.width+x)*4,px=left+x,py=top+y;
   check(px>=0&&py>=0&&px<width&&py<height,'Contact sheet cell too small for original offsets');
   if(f.rgba[ix+3])f.rgba.copy(canvas,(py*width+px)*4,ix,ix+4);
  }
 }
 return {width,height,rgba:canvas};
}
export async function renderUnit(root,out,unitCode='NORMAN',{colorSchemeId=1,selected=false}={}){
 check(/^[A-Z0-9_]{1,8}$/.test(unitCode),'Invalid 7KAA unit sprite ID');
 const [setFile,sprFile,paletteFile]=await Promise.all([
  readAsset(root,'RESOURCE','STD.SET'),readAsset(root,'SPRITE',unitCode+'.SPR'),
  readAsset(root,'RESOURCE','PAL_STD.RES')]);
 const tables=originalTables(setFile.bytes);
 const spr=tables.SPRITE.find(x=>x.code===unitCode);
 check(spr,'Sprite '+unitCode+' absent from original STD.SET');
 const begin=spr.firstAction-1,end=begin+spr.actionCount;
 check(begin>=0&&end<=tables.SACTION.length,'Invalid original sprite action range');
 const actions=tables.SACTION.slice(begin,end);
 check(actions.every(a=>a.sprite===unitCode),'Foreign sprite action in original data');
 const movement=actions.filter(a=>a.action==='M').sort((a,b)=>a.direction-b.direction);
 check(movement.length>0,'Sprite lacks original movement frames');
 const palette=decodeStandardPalette(paletteFile.bytes);
 const resolution=Number(spr.turnResolution);
 check([1,8,16,24].includes(resolution),'Unrecognized original turn resolution');
 // OUNITDRW.cpp::Unit::draw always uses Game::get_color_remap_table(nation_recno,0).
 // sprite_info->remap_bitmap_flag controls Sprite::draw, NOT Unit::draw;
 // do not accidentally suppress the unit's nation-colour mapping.
 const nationTable=nationRemapTable(colorSchemeId,{selected});
 const manifest={schemaVersion:2,id:unitCode,category:'unit',status:'pixel-decoded-not-visual-reviewed',
  decoded:true,visuallyVerified:false,license:{status:'upstream-gpl-release',notice:'7kaa README and COPYING; exclude separate music'},
  source:{repository:'the3dfxdude/7kaa',originalFilePaths:{
   metadata:'data/RESOURCE/STD.SET',bitmap:'data/SPRITE/'+unitCode+'.SPR',palette:'data/RESOURCE/PAL_STD.RES'},
   sha256:{metadata:sha256(setFile.bytes),bitmap:sha256(sprFile.bytes),palette:sha256(paletteFile.bytes)}},
  turnResolution:resolution,locWidth:spr.locWidth,locHeight:spr.locHeight,colorSchemeId,selected,
  nationRemap:'OGAME.cpp::get_color_remap_table on E0-E7, F2 and F3',spriteRemapFlag:spr.remap,
  frames:[],actions:[],previews:[],
  notes:['Direction 0 = north, increasing clockwise (OSPRITE.cpp); 5..7 use C++ mirror for resolution 8',
   'Ground-contact point and nation overlays not visually reviewed; only source-reserved palette codes are remapped']};
 const outDir=resolve(out),frameDir=join(outDir,'frames');await mkdir(frameDir,{recursive:true});
 const previewFrames=[];
 for(const action of movement){
  check(Number.isInteger(action.direction)&&action.direction>=0&&action.direction<24,'Invalid original source direction');
  check(action.firstFrame>0&&action.frameCount>0,'Invalid original action frames');
  const seen=new Map(),group=[];
  for(let k=0;k<action.frameCount;k++){
   const frame=tables.SFRAME[action.firstFrame-1+k];
   check(frame?.sprite===unitCode,'Missing or foreign original SFRAME');
   const decoded=decodeImportedBitmap(sprFile.bytes,frame.bitmapOffset);
   check(decoded.width===frame.width&&decoded.height===frame.height,'Original SFRAME dimensions disagree with bitmap header '+frame.recordNo);
   const mirrored=mirrorForDirection(action.direction,resolution);
   const rgba=indexedToRgba(decoded,palette,{mirror:mirrored,remap:nationTable});
   const filename=unitCode+'-M-'+String(action.direction).padStart(2,'0')+'-'+String(k).padStart(2,'0')+'.png';
   const output=join(frameDir,filename);await writeFile(output,encodePng(decoded.width,decoded.height,rgba));
   const pixelHash=sha256(decoded.pixels);
   const f={id:unitCode,category:'unit',action:'M',originalAction:'M',
    direction:action.direction,orientation:action.direction<8?dirs[action.direction]:null,
    sourceFrameDirection:frame.direction,frame:k,sourceFrame:frame.recordNo,
    sourceBitmapName:frame.file,bitmapOffset:frame.bitmapOffset,
    originalBitmapRecordLength:decoded.recordLength,bitmapPixelSha256:pixelHash,
    bitmapFile:unitCode+'.SPR',width:decoded.width,height:decoded.height,
    offsetX:frame.offsetX,offsetY:frame.offsetY,pivotX:-frame.offsetX,pivotY:-frame.offsetY,
    pivotStatus:'local-image-origin-not-ground-verified',mirror:mirrored,
    opaquePixels:decoded.opaque,transparentPixels:decoded.transparent,
    palette:'PAL_STD.RES',remap:'nation-remap-OGAME-E0-E7',
    path:'frames/'+filename,decoded:true,visuallyVerified:false};
   if(seen.has(pixelHash))f.duplicateOf=seen.get(pixelHash);else seen.set(pixelHash,k);
   group.push(f);manifest.frames.push(f);previewFrames.push({...f,rgba});
  }
  manifest.actions.push({action:'M',direction:action.direction,declaredFrames:action.frameCount,
   distinctPixelFrames:seen.size,sourceAction:action.recordNo,firstFrame:action.firstFrame});
  const explicitStop=actions.find(a=>a.action==='S'&&a.direction===action.direction);
  if(!explicitStop){
   // OSPRTRES.cpp::load_sprite_info: M[0] is the default stop frame unless S exists.
   manifest.frames.push({...group[0],action:'S',originalAction:'M',frame:0,
    fallbackFromMovement:true,duplicateOf:'M:'+action.direction+':0'});
   manifest.actions.push({action:'S',direction:action.direction,declaredFrames:0,
    derivedStopFromMovement:true,firstFrame:action.firstFrame});
  }else{
   const stopSeen=new Map();
   for(let k=0;k<explicitStop.frameCount;k++){
    const f=tables.SFRAME[explicitStop.firstFrame-1+k];
    check(f?.sprite===unitCode,'Missing original stop frame');
    const b=decodeImportedBitmap(sprFile.bytes,f.bitmapOffset),mirrored=mirrorForDirection(action.direction,resolution);
    check(b.width===f.width&&b.height===f.height,'Stop frame size mismatch');
    const rgba=indexedToRgba(b,palette,{mirror:mirrored,remap:nationTable}),filename=unitCode+'-S-'+String(action.direction).padStart(2,'0')+'-'+String(k).padStart(2,'0')+'.png';
    await writeFile(join(frameDir,filename),encodePng(b.width,b.height,rgba));
    const hash=sha256(b.pixels);stopSeen.set(hash,true);
    manifest.frames.push({id:unitCode,category:'unit',action:'S',originalAction:'S',
     direction:action.direction,orientation:action.direction<8?dirs[action.direction]:null,
     sourceFrame:f.recordNo,sourceFrameDirection:f.direction,frame:k,
     bitmapFile:unitCode+'.SPR',sourceBitmapName:f.file,bitmapOffset:f.bitmapOffset,
     bitmapPixelSha256:hash,width:b.width,height:b.height,offsetX:f.offsetX,offsetY:f.offsetY,
     pivotX:-f.offsetX,pivotY:-f.offsetY,mirror:mirrored,palette:'PAL_STD.RES',
     remap:'nation-remap-OGAME-E0-E7',path:'frames/'+filename,decoded:true,visuallyVerified:false});
   }
   manifest.actions.push({action:'S',direction:action.direction,declaredFrames:explicitStop.frameCount,
    distinctPixelFrames:stopSeen.size,sourceAction:explicitStop.recordNo});
  }
 }
 if(movement.length===8&&movement.every(a=>a.frameCount===6)){
  const contact=sheet(previewFrames);
  const name=unitCode+'-M-1x.png',name2=unitCode+'-M-2x.png';
  await writeFile(join(outDir,name),encodePng(contact.width,contact.height,contact.rgba));
  await writeFile(join(outDir,name2),encodePng(contact.width*2,contact.height*2,nearest2(contact.width,contact.height,contact.rgba)));
  manifest.previews=[name,name2];
 }
 await writeFile(join(outDir,'unit.json'),JSON.stringify(manifest,null,2)+'\n');
 return manifest;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const args=process.argv.slice(2),arg=k=>args[args.indexOf(k)+1];
 if(!args.includes('--source')||!args.includes('--out')){
  console.error('Usage: node render-unit.mjs --source /local/7kaa[/data] --out /tmp/norman --unit NORMAN');process.exitCode=2;
 }else renderUnit(arg('--source'),arg('--out'),arg('--unit')||'NORMAN').then(m=>console.log('Decoded '+m.frames.length+' original unit/idle frames; visual QA pending')).catch(e=>{console.error(e.stack);process.exitCode=1});
}
