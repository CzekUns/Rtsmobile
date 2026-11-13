#!/usr/bin/env node
// Rebuild the 180 original SG coast records, in 7KAA database order, as 8-bit indexed PNG.
// Does not port 7KAA world generation. No invented shore pixels or palette.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {parseTerrainDatabase} from './terrain-database.mjs';
import {decodeTerrainBitmap} from './terrain-bitmap.mjs';
import {encodeIndexedPng} from './indexed-png.mjs';

export const UPSTREAM_COMMIT='14e6fdfba9481af4dc3a54722614a608776e20bc';
const checksums=Object.freeze({
 'TERRAIN1.RES':'67b445d86916393c00e3b88466b7fa354701ef33b1c372e06fc463e0ba8a613a',
 'I_TERN1.RES':'791745a1bbaed1eeb3582725cf05f90918fd0733682b32eec697b6e297f45774',
 'PAL_STD.RES':'8bda65c749340446edb6debe73a5b0f67b1a4af8dd0fdb1fa0222a69848b6ef7'
});
const sha256=b=>createHash('sha256').update(b).digest('hex');
const blobSha=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const fail=(yes,msg)=>{if(!yes)throw Error(msg)};
async function resource(root,name){
 for(const path of [join(root,'data/RESOURCE',name),join(root,'RESOURCE',name)]){
  try{return await readFile(path)}catch(e){if(e.code!=='ENOENT')throw e}
 }
 throw Error('Original 7KAA resource '+name+' not found under '+root);
}
export function makeCoastAtlas(db,resourceBytes,paletteFile){
 fail(db.length===20636&&resourceBytes.length===577920&&paletteFile.length===776,'upstream file sizes differ from pinned 7KAA');
 const files=[['TERRAIN1.RES',db],['I_TERN1.RES',resourceBytes],['PAL_STD.RES',paletteFile]];
 for(const [name,data] of files)fail(sha256(data)===checksums[name],'SHA-256 mismatch: '+name);
 const rows=parseTerrainDatabase(db).records.filter(r=>(r.averageType===1)!==(r.secondaryType===1));
 fail(rows.length===180,'expected 180 SG records in pinned 7KAA');
 const columns=16,tileSize=32,count=rows.length,atlasRows=Math.ceil(count/columns);
 const pixels=Buffer.alloc(columns*tileSize*atlasRows*tileSize);
 const records=[];
 for(const [index,rec] of rows.entries()){
  const codes=['nw','ne','sw','se'].map(k=>rec.corners[k].code);
  fail(codes.every(code=>code[0]==='S'||code[0]==='G'),'only SG mixed corner rows permitted');
  fail(rec.specialFlag===' ','special terrain resource unexpected');
  const img=decodeTerrainBitmap(resourceBytes,rec.bitmapOffset);
  fail(img.width===32&&img.height===32&&img.payloadBytes===1028,'original coast bitmap dimensions unexpected');
  fail(img.pixels.every(p=>p<248),'terrain contains transparency opcode');
  const left=(index%columns)*tileSize,top=Math.floor(index/columns)*tileSize;
  for(let y=0;y<tileSize;y++)pixels.set(img.pixels.subarray(y*tileSize,(y+1)*tileSize),(top+y)*columns*tileSize+left);
  records.push({id:rec.id,offset:rec.bitmapOffset,length:1032,fileName:rec.fileName,
   cornerCodes:codes,corners:codes.map(c=>c[0]==='S'?'water':'land'),
   specialFlag:'',representativeType:rec.averageType===1?'S':'G',secondaryType:rec.secondaryType===1?'S':'G',
   atlasIndex:index,upstreamLookup:'TerrainRes::scan (src/OTERRAIN.cpp)'});
 }
 fail(paletteFile.readUInt32LE(0)===0x308&&paletteFile.length===8+768,'unrecognized original PAL_STD.RES');
 const png=encodeIndexedPng(columns*tileSize,atlasRows*tileSize,pixels,paletteFile.subarray(8));
 const manifest={schemaVersion:1,category:'original-coast-transitions',
  status:'7kaa-indexed-original-source-not-generative-world-parity',
  atlas:'TERRAIN1-SG-coast-16x12.png',tileSize,columns,rows:atlasRows,count,
  source:{url:'https://github.com/the3dfxdude/7kaa/tree/'+UPSTREAM_COMMIT+'/data/RESOURCE',repository:'the3dfxdude/7kaa',
   commit:UPSTREAM_COMMIT,license:'GPL-2.0-or-later',sha256:checksums['I_TERN1.RES'],
   files:files.map(([name,data])=>({path:'data/RESOURCE/'+name,bytes:data.length,
    gitBlobSha:blobSha(data),sha256:checksums[name]}))},
  notes:[
   'Original indexed bitmap pixels from I_TERN1.RES with PAL_STD.RES; 180 SG database records, each 32x32',
   'Lookup approximates source mask-based TerrainRes::scan when on a demo grass/water vertex grid; demo map generator and pathfinding are unchanged',
   'Original 7KAA corner height/mask and random pattern choice not ported; do not claim visual 1:1 parity',
   'PNG uses indexed 8-bit PLTE with uncompressed zlib blocks and no alpha; this form can be regenerated from the checked upstream files'
  ],records};
 return {png,manifest};
}
export async function renderCoastAtlas(source,out){
 const files=await Promise.all(['TERRAIN1.RES','I_TERN1.RES','PAL_STD.RES'].map(n=>resource(source,n)));
 const {png,manifest}=makeCoastAtlas(...files);await mkdir(out,{recursive:true});
 await Promise.all([
  writeFile(join(out,manifest.atlas),png),
  writeFile(join(out,'TERRAIN1-SG-coast-16x12.json'),JSON.stringify(manifest,null,2)+'\n')
 ]);
 return manifest;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const get=flag=>process.argv[process.argv.indexOf(flag)+1];
 if(!process.argv.includes('--source')||!process.argv.includes('--out')){console.error('Usage: node render-coast.mjs --source /path/to/7kaa --out /path/to/output');process.exitCode=2}
 else renderCoastAtlas(resolve(get('--source')),resolve(get('--out'))).then(m=>console.log('Generated '+m.count+' original SG coast DBF record images')).catch(e=>{console.error(e);process.exitCode=1});
}
