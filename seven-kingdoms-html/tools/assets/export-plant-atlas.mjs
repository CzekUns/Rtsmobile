// SKH-TERRAIN-002: deterministic atlas export from licensed, user-supplied 7KAA archives.
// No synthesized pixels. Refuse export without exact source hashes and original palette.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname} from 'node:path';
import {linkPlantResources} from './nature-bitmap.mjs';
import {encodeIndexedPng} from './indexed-png.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const validHash=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
export function exportPlantAtlas({plantDb,bitmapDb,bitmapArchive,palette,expectedHashes,sourceCommit,transparentIndex}) {
  const sources={PLANT1:plantDb,PLANTBM1:bitmapDb,I_PLANT1:bitmapArchive,PAL_STD:palette};
  if(sourceCommit!=='14e6fdfba9481af4dc3a54722614a608776e20bc')
    throw Error('unpinned 7KAA source commit');
  for(const [name,bytes] of Object.entries(sources)){
    if(!(bytes instanceof Uint8Array)||!validHash(expectedHashes?.[name])||hash(bytes)!==expectedHashes[name])
      throw Error('source SHA-256 mismatch or missing: '+name);
  }
  // PAL_STD.RES in pinned 7KAA has an 8-byte resource header (0x308 = 776 bytes).
  // Keep 768-byte raw RGB palettes accepted for existing unit fixtures.
  let rgbPalette=palette;
  if(palette.length===776){
    const view=new DataView(palette.buffer,palette.byteOffset,4);
    if(view.getUint32(0,true)!==0x308)throw Error('unrecognized original PAL_STD.RES header');
    rgbPalette=palette.subarray(8);
  }
  if(rgbPalette.length!==768)throw Error('original RGB palette must contain 768 bytes');
  const {plants,bitmaps}=linkPlantResources(plantDb,bitmapDb,bitmapArchive);
  if(!bitmaps.length)throw Error('empty original plant atlas');
  // Shelf layout: variable original dimensions, never rescale or interpolate.
  const maxWidth=bitmaps.reduce((max,b)=>Math.max(max,b.bitmap.width),0);
  const totalPixels=bitmaps.reduce((n,b)=>n+b.bitmap.width*b.bitmap.height,0);
  if(totalPixels>10000000)throw Error('atlas exceeds safe pixel limit');
  const targetWidth=Math.max(maxWidth,Math.ceil(Math.sqrt(totalPixels)));
  let x=0,y=0,rowHeight=0,usedWidth=0;
  const placements=[];
  for(const b of bitmaps){
    const {width,height}=b.bitmap;
    if(x&&x+width>targetWidth){y+=rowHeight;x=0;rowHeight=0;}
    placements.push({id:b.id,plant:b.plant,x,y,width,height,offsetX:b.offsetX,offsetY:b.offsetY,townAge:b.townAge});
    x+=width;rowHeight=Math.max(rowHeight,height);usedWidth=Math.max(usedWidth,x);
  }
  const height=y+rowHeight;
  if(usedWidth*height>10000000)throw Error('atlas exceeds safe pixel limit');
  const pixels=new Uint8Array(usedWidth*height).fill(255);
  for(let i=0;i<bitmaps.length;i++){
    const b=bitmaps[i].bitmap,p=placements[i];
    for(let row=0;row<b.height;row++)pixels.set(b.pixels.subarray(row*b.width,(row+1)*b.width),(p.y+row)*usedWidth+p.x);
  }
  return {png:encodeIndexedPng(usedWidth,height,pixels,rgbPalette,{transparentIndex:transparentIndex??255}),
    manifest:{schemaVersion:1,source:'the3dfxdude/7kaa',license:'GPL-2.0-or-later',
      sourceCommit,sha256:expectedHashes,width:usedWidth,height,plantCount:plants.length,
      bitmaps:placements,transparentIndex:transparentIndex??255,visualParity:'not_certified'}};
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
  const [, ,configPath]=process.argv;
  if(!configPath)throw Error('usage: node export-plant-atlas.mjs config.json');
  const cfg=JSON.parse(readFileSync(configPath,'utf8'));
  const required=['plantDb','bitmapDb','bitmapArchive','palette'];
  const inputs=Object.fromEntries(required.map(k=>[k,readFileSync(cfg.files[k])]));
  const result=exportPlantAtlas({...inputs,expectedHashes:cfg.expectedHashes,sourceCommit:cfg.sourceCommit,transparentIndex:cfg.transparentIndex});
  for(const file of [cfg.outputPng,cfg.outputManifest])mkdirSync(dirname(file),{recursive:true});
  writeFileSync(cfg.outputPng,result.png);
  writeFileSync(cfg.outputManifest,JSON.stringify(result.manifest,null,2)+'\n');
}
