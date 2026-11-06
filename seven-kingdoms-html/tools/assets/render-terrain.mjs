#!/usr/bin/env node
// Convert uncompressed original 7KAA TERRAIN1 DBF + I_TERN1.RES to PNG.
// GPL-2.0-or-later. Original resource layout: OTERRAIN.cpp and ORESDB.cpp.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {decodeStandardPalette,encodePng} from './pixel-codec.mjs';
import {sha256} from './decode.mjs';

const fail=(v,m)=>{if(!v)throw Error(m)};
const TILE=32,TYPES=['G','F','D','S'];
export function parseTerrainRows(db){
 fail(Buffer.isBuffer(db)&&db.length>=385,'Invalid original TERRAIN1.RES');
 const count=db.readUInt32LE(4),header=db.readUInt16LE(8),length=db.readUInt16LE(10);
 fail(length===27&&header===385&&count>0&&header+count*length<=db.length,
  'Unexpected original TERRAIN1 DBF layout');
 const ascii=(p,n)=>db.toString('latin1',p,p+n).trim();
 const rows=[];
 for(let i=0;i<count;i++){
  const p=header+i*length;
  fail(db[p]===32||db[p]===42,'Invalid DBF row marker');
  rows.push({sourceRecordNo:i+1,nw:ascii(p+1,2),ne:ascii(p+3,2),sw:ascii(p+5,2),se:ascii(p+7,2),
   extra:ascii(p+9,1),special:ascii(p+10,1),rep:ascii(p+11,1),
   filename:ascii(p+15,8),bitmapOffset:db.readUInt32LE(p+23)});
 }
 return rows;
}
export function rawTerrainTile(source,offset){
 fail(Buffer.isBuffer(source)&&Number.isInteger(offset)&&offset>=0&&offset+8<=source.length,
  'Invalid original I_TERN bitmap offset');
 const byteLength=source.readUInt32LE(offset),w=source.readUInt16LE(offset+4),h=source.readUInt16LE(offset+6);
 fail(byteLength===4+TILE*TILE&&w===TILE&&h===TILE&&offset+4+byteLength<=source.length,
  'Original terrain bitmap must be 32x32 uncompressed indexed pixels');
 const pixels=Buffer.from(source.subarray(offset+8,offset+8+TILE*TILE));
 fail(pixels.every(p=>p<248),'Unexpected transparency control in opaque terrain bitmap');
 return pixels;
}
export function choosePureTerrainRows(rows,type,count=8){
 fail(TYPES.includes(type),'Unsupported original terrain type '+type);
 let matches=[];
 for(const subtype of ['+','0','-','*']){
  const code=type+subtype;
  matches.push(...rows.filter(r=>r.rep===type&&!r.extra&&!r.special&&
   r.nw===code&&r.ne===code&&r.sw===code&&r.se===code));
 }
 fail(matches.length>0,'Missing original pure terrain '+type);
 return Array.from({length:count},(_,i)=>matches[i%matches.length]);
}
async function sourceFile(root,name){
 for(const path of [join(root,'data','RESOURCE',name),join(root,'RESOURCE',name)]){
  try{return await readFile(path)}catch(e){if(e.code!=='ENOENT')throw e}
 }
 throw Error('Missing licensed original RESOURCE/'+name+' at '+root);
}
export async function renderOriginalTerrain(root,out){
 const [db,source,paletteFile]=await Promise.all(['TERRAIN1.RES','I_TERN1.RES','PAL_STD.RES'].map(n=>sourceFile(root,n)));
 const palette=decodeStandardPalette(paletteFile),records=parseTerrainRows(db);
 const width=8*TILE,height=4*TILE,rgba=Buffer.alloc(width*height*4);
 const manifest={schemaVersion:1,category:'terrain',status:'pixel-decoded-not-original-gameplay-parity',
  decoded:true,visuallyVerified:false,integrated:false,atlas:'TERRAIN1-pure-8x4.png',
  tileSize:TILE,columns:8,rows:4,
  source:{repository:'the3dfxdude/7kaa',originalFiles:['data/RESOURCE/TERRAIN1.RES',
   'data/RESOURCE/I_TERN1.RES','data/RESOURCE/PAL_STD.RES'],
   sha256:{TERRAIN1:sha256(db),I_TERN1:sha256(source),PAL_STD:sha256(paletteFile)}},
  types:{},notes:['Original 32x32 opaque indexed tiles from OTERRAIN.cpp; four all-corner-pure source terrain types',
   'Only sampled pure terrain; source corner transition system and scene parity are pending',
   'Background visuals only: JS map terrain classification and collision remain unchanged']};
 for(let row=0;row<TYPES.length;row++){
  const type=TYPES[row];manifest.types[type]=[];
  for(let col=0;col<8;col++){
   const rec=choosePureTerrainRows(records,type)[col],pixels=rawTerrainTile(source,rec.bitmapOffset);
   for(let y=0;y<TILE;y++)for(let x=0;x<TILE;x++){
    const raw=pixels[y*TILE+x],dst=((row*TILE+y)*width+col*TILE+x)*4;
    rgba[dst]=palette[raw*3];rgba[dst+1]=palette[raw*3+1];rgba[dst+2]=palette[raw*3+2];rgba[dst+3]=255;
   }
   manifest.types[type].push({index:col,sourceRecordNo:rec.sourceRecordNo,
    fileName:rec.filename,originalBitmapOffset:rec.bitmapOffset,cornerCode:rec.nw,
    palette:'PAL_STD.RES'});
  }
 }
 const output=resolve(out);await mkdir(output,{recursive:true});
 await Promise.all([writeFile(join(output,manifest.atlas),encodePng(width,height,rgba)),
  writeFile(join(output,'TERRAIN1-pure-8x4.json'),JSON.stringify(manifest,null,2)+'\n')]);
 return manifest;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const args=process.argv.slice(2),get=(key)=>args[args.indexOf(key)+1];
 if(!args.includes('--source')||!args.includes('--out')){console.error('Usage: node render-terrain.mjs --source /path/to/7kaa --out /tmp/terrain');process.exitCode=2;}
 else renderOriginalTerrain(get('--source'),get('--out'))
  .then(m=>console.log('Extracted '+Object.values(m.types).flat().length+' authentic 32x32 terrain samples; visual parity pending'))
  .catch(e=>{console.error(e.stack);process.exitCode=1});
}
