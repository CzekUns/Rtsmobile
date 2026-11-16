// SKH-TERRAIN-002: inspect compressed 7KAA PLANT records without guessing the codec.
// GPL-2.0-or-later source linkage: ORESDB.cpp and OPLANT.cpp at pinned commit.
// Diagnostic output is bounded metadata, not a decoded bitmap or proof of visual parity.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {parseNatureDatabase} from './nature-database.mjs';
const sha256=b=>createHash('sha256').update(b).digest('hex');
export function inspectPlantRecords(database,archive,{limit=12}={}){
  if(!(archive instanceof Uint8Array)||!Number.isInteger(limit)||limit<1||limit>100)
    throw Error('invalid diagnostic input');
  const records=parseNatureDatabase('PLANTBM',database).records;
  const samples=[];
  for(const record of records.slice(0,limit)){
    const offset=record.bitmapOffset;
    if(!Number.isSafeInteger(offset)||offset<0||offset+8>archive.length)
      throw Error('bitmap record offset out of range');
    const view=new DataView(archive.buffer,archive.byteOffset+offset,8);
    const length=view.getUint32(0,true),width=view.getInt16(4,true),height=view.getInt16(6,true);
    if(length<4||length>archive.length-offset-4||width<=0||height<=0||width>4096||height>4096)
      throw Error('invalid compressed bitmap record');
    const payload=archive.subarray(offset+8,offset+4+length);
    const frequency=new Map();
    for(const byte of payload)frequency.set(byte,(frequency.get(byte)||0)+1);
    const topBytes=[...frequency].sort((a,b)=>b[1]-a[1]||a[0]-b[0]).slice(0,8)
      .map(([value,count])=>({value,count}));
    samples.push({id:record.id,plant:record.plant,offset,recordLength:length,
      width,height,encodedBytes:payload.length,decodedPixels:width*height,
      payloadSha256:sha256(payload),first32Hex:Buffer.from(payload.subarray(0,32)).toString('hex'),topBytes});
  }
  return {schemaVersion:1,sourceCommit:'14e6fdfba9481af4dc3a54722614a608776e20bc',
    license:'GPL-2.0-or-later',archiveSha256:sha256(archive),
    recordCount:records.length,samples,codec:'unverified',visualParity:'not_certified'};
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
  const [,,dbPath,archivePath,outPath]=process.argv;
  if(!dbPath||!archivePath||!outPath)throw Error('usage: node inspect-plant-compression.mjs PLANTBM1.RES I_PLANT1.RES report.json');
  const report=inspectPlantRecords(readFileSync(dbPath),readFileSync(archivePath));
  writeFileSync(outPath,JSON.stringify(report,null,2)+'\n');
  console.log('PLANT compression metadata written: '+report.samples.length+' records; no codec assumed');
}
