// Byte-exact pinned 7KAA ROCK resource acquisition; no generated or substitute pixels.
// the3dfxdude/7kaa @ 14e6fdfba9481af4dc3a54722614a608776e20bc, GPL-2.0-or-later.
import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
export const ROCK_SOURCE_COMMIT='14e6fdfba9481af4dc3a54722614a608776e20bc';
export const ROCK_RESOURCE_NAMES=Object.freeze([
  'ROCK1.RES','ROCKBLK1.RES','ROCKBMP1.RES','ROCKANI1.RES','I_ROCK1.RES','PAL_STD.RES'
]);
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function acquireRockResources({fetcher=fetch,commit=ROCK_SOURCE_COMMIT,maxBytes=32*1024*1024}={}){
  if(commit!==ROCK_SOURCE_COMMIT)throw Error('unpinned upstream source commit');
  if(!Number.isSafeInteger(maxBytes)||maxBytes<1)throw Error('invalid resource size limit');
  const resources=[],files=Object.create(null);
  for(const name of ROCK_RESOURCE_NAMES){
    const url=`https://raw.githubusercontent.com/the3dfxdude/7kaa/${commit}/data/RESOURCE/${name}`;
    const response=await fetcher(url);
    if(!response?.ok)throw Error(`upstream fetch failed: ${name} HTTP ${response?.status??'unknown'}`);
    const declared=response.headers?.get?.('content-length');
    if(declared!==null&&declared!==undefined&&declared!==''&&Number(declared)>maxBytes)
      throw Error('oversize upstream resource: '+name);
    const bytes=new Uint8Array(await response.arrayBuffer());
    if(!bytes.length||bytes.length>maxBytes)throw Error('invalid upstream resource length: '+name);
    resources.push({name,url,bytes:bytes.length,sha256:sha256(bytes)});
    files[name]=bytes;
  }
  return {files,manifest:{schemaVersion:1,source:'the3dfxdude/7kaa',sourceCommit:commit,
    license:'GPL-2.0-or-later',resources,verification:'byte-exact-download-sha256; visual-parity-not-certified'}};
}
export async function saveRockResources(result,dir){
  if(!result?.manifest?.resources||!result.files)throw Error('invalid rock resource bundle');
  await mkdir(dir,{recursive:true});
  for(const {name,bytes,sha256:expected} of result.manifest.resources){
    if(!ROCK_RESOURCE_NAMES.includes(name)||!result.files[name]||result.files[name].length!==bytes||
       sha256(result.files[name])!==expected)throw Error('rock resource provenance mismatch: '+name);
  }
  if(result.manifest.resources.length!==ROCK_RESOURCE_NAMES.length)throw Error('incomplete rock resource bundle');
  for(const {name} of result.manifest.resources)await writeFile(join(dir,name),result.files[name],{flag:'wx'});
  await writeFile(join(dir,'rock-source-provenance.json'),JSON.stringify(result.manifest,null,2)+'\n',{flag:'wx'});
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
  const dir=process.argv[2];
  if(!dir)throw Error('usage: node fetch-rock-resources.mjs OUTPUT_DIRECTORY');
  const result=await acquireRockResources();
  await saveRockResources(result,dir);
  console.log(JSON.stringify(result.manifest,null,2));
}
