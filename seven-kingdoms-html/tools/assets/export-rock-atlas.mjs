// Reproducible ROCK atlas from 7KAA GPL resources, no substitute pixels.
import {createHash} from 'node:crypto';
import {linkRockResources} from './rock-bitmap.mjs';
import {encodeIndexedPng} from './indexed-png.mjs';
import {ROCK_SOURCE_COMMIT,ROCK_RESOURCE_NAMES} from './fetch-rock-resources.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
export function exportRockAtlas({files,provenance,maxPixels=10_000_000}){
 if(provenance?.sourceCommit!==ROCK_SOURCE_COMMIT||provenance?.license!=='GPL-2.0-or-later')
   throw Error('unpinned ROCK provenance');
 for(const name of ROCK_RESOURCE_NAMES){
   const bytes=files?.[name],entry=provenance.resources?.find(r=>r.name===name);
   if(!(bytes instanceof Uint8Array)||!entry||entry.bytes!==bytes.length||entry.sha256!==hash(bytes))
     throw Error('ROCK resource hash mismatch: '+name);
 }
 const palette=files['PAL_STD.RES'];
 if(palette.length!==776||new DataView(palette.buffer,palette.byteOffset,4).getUint32(0,true)!==776)
   throw Error('invalid original ROCK palette');
 const rgb=palette.subarray(8);
 const linked=linkRockResources({
   rockDb:files['ROCK1.RES'],blockDb:files['ROCKBLK1.RES'],
   bitmapDb:files['ROCKBMP1.RES'],animDb:files['ROCKANI1.RES'],
   bitmapArchive:files['I_ROCK1.RES']
 });
 const frames=linked.rocks.flatMap(rock=>rock.blocks.flatMap(block=>block.frames.map(f=>({
   rockId:rock.id,rockType:rock.type,rockRecord:rock.idNumber??null,
   footprintWidth:rock.width,footprintHeight:rock.height,
   blockX:block.x,blockY:block.y,frame:f.frame,bitmap:f.bitmap
 }))));
 if(!frames.length)throw Error('empty original ROCK atlas');
 const total=frames.reduce((n,f)=>n+f.bitmap.width*f.bitmap.height,0);
 if(total>maxPixels)throw Error('ROCK atlas pixel limit');
 const widthLimit=Math.max(Math.ceil(Math.sqrt(total)),...frames.map(f=>f.bitmap.width));
 let x=0,y=0,rowHeight=0,width=0;
 const entries=[];
 for(const f of frames){
   if(x&&x+f.bitmap.width>widthLimit){y+=rowHeight;x=0;rowHeight=0;}
   entries.push({rockId:f.rockId,rockType:f.rockType,
     footprintWidth:f.footprintWidth,footprintHeight:f.footprintHeight,
     blockX:f.blockX,blockY:f.blockY,frame:f.frame,x,y,
     width:f.bitmap.width,height:f.bitmap.height});
   x+=f.bitmap.width;rowHeight=Math.max(rowHeight,f.bitmap.height);width=Math.max(width,x);
 }
 const height=y+rowHeight;
 if(width*height>maxPixels)throw Error('ROCK atlas pixel limit');
 const pixels=new Uint8Array(width*height).fill(255);
 frames.forEach((f,i)=>{
   const e=entries[i];
   for(let row=0;row<e.height;row++)
     pixels.set(f.bitmap.pixels.subarray(row*e.width,(row+1)*e.width),(e.y+row)*width+e.x);
 });
 return {png:encodeIndexedPng(width,height,pixels,rgb,{transparentIndex:255}),
   manifest:{schemaVersion:1,source:'the3dfxdude/7kaa',sourceCommit:ROCK_SOURCE_COMMIT,
     license:'GPL-2.0-or-later',resources:provenance.resources,
     width,height,transparentIndex:255,rockCount:linked.rocks.length,
     bitmapCount:linked.bitmapCount,animationCount:linked.animationCount,
     entries,visualParity:'not_certified'}};
}
