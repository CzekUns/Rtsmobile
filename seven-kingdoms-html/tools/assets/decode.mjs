#!/usr/bin/env node
// Metadata extractor for original 7KAA ResourceIdx (.RES) and packed DBF records.
// GPL-2.0-or-later, derived from the documented 7kaa layouts; no proprietary images included.
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export const sha256 = b => createHash('sha256').update(b).digest('hex');
const ascii = b => b.toString('latin1').replace(/\0.*$/s,'').trim();
const number = b => { const s=ascii(b); if (!/^-?\d+$/.test(s)) throw Error('Invalid integer field: '+JSON.stringify(s)); return Number(s); };
const assert = (p,m) => { if (!p) throw Error(m); };
export function parseRes(buffer) {
  assert(buffer.length>=2,'Truncated RES');
  const count=buffer.readUInt16LE(0), indexEnd=2+(count+1)*13;
  assert(indexEnd<=buffer.length && count<=10000,'Invalid RES index');
  const rows=[];
  for(let i=0;i<=count;i++){
    const p=2+i*13, name=ascii(buffer.subarray(p,p+9)), offset=buffer.readUInt32LE(p+9);
    assert(offset>=indexEnd && offset<=buffer.length,'Invalid RES offset at '+i);
    if(i) assert(offset>=rows[i-1].offset,'Unsorted RES offsets');
    rows.push({name,offset});
  }
  return rows.slice(0,-1).map((r,i)=>({id:i+1,name:r.name,offset:r.offset,size:rows[i+1].offset-r.offset}));
}
export function parseDbf(buffer){
  // 7kaa ODB.cpp: 12-byte packed header, one extra marker byte before data_offset.
  assert(buffer.length>=13,'Truncated DBF');
  const count=buffer.readUInt32LE(4), dataOffset=buffer.readUInt16LE(8), recordSize=buffer.readUInt16LE(10), start=1+dataOffset;
  assert(recordSize>0 && count<=1000000 && start+count*recordSize<=buffer.length,'Invalid DBF dimensions');
  return {count,recordSize,dataOffset,start,records:Array.from({length:count},(_,i)=>buffer.subarray(start+i*recordSize,start+(i+1)*recordSize))};
}
const fields = {
 SPRITE:[['code',8],['type',1],['subtype',1],['turn',1],['turnResolution',2],['locWidth',2],['locHeight',2],['speed',2],['framesPerStep',2],['rain',2],['snow',2],['lightning',3],['remap',1],['firstAction',5],['actionCount',5]],
 SACTION:[['sprite',8],['action',2],['direction',2],['firstFrame',5],['frameCount',2]],
 SFRAME:[['sprite',8],['action',2],['direction',2],['frameId',2],['offsetX',4],['offsetY',4],['width',3],['height',3],['file',8],['bitmapOffset',4]]
};
export function decodeTable(type,buffer){
  const db=parseDbf(buffer), schema=fields[type]; assert(schema,'Unsupported table '+type);
  const expected=schema.reduce((n,[,s])=>n+s,0);
  assert(db.recordSize===expected,type+' record width '+db.recordSize+' differs from packed '+expected);
  const records=db.records.map((r,i)=>{
    let pos=0;const row={recordNo:i+1};
    for(const [key,size] of schema){
      const b=r.subarray(pos,pos+size); pos+=size;
      row[key]=key==='bitmapOffset'?b.readUInt32LE(0):['firstAction','actionCount','direction','firstFrame','frameCount','frameId','offsetX','offsetY','width','height','locWidth','locHeight'].includes(key)?number(b):ascii(b);
    }
    return row;
  });
  return records;
}
export function makeManifest({source,sourceHash,sprites,actions,frames}){
  const frameIndex=new Map(frames.map(f=>[f.recordNo,f]));
  const out=[];
  for(const spr of sprites){
    for(let i=0;i<spr.actionCount;i++){
      const a=actions[spr.firstAction-1+i];
      assert(a && a.sprite===spr.code,'Missing or foreign action for '+spr.code);
      for(let j=0;j<a.frameCount;j++){
        const f=frameIndex.get(a.firstFrame+j);
        assert(f && f.sprite===spr.code,'Missing or foreign frame '+(a.firstFrame+j));
        assert(f.width>0 && f.height>0,'Invalid dimensions for frame '+f.recordNo);
        out.push({id:spr.code,action:a.action,direction:a.direction,frame:j,width:f.width,height:f.height,
          offsetX:f.offsetX,offsetY:f.offsetY,pivotX:-f.offsetX,pivotY:-f.offsetY,
          palette:null,path:null,bitmapFile:f.file,bitmapOffset:f.bitmapOffset,sourceFrame:f.recordNo,decoded:false});
      }
    }
  }
  return {schemaVersion:1,source,sourceHash,license:'UNVERIFIED_ASSET_LICENSE',status:'metadata-only',
    sprites:out,counts:{spriteDefinitions:sprites.length,actions:actions.length,framesReferenced:out.length},
    warnings:['No bitmap pixel decoding performed','Pivot is coordinate origin inferred from per-frame offset; ground anchor requires visual validation',
      'Direction is numeric 7KAA dir_id and is not mapped to compass labels','Sprites and towns not visually verified']};
}
export async function run(source,out){
  const names=await readdir(source,{recursive:true,withFileTypes:true});
  const allFiles=names.filter(x=>x.isFile()).map(x=>join(x.parentPath??x.path,x.name)).sort();
  const lookup=(name)=>allFiles.find(f=>f.toUpperCase().endsWith('/'+name.toUpperCase())||f.toUpperCase().endsWith('\\\\'+name.toUpperCase()));
  const resFiles=allFiles.filter(n=>/\\.res$/i.test(n));
  const res=[];
  for(const n of resFiles){const b=await readFile(n);res.push({file:n,sha256:sha256(b),records:parseRes(b)});}
  const tables={}; const hashes={};
  for(const name of Object.keys(fields)){
    const filename=lookup(name+'.DBF');
    if(filename){const b=await readFile(filename);tables[name]=decodeTable(name,b);hashes[name]=sha256(b);}
  }
  const setFile=lookup('STD.SET');
  if(setFile){
    const b=await readFile(setFile),index=parseRes(b);
    for(const name of Object.keys(fields)){
      const rec=index.find(x=>x.name.toUpperCase()===name);
      if(rec){
        const bytes=b.subarray(rec.offset,rec.offset+rec.size);
        tables[name]=decodeTable(name,bytes);hashes[name]=sha256(bytes);
      }
    }
  }
  const full=Object.keys(tables).length===3;
  const manifest=full?makeManifest({source:'local-7kaa-source',sourceHash:hashes,sprites:tables.SPRITE,actions:tables.SACTION,frames:tables.SFRAME}):
    {schemaVersion:1,source:'local-7kaa-source',sourceHash:hashes,license:'UNVERIFIED_ASSET_LICENSE',status:'inventory-only',
      sprites:[],res,availableTables:Object.keys(tables),missingTables:Object.keys(fields).filter(n=>!tables[n]),
      warnings:['No verified pixel conversion; original packed DBF/STD.SET inputs needed for frame metadata']};
  await mkdir(out,{recursive:true});
  await writeFile(join(out,'pack.json'),JSON.stringify(manifest,null,2)+'\\n');
  return manifest;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  const args=process.argv.slice(2), flag=x=>args[args.indexOf(x)+1];
  if(!args.includes('--source')||!args.includes('--out')){console.error('Usage: node tools/assets/decode.mjs --source <unpacked-original-dir> --out <destination>');process.exitCode=2;}
  else run(flag('--source'),flag('--out')).then(x=>console.log('Wrote pack.json ('+x.status+', '+x.sprites.length+' metadata records)')).catch(e=>{console.error(e.message);process.exitCode=1});
}
